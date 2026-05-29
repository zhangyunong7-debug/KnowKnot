'use client'

import React, { useState, useCallback } from 'react'
import { Sparkles, Lightbulb, Save, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RichNoteEditor } from '@/components/notes/editor/RichNoteEditor'
import type { QuestionBlockWithTags } from '@/types/models'

interface CornellNoteEditorProps {
  question: QuestionBlockWithTags
  onSaveNote?: (content: string) => void
  onSaveCue?: (content: string) => void
  onSaveSummary?: (content: string) => void
  onAIAssist?: (type: 'keywords' | 'summary') => Promise<{ tags?: Array<{ name: string; type: string; confidence: number }>; summary?: string } | void>
  className?: string
}

export function CornellNoteEditor({
  question,
  onSaveNote,
  onSaveCue,
  onSaveSummary,
  onAIAssist,
  className,
}: CornellNoteEditorProps) {
  const [noteContent, setNoteContent] = useState(question.content_entries?.find(e => e.content_type === 'solution')?.content_text || '')
  const [summaryContent, setSummaryContent] = useState(question.summaries?.[0]?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  const allTags = question.tags || []

  const handleSaveNote = useCallback(async () => {
    setIsSaving(true)
    await onSaveNote?.(noteContent)
    setIsSaving(false)
  }, [noteContent, onSaveNote])

  const handleSaveSummary = useCallback(async () => {
    setIsSaving(true)
    await onSaveSummary?.(summaryContent)
    setIsSaving(false)
  }, [summaryContent, onSaveSummary])

  const handleAIKeywords = async () => {
    setIsGeneratingAI(true)
    const result = await onAIAssist?.('keywords')
    setIsGeneratingAI(false)
  }

  const handleAISummary = async () => {
    setIsGeneratingAI(true)
    const result = await onAIAssist?.('summary')
    setIsGeneratingAI(false)

    if (result?.summary) {
      setSummaryContent(result.summary)
    }
  }

  const handleAddTag = () => {
    setNewTagInput('')
  }

  const handleRemoveTag = (tagId: string) => {}

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 题目信息头部 */}
      <div className="px-4 py-3 border-b bg-background shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
              #{question.block_order}
            </span>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              question.question_type === '选择题' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
              question.question_type === '填空题' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
              question.question_type === '解答题' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
            )}>
              {question.question_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAIKeywords}
              disabled={isGeneratingAI}
              className="text-primary h-7 text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI 关键词
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveNote}
              disabled={isSaving}
              className="h-7 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              保存
            </Button>
          </div>
        </div>

        {/* 题目内容 */}
        <div className="mt-2 p-3 bg-muted/30 rounded-md">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{question.question_text}</p>
          {question.options && question.options.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {question.options.map((opt, i) => (
                <p key={i} className="text-sm text-muted-foreground">{opt}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 康奈尔主体：笔记区(左) + 关键词区(右) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧笔记区 - 富文本编辑器 */}
        <div className="flex-1 overflow-hidden border-r">
          <RichNoteEditor
            value={noteContent}
            onChange={setNoteContent}
            placeholder="在此记录解题步骤、思路、公式..."
            className="h-full"
          />
        </div>

        {/* 右侧关键词/标签区 */}
        <div className="w-64 shrink-0 bg-muted/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b bg-background shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                关键词
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIKeywords}
                disabled={isGeneratingAI}
                className="text-primary h-6 text-xs px-1.5"
              >
                <Sparkles className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {/* 标签列表 */}
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <span
                  key={tag.id}
                  className={cn(
                    'inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                    `tag-${tag.tag_type}`,
                    tag.is_ai_generated && 'border border-dashed'
                  )}
                >
                  {tag.tag_name}
                  {tag.confidence && tag.confidence < 0.8 && (
                    <span className="opacity-50">?</span>
                  )}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* 添加标签输入 */}
            <div className="mt-3 flex items-center gap-1">
              <Input
                type="text"
                placeholder="添加标签..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="h-7 text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddTag}
                className="h-7 w-7 p-0 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* 提示 */}
            {allTags.length === 0 && (
              <div className="mt-4 text-center text-xs text-muted-foreground">
                <p>点击上方 AI 按钮自动识别关键词</p>
                <p className="mt-1">或手动添加标签</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部总结区 */}
      <div className="border-t bg-background shrink-0">
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              总结 - 解题心法
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAISummary}
                disabled={isGeneratingAI}
                className="text-primary h-6 text-xs px-1.5"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI 总结
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveSummary}
                disabled={isSaving}
                className="h-6 text-xs"
              >
                保存
              </Button>
            </div>
          </div>
        </div>
        <textarea
          value={summaryContent}
          onChange={(e) => setSummaryContent(e.target.value)}
          placeholder="记录解题技巧、核心思路、注意事项..."
          className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm min-h-[60px] max-h-[120px]"
        />
      </div>
    </div>
  )
}
