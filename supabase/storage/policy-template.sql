-- Supabase Storage Bucket 配置
-- 运行方式: supabase storage create-bucket 或在 Dashboard 中配置

-- 1. PDFs 存储桶 - 存放用户上传的 PDF 文件
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- PDFs 存储策略
CREATE POLICY "Users can upload PDFs to their folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdfs'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdfs'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own PDFs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pdfs'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pdfs'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- 2. Images 存储桶 - 存放题目图片和截图
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Users can upload images to their folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- 3. Attachments 存储桶 - 存放视频和音频文件
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  524288000, -- 500MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can manage their own attachments"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'attachments'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- 4. Mindmaps 存储桶 - 存放导图导出文件
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mindmaps',
  'mindmaps',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view public mindmaps"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mindmaps');

CREATE POLICY "Users can manage their own mindmaps"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'mindmaps'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- 5. Avatars 存储桶 - 存放用户头像
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
