import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import supabaseAdmin from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const noteId = params.id

    // 验证笔记所有权
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('id, user_id')
      .eq('id', noteId)
      .single()

    if (fetchError || !note) {
      return NextResponse.json({ error: '笔记不存在' }, { status: 404 })
    }

    if (note.user_id !== session.user.id) {
      return NextResponse.json({ error: '无权删除此笔记' }, { status: 403 })
    }

    // 删除所有关联 PDF 的 Storage 文件
    const { data: pdfSources } = await supabaseAdmin
      .from('pdf_sources')
      .select('pdf_url')
      .eq('note_id', noteId)

    for (const source of pdfSources ?? []) {
      try {
        const url = new URL(source.pdf_url)
        const pathParts = url.pathname.split('/')
        const bucketIndex = pathParts.findIndex(p => p === 'pdfs')
        if (bucketIndex >= 0) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/')
          await supabaseAdmin.storage.from('pdfs').remove([filePath])
        }
      } catch {
        // 文件可能已删除，忽略
      }
    }

    // 也清理旧的 source_pdf_url（兼容旧数据）
    const { data: noteWithOldUrl } = await supabaseAdmin
      .from('notes')
      .select('source_pdf_url')
      .eq('id', noteId)
      .single()

    if (noteWithOldUrl?.source_pdf_url) {
      try {
        const url = new URL(noteWithOldUrl.source_pdf_url)
        const pathParts = url.pathname.split('/')
        const bucketIndex = pathParts.findIndex(p => p === 'pdfs')
        if (bucketIndex >= 0) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/')
          await supabaseAdmin.storage.from('pdfs').remove([filePath])
        }
      } catch {
        // 文件可能已删除，忽略
      }
    }

    // 删除笔记（级联删除 question_blocks 等）
    const { error: deleteError } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (deleteError) {
      console.error('Delete note error:', deleteError)
      return NextResponse.json({ error: '删除失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
