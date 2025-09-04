import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { auth, db } from '../lib/supabase'
import { features } from '../config/environment'

interface AuthContextType {
  user: User | null
  userProfile: any | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  error: string | null
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
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        if (features.mockData) {
          // Use mock data in development without Supabase
          const savedUser = localStorage.getItem('redditscribe_user')
          if (savedUser) {
            const mockUser = JSON.parse(savedUser)
            setUser(mockUser)
            setUserProfile({ subscription_status: mockUser.user_metadata?.subscription_status || 'free' })
          }
          setLoading(false)
          return
        }

        const currentUser = await auth.getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          await loadUserProfile(currentUser.id)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err instanceof Error ? err.message : 'Authentication error')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    if (!features.mockData) {
      const { data: { subscription } } = auth.onAuthStateChange(async (_, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await db.getUserProfile(userId)
      setUserProfile(profile)
    } catch (err) {
      // If profile doesn't exist, create it
      if (user?.email) {
        try {
          const newProfile = await db.createUserProfile(userId, user.email)
          setUserProfile(newProfile)
        } catch (createErr) {
          console.error('Error creating user profile:', createErr)
        }
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    
    try {
      if (features.mockData) {
        // Mock authentication for development
        if (email === 'demo@redditscribe.com' && password === 'demo123') {
          const mockUser = {
            id: '1',
            email: 'demo@redditscribe.com',
            user_metadata: { subscription_status: 'premium' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User
          setUser(mockUser)
          setUserProfile({ subscription_status: 'premium' })
          localStorage.setItem('redditscribe_user', JSON.stringify(mockUser))
        } else {
          throw new Error('Invalid credentials')
        }
      } else {
        const { user: signedInUser } = await auth.signIn(email, password)
        if (signedInUser) {
          await loadUserProfile(signedInUser.id)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    
    try {
      if (features.mockData) {
        // Mock sign up for development
        const mockUser = {
          id: Date.now().toString(),
          email,
          user_metadata: { subscription_status: 'free' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User
        setUser(mockUser)
        setUserProfile({ subscription_status: 'free' })
        localStorage.setItem('redditscribe_user', JSON.stringify(mockUser))
      } else {
        const { user: newUser } = await auth.signUp(email, password)
        if (newUser) {
          // Profile will be created automatically via auth state change
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    
    try {
      if (features.mockData) {
        setUser(null)
        setUserProfile(null)
        localStorage.removeItem('redditscribe_user')
      } else {
        await auth.signOut()
        setUser(null)
        setUserProfile(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      signIn,
      signUp,
      signOut,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  )
}
