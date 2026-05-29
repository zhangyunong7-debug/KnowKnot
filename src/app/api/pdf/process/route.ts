import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase/admin'
import { splitQuestions } from '@/lib/pdf/split-questions'

let pdfjsLib: any = null

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'
  }
  return pdfjsLib
}

async function downloadPdfBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (response.ok) return response.arrayBuffer()

  const urlObj = new URL(url)
  const pathParts = urlObj.pathname.split('/')
  const bucketIndex = pathParts.findIndex((p) => p === 'pdfs')
  if (bucketIndex === -1) throw new Error('Cannot parse storage path from URL')
  const filePath = pathParts.slice(bucketIndex + 1).join('/')
  const { data, error } = await supabaseAdmin.storage.from('pdfs').download(filePath)
  if (error || !data) throw new Error('Failed to download PDF from storage')
  return data.arrayBuffer()
}

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const data = new Uint8Array(buffer.slice(0))
  const pdfjs = await getPdfjs()
  const doc = await pdfjs.getDocument({ data }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    let text = ''
    for (const item of content.items as any[]) {
      if (item.str !== undefined) {
        text += item.str
        if (item.hasEOL) text += '\n'
      }
    }
    pages.push(text)
  }

  return pages.join('\n\n')
}

async function ocrPdfWithOcrSpace(buffer: ArrayBuffer): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY
  if (!apiKey) throw new Error('OCR_SPACE_API_KEY not configured')

  const { createCanvas } = await import('@napi-rs/canvas')
  const pdfjs = await getPdfjs()
  const data = new Uint8Array(buffer.slice(0))
  const doc = await pdfjs.getDocument({ data }).promise

  const pageTasks = Array.from({ length: doc.numPages }, async (_, i) => {
    const pageNum = i + 1
    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2.0 })

    const canvas = createCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx as any, viewport }).promise

    const pngBuffer = canvas.toBuffer('image/png')

    const formData = new FormData()
    const blob = new Blob([pngBuffer], { type: 'image/png' })
    formData.append('file', blob, `page-${pageNum}.png`)
    formData.append('language', 'chs')
    formData.append('isOverlayRequired', 'false')
    formData.append('OCREngine', '2')

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: apiKey },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`OCR.space 第${pageNum}页返回 ${response.status}`)
    }

    const result = await response.json()
    if (result.OCRExitCode !== 1) {
      throw new Error(result.ErrorMessage || `OCR.space 第${pageNum}页识别失败`)
    }

    const pageText = result.ParsedResults.map((r: any) => r.ParsedText).join('\n')
    console.log(`OCR page ${pageNum}/${doc.numPages} done (${pageText.length} chars)`)
    return { pageNum, text: pageText }
  })

  const results = await Promise.all(pageTasks)
  results.sort((a, b) => a.pageNum - b.pageNum)
  return results.map((r) => r.text).join('\n\n')
}

interface QuestionInput {
  order: number
  type: string
  text: string
  options: string[] | null
  correctAnswer: string | null
}

async function insertQuestions(
  noteId: string,
  userId: string,
  questions: QuestionInput[],
  pdfSourceId: string | null,
  offset: number,
) {
  let insertedCount = 0
  for (const q of questions) {
    const { error: blockError } = await supabaseAdmin.from('question_blocks').insert({
      note_id: noteId,
      block_order: offset + q.order,
      question_type: q.type,
      question_text: q.text,
      options: q.options || null,
      correct_answer: q.correctAnswer || null,
      source_pdf_id: pdfSourceId,
    })

    if (blockError) {
      console.error('Error inserting question block:', blockError)
      continue
    }
    insertedCount++
  }

  return insertedCount
}

export async function POST(request: NextRequest) {
  try {
    const { noteId, pdfUrl, pdfName, userId } = await request.json()

    if (!noteId || !pdfUrl || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. 创建 pdf_sources 记录
    const { data: pdfSource, error: sourceError } = await supabaseAdmin
      .from('pdf_sources')
      .insert({
        note_id: noteId,
        pdf_url: pdfUrl,
        pdf_name: pdfName || pdfUrl.split('/').pop() || 'unknown.pdf',
        status: 'processing',
      })
      .select()
      .single()

    if (sourceError) {
      console.error('Error creating pdf source:', sourceError)
      return NextResponse.json({ error: 'Failed to create PDF source' }, { status: 500 })
    }

    const pdfSourceId = pdfSource.id

    // 2. 下载 PDF
    console.log('Downloading PDF...')
    const pdfBuffer = await downloadPdfBuffer(pdfUrl)

    // 3. 先尝试文字提取
    console.log('Extracting text from PDF...')
    const pdfText = await extractTextFromPdf(pdfBuffer)

    let rawText: string

    if (pdfText && pdfText.trim().length >= 10) {
      rawText = pdfText
    } else {
      // 文字提取失败，走 OCR
      console.log('Text extraction empty, trying OCR.space...')
      try {
        rawText = await ocrPdfWithOcrSpace(pdfBuffer)
        if (!rawText || rawText.trim().length < 10) {
          throw new Error('OCR returned insufficient text')
        }
      } catch (ocrError) {
        console.error('OCR.space error:', ocrError)
        await supabaseAdmin.from('pdf_sources').update({ status: 'error' }).eq('id', pdfSourceId)
        return NextResponse.json(
          {
            success: false,
            error: 'OCR 识别失败: ' + (ocrError instanceof Error ? ocrError.message : '未知错误'),
          },
          { status: 400 },
        )
      }
    }

    // 4. 规则切分题目
    console.log('Raw text preview (first 500 chars):', rawText.substring(0, 500))
    console.log('Raw text length:', rawText.length)
    console.log('Splitting questions via rule-based parser...')
    const parsed = splitQuestions(rawText)
    console.log('Parsed questions count:', parsed.length)

    if (parsed.length === 0) {
      await supabaseAdmin.from('pdf_sources').update({ status: 'error' }).eq('id', pdfSourceId)
      const preview = rawText.substring(0, 300).replace(/\n/g, '↵')
      return NextResponse.json(
        {
          success: false,
          error: `未能识别到题目。OCR 识别的前 300 字符: "${preview}..."`,
        },
        { status: 400 },
      )
    }

    // 5. 计算现有题目的最大 block_order，新题目追加其后
    const { data: existingBlocks } = await supabaseAdmin
      .from('question_blocks')
      .select('block_order')
      .eq('note_id', noteId)
      .order('block_order', { ascending: false })
      .limit(1)

    const maxOrder = existingBlocks && existingBlocks.length > 0 ? existingBlocks[0].block_order : 0

    const questions: QuestionInput[] = parsed.map((q) => ({
      order: q.order,
      type: q.type,
      text: q.text,
      options: q.options.length > 0 ? q.options : null,
      correctAnswer: null,
    }))

    // 6. 写入数据库
    const insertedCount = await insertQuestions(noteId, userId, questions, pdfSourceId, maxOrder)

    // 7. 更新状态
    await supabaseAdmin.from('pdf_sources').update({ status: 'ready' }).eq('id', pdfSourceId)
    await supabaseAdmin.from('notes').update({ status: 'ready' }).eq('id', noteId)

    return NextResponse.json({
      success: true,
      noteId,
      pdfSourceId,
      totalQuestions: insertedCount,
      method: 'rule-based',
    })
  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
