'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface FileUploaderProps {
  bucket?: 'pdfs' | 'images' | 'attachments'
  onUploadComplete?: (url: string, file: File) => void
  onUploadError?: (error: string) => void
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
}

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  error?: string
}

export function FileUploader({
  bucket = 'pdfs',
  onUploadComplete,
  onUploadError,
  accept = { 'application/pdf': ['.pdf'] },
  maxSize = 50 * 1024 * 1024,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const supabase = createClient()

  const handleUpload = async (f: UploadFile) => {
    try {
      setFiles((prev) =>
        prev.map((pf) => (pf.id === f.id ? { ...pf, status: 'uploading' } : pf))
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const ext = f.file.name.split('.').pop() || 'pdf'
      const fileName = `${timestamp}_${randomStr}.${ext}`
      const filePath = `${user.id}/${f.id}/${fileName}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, f.file, {
          contentType: f.file.type,
          upsert: false,
        })

      if (error) {
        throw error
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      setFiles((prev) =>
        prev.map((pf) =>
          pf.id === f.id ? { ...pf, status: 'success', url: urlData.publicUrl } : pf
        )
      )

      onUploadComplete?.(urlData.publicUrl, f.file)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      setFiles((prev) =>
        prev.map((pf) =>
          pf.id === f.id ? { ...pf, status: 'error', error: errorMessage } : pf
        )
      )
      onUploadError?.(errorMessage)
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: 'pending',
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...newFiles])

      // 开始上传
      for (const file of newFiles) {
        await handleUpload(file)
      }
    },
    [bucket]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 拖拽区域 */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary'
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn('w-10 h-10 mx-auto mb-4', isDragActive ? 'text-primary' : 'text-gray-400')} />
        {isDragActive ? (
          <p className="text-primary font-medium">松开以上传文件</p>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-sm text-gray-400">支持 PDF 文件，最大 {formatFileSize(maxSize)}</p>
          </>
        )}
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <File className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadFile.file.size)}
                </p>
              </div>
              <div className="flex-shrink-0">
                {uploadFile.status === 'pending' && (
                  <span className="text-sm text-muted-foreground">等待上传</span>
                )}
                {uploadFile.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {uploadFile.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {uploadFile.status === 'error' && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpload(uploadFile)}
                    >
                      重试
                    </Button>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeFile(uploadFile.id)}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
