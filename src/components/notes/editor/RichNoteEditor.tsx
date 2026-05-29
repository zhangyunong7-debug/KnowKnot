'use client'

import React, { useRef, useState } from 'react'
import { EditorToolbar } from './EditorToolbar'
import { NotePreview } from './NotePreview'
import { cn } from '@/lib/utils'

interface RichNoteEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichNoteEditor({ value, onChange, placeholder, className }: RichNoteEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <EditorToolbar
        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={onChange}
        mode={mode}
        onModeChange={setMode}
      />
      <div className="flex-1 overflow-auto">
        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[400px] p-6 bg-transparent resize-none focus:outline-none text-sm leading-7"
          />
        ) : (
          <NotePreview content={value || '_暂无内容，切换到编辑模式开始编写..._'} />
        )}
      </div>
    </div>
  )
}
