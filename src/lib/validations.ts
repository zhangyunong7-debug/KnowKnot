// Zod 验证模式

import { z } from 'zod'

// 用户相关
export const signUpSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  username: z.string().min(2, '用户名至少2个字符').max(50, '用户名最多50个字符'),
})

export const signInSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

export const profileUpdateSchema = z.object({
  username: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  plan_type: z.enum(['free', 'pro']).optional(),
})

// 笔记相关
export const noteCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  source_pdf_url: z.string().url().optional(),
  source_pdf_name: z.string().optional(),
})

export const noteUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['importing', 'processing', 'ready', 'archived']).optional(),
  is_template: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
})

// 题目相关
export const questionBlockCreateSchema = z.object({
  note_id: z.string().uuid('无效的笔记 ID'),
  block_order: z.number().int().positive(),
  question_type: z.string().optional(),
  question_text: z.string().min(1, '题目内容不能为空'),
  question_text_rich: z.record(z.unknown()).optional(),
  question_image_urls: z.array(z.string()).optional(),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
})

export const questionBlockUpdateSchema = z.object({
  block_order: z.number().int().positive().optional(),
  question_type: z.string().optional(),
  question_text: z.string().min(1).optional(),
  question_text_rich: z.record(z.unknown()).optional(),
  question_image_urls: z.array(z.string()).optional(),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  user_answer: z.string().optional(),
  is_locked: z.boolean().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  time_spent_seconds: z.number().int().nonnegative().optional(),
})

// 标签相关
export const tagCreateSchema = z.object({
  tag_name: z.string().min(1, '标签名不能为空').max(100),
  tag_type: z.enum(['knowledge_point', 'question_type', 'pitfall', 'formula', 'custom']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
})

export const tagUpdateSchema = z.object({
  tag_name: z.string().min(1).max(100).optional(),
  tag_type: z.enum(['knowledge_point', 'question_type', 'pitfall', 'formula', 'custom']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
})

// 笔记内容相关
export const contentEntryCreateSchema = z.object({
  question_block_id: z.string().uuid('无效的题目 ID'),
  content_type: z.enum(['solution', 'highlight', 'note']).optional(),
  content_text: z.string().optional(),
  content_rich: z.record(z.unknown()).optional(),
  formula_latex: z.array(z.string()).optional(),
  is_highlight: z.boolean().optional(),
  highlight_color: z.string().optional(),
})

// 总结相关
export const summaryCreateSchema = z.object({
  question_block_id: z.string().uuid('无效的题目 ID'),
  summary_type: z.enum(['ai', 'manual']).optional(),
  content: z.string().min(1, '总结内容不能为空'),
  content_rich: z.record(z.unknown()).optional(),
})

export const summaryUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  content_rich: z.record(z.unknown()).optional(),
})

// 思维导图相关
export const mindmapCreateSchema = z.object({
  title: z.string().min(1).max(255),
  source_note_ids: z.array(z.string()).optional(),
  source_tag_ids: z.array(z.string()).optional(),
  mindmap_data: z.record(z.unknown()),
  thumbnail_url: z.string().url().optional(),
  export_format: z.string().optional(),
  is_public: z.boolean().optional(),
})

export const mindmapUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  mindmap_data: z.record(z.unknown()).optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  export_format: z.string().optional(),
  is_public: z.boolean().optional(),
})

// 复习相关
export const reviewSessionCreateSchema = z.object({
  review_type: z.enum(['tag_pull', 'cloze', 'smart_daily']),
  tag_ids: z.array(z.string()).optional(),
  reviewed_question_ids: z.array(z.string()).optional(),
})

export const reviewSessionUpdateSchema = z.object({
  correct_count: z.number().int().nonnegative().optional(),
  wrong_count: z.number().int().nonnegative().optional(),
  duration_seconds: z.number().int().nonnegative().optional(),
  completed_at: z.string().datetime().optional(),
})

// 收藏相关
export const collectionCreateSchema = z.object({
  collection_name: z.string().min(1).max(100),
  description: z.string().optional(),
  is_default: z.boolean().optional(),
})

export const collectionQuestionAddSchema = z.object({
  collection_id: z.string().uuid('无效的收藏 ID'),
  question_block_id: z.string().uuid('无效的题目 ID'),
  added_reason: z.string().optional(),
})

// 文件上传相关
export const fileUploadSchema = z.object({
  bucket: z.enum(['pdfs', 'images', 'attachments', 'mindmaps', 'avatars']),
  folder: z.string().optional(),
})

// 批量操作相关
export const bulkTagSchema = z.object({
  question_ids: z.array(z.string().uuid()).min(1),
  tag_ids: z.array(z.string().uuid()).min(1),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})

// 搜索相关
export const searchSchema = z.object({
  query: z.string().min(1),
  filters: z.object({
    type: z.enum(['notes', 'questions', 'tags']).optional(),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
})

// 类型导出
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type NoteCreateInput = z.infer<typeof noteCreateSchema>
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>
export type QuestionBlockCreateInput = z.infer<typeof questionBlockCreateSchema>
export type QuestionBlockUpdateInput = z.infer<typeof questionBlockUpdateSchema>
export type TagCreateInput = z.infer<typeof tagCreateSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
export type ContentEntryCreateInput = z.infer<typeof contentEntryCreateSchema>
export type SummaryCreateInput = z.infer<typeof summaryCreateSchema>
export type SummaryUpdateInput = z.infer<typeof summaryUpdateSchema>
export type MindmapCreateInput = z.infer<typeof mindmapCreateSchema>
export type MindmapUpdateInput = z.infer<typeof mindmapUpdateSchema>
export type ReviewSessionCreateInput = z.infer<typeof reviewSessionCreateSchema>
export type ReviewSessionUpdateInput = z.infer<typeof reviewSessionUpdateSchema>
export type CollectionCreateInput = z.infer<typeof collectionCreateInput>
export type CollectionQuestionAddInput = z.infer<typeof collectionQuestionAddSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type BulkTagInput = z.infer<typeof bulkTagSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
export type SearchInput = z.infer<typeof searchSchema>
