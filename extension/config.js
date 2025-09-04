// Extension Configuration
// This file contains configuration for the browser extension

const ExtensionConfig = {
  // Web app URLs for different environments
  webApp: {
    development: 'http://localhost:5173',
    staging: 'https://staging.redditscribe.com',
    production: 'https://redditscribe.com'
  },

  // API endpoints
  api: {
    development: 'http://localhost:3001',
    staging: 'https://api-staging.redditscribe.com',
    production: 'https://api.redditscribe.com'
  },

  // Extension settings
  extension: {
    name: 'RedditScribe',
    version: '1.0.0',
    
    // Highlighting settings
    highlighting: {
      minTextLength: 10,
      maxTextLength: 5000,
      autoHighlight: true,
      showTooltips: true,
      animationDuration: 250
    },

    // Storage settings
    storage: {
      maxCompilations: 100,
      maxSnippetsPerCompilation: 500,
      syncInterval: 300000, // 5 minutes
      offlineRetentionDays: 30
    },

    // UI settings
    ui: {
      theme: 'dark',
      tooltipDelay: 500,
      notificationDuration: 3000,
      popupWidth: 320,
      popupHeight: 400
    },

    // Reddit-specific settings
    reddit: {
      supportedDomains: [
        'reddit.com',
        'www.reddit.com',
        'old.reddit.com',
        'm.reddit.com'
      ],
      
      // Selectors for different Reddit layouts
      selectors: {
        // New Reddit
        newReddit: {
          post: '[data-test-id="post-content"]',
          comment: '[data-test-id="comment"]',
          title: 'h1[data-test-id="post-content-title"]',
          author: '[data-test-id="post-content-author"]',
          score: '[data-test-id="post-vote-score"]'
        },
        
        // Old Reddit
        oldReddit: {
          post: '.thing .entry',
          comment: '.comment .md',
          title: '.thing .title a',
          author: '.thing .author',
          score: '.thing .score'
        },
        
        // Mobile Reddit
        mobile: {
          post: '.Post',
          comment: '.Comment',
          title: '.Post h3',
          author: '.Post__author',
          score: '.Post__score'
        }
      }
    },

    // Keyboard shortcuts
    shortcuts: {
      captureSnippet: 'Ctrl+Shift+S',
      toggleHighlighting: 'Ctrl+Shift+H',
      openWebApp: 'Ctrl+Shift+R',
      newCompilation: 'Ctrl+Shift+N'
    },

    // Feature flags
    features: {
      aiSummarization: true,
      realTimeSync: true,
      offlineMode: true,
      analytics: true,
      collaboration: false, // Premium feature
      customExports: false   // Premium feature
    }
  },

  // Get current environment
  getCurrentEnvironment() {
    // In a real extension, this would be determined by the build process
    // For now, default to development
    return 'development'
  },

  // Get web app URL for current environment
  getWebAppUrl() {
    const env = this.getCurrentEnvironment()
    return this.webApp[env] || this.webApp.development
  },

  // Get API URL for current environment
  getApiUrl() {
    const env = this.getCurrentEnvironment()
    return this.api[env] || this.api.development
  },

  // Check if a URL is a supported Reddit domain
  isRedditUrl(url) {
    try {
      const hostname = new URL(url).hostname
      return this.extension.reddit.supportedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      )
    } catch {
      return false
    }
  },

  // Get Reddit layout type based on URL
  getRedditLayout(url) {
    try {
      const hostname = new URL(url).hostname
      
      if (hostname.includes('old.')) {
        return 'oldReddit'
      } else if (hostname.includes('m.')) {
        return 'mobile'
      } else {
        return 'newReddit'
      }
    } catch {
      return 'newReddit'
    }
  },

  // Get selectors for current Reddit layout
  getRedditSelectors(url) {
    const layout = this.getRedditLayout(url)
    return this.extension.reddit.selectors[layout] || this.extension.reddit.selectors.newReddit
  },

  // Validate configuration
  validate() {
    const errors = []

    // Check required URLs
    if (!this.getWebAppUrl()) {
      errors.push('Web app URL is not configured')
    }

    if (!this.getApiUrl()) {
      errors.push('API URL is not configured')
    }

    // Check extension settings
    if (!this.extension.name) {
      errors.push('Extension name is not configured')
    }

    if (!this.extension.version) {
      errors.push('Extension version is not configured')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export for use in other extension scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionConfig
} else if (typeof window !== 'undefined') {
  window.ExtensionConfig = ExtensionConfig
}
