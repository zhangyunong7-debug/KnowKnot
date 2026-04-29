import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createCanvas } from '@napi-rs/canvas'
import supabaseAdmin from '@/lib/supabase/admin'

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
  const bucketIndex = pathParts.findIndex(p => p === 'pdfs')
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
    const text = content.items.map((item: any) => item.str).join(' ')
    pages.push(text)
  }

  return pages.join('\n\n')
}

async function renderPagesAsImages(buffer: ArrayBuffer, maxPages = 10): Promise<{ base64: string; pageNum: number }[]> {
  const data = new Uint8Array(buffer.slice(0))
  const pdfjs = await getPdfjs()
  const doc = await pdfjs.getDocument({ data }).promise
  const pageCount = Math.min(doc.numPages, maxPages)
  const images: { base64: string; pageNum: number }[] = []

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = createCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext('2d')

    await page.render({ canvasContext: ctx as any, viewport }).promise
    images.push({
      pageNum: i,
      base64: canvas.toBuffer('image/png').toString('base64'),
    })
  }

  return images
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
})

interface QuestionInput {
  order: number
  type: string
  text: string
  options: string[] | null
  correctAnswer: string | null
}

async function insertQuestions(noteId: string, userId: string, questions: QuestionInput[], pdfUrl: string) {
  let insertedCount = 0
  for (const q of questions) {
    const { error: blockError } = await supabaseAdmin
      .from('question_blocks')
      .insert({
        note_id: noteId,
        block_order: q.order || insertedCount + 1,
        question_type: q.type || 'unknown',
        question_text: q.text || '无内容',
        options: q.options || null,
        correct_answer: q.correctAnswer || null,
      })

    if (blockError) {
      console.error('Error inserting question block:', blockError)
      continue
    }
    insertedCount++
  }

  await supabaseAdmin
    .from('notes')
    .update({ status: 'ready' })
    .eq('id', noteId)

  await supabaseAdmin.from('activity_logs').insert({
    user_id: userId,
    action: 'import_pdf',
    entity_type: 'note',
    entity_id: noteId,
    metadata: { totalQuestions: insertedCount, pdfUrl },
  })

  return insertedCount
}

const QUESTION_SYSTEM_PROMPT = `你是一个专业的试卷分析AI。请识别并切分每道试题。

返回JSON格式：
{
  "questions": [
    {
      "order": 题号,
      "type": "选择题|填空题|解答题|判断题|其他",
      "text": "完整的题干内容（保留公式和符号）",
      "options": ["A. ...", "B. ..."] 或 null,
      "correctAnswer": "答案" 或 null
    }
  ]
}

注意：
- 保留完整的公式和数学符号
- 识别试卷中的大题和小题
- 如果文字中有答案解析，请一并保留`

export async function POST(request: NextRequest) {
  try {
    const { noteId, pdfUrl, userId } = await request.json()

    if (!noteId || !pdfUrl || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. 下载 PDF
    console.log('Downloading PDF...')
    const pdfBuffer = await downloadPdfBuffer(pdfUrl)

    // 2. 尝试文字提取
    console.log('Extracting text from PDF...')
    const pdfText = await extractTextFromPdf(pdfBuffer)

    let questions: QuestionInput[] = []
    let usedOcr = false

    if (pdfText && pdfText.trim().length >= 10) {
      // 文字提取成功，用文本模式切分题目
      await supabaseAdmin
        .from('notes')
        .update({ status: 'processing' })
        .eq('id', noteId)

      console.log('Splitting questions with AI...')
      const textSample = pdfText.substring(0, 15000)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: QUESTION_SYSTEM_PROMPT },
          { role: 'user', content: textSample },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')
      questions = result.questions || []
    } else {
      // 3. 文字提取失败，用 OCR 视觉识别
      console.log('Text extraction failed, using OCR vision...')
      await supabaseAdmin
        .from('notes')
        .update({ status: 'processing' })
        .eq('id', noteId)

      const pageImages = await renderPagesAsImages(pdfBuffer, 8)
      console.log(`Rendered ${pageImages.length} pages for OCR`)

      const imageContents = pageImages.map((img) => ({
        type: 'image_url' as const,
        image_url: {
          url: `data:image/png;base64,${img.base64}`,
          detail: 'low' as const,
        },
      }))

      const ocrCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${QUESTION_SYSTEM_PROMPT}

这是一份扫描版或图片型 PDF。请先识别图片中的文字（OCR），再切分试题。
图片按页码顺序排列。`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: '请识别以下试卷图片中的题目：' },
              ...imageContents,
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(ocrCompletion.choices[0].message.content || '{}')
      questions = result.questions || []
      usedOcr = true
    }

    // 4. 插入题目
    const insertedCount = await insertQuestions(noteId, userId, questions, pdfUrl)

    return NextResponse.json({
      success: true,
      noteId,
      totalQuestions: insertedCount,
      ...(usedOcr && { ocr: true, pagesProcessed: Math.min(8, questions.length > 0 ? 8 : 0) }),
    })
  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
