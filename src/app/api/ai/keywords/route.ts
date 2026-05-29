import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import supabaseAdmin from '@/lib/supabase/admin'

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
})

const colorMap: Record<string, string> = {
  knowledge_point: '#3B82F6',
  question_type: '#10B981',
  pitfall: '#EF4444',
  formula: '#8B5CF6',
  custom: '#6B7280',
}

export async function POST(request: NextRequest) {
  try {
    const { question_block_id, question_text, options, correct_answer, user_id } = await request.json()

    if (!question_block_id || !question_text || !user_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const optionsText = options
      ? `\n选项：\n${options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}`
      : ''

    const analysisPrompt = `请分析以下试题，识别其中的关键信息：

题干：${question_text}${optionsText}
${correct_answer ? `正确答案：${correct_answer}` : ''}

请识别以下类型的关键词：
1. 知识点（knowledge_point）：如"三角函数"、"牛顿定律"、"议论文写作"
2. 题型（question_type）：如"选择题"、"计算题"、"证明题"、"阅读理解"
3. 易错点（pitfall）：如"忽略角度范围"、"单位换算错误"
4. 公式（formula）：如"sin²α+cos²α=1"、"E=mc²"

请以JSON格式返回：
{
  "keywords": [
    {
      "name": "关键词名称",
      "type": "knowledge_point|question_type|pitfall|formula",
      "confidence": 0.0-1.0之间的置信度
    }
  ],
  "subject": "学科（如：数学、英语、物理）",
  "difficulty": 1-5的难度等级
}`

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的教育AI助手，擅长分析试题中的知识点、题型和易错点。',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const keywords = result.keywords || []

    const createdTags: { id: string; name: string; type: string; confidence: number }[] = []

    for (const kw of keywords) {
      const { data: existingTag } = await supabaseAdmin
        .from('tags')
        .select('id')
        .eq('user_id', user_id)
        .eq('tag_name', kw.name)
        .single()

      let tagId: string

      if (existingTag) {
        tagId = existingTag.id
      } else {
        const tagName = kw.name
        const { data: newTag, error: tagError } = await supabaseAdmin
          .from('tags')
          .insert({
            user_id: user_id,
            tag_name: tagName,
            tag_type: kw.type,
            color: colorMap[kw.type] || '#6B7280',
            usage_count: 1,
          })
          .select()
          .single()

        if (tagError) {
          console.error('Error creating tag:', tagError)
          continue
        }
        tagId = newTag.id
      }

      const { data: existingRelation } = await supabaseAdmin
        .from('question_tag_relations')
        .select('id')
        .eq('question_block_id', question_block_id)
        .eq('tag_id', tagId)
        .single()

      let relationError = null
      if (!existingRelation) {
        const { error } = await supabaseAdmin
          .from('question_tag_relations')
          .insert({
            question_block_id: question_block_id,
            tag_id: tagId,
            is_ai_generated: true,
            confidence: kw.confidence,
          })
        relationError = error
      }

      if (relationError) {
        console.error('Error creating tag relation:', relationError)
      } else {
        createdTags.push({
          id: tagId,
          name: kw.name,
          type: kw.type,
          confidence: kw.confidence,
        })
      }
    }

    if (result.difficulty) {
      await supabaseAdmin
        .from('question_blocks')
        .update({ difficulty: result.difficulty })
        .eq('id', question_block_id)
    }

    await supabaseAdmin.from('activity_logs').insert({
      user_id,
      action: 'ai_identify_keywords',
      entity_type: 'question',
      entity_id: question_block_id,
      metadata: {
        keywordsCount: keywords.length,
        subject: result.subject,
        difficulty: result.difficulty,
      },
    })

    return NextResponse.json({
      success: true,
      questionBlockId: question_block_id,
      tags: createdTags,
      subject: result.subject,
      difficulty: result.difficulty,
    })
  } catch (error) {
    console.error('AI Keywords Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
