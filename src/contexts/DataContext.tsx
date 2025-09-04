import React, { createContext, useContext, useState, useEffect } from 'react'
import { db, realtime } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { features } from '../config/environment'
import type { CompilationWithSnippets, SnippetMetadata } from '../lib/database.types'

export interface LegacySnippet {
  snippetId: string
  compilationId: string
  text: string
  sourceUrl: string
  timestamp: string
  metadata?: SnippetMetadata
}

export interface LegacyCompilation {
  compilationId: string
  userId: string
  title: string
  createdAt: string
  snippets: LegacySnippet[]
}

// Export as Compilation for backward compatibility
export type Compilation = LegacyCompilation

interface DataContextType {
  compilations: LegacyCompilation[]
  loading: boolean
  error: string | null
  createCompilation: (title: string) => Promise<LegacyCompilation>
  updateCompilation: (id: string, updates: Partial<LegacyCompilation>) => Promise<void>
  deleteCompilation: (id: string) => Promise<void>
  createSnippet: (compilationId: string, snippet: Omit<LegacySnippet, 'snippetId' | 'compilationId' | 'timestamp'>) => Promise<LegacySnippet>
  updateSnippet: (snippetId: string, updates: Partial<LegacySnippet>) => Promise<void>
  deleteSnippet: (snippetId: string) => Promise<void>
  exportCompilation: (compilation: LegacyCompilation, format: 'markdown' | 'txt' | 'pdf' | 'html') => Promise<void>
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [compilations, setCompilations] = useState<LegacyCompilation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Convert database types to legacy types for backward compatibility
  const convertToLegacyFormat = (dbCompilations: CompilationWithSnippets[]): LegacyCompilation[] => {
    return dbCompilations.map(comp => ({
      compilationId: comp.id,
      userId: comp.user_id,
      title: comp.title,
      createdAt: comp.created_at,
      snippets: comp.snippets.map(snippet => ({
        snippetId: snippet.id,
        compilationId: snippet.compilation_id,
        text: snippet.text,
        sourceUrl: snippet.source_url,
        timestamp: snippet.created_at,
        metadata: snippet.metadata as SnippetMetadata
      }))
    }))
  }

  const loadData = async () => {
    if (!user) {
      setCompilations([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      if (features.mockData) {
        // Load mock data for development
        const mockCompilations: LegacyCompilation[] = [
          {
            compilationId: '1',
            userId: user.id,
            title: 'The Next Recession',
            createdAt: '2024-01-15T10:30:00Z',
            snippets: [
              {
                snippetId: '1',
                compilationId: '1',
                text: 'Key indicators suggest that market volatility will continue to increase through Q2. Historical patterns show similar behavior before major corrections.',
                sourceUrl: 'https://reddit.com/r/investing/comments/abc123',
                timestamp: '2024-01-15T10:30:00Z',
                metadata: { subreddit: 'investing', author: 'analyst123', score: 245 }
              },
              {
                snippetId: '2',
                compilationId: '1',
                text: 'The Federal Reserve\'s recent policy changes indicate a shift towards more aggressive monetary tightening, which historically precedes economic downturns.',
                sourceUrl: 'https://reddit.com/r/economics/comments/def456',
                timestamp: '2024-01-15T11:15:00Z',
                metadata: { subreddit: 'economics', author: 'fedwatcher', score: 189 }
              }
            ]
          },
          {
            compilationId: '2',
            userId: user.id,
            title: 'AI Startup Ideas',
            createdAt: '2024-01-14T09:15:00Z',
            snippets: [
              {
                snippetId: '4',
                compilationId: '2',
                text: 'There\'s a huge opportunity in AI-powered content moderation for small businesses. Most current solutions are enterprise-focused.',
                sourceUrl: 'https://reddit.com/r/entrepreneur/comments/jkl012',
                timestamp: '2024-01-14T09:15:00Z',
                metadata: { subreddit: 'entrepreneur', author: 'startup_guru', score: 156 }
              }
            ]
          }
        ]
        setCompilations(mockCompilations)
      } else {
        const dbCompilations = await db.getCompilations(user.id)
        const legacyCompilations = convertToLegacyFormat(dbCompilations)
        setCompilations(legacyCompilations)
      }
    } catch (err) {
      console.error('Error loading compilations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Set up real-time subscriptions if not using mock data
    if (user && !features.mockData) {
      const subscription = realtime.subscribeToCompilations(user.id, (payload) => {
        console.log('Real-time update:', payload)
        // Refresh data when changes occur
        loadData()
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const createCompilation = async (title: string): Promise<LegacyCompilation> => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)
      
      if (features.mockData) {
        const newCompilation: LegacyCompilation = {
          compilationId: Date.now().toString(),
          userId: user.id,
          title,
          createdAt: new Date().toISOString(),
          snippets: []
        }
        setCompilations(prev => [newCompilation, ...prev])
        return newCompilation
      } else {
        const dbCompilation = await db.createCompilation(user.id, title)
        const legacyCompilation: LegacyCompilation = {
          compilationId: dbCompilation.id,
          userId: dbCompilation.user_id,
          title: dbCompilation.title,
          createdAt: dbCompilation.created_at,
          snippets: []
        }
        setCompilations(prev => [legacyCompilation, ...prev])
        return legacyCompilation
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create compilation'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateCompilation = async (id: string, updates: Partial<LegacyCompilation>): Promise<void> => {
    try {
      setError(null)
      
      if (features.mockData) {
        setCompilations(prev => prev.map(comp => 
          comp.compilationId === id ? { ...comp, ...updates } : comp
        ))
      } else {
        await db.updateCompilation(id, {
          title: updates.title,
          // Add other updatable fields as needed
        })
        await loadData() // Refresh data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update compilation'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteCompilation = async (id: string): Promise<void> => {
    try {
      setError(null)
      
      if (features.mockData) {
        setCompilations(prev => prev.filter(comp => comp.compilationId !== id))
      } else {
        await db.deleteCompilation(id)
        setCompilations(prev => prev.filter(comp => comp.compilationId !== id))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete compilation'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const createSnippet = async (
    compilationId: string, 
    snippet: Omit<LegacySnippet, 'snippetId' | 'compilationId' | 'timestamp'>
  ): Promise<LegacySnippet> => {
    try {
      setError(null)
      
      if (features.mockData) {
        const newSnippet: LegacySnippet = {
          snippetId: Date.now().toString(),
          compilationId,
          timestamp: new Date().toISOString(),
          ...snippet
        }
        
        setCompilations(prev => prev.map(comp => 
          comp.compilationId === compilationId 
            ? { ...comp, snippets: [...comp.snippets, newSnippet] }
            : comp
        ))
        
        return newSnippet
      } else {
        const dbSnippet = await db.createSnippet({
          compilation_id: compilationId,
          text: snippet.text,
          source_url: snippet.sourceUrl,
          metadata: snippet.metadata
        })
        
        const legacySnippet: LegacySnippet = {
          snippetId: dbSnippet.id,
          compilationId: dbSnippet.compilation_id,
          text: dbSnippet.text,
          sourceUrl: dbSnippet.source_url,
          timestamp: dbSnippet.created_at,
          metadata: dbSnippet.metadata as SnippetMetadata
        }
        
        // Update local state
        setCompilations(prev => prev.map(comp => 
          comp.compilationId === compilationId 
            ? { ...comp, snippets: [...comp.snippets, legacySnippet] }
            : comp
        ))
        
        return legacySnippet
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create snippet'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateSnippet = async (snippetId: string, updates: Partial<LegacySnippet>): Promise<void> => {
    try {
      setError(null)
      
      if (features.mockData) {
        setCompilations(prev => prev.map(comp => ({
          ...comp,
          snippets: comp.snippets.map(snippet => 
            snippet.snippetId === snippetId ? { ...snippet, ...updates } : snippet
          )
        })))
      } else {
        await db.updateSnippet(snippetId, {
          text: updates.text,
          metadata: updates.metadata
        })
        await loadData() // Refresh data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update snippet'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteSnippet = async (snippetId: string): Promise<void> => {
    try {
      setError(null)
      
      if (features.mockData) {
        setCompilations(prev => prev.map(comp => ({
          ...comp,
          snippets: comp.snippets.filter(snippet => snippet.snippetId !== snippetId)
        })))
      } else {
        await db.deleteSnippet(snippetId)
        setCompilations(prev => prev.map(comp => ({
          ...comp,
          snippets: comp.snippets.filter(snippet => snippet.snippetId !== snippetId)
        })))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete snippet'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const exportCompilation = async (compilation: LegacyCompilation, format: 'markdown' | 'txt' | 'pdf' | 'html'): Promise<void> => {
    try {
      let content = ''
      let mimeType = 'text/plain'
      let fileExtension = 'txt'
      
      if (format === 'markdown') {
        content = `# ${compilation.title}\n\n`
        content += `*Compiled on ${new Date(compilation.createdAt).toLocaleDateString()}*\n\n`
        
        compilation.snippets.forEach((snippet, index) => {
          content += `## Snippet ${index + 1}\n\n`
          content += `${snippet.text}\n\n`
          content += `**Source:** [Reddit Thread](${snippet.sourceUrl})\n`
          content += `**Captured:** ${new Date(snippet.timestamp).toLocaleString()}\n`
          
          if (snippet.metadata?.subreddit) {
            content += `**Subreddit:** r/${snippet.metadata.subreddit}\n`
          }
          if (snippet.metadata?.author) {
            content += `**Author:** u/${snippet.metadata.author}\n`
          }
          if (snippet.metadata?.score) {
            content += `**Score:** ${snippet.metadata.score} points\n`
          }
          
          content += `\n---\n\n`
        })
        
        mimeType = 'text/markdown'
        fileExtension = 'md'
      } else if (format === 'html') {
        content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${compilation.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
        .snippet { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .metadata { font-size: 0.9em; color: #666; margin-top: 10px; }
        .source { color: #10b981; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${compilation.title}</h1>
        <p><em>Compiled on ${new Date(compilation.createdAt).toLocaleDateString()}</em></p>
    </div>
`
        
        compilation.snippets.forEach((snippet, index) => {
          content += `
    <div class="snippet">
        <h2>Snippet ${index + 1}</h2>
        <p>${snippet.text}</p>
        <div class="metadata">
            <strong>Source:</strong> <a href="${snippet.sourceUrl}" class="source">Reddit Thread</a><br>
            <strong>Captured:</strong> ${new Date(snippet.timestamp).toLocaleString()}<br>
`
          
          if (snippet.metadata?.subreddit) {
            content += `            <strong>Subreddit:</strong> r/${snippet.metadata.subreddit}<br>\n`
          }
          if (snippet.metadata?.author) {
            content += `            <strong>Author:</strong> u/${snippet.metadata.author}<br>\n`
          }
          if (snippet.metadata?.score) {
            content += `            <strong>Score:</strong> ${snippet.metadata.score} points<br>\n`
          }
          
          content += `        </div>
    </div>
`
        })
        
        content += `
</body>
</html>`
        
        mimeType = 'text/html'
        fileExtension = 'html'
      } else {
        // Plain text format
        content = `${compilation.title}\n`
        content += `${'='.repeat(compilation.title.length)}\n\n`
        content += `Compiled on ${new Date(compilation.createdAt).toLocaleDateString()}\n\n`
        
        compilation.snippets.forEach((snippet, index) => {
          content += `Snippet ${index + 1}\n`
          content += `${'-'.repeat(12)}\n`
          content += `${snippet.text}\n\n`
          content += `Source: ${snippet.sourceUrl}\n`
          content += `Captured: ${new Date(snippet.timestamp).toLocaleString()}\n`
          
          if (snippet.metadata?.subreddit) {
            content += `Subreddit: r/${snippet.metadata.subreddit}\n`
          }
          if (snippet.metadata?.author) {
            content += `Author: u/${snippet.metadata.author}\n`
          }
          if (snippet.metadata?.score) {
            content += `Score: ${snippet.metadata.score} points\n`
          }
          
          content += `\n`
        })
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${compilation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export compilation'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshData = async (): Promise<void> => {
    await loadData()
  }

  return (
    <DataContext.Provider value={{
      compilations,
      loading,
      error,
      createCompilation,
      updateCompilation,
      deleteCompilation,
      createSnippet,
      updateSnippet,
      deleteSnippet,
      exportCompilation,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  )
}
