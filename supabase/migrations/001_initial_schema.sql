-- =============================================
-- KnowKnot 数据库表设计 (PostgreSQL)
-- Supabase 完整配置版本
-- =============================================

-- 1. 用户表 (使用 Supabase Auth 的 auth.users 扩展)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    username VARCHAR(100),
    avatar_url TEXT,
    plan_type VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{"theme": "light", "notifications": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 笔记表 (核心：一个笔记对应一份试卷或一组题目)
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_pdf_url TEXT,
    source_pdf_name TEXT,
    thumbnail_url TEXT,
    status VARCHAR(50) DEFAULT 'importing',
    is_template BOOLEAN DEFAULT FALSE,
    parent_note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{"view_mode": "multi", "font_size": "medium"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 题目区块表 (对应切分后的每一道题)
CREATE TABLE public.question_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    block_order INT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'unknown',
    question_text TEXT NOT NULL,
    question_text_rich JSONB,
    question_image_urls TEXT[],
    options JSONB,
    correct_answer TEXT,
    user_answer TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
    time_spent_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 笔记区额外内容表 (解题答案、高亮、富文本)
CREATE TABLE public.note_content_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_block_id UUID NOT NULL REFERENCES public.question_blocks(id) ON DELETE CASCADE,
    content_type VARCHAR(50) DEFAULT 'solution',
    content_text TEXT,
    content_rich JSONB,
    formula_latex TEXT[],
    is_highlight BOOLEAN DEFAULT FALSE,
    highlight_color VARCHAR(20) DEFAULT 'yellow',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 关键词/标签表 (统一标签库)
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(50) DEFAULT 'custom',
    color VARCHAR(7),
    icon VARCHAR(50),
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tag_name)
);

-- 6. 题目-标签关联表 (多对多)
CREATE TABLE public.question_tag_relations (
    question_block_id UUID NOT NULL REFERENCES public.question_blocks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (question_block_id, tag_id)
);

-- 7. 总结区表 (每道题的AI总结/用户手写总结)
CREATE TABLE public.summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_block_id UUID NOT NULL REFERENCES public.question_blocks(id) ON DELETE CASCADE,
    summary_type VARCHAR(50) DEFAULT 'ai',
    content TEXT NOT NULL,
    content_rich JSONB,
    prompt_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 多媒体附件表 (视频/录音)
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_block_id UUID NOT NULL REFERENCES public.question_blocks(id) ON DELETE CASCADE,
    attachment_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    file_url TEXT,
    file_name TEXT,
    file_size INT,
    external_url TEXT,
    transcript_text TEXT,
    duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 复习记录表 (主动召回引擎核心)
CREATE TABLE public.review_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_type VARCHAR(50) NOT NULL,
    tag_ids UUID[],
    reviewed_question_ids UUID[],
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    duration_seconds INT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 挖空遮盖记录表 (笔记区高亮转填空)
CREATE TABLE public.cloze_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_content_entry_id UUID NOT NULL REFERENCES public.note_content_entries(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    hidden_text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    review_count INT DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 思维导图表 (多笔记聚合生成)
CREATE TABLE public.mindmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_note_ids UUID[],
    source_tag_ids UUID[],
    mindmap_data JSONB NOT NULL,
    thumbnail_url TEXT,
    export_format VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 错题本/重点本 (快速收藏)
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collection_questions (
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    question_block_id UUID NOT NULL REFERENCES public.question_blocks(id) ON DELETE CASCADE,
    added_reason VARCHAR(255),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, question_block_id)
);

-- 13. 每日推送记录 (手机端碎片复习)
CREATE TABLE public.daily_pushes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    push_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recommended_question_ids UUID[],
    tag_ids UUID[],
    is_clicked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, push_date)
);

-- 14. 设备同步表 (跨端体验)
CREATE TABLE public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_type VARCHAR(50),
    device_name VARCHAR(255),
    last_sync_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- 15. 操作日志表 (可选，用于数据分析和问题定位)
CREATE TABLE public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 索引优化 (提升查询性能)
-- =============================================

CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_status ON public.notes(status);
CREATE INDEX idx_notes_created ON public.notes(user_id, created_at DESC);
CREATE INDEX idx_question_blocks_note_id ON public.question_blocks(note_id);
CREATE INDEX idx_question_blocks_order ON public.question_blocks(note_id, block_order);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_tags_name ON public.tags(user_id, tag_name);
CREATE INDEX idx_tags_type ON public.tags(user_id, tag_type);
CREATE INDEX idx_question_tag_q ON public.question_tag_relations(question_block_id);
CREATE INDEX idx_question_tag_t ON public.question_tag_relations(tag_id);
CREATE INDEX idx_summaries_question ON public.summaries(question_block_id);
CREATE INDEX idx_attachments_question ON public.attachments(question_block_id);
CREATE INDEX idx_review_sessions_user ON public.review_sessions(user_id);
CREATE INDEX idx_review_sessions_date ON public.review_sessions(user_id, started_at DESC);
CREATE INDEX idx_daily_pushes_user_date ON public.daily_pushes(user_id, push_date);
CREATE INDEX idx_cloze_items_entry ON public.cloze_items(note_content_entry_id);
CREATE INDEX idx_cloze_items_active ON public.cloze_items(note_content_entry_id) WHERE is_active = true;
CREATE INDEX idx_mindmaps_user ON public.mindmaps(user_id);
CREATE INDEX idx_collections_user ON public.collections(user_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action, created_at DESC);

-- =============================================
-- 行级安全策略 (RLS) - 多租户隔离
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_content_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloze_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_pushes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles 策略：用户只能查看和更新自己的资料
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Notes 策略：用户只能操作自己的笔记
CREATE POLICY "Users can view own notes"
    ON public.notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON public.notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id);

-- Question Blocks 策略：通过笔记间接验证权限
CREATE POLICY "Users can view own question blocks"
    ON public.question_blocks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = question_blocks.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own question blocks"
    ON public.question_blocks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = question_blocks.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own question blocks"
    ON public.question_blocks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = question_blocks.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own question blocks"
    ON public.question_blocks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = question_blocks.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- Note Content Entries 策略
CREATE POLICY "Users can manage own content entries"
    ON public.note_content_entries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.question_blocks qb
            JOIN public.notes n ON n.id = qb.note_id
            WHERE qb.id = note_content_entries.question_block_id
            AND n.user_id = auth.uid()
        )
    );

-- Tags 策略：用户只能操作自己的标签
CREATE POLICY "Users can view own tags"
    ON public.tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
    ON public.tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
    ON public.tags FOR DELETE
    USING (auth.uid() = user_id);

-- Question Tag Relations 策略
CREATE POLICY "Users can manage own tag relations"
    ON public.question_tag_relations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.question_blocks qb
            JOIN public.notes n ON n.id = qb.note_id
            WHERE qb.id = question_tag_relations.question_block_id
            AND n.user_id = auth.uid()
        )
    );

-- Summaries 策略
CREATE POLICY "Users can manage own summaries"
    ON public.summaries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.question_blocks qb
            JOIN public.notes n ON n.id = qb.note_id
            WHERE qb.id = summaries.question_block_id
            AND n.user_id = auth.uid()
        )
    );

-- Attachments 策略
CREATE POLICY "Users can manage own attachments"
    ON public.attachments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.question_blocks qb
            JOIN public.notes n ON n.id = qb.note_id
            WHERE qb.id = attachments.question_block_id
            AND n.user_id = auth.uid()
        )
    );

-- Review Sessions 策略
CREATE POLICY "Users can manage own review sessions"
    ON public.review_sessions FOR ALL
    USING (auth.uid() = user_id);

-- Cloze Items 策略
CREATE POLICY "Users can manage own cloze items"
    ON public.cloze_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.note_content_entries nce
            JOIN public.question_blocks qb ON qb.id = nce.question_block_id
            JOIN public.notes n ON n.id = qb.note_id
            WHERE nce.id = cloze_items.note_content_entry_id
            AND n.user_id = auth.uid()
        )
    );

-- Mindmaps 策略
CREATE POLICY "Users can manage own mindmaps"
    ON public.mindmaps FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public mindmaps"
    ON public.mindmaps FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

-- Collections 策略
CREATE POLICY "Users can manage own collections"
    ON public.collections FOR ALL
    USING (auth.uid() = user_id);

-- Collection Questions 策略
CREATE POLICY "Users can manage own collection questions"
    ON public.collection_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = collection_questions.collection_id
            AND c.user_id = auth.uid()
        )
    );

-- Daily Pushes 策略
CREATE POLICY "Users can manage own daily pushes"
    ON public.daily_pushes FOR ALL
    USING (auth.uid() = user_id);

-- User Devices 策略
CREATE POLICY "Users can manage own devices"
    ON public.user_devices FOR ALL
    USING (auth.uid() = user_id);

-- Activity Logs 策略：用户只能查看自己的日志
CREATE POLICY "Users can view own activity logs"
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 触发器: 自动更新 updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_question_blocks_updated_at
    BEFORE UPDATE ON public.question_blocks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_note_content_entries_updated_at
    BEFORE UPDATE ON public.note_content_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_summaries_updated_at
    BEFORE UPDATE ON public.summaries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_mindmaps_updated_at
    BEFORE UPDATE ON public.mindmaps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 自动创建 profile (当用户注册时)
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 存储桶配置 (通过 Supabase Dashboard 或 CLI)
-- =============================================

-- 需要的存储桶:
-- 1. pdfs - 存放用户上传的 PDF 文件
-- 2. images - 存放题目图片和截图
-- 3. attachments - 存放视频和音频文件
-- 4. mindmaps - 存放导图导出文件
-- 5. avatars - 存放用户头像

-- =============================================
-- 实时订阅配置
-- =============================================

-- 启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.question_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_content_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
