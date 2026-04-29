// Supabase Edge Function: PDF 智能导入和题目切分
// 功能：解析 PDF 内容，调用 OpenAI API 智能切分试题

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://deno.land/x/openai@v4.52.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionBlock {
  order: number;
  type: string;
  text: string;
  options?: string[];
  images?: string[];
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { noteId, pdfUrl, userId } = await req.json();

    if (!noteId || !pdfUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 初始化 OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // 下载 PDF 内容
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to download PDF');
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // 调用 OpenAI 解析 PDF 内容
    // 注意：实际项目中应该使用 PDF 解析库（如 pdf-parse）或云服务
    // 这里演示如何调用 OpenAI API 进行题目切分
    const analysisPrompt = `你是一个专业的试卷分析AI。请分析以下PDF内容中的试题：

    1. 识别试卷标题和大题编号（如"一、选择题"、"二、填空题"等）
    2. 识别每道小题的题干、选项（如有）
    3. 识别图片位置和数学公式
    4. 判断题目类型（选择题、填空题、解答题等）

    请以JSON格式返回切分后的题目列表：
    {
      "title": "试卷标题",
      "totalQuestions": 总题数,
      "questions": [
        {
          "order": 题目序号,
          "type": "选择题|填空题|解答题",
          "text": "题干内容",
          "options": ["A. 选项", "B. 选项", ...],
          "hasImages": 是否包含图片,
          "hasFormula": 是否包含公式
        }
      ]
    }

    PDF内容（Base64编码）: ${pdfBase64.substring(0, 5000)}...`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的教育AI助手，擅长分析试卷和切分试题。',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');

    // 更新笔记状态为处理中
    await supabase
      .from('notes')
      .update({ status: 'processing' })
      .eq('id', noteId);

    // 插入题目区块
    const questionBlocks: QuestionBlock[] = analysisResult.questions || [];
    const insertedBlocks = [];

    for (const q of questionBlocks) {
      const { data: block, error: blockError } = await supabase
        .from('question_blocks')
        .insert({
          note_id: noteId,
          block_order: q.order,
          question_type: q.type,
          question_text: q.text,
          options: q.options || null,
          question_image_urls: q.hasImages ? [`${pdfUrl}#page=1&box=${q.order}`] : [],
        })
        .select()
        .single();

      if (blockError) {
        console.error('Error inserting question block:', blockError);
        continue;
      }

      insertedBlocks.push(block);
    }

    // 更新笔记状态为就绪
    await supabase
      .from('notes')
      .update({ status: 'ready' })
      .eq('id', noteId);

    // 记录操作日志
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'import_pdf',
      entity_type: 'note',
      entity_id: noteId,
      metadata: {
        totalQuestions: questionBlocks.length,
        pdfUrl,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        noteId,
        totalQuestions: questionBlocks.length,
        questions: insertedBlocks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
