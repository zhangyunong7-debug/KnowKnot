import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, Plus, Clock, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DeleteNoteButton } from '@/components/notes/DeleteNoteButton'

export default async function NotesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: notes } = await supabase
    .from('notes')
    .select('*, question_blocks(count)')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })

  return (
    <DashboardLayout user={profile || undefined}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">我的笔记</h1>
            <p className="text-muted-foreground mt-1">管理你的所有笔记</p>
          </div>
          <Link href="/dashboard">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              导入 PDF
            </Button>
          </Link>
        </div>

        {notes && notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div key={note.id} className="relative group">
                <Link href={`/notes/${note.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="line-clamp-1 pr-8">{note.title}</CardTitle>
                      <CardDescription>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(note.updated_at, 'relative')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          note.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                          note.status === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {note.status === 'ready' ? '已完成' :
                           note.status === 'processing' ? '处理中' :
                           note.status === 'importing' ? '导入中' : '已归档'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(note as any).question_blocks?.[0]?.count || 0} 道题
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteNoteButton noteId={note.id} noteTitle={note.title} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">还没有笔记，去导入一份 PDF 开始吧</p>
              <Link href="/dashboard">
                <Button>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  前往导入
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
