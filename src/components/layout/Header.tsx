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
    <header className="flex items-center justify-between h-12 px-6 bg-[hsl(var(--sidebar-rail))]">
      {/* 搜索栏 */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            type="search"
            placeholder="搜索笔记、题目、标签..."
            className="pl-9 h-8 bg-white/10 border-0 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30 rounded-md text-sm"
          />
        </div>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-white/65 hover:text-white hover:bg-white/10"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/65 hover:text-white hover:bg-white/10 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-1 hover:bg-white/10">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username || '用户'}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
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
