import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import CompilationList from '../components/CompilationList'
import CompilationDetail from '../components/CompilationDetail'
import AnalyticsPanel from '../components/AnalyticsPanel'
import { Compilation } from '../contexts/DataContext'

export default function Dashboard() {
  const { user } = useAuth()
  const { compilations, loading } = useData()
  const [selectedCompilation, setSelectedCompilation] = useState<Compilation | null>(null)
  const [activeView, setActiveView] = useState<'compilations' | 'analytics'>('compilations')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary flex">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        setSelectedCompilation={setSelectedCompilation}
      />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-6 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full">
            {activeView === 'analytics' ? (
              <AnalyticsPanel compilations={compilations} />
            ) : selectedCompilation ? (
              <CompilationDetail 
                compilation={selectedCompilation} 
                onBack={() => setSelectedCompilation(null)}
              />
            ) : (
              <CompilationList 
                compilations={compilations}
                onSelectCompilation={setSelectedCompilation}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}