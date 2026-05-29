import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import supabaseAdmin from '@/lib/supabase/admin'

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
})

export async function POST(request: NextRequest) {
  try {
    const {
      question_block_id,
      question_text,
      user_answer,
      correct_answer,
      tags,
      user_id,
    } = await request.json()

    if (!question_block_id || !question_text || !user_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const summaryPrompt = `请为以下试题生成解题总结：

题干：${question_text}

${user_answer ? `用户答案：${user_answer}` : ''}
${correct_answer ? `正确答案：${correct_answer}` : ''}
${tags && tags.length > 0 ? `相关标签：${tags.map((t: { name: string }) => t.name).join('、')}` : ''}

请生成一个精炼的"解题心法"总结，包括：
1. 解题思路的核心步骤
2. 关键知识点和解题技巧
3. 如果是错题，分析错误原因和避免方法

请用简洁、有条理的语言表达，适合复习时快速回忆。

请以JSON格式返回：
{
  "summary": "解题心法总结内容",
  "keyPoints": ["要点1", "要点2", ...],
  "tips": "如有额外技巧或提醒",
  "difficultyReason": "为什么这个难度..."
}`

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一位经验丰富的学科教师，擅长总结解题方法和技巧。
你的总结应该：
- 简洁明了，便于记忆
- 突出核心思路和关键步骤
- 包含实用的解题技巧
- 适当提醒常见的易错点`,
        },
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const summaryContent = result.summary || '无法生成总结'

    const promptUsed = `用户答案：${user_answer || '无'}\n正确答案：${correct_answer || '无'}\n相关标签：${tags?.map((t: { name: string }) => t.name).join('、') || '无'}`

    const { data: existingSummary } = await supabaseAdmin
      .from('summaries')
      .select('id')
      .eq('question_block_id', question_block_id)
      .eq('summary_type', 'ai')
      .single()

    let summaryId: string

    if (existingSummary) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('summaries')
        .update({
          content: summaryContent,
          content_rich: {
            keyPoints: result.keyPoints,
            tips: result.tips,
            difficultyReason: result.difficultyReason,
          },
          prompt_used: promptUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSummary.id)
        .select()
        .single()

      if (updateError) throw updateError
      summaryId = updated.id
    } else {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('summaries')
        .insert({
          question_block_id: question_block_id,
          summary_type: 'ai',
          content: summaryContent,
          content_rich: {
            keyPoints: result.keyPoints,
            tips: result.tips,
            difficultyReason: result.difficultyReason,
          },
          prompt_used: promptUsed,
        })
        .select()
        .single()

      if (insertError) throw insertError
      summaryId = inserted.id
    }

    await supabaseAdmin.from('activity_logs').insert({
      user_id,
      action: 'generate_summary',
      entity_type: 'question',
      entity_id: question_block_id,
      metadata: {
        summaryId,
        keyPointsCount: result.keyPoints?.length || 0,
      },
    })

    return NextResponse.json({
      success: true,
      summaryId,
      summary: summaryContent,
      keyPoints: result.keyPoints || [],
      tips: result.tips || '',
    })
  } catch (error) {
    console.error('AI Summary Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
