import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Only validate in runtime, not during build
if (typeof window !== 'undefined' && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('Missing Supabase environment variables - using mock data')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    return data
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  // Users
  createUserProfile: async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        subscription_status: 'free',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  updateUserProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Compilations
  getCompilations: async (userId: string) => {
    const { data, error } = await supabase
      .from('compilations')
      .select(`
        *,
        snippets (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  createCompilation: async (userId: string, title: string) => {
    const { data, error } = await supabase
      .from('compilations')
      .insert({
        user_id: userId,
        title,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  updateCompilation: async (compilationId: string, updates: any) => {
    const { data, error } = await supabase
      .from('compilations')
      .update(updates)
      .eq('id', compilationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  deleteCompilation: async (compilationId: string) => {
    const { error } = await supabase
      .from('compilations')
      .delete()
      .eq('id', compilationId)
    
    if (error) throw error
  },

  // Snippets
  createSnippet: async (snippet: {
    compilation_id: string
    text: string
    source_url: string
    metadata?: any
  }) => {
    const { data, error } = await supabase
      .from('snippets')
      .insert({
        ...snippet,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  updateSnippet: async (snippetId: string, updates: any) => {
    const { data, error } = await supabase
      .from('snippets')
      .update(updates)
      .eq('id', snippetId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  deleteSnippet: async (snippetId: string) => {
    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', snippetId)
    
    if (error) throw error
  },

  getSnippetsByUrl: async (userId: string, sourceUrl: string) => {
    const { data, error } = await supabase
      .from('snippets')
      .select(`
        *,
        compilations!inner (
          user_id
        )
      `)
      .eq('source_url', sourceUrl)
      .eq('compilations.user_id', userId)
    
    if (error) throw error
    return data
  }
}

// Real-time subscriptions
export const realtime = {
  subscribeToCompilations: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('compilations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compilations',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToSnippets: (compilationId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('snippets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'snippets',
          filter: `compilation_id=eq.${compilationId}`
        },
        callback
      )
      .subscribe()
  }
}

// Storage helpers for file uploads (if needed)
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    
    if (error) throw error
    return data
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}
