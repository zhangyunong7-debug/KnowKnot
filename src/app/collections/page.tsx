import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Bookmark, Plus, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function CollectionsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: collections } = await supabase
    .from('collections')
    .select('*, collection_questions(count)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout user={profile || undefined}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">我的收藏</h1>
            <p className="text-muted-foreground mt-1">错题本和重点标记</p>
          </div>
        </div>

        {collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <Link key={col.id} href={`/collections/${col.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{col.collection_name}</CardTitle>
                    <CardDescription>
                      {col.description || '暂无描述'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Bookmark className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {(col as any).collection_questions?.[0]?.count || 0} 道题
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">还没有收藏</p>
              <p className="text-sm text-muted-foreground mb-4">
                在刷题或查看笔记时，可以标记题目加入收藏
              </p>
              <Link href="/review">
                <Button>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  去刷题
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
