import { NextRequest, NextResponse } from 'next/server'

// 调用 AI 总结生成 Edge Function
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      question_block_id,
      question_text,
      user_answer,
      correct_answer,
      tags,
      user_id,
    } = body

    if (!question_block_id || !question_text || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 调用 Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-summary`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          questionBlockId: question_block_id,
          questionText: question_text,
          userAnswer: user_answer,
          correctAnswer: correct_answer,
          tags,
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
    console.error('AI Summary Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
