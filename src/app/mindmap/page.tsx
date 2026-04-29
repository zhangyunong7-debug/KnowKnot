import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MindmapContent } from './MindmapContent'

export default async function MindmapPage() {
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

  // 获取思维导图列表
  const { data: mindmaps } = await supabase
    .from('mindmaps')
    .select('*')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })

  return (
    <DashboardLayout user={profile || undefined}>
      <MindmapContent
        userId={session.user.id}
        mindmaps={mindmaps || []}
      />
    </DashboardLayout>
  )
}
