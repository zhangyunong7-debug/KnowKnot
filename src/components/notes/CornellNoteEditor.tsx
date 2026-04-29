'use client'

import React, { useState, useCallback } from 'react'
import { Sparkles, Lightbulb, PenLine, Save, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { QuestionBlockWithTags, Summary } from '@/types/models'

interface CornellNoteEditorProps {
  question: QuestionBlockWithTags
  onSaveNote?: (content: string) => void
  onSaveCue?: (content: string) => void
  onSaveSummary?: (content: string) => void
  onAIAssist?: (type: 'keywords' | 'summary') => void
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
  const [cueContent, setCueContent] = useState(question.content_entries?.find(e => e.content_type === 'note')?.content_text || '')
  const [summaryContent, setSummaryContent] = useState(question.summaries?.[0]?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const handleSaveNote = useCallback(async () => {
    setIsSaving(true)
    await onSaveNote?.(noteContent)
    setIsSaving(false)
  }, [noteContent, onSaveNote])

  const handleSaveCue = useCallback(async () => {
    setIsSaving(true)
    await onSaveCue?.(cueContent)
    setIsSaving(false)
  }, [cueContent, onSaveCue])

  const handleSaveSummary = useCallback(async () => {
    setIsSaving(true)
    await onSaveSummary?.(summaryContent)
    setIsSaving(false)
  }, [summaryContent, onSaveSummary])

  const handleAIKeywords = async () => {
    setIsGeneratingAI(true)
    await onAIAssist?.('keywords')
    setIsGeneratingAI(false)
  }

  const handleAISummary = async () => {
    setIsGeneratingAI(true)
    await onAIAssist?.('summary')
    setIsGeneratingAI(false)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 题目信息 */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            题目 #{question.block_order}
          </span>
          <div className="flex items-center gap-2">
            {question.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className={cn('tag-pill', `tag-${tag.tag_type}`)}
              >
                {tag.tag_name}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <p className="text-sm whitespace-pre-wrap">{question.question_text}</p>
          {question.options && question.options.length > 0 && (
            <div className="mt-3 space-y-1">
              {question.options.map((opt, i) => (
                <p key={i} className="text-sm">{opt}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 康奈尔三区布局 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* 笔记区 (左侧 3/4) */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              笔记区
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveNote}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="记录解题步骤、思路、公式..."
            className="flex-1 p-3 rounded-lg border bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* 关键词区 (右侧 1/4) */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              关键词区
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAIKeywords}
              disabled={isGeneratingAI}
              className="text-primary"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI
            </Button>
          </div>
          <textarea
            value={cueContent}
            onChange={(e) => setCueContent(e.target.value)}
            placeholder="记录关键词、题型、易错点..."
            className="flex-1 p-3 rounded-lg border bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveCue}
            disabled={isSaving}
            className="mt-2"
          >
            保存关键词
          </Button>

          {/* 已有标签展示 */}
          {question.tags && question.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">已识别标签</p>
              <div className="flex flex-wrap gap-1">
                {question.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={cn(
                      'tag-pill text-xs',
                      `tag-${tag.tag_type}`,
                      tag.is_ai_generated && 'border border-dashed border-current'
                    )}
                  >
                    {tag.tag_name}
                    {tag.confidence && tag.confidence < 0.8 && (
                      <span className="ml-1 opacity-60">?</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 总结区 (底部) */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            总结区 - 解题心法
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAISummary}
              disabled={isGeneratingAI}
              className="text-primary border-primary hover:bg-primary/10"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI 总结
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveSummary}
              disabled={isSaving}
            >
              保存总结
            </Button>
          </div>
        </div>
        <textarea
          value={summaryContent}
          onChange={(e) => setSummaryContent(e.target.value)}
          placeholder="记录解题技巧、核心思路、注意事项..."
          className="w-full p-3 rounded-lg border bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
        />
      </div>
    </div>
  )
}
