import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KnowKnot - 从试卷到笔记，从笔记到大脑',
  description: '一款基于康奈尔笔记法的智能学习工具，融合 AI 辅助，助你高效备考',
  keywords: ['康奈尔笔记', 'AI学习', '错题整理', '思维导图', '备考工具'],
  authors: [{ name: 'KnowKnot Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </body>
    </html>
  )
}
