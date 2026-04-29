import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Bookmark, ArrowLeft, Trash2 } from 'lucide-react'

interface CollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !collection) notFound()

  const { data: items } = await supabase
    .from('collection_questions')
    .select(`
      question_blocks (
        *,
        notes(title),
        summaries(content),
        question_tag_relations(tags(tag_name, tag_type, color))
      )
    `)
    .eq('collection_id', id)

  const questions = items?.map(i => (i as any).question_blocks).filter(Boolean) || []

  return (
    <DashboardLayout user={profile || undefined}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/collections">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{collection.collection_name}</h1>
              <p className="text-muted-foreground mt-1">{collection.description || '暂无描述'}</p>
            </div>
          </div>
        </div>

        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q: any) => (
              <Link key={q.id} href={`/notes/${q.note_id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base line-clamp-2">{q.question_text}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      {q.question_tag_relations?.map((r: any) => (
                        <span
                          key={r.tags.tag_name}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: r.tags.color + '20', color: r.tags.color }}
                        >
                          {r.tags.tag_name}
                        </span>
                      ))}
                      {q.summaries?.content && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {q.summaries.content}
                        </p>
                      )}
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
              <p className="text-muted-foreground">此收藏夹还是空的</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
