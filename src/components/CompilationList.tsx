
import { useData, Compilation } from '../contexts/DataContext'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Trash2, ExternalLink, Download } from 'lucide-react'

interface CompilationListProps {
  compilations: Compilation[]
  onSelectCompilation: (compilation: Compilation) => void
}

export default function CompilationList({ compilations, onSelectCompilation }: CompilationListProps) {
  const { deleteCompilation, exportCompilation } = useData()

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this compilation?')) {
      deleteCompilation(id)
    }
  }

  const handleExport = (e: React.MouseEvent, compilation: Compilation) => {
    e.stopPropagation()
    exportCompilation(compilation, 'markdown')
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Compilations</h1>
          <p className="text-text-secondary">
            {compilations.length} compilation{compilations.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {compilations.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No compilations yet</h3>
          <p className="text-text-secondary mb-6">
            Start by installing the browser extension and highlighting text on Reddit
          </p>
          <button className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg transition-colors">
            Install Extension
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {compilations.map((compilation) => (
            <div
              key={compilation.compilationId}
              onClick={() => onSelectCompilation(compilation)}
              className="bg-background-secondary rounded-xl p-6 card-shadow hover:bg-background-tertiary transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-accent-500 transition-colors">
                    {compilation.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {compilation.snippets.length} snippet{compilation.snippets.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleExport(e, compilation)}
                    className="p-2 text-text-secondary hover:text-accent-500 transition-colors"
                    title="Export"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, compilation.compilationId)}
                    className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {compilation.snippets.slice(0, 2).map((snippet) => (
                  <div key={snippet.snippetId} className="border-l-2 border-accent-500 pl-3">
                    <p className="text-text-secondary text-sm line-clamp-2">
                      {snippet.text}
                    </p>
                  </div>
                ))}
                {compilation.snippets.length > 2 && (
                  <p className="text-text-tertiary text-xs">
                    +{compilation.snippets.length - 2} more snippet{compilation.snippets.length - 2 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>
                  Created {formatDistanceToNow(new Date(compilation.createdAt), { addSuffix: true })}
                </span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}