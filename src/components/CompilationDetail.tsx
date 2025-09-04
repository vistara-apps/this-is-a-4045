import React from 'react'
import { useData, Compilation } from '../contexts/DataContext'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Download, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface CompilationDetailProps {
  compilation: Compilation
  onBack: () => void
}

export default function CompilationDetail({ compilation, onBack }: CompilationDetailProps) {
  const { exportCompilation } = useData()
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const handleExport = (format: 'markdown' | 'txt') => {
    exportCompilation(compilation, format)
  }

  const handleCopySnippet = async (snippetId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSnippet(snippetId)
      setTimeout(() => setCopiedSnippet(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{compilation.title}</h1>
            <p className="text-text-secondary">
              {compilation.snippets.length} snippet{compilation.snippets.length !== 1 ? 's' : ''} • 
              Created {formatDistanceToNow(new Date(compilation.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('txt')}
            className="flex items-center px-4 py-2 bg-background-tertiary hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export TXT
          </button>
          <button
            onClick={() => handleExport('markdown')}
            className="flex items-center px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Markdown
          </button>
        </div>
      </div>

      {/* Snippets */}
      <div className="space-y-6">
        {compilation.snippets.map((snippet, index) => (
          <div
            key={snippet.snippetId}
            className="bg-background-secondary rounded-xl p-6 card-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="bg-accent-500 text-white text-sm font-medium px-3 py-1 rounded-full mr-3">
                  #{index + 1}
                </span>
                <div>
                  <p className="text-text-secondary text-sm">
                    Captured {formatDistanceToNow(new Date(snippet.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopySnippet(snippet.snippetId, snippet.text)}
                  className="p-2 text-text-secondary hover:text-accent-500 transition-colors"
                  title="Copy snippet"
                >
                  {copiedSnippet === snippet.snippetId ? (
                    <Check className="h-4 w-4 text-accent-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <a
                  href={snippet.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-text-secondary hover:text-accent-500 transition-colors"
                  title="View source"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-white leading-relaxed">{snippet.text}</p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center text-sm text-text-tertiary">
                <span className="mr-2">Source:</span>
                <a
                  href={snippet.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-500 hover:text-accent-400 transition-colors truncate flex-1"
                >
                  {snippet.sourceUrl}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {compilation.snippets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary">No snippets in this compilation yet.</p>
        </div>
      )}
    </div>
  )
}