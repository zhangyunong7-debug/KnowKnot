'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal'

interface DeleteNoteButtonProps {
  noteId: string
  noteTitle: string
  variant?: 'icon' | 'button' | 'dropdown'
  onDeleted?: () => void
  redirectTo?: string
}

export function DeleteNoteButton({
  noteId,
  noteTitle,
  variant = 'icon',
  onDeleted,
  redirectTo,
}: DeleteNoteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '删除失败' }))
        throw new Error(err.error || '删除失败')
      }

      toast.success('笔记已删除')
      setOpen(false)
      onDeleted?.()

      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
          }}
          title="删除笔记"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : variant === 'dropdown' ? (
        <button
          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
          }}
        >
          <Trash2 className="w-4 h-4" />
          删除笔记
        </button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
          }}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          删除
        </Button>
      )}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>确认删除</ModalTitle>
            <ModalDescription>
              确定要删除笔记「{noteTitle}」吗？此操作将同时删除所有关联的题目和笔记内容，且不可撤销。
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
