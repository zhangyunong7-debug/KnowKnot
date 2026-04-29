// Supabase 客户端配置 - 服务端 (API Routes / Server Components)

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// 创建服务端 Supabase 客户端 (用于 Server Components 和 API Routes)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 在 Server Components 中设置 cookies 可能会失败
            // 这种情况会在中间件中处理
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 同上
          }
        },
      },
    }
  )
}

// 创建带服务密钥的 Supabase 客户端 (用于需要更高权限的操作)
export function createServiceClient() {
  const { createClient } = require('@supabase/supabase-js')

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export default createServerSupabaseClient
