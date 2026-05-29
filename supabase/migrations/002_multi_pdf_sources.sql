-- =============================================
-- 多 PDF 支持：pdf_sources 表
-- =============================================

-- 1. PDF 来源表：一个笔记可以有多个 PDF
CREATE TABLE public.pdf_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    pdf_name TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pdf_sources_note_id ON public.pdf_sources(note_id);

ALTER TABLE public.pdf_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pdf sources"
    ON public.pdf_sources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.notes n
            WHERE n.id = pdf_sources.note_id
            AND n.user_id = auth.uid()
        )
    );

-- 2. question_blocks 增加 source_pdf_id 外键
ALTER TABLE public.question_blocks
    ADD COLUMN source_pdf_id UUID REFERENCES public.pdf_sources(id) ON DELETE SET NULL;

CREATE INDEX idx_question_blocks_source_pdf ON public.question_blocks(source_pdf_id);

-- 3. 迁移现有数据：将 notes.source_pdf_url/name 迁移到 pdf_sources
INSERT INTO public.pdf_sources (note_id, pdf_url, pdf_name, status, imported_at)
SELECT id, source_pdf_url, COALESCE(source_pdf_name, 'unknown.pdf'), 'ready', created_at
FROM public.notes
WHERE source_pdf_url IS NOT NULL;

-- 4. 回填 question_blocks.source_pdf_id
UPDATE public.question_blocks qb
SET source_pdf_id = ps.id
FROM public.pdf_sources ps
WHERE ps.note_id = qb.note_id;

-- 5. 添加触发器：自动更新 pdf_sources.updated_at（如果需要）
CREATE TRIGGER trigger_pdf_sources_updated_at
    BEFORE UPDATE ON public.pdf_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. 启用 pdf_sources 实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE public.pdf_sources;
