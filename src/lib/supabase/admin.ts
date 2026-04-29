// Supabase Admin 客户端 - 用于管理操作

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 仅服务端使用
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export default supabaseAdmin

// 管理员操作函数

/**
 * 创建用户
 */
export async function adminCreateUser(email: string, password: string, metadata?: Record<string, unknown>) {
  return supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })
}

/**
 * 删除用户
 */
export async function adminDeleteUser(userId: string) {
  return supabaseAdmin.auth.admin.deleteUser(userId)
}

/**
 * 更新用户
 */
export async function adminUpdateUser(userId: string, attributes: Record<string, unknown>) {
  return supabaseAdmin.auth.admin.updateUserById(userId, attributes)
}

/**
 * 获取用户列表
 */
export async function adminListUsers(page: number = 1, perPage: number = 50) {
  return supabaseAdmin.auth.admin.listUsers({
    page,
    perPage,
  })
}
