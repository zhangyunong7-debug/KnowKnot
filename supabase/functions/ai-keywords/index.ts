// Supabase Edge Function: AI 关键词识别
// 功能：分析题目内容，识别知识点、题型、易错点等标签

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://deno.land/x/openai@v4.52.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordResult {
  tagName: string;
  tagType: 'knowledge_point' | 'question_type' | 'pitfall' | 'formula' | 'custom';
  color: string;
  isAiGenerated: boolean;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { questionBlockId, questionText, options, correctAnswer, userId } = await req.json();

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

    // 构建分析提示
    const analysisPrompt = `请分析以下试题，识别其中的关键信息：

    题干：${questionText}
    ${options ? `选项：\n${options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}` : ''}
    ${correctAnswer ? `正确答案：${correctAnswer}` : ''}

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
    }`;

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
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const keywords: KeywordResult[] = result.keywords || [];

    // 颜色映射
    const colorMap: Record<string, string> = {
      knowledge_point: '#3B82F6', // 蓝色
      question_type: '#10B981',   // 绿色
      pitfall: '#EF4444',         // 红色
      formula: '#8B5CF6',         // 紫色
      custom: '#6B7280',          // 灰色
    };

    const createdTags = [];

    for (const kw of keywords) {
      // 检查标签是否已存在
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('tag_name', kw.name)
        .single();

      let tagId: string;

      if (existingTag) {
        tagId = existingTag.id;
        // 更新使用次数
        await supabase
          .from('tags')
          .update({ usage_count: supabase.sql`usage_count + 1` })
          .eq('id', tagId);
      } else {
        // 创建新标签
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({
            user_id: userId,
            tag_name: kw.name,
            tag_type: kw.type,
            color: colorMap[kw.type] || '#6B7280',
            usage_count: 1,
          })
          .select()
          .single();

        if (tagError) {
          console.error('Error creating tag:', tagError);
          continue;
        }
        tagId = newTag.id;
      }

      // 创建题目-标签关联
      const { error: relationError } = await supabase
        .from('question_tag_relations')
        .insert({
          question_block_id: questionBlockId,
          tag_id: tagId,
          is_ai_generated: true,
          confidence: kw.confidence,
        });

      if (relationError) {
        console.error('Error creating tag relation:', relationError);
      } else {
        createdTags.push({
          id: tagId,
          name: kw.name,
          type: kw.type,
          confidence: kw.confidence,
        });
      }
    }

    // 更新题目难度
    if (result.difficulty) {
      await supabase
        .from('question_blocks')
        .update({ difficulty: result.difficulty })
        .eq('id', questionBlockId);
    }

    // 记录操作日志
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'ai_identify_keywords',
      entity_type: 'question',
      entity_id: questionBlockId,
      metadata: {
        keywordsCount: keywords.length,
        subject: result.subject,
        difficulty: result.difficulty,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        questionBlockId,
        tags: createdTags,
        subject: result.subject,
        difficulty: result.difficulty,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error identifying keywords:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
