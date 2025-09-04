import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { 
  BookOpen, 
  Home, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Crown,
  Plus
} from 'lucide-react'

interface SidebarProps {
  activeView: 'compilations' | 'analytics'
  setActiveView: (view: 'compilations' | 'analytics') => void
  setSelectedCompilation: (compilation: any) => void
}

export default function Sidebar({ activeView, setActiveView, setSelectedCompilation }: SidebarProps) {
  const { user, signOut } = useAuth()
  const { compilations, createCompilation } = useData()

  const navigationItems = [
    { id: 'compilations', label: 'Compilations', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const handleNewCompilation = () => {
    const title = prompt('Enter compilation title:')
    if (title?.trim()) {
      createCompilation(title.trim())
    }
  }

  const isUserPremium = user?.user_metadata?.subscription_status === 'premium'

  return (
    <div className="w-64 bg-background-secondary h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 text-accent-500 mr-3" />
          <h1 className="text-xl font-bold text-white">RedditScribe</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as 'compilations' | 'analytics')
                setSelectedCompilation(null)
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                activeView === item.id
                  ? 'bg-accent-500 text-white'
                  : 'text-text-secondary hover:text-white hover:bg-background-tertiary'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <button
            onClick={handleNewCompilation}
            className="w-full flex items-center px-3 py-2 rounded-lg text-text-secondary hover:text-white hover:bg-background-tertiary transition-colors"
          >
            <Plus className="h-5 w-5 mr-3" />
            New Compilation
          </button>
        </div>

        {/* Recent Compilations */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide mb-3">
            Recent
          </h3>
          <div className="space-y-1">
            {compilations.slice(0, 3).map((compilation) => (
              <button
                key={compilation.compilationId}
                onClick={() => {
                  setActiveView('compilations')
                  setSelectedCompilation(compilation)
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-text-secondary hover:text-white hover:bg-background-tertiary transition-colors text-sm truncate"
              >
                {compilation.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-6 border-t border-gray-700">
        <div className="mb-4">
          {!isUserPremium && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 mb-3">
              <div className="flex items-center mb-2">
                <Crown className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-white">Upgrade to Premium</span>
              </div>
              <p className="text-xs text-gray-200 mb-2">
                Unlimited compilations and advanced features
              </p>
              <button className="text-xs bg-white text-purple-600 px-2 py-1 rounded font-medium">
                Upgrade Now
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white truncate">
                {user?.email}
              </p>
              <p className="text-xs text-text-tertiary">
                {isUserPremium ? 'Premium' : 'Free Plan'}
              </p>
            </div>
          </div>
          
          <button
            onClick={signOut}
            className="p-2 text-text-secondary hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}