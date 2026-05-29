'use client'

import React, { useState, useCallback, useRef } from 'react'
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
  Plus,
  FileText,
  Trash2,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { QuestionBlockList } from '@/components/notes/QuestionBlockItem'
import { CornellNoteEditor } from '@/components/notes/CornellNoteEditor'
import { PDFPreview } from '@/components/pdf/PDFPreview'
import { FileUploader } from '@/components/pdf/FileUploader'
import { DeleteNoteButton } from '@/components/notes/DeleteNoteButton'
import type { Note, QuestionBlock, PdfSource } from '@/types/database'
import type { QuestionBlockWithTags } from '@/types/models'

interface NoteEditorPageProps {
  note: Note & { pdf_sources?: PdfSource[] }
  questions: QuestionBlockWithTags[]
  userId: string
}

export function NoteEditorPage({ note, questions: initialQuestions, userId }: NoteEditorPageProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [pdfSources, setPdfSources] = useState<PdfSource[]>(note.pdf_sources || [])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialQuestions[0]?.id || null
  )
  const [viewMode, setViewMode] = useState<'cornell' | 'pdf' | 'split'>('cornell')
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>(note.source_pdf_url || pdfSources[0]?.pdf_url || '')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId)

  // 当选择题目时，自动切换到其来源的 PDF
  const handleSelectQuestion = useCallback((id: string | null) => {
    setSelectedQuestionId(id)
    if (id) {
      const q = questions.find((q) => q.id === id)
      if (q?.source_pdf_id) {
        const source = pdfSources.find((s) => s.id === q.source_pdf_id)
        if (source) setSelectedPdfUrl(source.pdf_url)
      }
    }
  }, [questions, pdfSources])

  const handleUploadComplete = useCallback(async (url: string, file: File) => {
    setIsUploading(true)
    try {
      const res = await fetch('/api/pdf/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          pdfUrl: url,
          pdfName: file.name,
          userId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'PDF 处理失败')
        return
      }

      toast.success(`已导入 ${data.totalQuestions} 道题目`)

      // 刷新页面获取新题目
      router.refresh()
    } catch (error) {
      toast.error('上传失败')
    } finally {
      setIsUploading(false)
      setShowPdfModal(false)
    }
  }, [note.id, userId, router])

  const handleDeletePdf = useCallback(async (pdfId: string) => {
    if (!confirm('确定要删除此 PDF 及其所有题目吗？')) return

    try {
      const res = await fetch(`/api/notes/${note.id}/pdfs/${pdfId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        toast.error('删除失败')
        return
      }

      toast.success('PDF 已删除')
      setPdfSources((prev) => prev.filter((s) => s.id !== pdfId))
      router.refresh()
    } catch (error) {
      toast.error('删除失败')
    }
  }, [note.id, router])

  const handleUpdateQuestion = useCallback(async (id: string, data: Partial<QuestionBlock>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data } : q))
    )

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
    toast.success(`已合并 ${ids.length} 道题目`)
  }, [])

  const handleSplitQuestion = useCallback(async (id: string) => {
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
        const data = await response.json()
        toast.success(type === 'keywords' ? '关键词已识别' : '总结已生成', { id: 'ai-assist' })
        return { tags: data.tags, summary: data.summary }
      } else {
        toast.error('AI 分析失败', { id: 'ai-assist' })
      }
    } catch (error) {
      toast.error('AI 分析失败', { id: 'ai-assist' })
    }
  }, [selectedQuestion, userId])

  const handleSaveNote = useCallback(async (content: string) => {
    if (!selectedQuestion) return

    try {
      const response = await fetch(`/api/questions/${selectedQuestion.id}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_text: content,
          content_rich: { type: 'markdown', version: 1 },
        }),
      })

      if (!response.ok) {
        toast.error('保存失败')
      } else {
        toast.success('已保存')
      }
    } catch (error) {
      toast.error('保存失败')
    }
  }, [selectedQuestion])

  // 统计每个 PDF 的题目数
  const getPdfQuestionCount = useCallback((pdfId: string) => {
    return questions.filter((q) => q.source_pdf_id === pdfId).length
  }, [questions])

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
              {pdfSources.length > 1 && ` · ${pdfSources.length} 个 PDF`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 添加 PDF 按钮 */}
          <Button variant="outline" size="sm" onClick={() => setShowPdfModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            添加 PDF
          </Button>

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
        {/* 左侧 PDF 来源 + 题目列表 */}
        <div className="w-80 border-r pr-4 overflow-hidden flex flex-col">
          {/* PDF 来源面板 */}
          {pdfSources.length > 0 && (
            <div className="mb-3 pb-3 border-b">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">PDF 来源</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pdfSources.map((source) => (
                  <div
                    key={source.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer group ${
                      selectedPdfUrl === source.pdf_url
                        ? 'bg-secondary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedPdfUrl(source.pdf_url)}
                  >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate flex-1" title={source.pdf_name}>
                      {source.pdf_name}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {getPdfQuestionCount(source.id)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePdf(source.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 题目列表 */}
          <div className="flex-1 overflow-hidden">
            <QuestionBlockList
              questions={questions}
              selectedId={selectedQuestionId || undefined}
              onSelect={handleSelectQuestion}
              onUpdate={handleUpdateQuestion}
              onDelete={handleDeleteQuestion}
              onMerge={handleMergeQuestions}
              onSplit={handleSplitQuestion}
              onAddTag={handleAddTag}
            />
          </div>
        </div>

        {/* 右侧编辑器 */}
        <div className="flex-1 pl-4 overflow-hidden">
          {selectedQuestion ? (
            viewMode === 'pdf' && selectedPdfUrl ? (
              <div className="h-full flex flex-col">
                {/* PDF 选择器（多 PDF 时显示） */}
                {pdfSources.length > 1 && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">查看:</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-sm">
                          {pdfSources.find((s) => s.pdf_url === selectedPdfUrl)?.pdf_name || '选择 PDF'}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {pdfSources.map((source) => (
                          <DropdownMenuItem
                            key={source.id}
                            onClick={() => setSelectedPdfUrl(source.pdf_url)}
                          >
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            {source.pdf_name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <PDFPreview url={selectedPdfUrl} className="flex-1" />
              </div>
            ) : (
              <CornellNoteEditor
                question={selectedQuestion}
                onSaveNote={handleSaveNote}
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

      {/* 添加 PDF 弹窗 */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">添加 PDF 到「{note.title}」</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowPdfModal(false)}>
                <span className="sr-only">关闭</span>
                ×
              </Button>
            </div>
            {isUploading ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>正在处理 PDF，请稍候...</p>
              </div>
            ) : (
              <FileUploader
                onUploadComplete={handleUploadComplete}
                maxSizeMB={50}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
