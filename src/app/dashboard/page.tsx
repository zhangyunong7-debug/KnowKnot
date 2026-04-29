import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardContent } from './DashboardContent'

export default async function DashboardPage() {
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

  // 获取最近笔记
  const { data: recentNotes } = await supabase
    .from('notes')
    .select(`
      *,
      question_blocks(count)
    `)
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  // 获取统计数据
  const { count: totalNotes } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  const { count: totalQuestions } = await supabase
    .from('question_blocks')
    .select('*', { count: 'exact', head: true })
    .eq('is_locked', false)

  const { count: masteredQuestions } = await supabase
    .from('question_blocks')
    .select('*', { count: 'exact', head: true })
    .eq('is_locked', true)

  return (
    <DashboardLayout user={profile || undefined}>
      <DashboardContent
        user={profile || undefined}
        recentNotes={recentNotes || []}
        stats={{
          totalNotes: totalNotes || 0,
          totalQuestions: totalQuestions || 0,
          masteredQuestions: masteredQuestions || 0,
        }}
      />
    </DashboardLayout>
  )
}
