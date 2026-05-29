'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/Modal'

export function NotesPageClient() {
  const router = useRouter()
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newNoteTitle.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '创建失败' }))
        throw new Error(err.error || '创建笔记失败')
      }

      const data = await res.json()
      toast.success('笔记已创建')
      setShowNewNoteModal(false)
      setNewNoteTitle('')
      router.push(`/notes/${data.note.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建笔记失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">我的笔记</h1>
        <p className="text-muted-foreground mt-1">管理你的所有笔记</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setShowNewNoteModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建笔记
        </Button>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 mr-2" />
            导入 PDF
          </Button>
        </Link>
      </div>

      <Modal open={showNewNoteModal} onOpenChange={setShowNewNoteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>新建笔记</ModalTitle>
            <ModalDescription>
              创建一个空笔记，后续可以导入多个 PDF
            </ModalDescription>
          </ModalHeader>
          <div className="py-4 space-y-4">
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="输入笔记标题"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNote()
              }}
              disabled={creating}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewNoteModal(false)} disabled={creating}>
                取消
              </Button>
              <Button onClick={handleCreateNote} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {creating ? '创建中...' : '创建'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
