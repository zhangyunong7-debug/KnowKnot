import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import supabaseAdmin from '@/lib/supabase/admin'

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
})

export async function POST(request: NextRequest) {
  try {
    const { title, note_ids, tag_ids, user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('question_blocks')
      .select(`
        id,
        question_text,
        question_type,
        summaries (content, content_rich),
        question_tag_relations (tags (id, tag_name, tag_type))
      `)

    if (note_ids && note_ids.length > 0) {
      query = query.in('note_id', note_ids)
    }

    const { data: questions, error: queryError } = await query

    if (queryError) throw queryError

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for mindmap generation' }, { status: 400 })
    }

    const questionsData = questions.map((q: any) => ({
      question: q.question_text,
      type: q.question_type,
      summary: q.summaries?.content || '',
      tags: q.question_tag_relations?.map((r: any) => ({
        name: r.tags.tag_name,
        type: r.tags.tag_type,
      })) || [],
    }))

    const mindmapPrompt = `请基于以下试题总结，生成一个层级思维导图的结构：

主题：${title || '知识总结'}

试题总结列表：
${questionsData.map((q: any, i: number) => `
【题目 ${i + 1}】
题干：${q.question}
题型：${q.type}
总结：${q.summary}
标签：${q.tags.map((t: any) => t.name).join('、')}
`).join('\n')}

请根据以上内容，生成一个合理的思维导图结构：
1. 中心节点为主题
2. 第一层分支为主题下的主要分类（如：不同题型、重要知识点）
3. 第二层分支为具体的解题方法、技巧或要点
4. 叶子节点为最具体的知识点

请以JSON格式返回思维导图结构：
{
  "center": "中心主题",
  "branches": [
    {
      "id": "branch_1",
      "text": "分支1标题",
      "children": [
        {
          "id": "leaf_1",
          "text": "叶子节点1"
        }
      ]
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的教育AI助手，擅长归纳总结知识点和构建思维导图。
你的任务是将多个试题的总结聚合成一个结构清晰、层次分明的思维导图。
导图应该：
- 逻辑清晰，层次分明
- 突出核心知识点
- 包含实用的解题技巧
- 便于复习时快速回忆整体知识框架`,
        },
        {
          role: 'user',
          content: mindmapPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    const mindmapData = {
      id: 'root',
      text: result.center || title || '知识总结',
      style: {
        backgroundColor: '#0ea5e9',
        textColor: '#ffffff',
      },
      children: (result.branches || []).map((branch: { id: string; text: string; children?: { id: string; text: string }[] }) => ({
        id: branch.id,
        text: branch.text,
        children: (branch.children || []).map((child: { id: string; text: string }) => ({
          id: child.id,
          text: child.text,
        })),
      })),
    }

    const { data: mindmap, error: insertError } = await supabaseAdmin
      .from('mindmaps')
      .insert({
        user_id,
        title: title || '未命名导图',
        source_note_ids: note_ids || [],
        source_tag_ids: tag_ids || [],
        mindmap_data: mindmapData,
      })
      .select()
      .single()

    if (insertError) throw insertError

    await supabaseAdmin.from('activity_logs').insert({
      user_id,
      action: 'generate_mindmap',
      entity_type: 'mindmap',
      entity_id: mindmap.id,
      metadata: {
        questionCount: questions.length,
        branchCount: mindmapData.children?.length || 0,
      },
    })

    return NextResponse.json({
      success: true,
      mindmapId: mindmap.id,
      mindmapData,
    })
  } catch (error) {
    console.error('AI Mindmap Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
