import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import supabaseAdmin from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await request.json()

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid title' }, { status: 400 })
    }

    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .insert({
        user_id: session.user.id,
        title,
        status: 'ready',
      })
      .select()
      .single()

    if (error) {
      console.error('Create note error:', error)
      return NextResponse.json({ error: '创建失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
