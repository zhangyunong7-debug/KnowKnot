'use client'

import React from 'react'
import { Search, Bell, Moon, Sun, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useTheme } from 'next-themes'
import type { Profile } from '@/types/database'

interface HeaderProps {
  user?: Profile
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-card">
      {/* 搜索栏 */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索笔记、题目、标签..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-2">
        {/* 主题切换 */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* 通知 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username || '用户'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.username || '用户'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings/profile">个人设置</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings/billing">订阅管理</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <a href="/auth/login">登出</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
