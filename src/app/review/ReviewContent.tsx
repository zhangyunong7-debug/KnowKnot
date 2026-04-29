'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Target,
  Zap,
  BookOpen,
  Tag,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
  Play,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Tag as TagType } from '@/types/database'

interface ReviewContentProps {
  userId: string
  tags: TagType[]
  stats: {
    totalReviews: number
  }
}

export function ReviewContent({ userId, tags, stats }: ReviewContentProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [reviewMode, setReviewMode] = useState<'tag_pull' | 'cloze' | 'smart'>('tag_pull')

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const startReview = async () => {
    if (selectedTags.length === 0) return

    // 创建复习会话
    try {
      const response = await fetch('/api/review/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          review_type: reviewMode,
          tag_ids: selectedTags,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = `/review/${data.session.id}`
      }
    } catch (error) {
      console.error('Failed to start review:', error)
    }
  }

  const tagGroups = useMemo(() => {
    const groups: Record<string, TagType[]> = {
      knowledge_point: [],
      question_type: [],
      pitfall: [],
      formula: [],
      custom: [],
    }

    tags.forEach((tag) => {
      if (groups[tag.tag_type]) {
        groups[tag.tag_type].push(tag)
      }
    })

    return groups
  }, [tags])

  return (
    <div className="space-y-6">
      {/* 标题区 */}
      <div>
        <h1 className="text-2xl font-bold">复习中心</h1>
        <p className="text-muted-foreground mt-1">
          选择标签开始针对性复习，提升学习效率
        </p>
      </div>

      {/* 复习模式选择 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={cn(
            'cursor-pointer transition-all',
            reviewMode === 'tag_pull' && 'ring-2 ring-primary'
          )}
          onClick={() => setReviewMode('tag_pull')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              挖题重做
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              根据标签筛选题目，清空答案后重新作答
            </CardDescription>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'cursor-pointer transition-all',
            reviewMode === 'cloze' && 'ring-2 ring-primary'
          )}
          onClick={() => setReviewMode('cloze')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              挖空背诵
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              高亮内容变成填空，检测记忆效果
            </CardDescription>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'cursor-pointer transition-all',
            reviewMode === 'smart' && 'ring-2 ring-primary'
          )}
          onClick={() => setReviewMode('smart')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI 智能复习
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              AI 根据您的学习情况智能推荐复习内容
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 标签选择区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(tagGroups).map(([type, tagList]) => {
          if (tagList.length === 0) return null
          return (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4" />
                  {type === 'knowledge_point' && '知识点'}
                  {type === 'question_type' && '题型'}
                  {type === 'pitfall' && '易错点'}
                  {type === 'formula' && '公式'}
                  {type === 'custom' && '自定义'}
                  <span className="text-muted-foreground font-normal">
                    ({tagList.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'tag-pill cursor-pointer transition-all',
                        `tag-${tag.tag_type}`,
                        selectedTags.includes(tag.id) && 'ring-2 ring-offset-2 ring-primary'
                      )}
                    >
                      {tag.tag_name}
                      <span className="ml-1 opacity-60">({tag.usage_count})</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 开始复习按钮 */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30 rounded-lg">
        <div>
          <p className="font-medium">
            已选择 {selectedTags.length} 个标签
          </p>
          <p className="text-sm text-muted-foreground">
            点击开始按钮进行复习
          </p>
        </div>
        <Button size="lg" disabled={selectedTags.length === 0} onClick={startReview}>
          <Play className="w-4 h-4 mr-2" />
          开始复习
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* 复习统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            学习统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
              <p className="text-sm text-muted-foreground">复习次数</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{tags.length}</p>
              <p className="text-sm text-muted-foreground">已掌握标签</p>
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">本周复习</p>
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">连续天数</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
