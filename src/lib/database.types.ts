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
      users: {
        Row: {
          id: string
          email: string
          subscription_status: 'free' | 'premium' | 'enterprise'
          created_at: string
          updated_at?: string
          stripe_customer_id?: string
          subscription_end_date?: string
        }
        Insert: {
          id: string
          email: string
          subscription_status?: 'free' | 'premium' | 'enterprise'
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string
          subscription_end_date?: string
        }
        Update: {
          id?: string
          email?: string
          subscription_status?: 'free' | 'premium' | 'enterprise'
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string
          subscription_end_date?: string
        }
      }
      compilations: {
        Row: {
          id: string
          user_id: string
          title: string
          description?: string
          created_at: string
          updated_at?: string
          is_public: boolean
          tags?: string[]
          metadata?: Json
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string
          created_at?: string
          updated_at?: string
          is_public?: boolean
          tags?: string[]
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
          is_public?: boolean
          tags?: string[]
          metadata?: Json
        }
      }
      snippets: {
        Row: {
          id: string
          compilation_id: string
          text: string
          source_url: string
          created_at: string
          updated_at?: string
          metadata?: Json
          ai_summary?: string
          ai_tags?: string[]
          position_in_compilation: number
        }
        Insert: {
          id?: string
          compilation_id: string
          text: string
          source_url: string
          created_at?: string
          updated_at?: string
          metadata?: Json
          ai_summary?: string
          ai_tags?: string[]
          position_in_compilation?: number
        }
        Update: {
          id?: string
          compilation_id?: string
          text?: string
          source_url?: string
          created_at?: string
          updated_at?: string
          metadata?: Json
          ai_summary?: string
          ai_tags?: string[]
          position_in_compilation?: number
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          event_data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_status: 'free' | 'premium' | 'enterprise'
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Compilation = Database['public']['Tables']['compilations']['Row']
export type CompilationInsert = Database['public']['Tables']['compilations']['Insert']
export type CompilationUpdate = Database['public']['Tables']['compilations']['Update']

export type Snippet = Database['public']['Tables']['snippets']['Row']
export type SnippetInsert = Database['public']['Tables']['snippets']['Insert']
export type SnippetUpdate = Database['public']['Tables']['snippets']['Update']

export type UserAnalytics = Database['public']['Tables']['user_analytics']['Row']
export type UserAnalyticsInsert = Database['public']['Tables']['user_analytics']['Insert']

// Extended types with relationships
export type CompilationWithSnippets = Compilation & {
  snippets: Snippet[]
}

export type SnippetWithCompilation = Snippet & {
  compilation: Compilation
}

// Metadata types for better type safety
export interface SnippetMetadata {
  subreddit?: string
  threadTitle?: string
  author?: string
  score?: number
  postType?: 'post' | 'comment'
  timestamp?: string
  highlightId?: string
  note?: string
}

export interface CompilationMetadata {
  totalSnippets?: number
  lastUpdated?: string
  exportCount?: number
  shareCount?: number
  aiProcessed?: boolean
}

export interface UserAnalyticsData {
  snippetsCaptured?: number
  compilationsCreated?: number
  exportsGenerated?: number
  timeSpent?: number
  mostActiveSubreddits?: string[]
  [key: string]: any
}
