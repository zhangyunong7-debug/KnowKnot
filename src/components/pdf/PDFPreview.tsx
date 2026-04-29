'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface PDFPreviewProps {
  url: string
  className?: string
  onPageChange?: (page: number, total: number) => void
}

export function PDFPreview({ url, className, onPageChange }: PDFPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 加载 PDF.js
    const loadPDF = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const loadingTask = pdfjsLib.getDocument(url)
        const pdf = await loadingTask.promise

        setTotalPages(pdf.numPages)
        onPageChange?.(1, pdf.numPages)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading PDF:', error)
        setIsLoading(false)
      }
    }

    loadPDF()
  }, [url, onPageChange])

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      onPageChange?.(newPage, totalPages)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      onPageChange?.(newPage, totalPages)
    }
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        {/* 页码控制 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrevPage} disabled={currentPage <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextPage} disabled={currentPage >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= 3}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setScale(1)}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF 预览区域 */}
      <div className="flex-1 overflow-auto bg-gray-800 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <PDFPage url={url} page={currentPage} scale={scale} />
        )}
      </div>
    </div>
  )
}

interface PDFPageProps {
  url: string
  page: number
  scale: number
}

function PDFPage({ url, page, scale }: PDFPageProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const renderPage = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const loadingTask = pdfjsLib.getDocument(url)
        const pdf = await loadingTask.promise
        const pdfPage = await pdf.getPage(page)

        const viewport = pdfPage.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await pdfPage.render(renderContext).promise
        setLoading(false)
      } catch (error) {
        console.error('Error rendering page:', error)
        setLoading(false)
      }
    }

    renderPage()
  }, [url, page, scale])

  return (
    <div className="flex justify-center">
      {loading && (
        <div className="absolute flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      <canvas ref={canvasRef} className="shadow-lg" />
    </div>
  )
}
