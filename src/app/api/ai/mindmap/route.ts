import { NextRequest, NextResponse } from 'next/server'

// 调用思维导图生成 Edge Function
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { title, note_ids, tag_ids, user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    // 调用 Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-mindmap`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          title,
          noteIds: note_ids,
          tagIds: tag_ids,
          userId: user_id,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.message }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('AI Mindmap Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
