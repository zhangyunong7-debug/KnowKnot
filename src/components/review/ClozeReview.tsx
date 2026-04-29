'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Eye, EyeOff, RotateCcw, Check, X, Trophy, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { NoteContentEntry, ClozeItem } from '@/types/database'

interface ClozeReviewProps {
  contentEntries: NoteContentEntry[]
  clozeItems: ClozeItem[]
  onReveal?: (itemId: string) => void
  onComplete?: (itemId: string, correct: boolean) => void
  className?: string
}

interface ClozeState {
  itemId: string
  isRevealed: boolean
}

export function ClozeReview({
  contentEntries,
  clozeItems,
  onReveal,
  onComplete,
  className,
}: ClozeReviewProps) {
  const [clozeStates, setClozeStates] = useState<ClozeState[]>(() =>
    clozeItems.map((item) => ({
      itemId: item.id,
      isRevealed: false,
    }))
  )
  const [showAll, setShowAll] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)

  const toggleReveal = useCallback((itemId: string) => {
    setClozeStates((prev) =>
      prev.map((state) =>
        state.itemId === itemId ? { ...state, isRevealed: !state.isRevealed } : state
      )
    )
    onReveal?.(itemId)
  }, [onReveal])

  const handleRevealAll = useCallback(() => {
    setClozeStates((prev) => prev.map((state) => ({ ...state, isRevealed: true })))
    setShowAll(true)
  }, [])

  const handleHideAll = useCallback(() => {
    setClozeStates((prev) => prev.map((state) => ({ ...state, isRevealed: false })))
    setShowAll(false)
  }, [])

  const getClozeState = (itemId: string) => {
    return clozeStates.find((s) => s.itemId === itemId)
  }

  // 渲染带挖空的内容
  const renderContentWithCloze = (entry: NoteContentEntry) => {
    const entryClozeItems = clozeItems.filter((c) => c.note_content_entry_id === entry.id)

    if (entryClozeItems.length === 0) {
      return <p className="text-sm whitespace-pre-wrap">{entry.content_text}</p>
    }

    let content = entry.content_text || ''
    const parts: Array<{ type: 'text' | 'cloze'; text: string; id?: string }> = []

    // 简单的挖空处理逻辑
    entryClozeItems.forEach((cloze) => {
      const index = content.indexOf(cloze.original_text)
      if (index !== -1) {
        if (index > 0) {
          parts.push({ type: 'text', text: content.substring(0, index) })
        }
        parts.push({
          type: 'cloze',
          text: cloze.original_text,
          id: cloze.id,
        })
        content = content.substring(index + cloze.original_text.length)
      }
    })
    if (content) {
      parts.push({ type: 'text', text: content })
    }

    return (
      <div className="space-y-2">
        {parts.map((part, i) =>
          part.type === 'text' ? (
            <span key={i} className="text-sm whitespace-pre-wrap">
              {part.text}
            </span>
          ) : (
            <span
              key={i}
              className={cn(
                'inline-block px-2 py-1 rounded cursor-pointer transition-all',
                getClozeState(part.id!)?.isRevealed
                  ? 'cloze-revealed'
                  : 'cloze-hidden'
              )}
              onClick={() => toggleReveal(part.id!)}
            >
              {getClozeState(part.id!)?.isRevealed ? part.text : '____'}
            </span>
          )
        )}
      </div>
    )
  }

  const stats = useMemo(() => {
    const total = clozeItems.length
    const revealed = clozeStates.filter((s) => s.isRevealed).length
    const hidden = total - revealed
    return { total, revealed, hidden }
  }, [clozeItems, clozeStates])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">挖空复习</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{stats.revealed}</span> / {stats.total} 已显示
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRevealAll}>
            <Eye className="w-4 h-4 mr-1" />
            显示全部
          </Button>
          <Button variant="outline" size="sm" onClick={handleHideAll}>
            <EyeOff className="w-4 h-4 mr-1" />
            隐藏全部
          </Button>
          <Button variant="outline" size="sm" onClick={() => setClozeStates((prev) => prev.map((s) => ({ ...s, isRevealed: false }))))>
            <RotateCcw className="w-4 h-4 mr-1" />
            重置
          </Button>
        </div>
      </div>

      {/* 挖空内容区 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {contentEntries.map((entry) => (
            <div key={entry.id} className="p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  entry.content_type === 'solution' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                  entry.content_type === 'highlight' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
                  entry.content_type === 'note' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                )}>
                  {entry.content_type === 'solution' && '解题步骤'}
                  {entry.content_type === 'highlight' && '高亮内容'}
                  {entry.content_type === 'note' && '笔记'}
                </span>
                {entry.formula_latex && entry.formula_latex.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {entry.formula_latex.length} 个公式
                  </span>
                )}
              </div>
              {renderContentWithCloze(entry)}
            </div>
          ))}
        </div>
      </div>

      {/* 进度条 */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">复习进度</span>
          <span className="text-sm font-medium">{Math.round((stats.revealed / stats.total) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(stats.revealed / stats.total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
