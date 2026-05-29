// Supabase Edge Function: AI 总结生成
// 功能：为题目生成解题思路和总结

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://deno.land/x/openai@v4.52.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      questionBlockId,
      questionText,
      userAnswer,
      correctAnswer,
      tags,
      transcriptText,
      userId,
    } = await req.json();

    if (!questionBlockId || !questionText || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 初始化客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }
    const openai = new OpenAI({ apiKey: deepseekApiKey, baseURL: 'https://api.deepseek.com' });

    // 构建总结提示
    const summaryPrompt = `请为以下试题生成解题总结：

    题干：${questionText}

    ${userAnswer ? `用户答案：${userAnswer}` : ''}
    ${correctAnswer ? `正确答案：${correctAnswer}` : ''}
    ${tags && tags.length > 0 ? `相关标签：${tags.map((t: { name: string }) => t.name).join('、')}` : ''}
    ${transcriptText ? `\n视频/录音转录内容：\n${transcriptText}` : ''}

    请生成一个精炼的"解题心法"总结，包括：
    1. 解题思路的核心步骤
    2. 关键知识点和解题技巧
    3. 如果是错题，分析错误原因和避免方法
    4. 如果有视频内容，提炼视频讲解中的要点

    请用简洁、有条理的语言表达，适合复习时快速回忆。

    请以JSON格式返回：
    {
      "summary": "解题心法总结内容",
      "keyPoints": ["要点1", "要点2", ...],
      "tips": "如有额外技巧或提醒",
      "difficultyReason": "为什么这个难度..."
    }`;

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
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const summaryContent = result.summary || '无法生成总结';

    // 构建完整的提示词记录
    const promptUsed = `用户答案：${userAnswer || '无'}\n正确答案：${correctAnswer || '无'}\n相关标签：${tags?.map((t: { name: string }) => t.name).join('、') || '无'}`;

    // 检查是否已有 AI 总结，如有则更新，否则插入
    const { data: existingSummary } = await supabase
      .from('summaries')
      .select('id')
      .eq('question_block_id', questionBlockId)
      .eq('summary_type', 'ai')
      .single();

    let summaryId: string;

    if (existingSummary) {
      const { data: updated, error: updateError } = await supabase
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
        .single();

      if (updateError) {
        throw updateError;
      }
      summaryId = updated.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('summaries')
        .insert({
          question_block_id: questionBlockId,
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
        .single();

      if (insertError) {
        throw insertError;
      }
      summaryId = inserted.id;
    }

    // 记录操作日志
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'generate_summary',
      entity_type: 'question',
      entity_id: questionBlockId,
      metadata: {
        summaryId,
        hasTranscript: !!transcriptText,
        keyPointsCount: result.keyPoints?.length || 0,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        summaryId,
        summary: summaryContent,
        keyPoints: result.keyPoints || [],
        tips: result.tips || '',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
