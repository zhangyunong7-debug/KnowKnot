import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NoteEditorPage } from './NoteEditorPage'

interface NotePageProps {
  params: Promise<{ id: string }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // 获取用户资料
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // 获取笔记详情（包含 PDF 来源）
  const { data: note, error } = await supabase
    .from('notes')
    .select('*, pdf_sources(*)')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !note) {
    notFound()
  }

  // 获取题目列表
  const { data: questions } = await supabase
    .from('question_blocks')
    .select(`
      *,
      tags:question_tag_relations(
        tags(*)
      ),
      summaries(*),
      content_entries:note_content_entries(*),
      attachments(*)
    `)
    .eq('note_id', id)
    .order('block_order')

  return (
    <DashboardLayout user={profile || undefined}>
      <NoteEditorPage
        note={note}
        questions={questions || []}
        userId={session.user.id}
      />
    </DashboardLayout>
  )
}
