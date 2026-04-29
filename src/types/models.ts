// 应用特定类型定义

import type {
  Profile,
  Note,
  QuestionBlock,
  NoteContentEntry,
  Tag,
  Summary,
  Attachment,
  ReviewSession,
  ClozeItem,
  Mindmap,
} from './database'

// 用户相关
export interface UserProfile extends Profile {
  stats?: UserStats
}

export interface UserStats {
  totalNotes: number
  totalQuestions: number
  totalReviews: number
  masteredQuestions: number
  streakDays: number
}

// 笔记相关
export interface NoteWithDetails extends Note {
  question_blocks?: QuestionBlockWithTags[]
  _count?: {
    question_blocks: number
  }
}

export interface QuestionBlockWithTags extends QuestionBlock {
  tags?: TagWithRelations[]
  summaries?: Summary[]
  content_entries?: NoteContentEntry[]
  attachments?: Attachment[]
}

// 标签相关
export interface TagWithRelations extends Tag {
  question_tag_relations?: QuestionTagRelation[]
  _count?: {
    question_tag_relations: number
  }
}

// 康奈尔笔记区域
export type CornellSection = 'cue' | 'note' | 'summary'

export interface CornellNoteData {
  questionBlockId: string
  noteSection: CornellSection
  content: string
  richContent?: Record<string, unknown>
}

// 复习模式
export type ReviewMode = 'tag_pull' | 'cloze' | 'smart_daily'

export interface ReviewSessionWithDetails extends ReviewSession {
  questions?: QuestionBlockWithTags[]
  tags?: Tag[]
}

// 挖空状态
export interface ClozeState {
  itemId: string
  isHidden: boolean
  revealed: boolean
}

// 思维导图节点
export interface MindMapNode {
  id: string
  text: string
  children?: MindMapNode[]
  style?: {
    backgroundColor?: string
    textColor?: string
  }
}

export interface MindmapWithDetails extends Mindmap {
  mindmapData: MindMapNode
}

// 文件上传
export interface UploadedFile {
  url: string
  path: string
  name: string
  size: number
  type: string
}

// PDF 导入
export interface PDFImportResult {
  noteId: string
  pdfUrl: string
  questions: QuestionBlock[]
  status: 'importing' | 'processing' | 'ready' | 'error'
}

// AI 功能结果
export interface AIKeywordResult {
  tagId: string
  tagName: string
  tagType: 'knowledge_point' | 'question_type' | 'pitfall' | 'formula'
  confidence: number
  isNew: boolean
}

export interface AISummaryResult {
  summaryId: string
  summary: string
  keyPoints: string[]
  tips?: string
}

export interface AIMindmapResult {
  mindmapId: string
  mindmapData: MindMapNode
}

// 视图模式
export type ViewMode = 'single' | 'multi'
export type ThemeMode = 'light' | 'dark' | 'system'

// 搜索和筛选
export interface NoteFilters {
  status?: Note['status']
  search?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface QuestionFilters {
  noteId?: string
  tags?: string[]
  difficulty?: number[]
  isLocked?: boolean
  search?: string
}

// 排序
export type SortOrder = 'asc' | 'desc'

export interface NoteSortConfig {
  field: 'created_at' | 'updated_at' | 'title'
  order: SortOrder
}

export interface QuestionSortConfig {
  field: 'block_order' | 'difficulty' | 'created_at'
  order: SortOrder
}

// 实时订阅
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T | null
}

// API 响应
export interface APIResponse<T> {
  data?: T
  error?: string
  message?: string
}

// 分页
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 设置
export interface AppSettings {
  theme: ThemeMode
  fontSize: 'small' | 'medium' | 'large'
  noteViewMode: ViewMode
  enableRealtime: boolean
  enableNotifications: boolean
  dailyGoal?: number
}

// 设备信息
export interface DeviceInfo {
  deviceId: string
  deviceType: 'windows' | 'ipad' | 'android' | 'ios' | 'unknown'
  deviceName: string
  lastSyncAt: string
}
