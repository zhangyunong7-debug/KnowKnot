// 数据库类型定义 - 从 Supabase 表结构生成

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          avatar_url: string | null
          plan_type: 'free' | 'pro'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          avatar_url?: string | null
          plan_type?: 'free' | 'pro'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          avatar_url?: string | null
          plan_type?: 'free' | 'pro'
          settings?: Json
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          source_pdf_url: string | null
          source_pdf_name: string | null
          thumbnail_url: string | null
          status: 'importing' | 'processing' | 'ready' | 'archived'
          is_template: boolean
          parent_note_id: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          source_pdf_url?: string | null
          source_pdf_name?: string | null
          thumbnail_url?: string | null
          status?: 'importing' | 'processing' | 'ready' | 'archived'
          is_template?: boolean
          parent_note_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          source_pdf_url?: string | null
          source_pdf_name?: string | null
          thumbnail_url?: string | null
          status?: 'importing' | 'processing' | 'ready' | 'archived'
          is_template?: boolean
          parent_note_id?: string | null
          settings?: Json
          updated_at?: string
        }
      }
      question_blocks: {
        Row: {
          id: string
          note_id: string
          block_order: number
          question_type: string
          question_text: string
          question_text_rich: Json | null
          question_image_urls: string[] | null
          options: string[] | null
          correct_answer: string | null
          user_answer: string | null
          is_locked: boolean
          difficulty: number | null
          time_spent_seconds: number | null
          source_pdf_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          note_id: string
          block_order: number
          question_type?: string
          question_text: string
          question_text_rich?: Json | null
          question_image_urls?: string[] | null
          options?: string[] | null
          correct_answer?: string | null
          user_answer?: string | null
          is_locked?: boolean
          difficulty?: number | null
          time_spent_seconds?: number | null
          source_pdf_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          block_order?: number
          question_type?: string
          question_text?: string
          question_text_rich?: Json | null
          question_image_urls?: string[] | null
          options?: string[] | null
          correct_answer?: string | null
          user_answer?: string | null
          is_locked?: boolean
          difficulty?: number | null
          time_spent_seconds?: number | null
          source_pdf_id?: string | null
          updated_at?: string
        }
      }
      pdf_sources: {
        Row: {
          id: string
          note_id: string
          pdf_url: string
          pdf_name: string
          status: 'processing' | 'ready' | 'error'
          imported_at: string
        }
        Insert: {
          id?: string
          note_id: string
          pdf_url: string
          pdf_name: string
          status?: 'processing' | 'ready' | 'error'
          imported_at?: string
        }
        Update: {
          note_id?: string
          pdf_url?: string
          pdf_name?: string
          status?: 'processing' | 'ready' | 'error'
          imported_at?: string
        }
      }
      note_content_entries: {
        Row: {
          id: string
          question_block_id: string
          content_type: 'solution' | 'highlight' | 'note'
          content_text: string | null
          content_rich: Json | null
          formula_latex: string[] | null
          is_highlight: boolean
          highlight_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_block_id: string
          content_type?: 'solution' | 'highlight' | 'note'
          content_text?: string | null
          content_rich?: Json | null
          formula_latex?: string[] | null
          is_highlight?: boolean
          highlight_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_block_id?: string
          content_type?: 'solution' | 'highlight' | 'note'
          content_text?: string | null
          content_rich?: Json | null
          formula_latex?: string[] | null
          is_highlight?: boolean
          highlight_color?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          tag_name: string
          tag_type: 'knowledge_point' | 'question_type' | 'pitfall' | 'formula' | 'custom'
          color: string | null
          icon: string | null
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tag_name: string
          tag_type?: 'knowledge_point' | 'question_type' | 'pitfall' | 'formula' | 'custom'
          color?: string | null
          icon?: string | null
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tag_name?: string
          tag_type?: 'knowledge_point' | 'question_type' | 'pitfall' | 'formula' | 'custom'
          color?: string | null
          icon?: string | null
          usage_count?: number
        }
      }
      question_tag_relations: {
        Row: {
          question_block_id: string
          tag_id: string
          is_ai_generated: boolean
          confidence: number | null
          created_at: string
        }
        Insert: {
          question_block_id: string
          tag_id: string
          is_ai_generated?: boolean
          confidence?: number | null
          created_at?: string
        }
        Update: {
          is_ai_generated?: boolean
          confidence?: number | null
        }
      }
      summaries: {
        Row: {
          id: string
          question_block_id: string
          summary_type: 'ai' | 'manual'
          content: string
          content_rich: Json | null
          prompt_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_block_id: string
          summary_type?: 'ai' | 'manual'
          content: string
          content_rich?: Json | null
          prompt_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          summary_type?: 'ai' | 'manual'
          content?: string
          content_rich?: Json | null
          prompt_used?: string | null
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          question_block_id: string
          attachment_type: 'video' | 'audio'
          title: string | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          external_url: string | null
          transcript_text: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          question_block_id: string
          attachment_type: 'video' | 'audio'
          title?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          external_url?: string | null
          transcript_text?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          question_block_id?: string
          attachment_type?: 'video' | 'audio'
          title?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          external_url?: string | null
          transcript_text?: string | null
          duration_seconds?: number | null
        }
      }
      review_sessions: {
        Row: {
          id: string
          user_id: string
          review_type: 'tag_pull' | 'cloze' | 'smart_daily'
          tag_ids: string[] | null
          reviewed_question_ids: string[] | null
          correct_count: number
          wrong_count: number
          duration_seconds: number | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          review_type: 'tag_pull' | 'cloze' | 'smart_daily'
          tag_ids?: string[] | null
          reviewed_question_ids?: string[] | null
          correct_count?: number
          wrong_count?: number
          duration_seconds?: number | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          tag_ids?: string[] | null
          reviewed_question_ids?: string[] | null
          correct_count?: number
          wrong_count?: number
          duration_seconds?: number | null
          completed_at?: string | null
        }
      }
      cloze_items: {
        Row: {
          id: string
          note_content_entry_id: string
          original_text: string
          hidden_text: string | null
          is_active: boolean
          review_count: number
          last_reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          note_content_entry_id: string
          original_text: string
          hidden_text?: string | null
          is_active?: boolean
          review_count?: number
          last_reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          hidden_text?: string | null
          is_active?: boolean
          review_count?: number
          last_reviewed_at?: string | null
        }
      }
      mindmaps: {
        Row: {
          id: string
          user_id: string
          title: string
          source_note_ids: string[] | null
          source_tag_ids: string[] | null
          mindmap_data: Json
          thumbnail_url: string | null
          export_format: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          source_note_ids?: string[] | null
          source_tag_ids?: string[] | null
          mindmap_data: Json
          thumbnail_url?: string | null
          export_format?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          source_note_ids?: string[] | null
          source_tag_ids?: string[] | null
          mindmap_data?: Json
          thumbnail_url?: string | null
          export_format?: string | null
          is_public?: boolean
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          collection_name: string
          description: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collection_name: string
          description?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          collection_name?: string
          description?: string | null
          is_default?: boolean
        }
      }
      collection_questions: {
        Row: {
          collection_id: string
          question_block_id: string
          added_reason: string | null
          added_at: string
        }
        Insert: {
          collection_id: string
          question_block_id: string
          added_reason?: string | null
          added_at?: string
        }
        Update: {
          added_reason?: string | null
        }
      }
      daily_pushes: {
        Row: {
          id: string
          user_id: string
          push_date: string
          recommended_question_ids: string[] | null
          tag_ids: string[] | null
          is_clicked: boolean
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          push_date?: string
          recommended_question_ids?: string[] | null
          tag_ids?: string[] | null
          is_clicked?: boolean
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          recommended_question_ids?: string[] | null
          tag_ids?: string[] | null
          is_clicked?: boolean
          is_completed?: boolean
        }
      }
      activity_logs: {
        Row: {
          id: number
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
        }
      }
    }
  }
}

// 便捷类型别名
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type QuestionBlock = Database['public']['Tables']['question_blocks']['Row']
export type NoteContentEntry = Database['public']['Tables']['note_content_entries']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type QuestionTagRelation = Database['public']['Tables']['question_tag_relations']['Row']
export type Summary = Database['public']['Tables']['summaries']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type ReviewSession = Database['public']['Tables']['review_sessions']['Row']
export type ClozeItem = Database['public']['Tables']['cloze_items']['Row']
export type Mindmap = Database['public']['Tables']['mindmaps']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type CollectionQuestion = Database['public']['Tables']['collection_questions']['Row']
export type DailyPush = Database['public']['Tables']['daily_pushes']['Row']
export type PdfSource = Database['public']['Tables']['pdf_sources']['Row']
