'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  TrendingUp,
  Target,
  Trophy,
  Plus,
  ArrowRight,
  Upload,
  Sparkles,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import { FileUploader } from '@/components/pdf/FileUploader'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { DeleteNoteButton } from '@/components/notes/DeleteNoteButton'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Note } from '@/types/database'

interface DashboardContentProps {
  user?: Profile
  recentNotes: Note[]
  stats: {
    totalNotes: number
    totalQuestions: number
    masteredQuestions: number
  }
}

export function DashboardContent({ user, recentNotes, stats }: DashboardContentProps) {
  const router = useRouter()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [importing, setImporting] = useState(false)

  const handleUploadComplete = async (url: string, file: File) => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    setImporting(true)

    try {
      // 1. 创建笔记记录（使用 API）
      const noteTitle = file.name.replace(/\.(pdf|PDF)$/, '')
      const noteRes = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noteTitle }),
      })

      if (!noteRes.ok) {
        toast.error('创建笔记失败，请重试')
        setImporting(false)
        return
      }

      const noteData = await noteRes.json()
      const note = noteData.note

      // 2. 调用 PDF 处理 API 解析并切分题目
      const res = await fetch('/api/pdf/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          pdfUrl: url,
          pdfName: file.name,
          userId: authUser.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '处理失败' }))
        throw new Error(err.error || 'PDF 处理失败')
      }

      const result = await res.json()

      if (result.totalQuestions > 0) {
        toast.success(`已识别 ${result.totalQuestions} 道题目`)
      } else {
        toast.warning('未能从 PDF 中识别到题目')
      }

      setImporting(false)
      setShowUploadModal(false)
      router.push(`/notes/${note.id}`)
    } catch (err) {
      console.error('PDF import error:', err)
      toast.error(err instanceof Error ? err.message : 'PDF 导入失败，请重试')
      setImporting(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newNoteTitle.trim() }),
      })

      if (!res.ok) {
        toast.error('创建笔记失败')
        return
      }

      const data = await res.json()
      toast.success('笔记已创建')
      setShowNewNoteModal(false)
      setNewNoteTitle('')
      router.push(`/notes/${data.note.id}`)
    } catch (error) {
      toast.error('创建失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            你好，{user?.username || '用户'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            继续您的高效学习之旅
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowNewNoteModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建笔记
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            导入 PDF
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">笔记总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotes}</div>
            <p className="text-xs text-muted-foreground">
              份笔记
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">题目数量</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              待复习
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已掌握</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.masteredQuestions}</div>
            <p className="text-xs text-muted-foreground">
              题目
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近笔记 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近笔记</h2>
          <Link href="/notes">
            <Button variant="ghost" size="sm">
              查看全部
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        {recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map((note) => (
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
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          note.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                          note.status === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {note.status === 'ready' ? '已完成' :
                           note.status === 'processing' ? '处理中' :
                           note.status === 'importing' ? '导入中' : '已归档'}
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
              <p className="text-muted-foreground mb-4">还没有笔记</p>
              <Button onClick={() => setShowUploadModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建第一个笔记
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI 智能复习
            </CardTitle>
            <CardDescription>
              基于您的学习数据，AI 智能推荐复习内容
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/review">
              <Button variant="outline" className="w-full">
                开始智能复习
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              学习统计
            </CardTitle>
            <CardDescription>
              查看您的学习进度和掌握情况
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/stats">
              <Button variant="outline" className="w-full">
                查看统计
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 上传弹窗 */}
      <Modal open={showUploadModal} onOpenChange={setShowUploadModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>导入 PDF</ModalTitle>
            <ModalDescription>
              上传您的试卷 PDF 文件，将自动识别题号并切分题目
            </ModalDescription>
          </ModalHeader>
          <div className="py-4">
            {importing ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground">正在解析 PDF，请稍候...</p>
              </div>
            ) : (
              <FileUploader
                bucket="pdfs"
                onUploadComplete={handleUploadComplete}
                accept={{ 'application/pdf': ['.pdf'] }}
                maxSize={50 * 1024 * 1024}
              />
            )}
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
