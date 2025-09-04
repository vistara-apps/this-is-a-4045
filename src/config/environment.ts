// Environment configuration for RedditScribe

interface Config {
  supabase: {
    url: string
    anonKey: string
  }
  stripe: {
    publishableKey: string
  }
  openai: {
    apiKey: string
  }
  app: {
    url: string
    apiUrl: string
    extensionId: string
  }
  analytics: {
    id?: string
  }
  isDevelopment: boolean
  isProduction: boolean
}

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_OPENAI_API_KEY',
  'VITE_APP_URL'
] as const

// Validate required environment variables
const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
}

// Validate environment in development (but not during build)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  try {
    validateEnv()
  } catch (error) {
    console.warn('Environment validation warning:', error)
  }
}

export const config: Config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
  },
  app: {
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    extensionId: import.meta.env.VITE_EXTENSION_ID || ''
  },
  analytics: {
    id: import.meta.env.VITE_ANALYTICS_ID
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
}

// Feature flags based on environment
export const features = {
  // Enable AI features only if OpenAI key is available
  aiEnabled: !!config.openai.apiKey,
  
  // Enable analytics only if ID is provided
  analyticsEnabled: !!config.analytics.id,
  
  // Enable Stripe features only if key is available
  paymentsEnabled: !!config.stripe.publishableKey,
  
  // Development-only features
  debugMode: config.isDevelopment,
  mockData: config.isDevelopment && !config.supabase.url,
  
  // Extension features
  extensionEnabled: !!config.app.extensionId
}

// API endpoints
export const endpoints = {
  auth: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    signOut: '/auth/signout',
    callback: '/auth/callback'
  },
  api: {
    compilations: '/api/compilations',
    snippets: '/api/snippets',
    export: '/api/export',
    analytics: '/api/analytics',
    ai: '/api/ai'
  },
  stripe: {
    checkout: '/api/stripe/checkout',
    portal: '/api/stripe/portal',
    webhook: '/api/stripe/webhook'
  }
}

// Subscription plans
export const subscriptionPlans = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      'Up to 5 compilations per month',
      'Basic export (Markdown, TXT)',
      'Reddit highlighting',
      'Basic analytics'
    ],
    limits: {
      compilationsPerMonth: 5,
      snippetsPerCompilation: 50,
      exportsPerMonth: 10
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    features: [
      'Unlimited compilations',
      'Advanced export (PDF, HTML)',
      'AI-powered summarization',
      'Advanced analytics',
      'Collaboration features',
      'Priority support'
    ],
    limits: {
      compilationsPerMonth: Infinity,
      snippetsPerCompilation: Infinity,
      exportsPerMonth: Infinity
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    interval: 'month',
    features: [
      'Everything in Premium',
      'Team collaboration',
      'Custom integrations',
      'Advanced AI features',
      'Dedicated support',
      'Custom branding'
    ],
    limits: {
      compilationsPerMonth: Infinity,
      snippetsPerCompilation: Infinity,
      exportsPerMonth: Infinity
    }
  }
}

// Export default config
export default config
