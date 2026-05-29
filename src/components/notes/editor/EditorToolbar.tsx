'use client'

import React, { useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Highlighter,
  Heading1,
  Heading2,
  Quote,
  Code,
  List,
  ListOrdered,
  Sigma,
  Eye,
  Edit3,
  Palette,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  value: string
  onChange: (value: string) => void
  mode: 'edit' | 'preview'
  onModeChange: (mode: 'edit' | 'preview') => void
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  before: string,
  after: string,
  defaultText = '文本',
): string {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = value.slice(start, end) || defaultText
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
  return newValue
}

function prefixLine(textarea: HTMLTextAreaElement, value: string, prefix: string): string {
  const start = textarea.selectionStart
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  return value.slice(0, lineStart) + prefix + value.slice(lineStart)
}

export function EditorToolbar({ textareaRef, value, onChange, mode, onModeChange }: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLatexPicker, setShowLatexPicker] = useState(false)
  const [latexInput, setLatexInput] = useState('')
  const [latexMode, setLatexMode] = useState<'inline' | 'block'>('inline')
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const insert = (before: string, after: string, defaultText = '文本') => {
    if (!textareaRef.current) return
    const newValue = wrapSelection(textareaRef.current, value, before, after, defaultText)
    onChange(newValue)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const insertPrefix = (prefix: string) => {
    if (!textareaRef.current) return
    const newValue = prefixLine(textareaRef.current, value, prefix)
    onChange(newValue)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const handleColorInsert = (color: string) => {
    if (!textareaRef.current) return
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selected = value.slice(start, end) || '彩色文字'
    const newValue =
      value.slice(0, start) +
      `<span style="color: ${color}">${selected}</span>` +
      value.slice(end)
    onChange(newValue)
    setShowColorPicker(false)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleLatexInsert = () => {
    if (!latexInput.trim()) return
    if (latexMode === 'inline') {
      insert('$', '$', latexInput.trim())
    } else {
      insert('$$\n', '\n$$', latexInput.trim())
    }
    setLatexInput('')
    setShowLatexPicker(false)
  }

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    label,
    active,
    className,
  }: {
    onClick: () => void
    icon: React.ComponentType<{ className?: string }>
    label: string
    active?: boolean
    className?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded hover:bg-muted transition-colors',
        active && 'bg-muted',
        className,
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  )

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b bg-background flex-wrap">
      {/* 行内格式 */}
      <ToolbarButton onClick={() => insert('**', '**', '粗体')} icon={Bold} label="加粗" />
      <ToolbarButton onClick={() => insert('*', '*', '斜体')} icon={Italic} label="斜体" />
      <ToolbarButton onClick={() => insert('~~', '~~', '删除线')} icon={Strikethrough} label="删除线" />
      <ToolbarButton onClick={() => insert('<u>', '</u>', '下划线')} icon={Underline} label="下划线" />
      <ToolbarButton onClick={() => insert('==', '==', '高亮')} icon={Highlighter} label="高亮" />

      <div className="w-px h-5 bg-border mx-1" />

      {/* 颜色选择 */}
      <div className="relative" ref={colorPickerRef}>
        <ToolbarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          icon={Palette}
          label="文字颜色"
          active={showColorPicker}
        />
        {showColorPicker && (
          <div className="absolute top-full left-0 z-50 mt-1 p-2 bg-background border rounded-lg shadow-lg">
            <div className="grid grid-cols-6 gap-1">
              {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#000000', '#ffffff', '#14b8a6', '#f43f5e'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorInsert(color)}
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* 块格式 */}
      <ToolbarButton onClick={() => insertPrefix('# ')} icon={Heading1} label="标题1" />
      <ToolbarButton onClick={() => insertPrefix('## ')} icon={Heading2} label="标题2" />
      <ToolbarButton onClick={() => insertPrefix('> ')} icon={Quote} label="引用" />
      <ToolbarButton
        onClick={() => insert('\n```\n', '\n```\n', '代码')}
        icon={Code}
        label="代码块"
      />

      <div className="w-px h-5 bg-border mx-1" />

      {/* 列表 */}
      <ToolbarButton onClick={() => insertPrefix('- ')} icon={List} label="无序列表" />
      <ToolbarButton onClick={() => insertPrefix('1. ')} icon={ListOrdered} label="有序列表" />

      <div className="w-px h-5 bg-border mx-1" />

      {/* 数学公式 */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowLatexPicker(!showLatexPicker)}
          icon={Sigma}
          label="LaTeX 公式"
          active={showLatexPicker}
        />
        {showLatexPicker && (
          <div className="absolute top-full left-0 z-50 mt-1 p-3 bg-background border rounded-lg shadow-lg w-64">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setLatexMode('inline')}
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  latexMode === 'inline' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                行内公式
              </button>
              <button
                type="button"
                onClick={() => setLatexMode('block')}
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  latexMode === 'block' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                块级公式
              </button>
            </div>
            <input
              type="text"
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder={latexMode === 'inline' ? 'E = mc^2' : '\\int_0^1 x dx'}
              className="w-full px-2 py-1.5 text-xs border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && handleLatexInsert()}
              autoFocus
            />
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowLatexPicker(false)}>
                <X className="w-3 h-3 mr-1" />
                取消
              </Button>
              <Button size="sm" className="h-6 text-xs" onClick={handleLatexInsert} disabled={!latexInput.trim()}>
                <Check className="w-3 h-3 mr-1" />
                插入
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* 模式切换 */}
      <div className="flex items-center border rounded overflow-hidden">
        <button
          type="button"
          onClick={() => onModeChange('edit')}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 text-xs transition-colors',
            mode === 'edit' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Edit3 className="w-3 h-3" />
          编辑
        </button>
        <button
          type="button"
          onClick={() => onModeChange('preview')}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 text-xs transition-colors',
            mode === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Eye className="w-3 h-3" />
          预览
        </button>
      </div>
    </div>
  )
}
