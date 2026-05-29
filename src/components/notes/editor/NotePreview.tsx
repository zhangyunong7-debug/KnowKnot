'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface NotePreviewProps {
  content: string
  className?: string
}

export function NotePreview({ content, className }: NotePreviewProps) {
  return (
    <div className={cn('note-preview p-6', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
