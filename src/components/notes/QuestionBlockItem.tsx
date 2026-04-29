'use client'

import React, { useState, useCallback } from 'react'
import {
  GripVertical,
  Edit3,
  Trash2,
  Plus,
  Merge,
  Split,
  Lock,
  Unlock,
  Check,
  X,
  Tag,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { QuestionBlockWithTags } from '@/types/models'

interface QuestionBlockEditorProps {
  questions: QuestionBlockWithTags[]
  selectedId?: string
  onSelect?: (id: string) => void
  onUpdate?: (id: string, data: Partial<QuestionBlockWithTags>) => void
  onDelete?: (id: string) => void
  onMerge?: (ids: string[]) => void
  onSplit?: (id: string) => void
  onAddTag?: (questionId: string, tagName: string) => void
  className?: string
}

export function QuestionBlockList({
  questions,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onMerge,
  onSplit,
  onAddTag,
  className,
}: QuestionBlockEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [showTagInput, setShowTagInput] = useState<string | null>(null)

  const handleStartEdit = useCallback((question: QuestionBlockWithTags) => {
    setEditingId(question.id)
    setEditText(question.question_text)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editingId && editText.trim()) {
      onUpdate?.(editingId, { question_text: editText.trim() })
    }
    setEditingId(null)
    setEditText('')
  }, [editingId, editText, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleMergeSelected = useCallback(() => {
    if (selectedIds.length >= 2) {
      onMerge?.(selectedIds)
      setSelectedIds([])
    }
  }, [selectedIds, onMerge])

  const handleAddTag = useCallback((questionId: string) => {
    if (newTagInput.trim()) {
      onAddTag?.(questionId, newTagInput.trim())
      setNewTagInput('')
      setShowTagInput(null)
    }
  }, [newTagInput, onAddTag])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {questions.length} 道题目
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMergeSelected}
            >
              <Merge className="w-4 h-4 mr-1" />
              合并 ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedIds(questions.map((q) => q.id))}
          >
            全选
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
            disabled={selectedIds.length === 0}
          >
            取消选择
          </Button>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={cn(
              'group relative rounded-lg border transition-all',
              selectedId === question.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              selectedIds.includes(question.id) && 'bg-primary/5 border-primary/50'
            )}
            onClick={() => onSelect?.(question.id)}
          >
            {/* 选择框 */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <input
                type="checkbox"
                checked={selectedIds.includes(question.id)}
                onChange={() => handleToggleSelect(question.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-gray-300"
              />
            </div>

            {/* 拖拽手柄 */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            {/* 内容区域 */}
            <div className="pl-16 pr-4 py-3">
              {/* 题目头部 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    #{question.block_order}
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    question.question_type === '选择题' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                    question.question_type === '填空题' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                    question.question_type === '解答题' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
                    !['选择题', '填空题', '解答题'].includes(question.question_type) && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  )}>
                    {question.question_type}
                  </span>
                  {question.difficulty && (
                    <span className="text-xs text-yellow-600">
                      {'★'.repeat(question.difficulty)}{'☆'.repeat(5 - question.difficulty)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSplit?.(question.id)
                    }}
                  >
                    <Split className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(question)
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdate?.(question.id, { is_locked: !question.is_locked })
                    }}
                  >
                    {question.is_locked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.(question.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 题目内容 */}
              {editingId === question.id ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 rounded border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 mr-1" />
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm line-clamp-2">{question.question_text}</p>

                  {/* 选项展示 */}
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {question.options.slice(0, 4).map((opt, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{opt}</p>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 标签 */}
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                {question.tags?.slice(0, 5).map((tag) => (
                  <span
                    key={tag.id}
                    className={cn('tag-pill text-xs', `tag-${tag.tag_type}`)}
                  >
                    {tag.tag_name}
                  </span>
                ))}
                {question.tags && question.tags.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{question.tags.length - 5}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTagInput(showTagInput === question.id ? null : question.id)
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* 添加标签输入 */}
              {showTagInput === question.id && (
                <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="输入标签名..."
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(question.id)
                      }
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => handleAddTag(question.id)}>
                    添加
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
