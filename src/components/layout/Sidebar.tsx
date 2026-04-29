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
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

const navItems = [
  { href: '/dashboard', label: '工作台', icon: Home },
  { href: '/notes', label: '我的笔记', icon: FileText },
  { href: '/review', label: '复习中心', icon: Repeat },
  { href: '/mindmap', label: '思维导图', icon: Network },
  { href: '/collections', label: '错题本', icon: FolderOpen },
  { href: '/settings', label: '设置', icon: Settings },
]

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">K</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-foreground">KnowKnot</span>
          )}
        </Link>
      </div>

      {/* 快速上传按钮 */}
      {!collapsed && (
        <div className="p-4">
          <Link
            href="/dashboard?upload=true"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">导入 PDF</span>
          </Link>
        </div>
      )}

      {collapsed && (
        <div className="p-2">
          <Link
            href="/dashboard?upload=true"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 导航菜单 */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* 底部区域 */}
      <div className="p-2 border-t space-y-1">
        {/* 折叠按钮 */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        {/* 登出按钮 */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title={collapsed ? '登出' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">登出</span>}
        </button>
      </div>
    </aside>
  )
}
