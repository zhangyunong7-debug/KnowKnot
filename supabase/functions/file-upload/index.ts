// Supabase Edge Function: 文件上传处理
// 功能：处理 PDF、图片、音频等文件上传到 Storage

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_FILE_TYPES = {
  pdf: ['application/pdf'],
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  video: ['video/mp4', 'video/webm'],
};

const MAX_FILE_SIZES = {
  pdf: 50 * 1024 * 1024, // 50MB
  images: 10 * 1024 * 1024, // 10MB
  audio: 100 * 1024 * 1024, // 100MB
  video: 500 * 1024 * 1024, // 500MB
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 获取认证信息
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 创建带认证的客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 解析表单数据
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'files';
    const folder = formData.get('folder') as string || 'misc';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 确定文件类型
    let fileCategory: keyof typeof ALLOWED_FILE_TYPES = 'images';
    for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
      if (types.includes(file.type)) {
        fileCategory = category as keyof typeof ALLOWED_FILE_TYPES;
        break;
      }
    }

    // 验证文件类型
    const allowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `File type ${file.type} is not allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZES[fileCategory]) {
      return new Response(
        JSON.stringify({ error: `File size exceeds limit of ${MAX_FILE_SIZES[fileCategory] / 1024 / 1024}MB` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}_${randomStr}.${ext}`;
    const filePath = `${user.id}/${folder}/${fileName}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const content = new Uint8Array(arrayBuffer);

    // 上传到 Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, content, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // 记录操作日志
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'upload_file',
      entity_type: 'file',
      metadata: {
        bucket,
        folder,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        fileUrl: urlData.publicUrl,
        filePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
