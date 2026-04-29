'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { Profile } from '@/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: Profile
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
