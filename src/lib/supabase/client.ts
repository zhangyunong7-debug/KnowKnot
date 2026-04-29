// Supabase 客户端配置 - 浏览器端

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// 创建浏览器端 Supabase 客户端
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 单例模式
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

export default getSupabaseClient
