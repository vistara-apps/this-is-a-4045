import React from 'react'
import { Compilation } from '../contexts/DataContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, FileText, Calendar, Target } from 'lucide-react'

interface AnalyticsPanelProps {
  compilations: Compilation[]
}

export default function AnalyticsPanel({ compilations }: AnalyticsPanelProps) {
  // Calculate metrics
  const totalSnippets = compilations.reduce((sum, comp) => sum + comp.snippets.length, 0)
  const avgSnippetsPerCompilation = totalSnippets / (compilations.length || 1)
  
  // Weekly activity data
  const weeklyData = [
    { day: 'Mon', snippets: 12 },
    { day: 'Tue', snippets: 8 },
    { day: 'Wed', snippets: 15 },
    { day: 'Thu', snippets: 6 },
    { day: 'Fri', snippets: 20 },
    { day: 'Sat', snippets: 3 },
    { day: 'Sun', snippets: 7 },
  ]

  // Monthly trend data
  const monthlyData = [
    { month: 'Jan', compilations: 8, snippets: 45 },
    { month: 'Feb', compilations: 12, snippets: 67 },
    { month: 'Mar', compilations: 6, snippets: 32 },
    { month: 'Apr', compilations: 15, snippets: 89 },
    { month: 'May', compilations: 9, snippets: 56 },
    { month: 'Jun', compilations: 18, snippets: 102 },
  ]

  const stats = [
    {
      label: 'Total Compilations',
      value: compilations.length,
      icon: FileText,
      change: '+12%',
      positive: true
    },
    {
      label: 'Total Snippets',
      value: totalSnippets,
      icon: Target,
      change: '+8%',
      positive: true
    },
    {
      label: 'Avg per Compilation',
      value: avgSnippetsPerCompilation.toFixed(1),
      icon: TrendingUp,
      change: '-3%',
      positive: false
    },
    {
      label: 'This Month',
      value: '18',
      icon: Calendar,
      change: '+24%',
      positive: true
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-text-secondary">Track your Reddit research activity and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-background-secondary rounded-xl p-6 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className="bg-accent-500 bg-opacity-20 p-3 rounded-lg">
                <stat.icon className="h-6 w-6 text-accent-500" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
              <span className="text-text-tertiary text-sm ml-1">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity */}
        <div className="bg-background-secondary rounded-xl p-6 card-shadow">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }} 
              />
              <Bar dataKey="snippets" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-background-secondary rounded-xl p-6 card-shadow">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="compilations" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                name="Compilations"
              />
              <Line 
                type="monotone" 
                dataKey="snippets" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                name="Snippets"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Sources */}
      <div className="mt-8 bg-background-secondary rounded-xl p-6 card-shadow">
        <h3 className="text-lg font-semibold text-white mb-4">Top Source Subreddits</h3>
        <div className="space-y-4">
          {[
            { name: 'r/investing', snippets: 15, percentage: 35 },
            { name: 'r/entrepreneur', snippets: 12, percentage: 28 },
            { name: 'r/remotework', snippets: 8, percentage: 19 },
            { name: 'r/startups', snippets: 5, percentage: 12 },
            { name: 'r/economics', snippets: 3, percentage: 6 },
          ].map((subreddit, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{subreddit.name}</span>
                  <span className="text-text-secondary text-sm">{subreddit.snippets} snippets</span>
                </div>
                <div className="w-full bg-background-tertiary rounded-full h-2">
                  <div 
                    className="bg-accent-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${subreddit.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}