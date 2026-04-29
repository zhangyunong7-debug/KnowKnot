'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Eye,
  Columns,
  Square,
  MoreVertical,
  Download,
  Share,
  Settings,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { QuestionBlockList } from '@/components/notes/QuestionBlockItem'
import { CornellNoteEditor } from '@/components/notes/CornellNoteEditor'
import { PDFPreview } from '@/components/pdf/PDFPreview'
import { DeleteNoteButton } from '@/components/notes/DeleteNoteButton'
import type { Note, QuestionBlock } from '@/types/database'
import type { QuestionBlockWithTags } from '@/types/models'

interface NoteEditorPageProps {
  note: Note
  questions: QuestionBlockWithTags[]
  userId: string
}

export function NoteEditorPage({ note, questions: initialQuestions, userId }: NoteEditorPageProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialQuestions[0]?.id || null
  )
  const [viewMode, setViewMode] = useState<'cornell' | 'pdf' | 'split'>('cornell')
  const [isSaving, setIsSaving] = useState(false)

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId)

  const handleUpdateQuestion = useCallback(async (id: string, data: Partial<QuestionBlock>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data } : q))
    )

    // 调用 API 更新
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        toast.error('保存失败')
      } else {
        toast.success('已保存')
      }
    } catch (error) {
      toast.error('保存失败')
    }
  }, [])

  const handleDeleteQuestion = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        if (selectedQuestionId === id) {
          setSelectedQuestionId(questions[0]?.id || null)
        }
        toast.success('题目已删除')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }, [selectedQuestionId, questions])

  const handleMergeQuestions = useCallback(async (ids: string[]) => {
    // 合并逻辑
    toast.success(`已合并 ${ids.length} 道题目`)
  }, [])

  const handleSplitQuestion = useCallback(async (id: string) => {
    // 拆分逻辑
    toast.info('题目拆分功能开发中')
  }, [])

  const handleAddTag = useCallback(async (questionId: string, tagName: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          tag_name: tagName,
          user_id: userId,
        }),
      })

      if (response.ok) {
        toast.success('标签已添加')
      }
    } catch (error) {
      toast.error('添加标签失败')
    }
  }, [userId])

  const handleAIAssist = useCallback(async (type: 'keywords' | 'summary') => {
    if (!selectedQuestion) return

    toast.loading(`AI 正在分析...`, { id: 'ai-assist' })

    try {
      const endpoint = type === 'keywords' ? '/api/ai/keywords' : '/api/ai/summary'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_block_id: selectedQuestion.id,
          question_text: selectedQuestion.question_text,
          options: selectedQuestion.options,
          user_id: userId,
        }),
      })

      if (response.ok) {
        toast.success(type === 'keywords' ? '关键词已识别' : '总结已生成', { id: 'ai-assist' })
      } else {
        toast.error('AI 分析失败', { id: 'ai-assist' })
      }
    } catch (error) {
      toast.error('AI 分析失败', { id: 'ai-assist' })
    }
  }, [selectedQuestion, userId])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{note.title}</h1>
            <p className="text-sm text-muted-foreground">
              {questions.length} 道题目
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'cornell' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('cornell')}
            >
              <Square className="w-4 h-4 mr-1" />
              笔记
            </Button>
            <Button
              variant={viewMode === 'pdf' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setViewMode('pdf')}
            >
              <Eye className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('split')}
            >
              <Columns className="w-4 h-4 mr-1" />
              分屏
            </Button>
          </div>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-1" />
            分享
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                笔记设置
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Lock className="w-4 h-4 mr-2" />
                归档
              </DropdownMenuItem>
              <div className="border-t my-1" />
              <DeleteNoteButton
                noteId={note.id}
                noteTitle={note.title}
                variant="dropdown"
                redirectTo="/notes"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden mt-4">
        {/* 左侧题目列表 */}
        <div className="w-80 border-r pr-4 overflow-hidden flex flex-col">
          <QuestionBlockList
            questions={questions}
            selectedId={selectedQuestionId || undefined}
            onSelect={setSelectedQuestionId}
            onUpdate={handleUpdateQuestion}
            onDelete={handleDeleteQuestion}
            onMerge={handleMergeQuestions}
            onSplit={handleSplitQuestion}
            onAddTag={handleAddTag}
          />
        </div>

        {/* 右侧编辑器 */}
        <div className="flex-1 pl-4 overflow-hidden">
          {selectedQuestion ? (
            viewMode === 'pdf' && note.source_pdf_url ? (
              <PDFPreview url={note.source_pdf_url} className="h-full" />
            ) : (
              <CornellNoteEditor
                question={selectedQuestion}
                onAIAssist={handleAIAssist}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              选择一道题目开始编辑
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
