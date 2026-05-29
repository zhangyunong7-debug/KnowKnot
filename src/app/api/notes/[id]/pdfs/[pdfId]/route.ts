import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import supabaseAdmin from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pdfId: string } },
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const noteId = params.id
    const pdfId = params.pdfId

    // 验证笔记所有权
    const { data: note } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single()

    if (!note || note.user_id !== session.user.id) {
      return NextResponse.json({ error: '笔记不存在或无权操作' }, { status: 404 })
    }

    // 获取 PDF 来源信息
    const { data: pdfSource } = await supabaseAdmin
      .from('pdf_sources')
      .select('pdf_url')
      .eq('id', pdfId)
      .eq('note_id', noteId)
      .single()

    if (!pdfSource) {
      return NextResponse.json({ error: 'PDF 来源不存在' }, { status: 404 })
    }

    // 删除 Storage 中的 PDF 文件
    try {
      const url = new URL(pdfSource.pdf_url)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(p => p === 'pdfs')
      if (bucketIndex >= 0) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/')
        await supabaseAdmin.storage.from('pdfs').remove([filePath])
      }
    } catch {
      // 文件可能已删除，忽略
    }

    // 删除该 PDF 关联的题目
    await supabaseAdmin
      .from('question_blocks')
      .delete()
      .eq('source_pdf_id', pdfId)

    // 删除 PDF 来源记录
    await supabaseAdmin
      .from('pdf_sources')
      .delete()
      .eq('id', pdfId)

    // 重新排序剩余题目的 block_order
    const { data: remainingBlocks } = await supabaseAdmin
      .from('question_blocks')
      .select('id')
      .eq('note_id', noteId)
      .order('block_order', { ascending: true })

    if (remainingBlocks && remainingBlocks.length > 0) {
      const updates = remainingBlocks.map((block, index) => ({
        id: block.id,
        block_order: index + 1,
      }))

      for (const update of updates) {
        await supabaseAdmin
          .from('question_blocks')
          .update({ block_order: update.block_order })
          .eq('id', update.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete PDF source error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
