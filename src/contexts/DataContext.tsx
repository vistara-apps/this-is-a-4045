import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Snippet {
  snippetId: string
  compilationId: string
  text: string
  sourceUrl: string
  timestamp: string
}

export interface Compilation {
  compilationId: string
  userId: string
  title: string
  createdAt: string
  snippets: Snippet[]
}

interface DataContextType {
  compilations: Compilation[]
  loading: boolean
  createCompilation: (title: string) => void
  deleteCompilation: (id: string) => void
  exportCompilation: (compilation: Compilation, format: 'markdown' | 'txt') => void
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
  const [compilations, setCompilations] = useState<Compilation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load mock data
    const mockCompilations: Compilation[] = [
      {
        compilationId: '1',
        userId: '1',
        title: 'The Next Recession',
        createdAt: '2024-01-15T10:30:00Z',
        snippets: [
          {
            snippetId: '1',
            compilationId: '1',
            text: 'Key indicators suggest that market volatility will continue to increase through Q2. Historical patterns show similar behavior before major corrections.',
            sourceUrl: 'https://reddit.com/r/investing/comments/abc123',
            timestamp: '2024-01-15T10:30:00Z'
          },
          {
            snippetId: '2',
            compilationId: '1',
            text: 'The Federal Reserve\'s recent policy changes indicate a shift towards more aggressive monetary tightening, which historically precedes economic downturns.',
            sourceUrl: 'https://reddit.com/r/economics/comments/def456',
            timestamp: '2024-01-15T11:15:00Z'
          },
          {
            snippetId: '3',
            compilationId: '1',
            text: 'Corporate earnings guidance has been consistently revised downward across multiple sectors, suggesting weakening demand and potential layoffs.',
            sourceUrl: 'https://reddit.com/r/StockMarket/comments/ghi789',
            timestamp: '2024-01-15T12:00:00Z'
          }
        ]
      },
      {
        compilationId: '2',
        userId: '1',
        title: 'AI Startup Ideas',
        createdAt: '2024-01-14T09:15:00Z',
        snippets: [
          {
            snippetId: '4',
            compilationId: '2',
            text: 'There\'s a huge opportunity in AI-powered content moderation for small businesses. Most current solutions are enterprise-focused.',
            sourceUrl: 'https://reddit.com/r/entrepreneur/comments/jkl012',
            timestamp: '2024-01-14T09:15:00Z'
          },
          {
            snippetId: '5',
            compilationId: '2',
            text: 'Personal AI assistants for elderly care is massively underserved. The tech exists but nobody is packaging it properly.',
            sourceUrl: 'https://reddit.com/r/startups/comments/mno345',
            timestamp: '2024-01-14T10:30:00Z'
          }
        ]
      },
      {
        compilationId: '3',
        userId: '1',
        title: 'Remote Work Tips',
        createdAt: '2024-01-13T14:20:00Z',
        snippets: [
          {
            snippetId: '6',
            compilationId: '3',
            text: 'Setting up dedicated workspace boundaries is crucial. Even in a small apartment, creating physical separation helps maintain work-life balance.',
            sourceUrl: 'https://reddit.com/r/remotework/comments/pqr678',
            timestamp: '2024-01-13T14:20:00Z'
          }
        ]
      }
    ]
    
    setCompilations(mockCompilations)
    setLoading(false)
  }, [])

  const createCompilation = (title: string) => {
    const newCompilation: Compilation = {
      compilationId: Date.now().toString(),
      userId: '1',
      title,
      createdAt: new Date().toISOString(),
      snippets: []
    }
    setCompilations(prev => [newCompilation, ...prev])
  }

  const deleteCompilation = (id: string) => {
    setCompilations(prev => prev.filter(comp => comp.compilationId !== id))
  }

  const exportCompilation = (compilation: Compilation, format: 'markdown' | 'txt') => {
    let content = ''
    
    if (format === 'markdown') {
      content = `# ${compilation.title}\n\n`
      content += `*Compiled on ${new Date(compilation.createdAt).toLocaleDateString()}*\n\n`
      
      compilation.snippets.forEach((snippet, index) => {
        content += `## Snippet ${index + 1}\n\n`
        content += `${snippet.text}\n\n`
        content += `**Source:** [Reddit Thread](${snippet.sourceUrl})\n`
        content += `**Captured:** ${new Date(snippet.timestamp).toLocaleString()}\n\n---\n\n`
      })
    } else {
      content = `${compilation.title}\n`
      content += `${'='.repeat(compilation.title.length)}\n\n`
      content += `Compiled on ${new Date(compilation.createdAt).toLocaleDateString()}\n\n`
      
      compilation.snippets.forEach((snippet, index) => {
        content += `Snippet ${index + 1}\n`
        content += `${'-'.repeat(12)}\n`
        content += `${snippet.text}\n\n`
        content += `Source: ${snippet.sourceUrl}\n`
        content += `Captured: ${new Date(snippet.timestamp).toLocaleString()}\n\n`
      })
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${compilation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <DataContext.Provider value={{
      compilations,
      loading,
      createCompilation,
      deleteCompilation,
      exportCompilation
    }}>
      {children}
    </DataContext.Provider>
  )
}