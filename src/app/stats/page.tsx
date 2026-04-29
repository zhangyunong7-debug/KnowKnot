import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Target, Trophy, FileText } from 'lucide-react'

export default async function StatsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { count: totalNotes } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  const { count: totalQuestions } = await supabase
    .from('question_blocks')
    .select('*', { count: 'exact', head: true })

  const { count: masteredQuestions } = await supabase
    .from('question_blocks')
    .select('*', { count: 'exact', head: true })
    .eq('is_locked', true)

  const { data: reviewSessions } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  const totalReviewed = reviewSessions?.reduce((sum, s) => sum + (s.correct_count || 0) + (s.wrong_count || 0), 0) || 0
  const totalCorrect = reviewSessions?.reduce((sum, s) => sum + (s.correct_count || 0), 0) || 0
  const accuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0

  return (
    <DashboardLayout user={profile || undefined}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">学习统计</h1>
          <p className="text-muted-foreground mt-1">查看你的学习进度和掌握情况</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">笔记总数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalNotes || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">题目总数</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuestions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已掌握</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{masteredQuestions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">正确率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracy}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>最近复习记录</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewSessions && reviewSessions.length > 0 ? (
              <div className="space-y-3">
                {reviewSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="text-sm font-medium">
                        {s.review_type === 'spaced_repetition' ? '间隔复习' :
                         s.review_type === 'random' ? '随机复习' :
                         s.review_type === 'tag_focused' ? '标签复习' : '复习'}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.started_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">正确 {s.correct_count}</span>
                      <span className="text-red-600">错误 {s.wrong_count}</span>
                      {s.duration_seconds && (
                        <span className="text-muted-foreground">
                          {Math.round(s.duration_seconds / 60)} 分钟
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">还没有复习记录，开始你的第一次复习吧</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
