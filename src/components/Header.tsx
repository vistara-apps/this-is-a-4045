
import { Search, Bell, Download } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-background-secondary border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search compilations..."
              className="w-full pl-10 pr-4 py-2 bg-background-tertiary border border-gray-600 rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 ml-6">
          <button className="p-2 text-text-secondary hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          
          <button className="flex items-center px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Install Extension
          </button>
        </div>
      </div>
    </header>
  )
}