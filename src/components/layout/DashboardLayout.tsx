'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { Profile } from '@/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: Profile
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-[#faf8f5] dark:bg-background">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
