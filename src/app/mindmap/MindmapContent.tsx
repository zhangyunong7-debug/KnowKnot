'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Network,
  Calendar,
  Eye,
  Share2,
  Trash2,
  Download,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import type { Mindmap } from '@/types/database'

interface MindmapContentProps {
  userId: string
  mindmaps: Mindmap[]
}

export function MindmapContent({ userId, mindmaps }: MindmapContentProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateMindmap = async () => {
    if (!newTitle.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/ai/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          user_id: userId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = `/mindmap/${data.mindmapId}`
      }
    } catch (error) {
      console.error('Failed to create mindmap:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">思维导图</h1>
          <p className="text-muted-foreground mt-1">
            聚合多个笔记的总结，生成结构化的思维导图
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          创建导图
        </Button>
      </div>

      {/* 导图列表 */}
      {mindmaps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mindmaps.map((mindmap) => (
            <Card key={mindmap.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{mindmap.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {formatDate(mindmap.updated_at, 'relative')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mindmap.thumbnail_url ? (
                  <img
                    src={mindmap.thumbnail_url}
                    alt={mindmap.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                    <Network className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href={`/mindmap/${mindmap.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                {mindmap.is_public && (
                  <span className="text-xs text-muted-foreground">已公开</span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">还没有思维导图</h3>
            <p className="text-muted-foreground mb-4">
              创建第一个思维导图，将您的学习内容结构化
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              创建导图
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>如何使用</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium">1</span>
              </div>
              <div>
                <p className="font-medium">整理笔记</p>
                <p className="text-sm text-muted-foreground">
                  在笔记阶段，为每道题目添加总结
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium">2</span>
              </div>
              <div>
                <p className="font-medium">选择标签</p>
                <p className="text-sm text-muted-foreground">
                  选择想要聚合的标签（如"三角函数"）
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium">3</span>
              </div>
              <div>
                <p className="font-medium">生成导图</p>
                <p className="text-sm text-muted-foreground">
                  AI 将根据总结内容自动生成思维导图
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建弹窗 */}
      <Modal open={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>创建思维导图</ModalTitle>
            <ModalDescription>
              选择笔记或标签，AI 将生成聚合的思维导图
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">导图标题</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="例如：三角函数解题方法总结"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              您还需要在下一页选择要聚合的笔记或标签
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateMindmap} disabled={!newTitle.trim() || isCreating}>
              {isCreating ? '创建中...' : '创建'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
