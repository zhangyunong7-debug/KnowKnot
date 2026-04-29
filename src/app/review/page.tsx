import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ReviewContent } from './ReviewContent'

export default async function ReviewPage() {
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

  // 获取所有标签
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', session.user.id)
    .order('usage_count', { ascending: false })

  // 获取复习统计
  const { count: totalReviews } = await supabase
    .from('review_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  return (
    <DashboardLayout user={profile || undefined}>
      <ReviewContent
        userId={session.user.id}
        tags={tags || []}
        stats={{
          totalReviews: totalReviews || 0,
        }}
      />
    </DashboardLayout>
  )
}
