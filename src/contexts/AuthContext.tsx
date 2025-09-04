import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate auth check
    const savedUser = localStorage.getItem('redditscribe_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Simulate sign in
    if (email === 'demo@redditscribe.com' && password === 'demo123') {
      const mockUser = {
        id: '1',
        email: 'demo@redditscribe.com',
        user_metadata: { subscription_status: 'premium' }
      } as User
      setUser(mockUser)
      localStorage.setItem('redditscribe_user', JSON.stringify(mockUser))
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const signUp = async (email: string, password: string) => {
    // Simulate sign up
    const mockUser = {
      id: Date.now().toString(),
      email,
      user_metadata: { subscription_status: 'free' }
    } as User
    setUser(mockUser)
    localStorage.setItem('redditscribe_user', JSON.stringify(mockUser))
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('redditscribe_user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      signIn,
      signUp,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}