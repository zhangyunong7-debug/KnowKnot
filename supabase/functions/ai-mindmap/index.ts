// Supabase Edge Function: 思维导图聚合生成
// 功能：聚合多个笔记的总结区，生成层级思维导图

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://deno.land/x/openai@v4.52.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
  style?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, noteIds, tagIds, userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 初始化客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // 获取相关笔记和总结
    let query = supabase
      .from('question_blocks')
      .select(`
        id,
        question_text,
        question_type,
        summaries (
          content,
          content_rich
        ),
        question_tag_relations (
          tags (
            id,
            tag_name,
            tag_type
          )
        )
      `);

    if (noteIds && noteIds.length > 0) {
      query = query.in('note_id', noteIds);
    }

    const { data: questions, error: queryError } = await query;

    if (queryError) {
      throw queryError;
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No questions found for mindmap generation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 整理题目数据
    const questionsData = questions.map((q) => ({
      question: q.question_text,
      type: q.question_type,
      summary: q.summaries?.content || '',
      tags: q.question_tag_relations?.map((r: { tags: { tag_name: string; tag_type: string } }) => ({
        name: r.tags.tag_name,
        type: r.tags.tag_type,
      })) || [],
    }));

    // 构建思维导图生成提示
    const mindmapPrompt = `请基于以下试题总结，生成一个层级思维导图的结构：

    主题：${title || '知识总结'}

    试题总结列表：
    ${questionsData.map((q, i) => `
    【题目 ${i + 1}】
    题干：${q.question}
    题型：${q.type}
    总结：${q.summary}
    标签：${q.tags.map((t: { name: string }) => t.name).join('、')}
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
    }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // 构建思维导图数据
    const mindmapData: MindMapNode = {
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
    };

    // 保存思维导图到数据库
    const { data: mindmap, error: insertError } = await supabase
      .from('mindmaps')
      .insert({
        user_id: userId,
        title: title || '未命名导图',
        source_note_ids: noteIds || [],
        source_tag_ids: tagIds || [],
        mindmap_data: mindmapData,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 记录操作日志
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'generate_mindmap',
      entity_type: 'mindmap',
      entity_id: mindmap.id,
      metadata: {
        questionCount: questions.length,
        branchCount: mindmapData.children?.length || 0,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        mindmapId: mindmap.id,
        mindmapData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating mindmap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
