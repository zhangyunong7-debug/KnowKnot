'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  Repeat,
  Network,
  FolderOpen,
  Settings,
  LogOut,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: '工作台', icon: Home },
  { href: '/notes', label: '我的笔记', icon: FileText },
  { href: '/review', label: '复习中心', icon: Repeat },
  { href: '/mindmap', label: '思维导图', icon: Network },
  { href: '/collections', label: '错题本', icon: FolderOpen },
  { href: '/settings', label: '设置', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex flex-col h-screen w-48 py-3 gap-1 bg-[hsl(var(--sidebar-rail))]">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-4 py-2 mb-1 rounded-md text-white font-bold text-lg hover:bg-white/10 transition-colors"
        title="KnowKnot"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-md bg-white/15 text-white font-bold text-base">
          K
        </span>
        <span>KnowKnot</span>
      </Link>

      {/* 导航 */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 底部 */}
      <div className="px-2 space-y-0.5 border-t border-white/10 pt-2">
        <Link
          href="/dashboard?upload=true"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/65 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Upload className="w-5 h-5 flex-shrink-0" />
          <span>导入 PDF</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>登出</span>
        </button>
      </div>
    </div>
  )
}
