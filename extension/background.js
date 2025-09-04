// RedditScribe Background Script
// Handles extension lifecycle, storage, and communication with web app

class RedditScribeBackground {
  constructor() {
    this.webAppUrl = 'https://localhost:5173'; // Development URL
    this.apiUrl = 'https://your-supabase-url.supabase.co';
    this.init();
  }

  init() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Listen for tab updates to inject scripts
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    // Listen for external messages from web app
    chrome.runtime.onMessageExternal.addListener(this.handleExternalMessage.bind(this));
  }

  async handleInstall(details) {
    if (details.reason === 'install') {
      // Set up initial storage
      await chrome.storage.local.set({
        isFirstTime: true,
        compilations: [],
        settings: {
          autoHighlight: true,
          showTooltips: true,
          theme: 'dark'
        }
      });
      
      // Open onboarding page
      chrome.tabs.create({
        url: `${this.webAppUrl}/auth?source=extension`
      });
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'CAPTURE_SNIPPET':
          await this.captureSnippet(message.data);
          sendResponse({ success: true });
          break;
          
        case 'GET_COMPILATIONS':
          const compilations = await this.getCompilations();
          sendResponse({ success: true, data: compilations });
          break;
          
        case 'CREATE_COMPILATION':
          const newCompilation = await this.createCompilation(message.data);
          sendResponse({ success: true, data: newCompilation });
          break;
          
        case 'SYNC_WITH_WEBAPP':
          await this.syncWithWebApp();
          sendResponse({ success: true });
          break;
          
        case 'GET_AUTH_STATUS':
          const authStatus = await this.getAuthStatus();
          sendResponse({ success: true, data: authStatus });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep message channel open for async response
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Only act when page is completely loaded
    if (changeInfo.status !== 'complete') return;
    
    // Check if it's a Reddit page
    if (tab.url && this.isRedditUrl(tab.url)) {
      try {
        // Inject Reddit-specific scripts
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['reddit-highlighter.js']
        });
      } catch (error) {
        console.error('Failed to inject Reddit scripts:', error);
      }
    }
  }

  async handleExternalMessage(message, sender, sendResponse) {
    // Handle messages from the web app
    if (sender.origin !== this.webAppUrl.replace(/:\d+$/, '')) return;
    
    try {
      switch (message.type) {
        case 'GET_EXTENSION_DATA':
          const data = await chrome.storage.local.get();
          sendResponse({ success: true, data });
          break;
          
        case 'UPDATE_AUTH_TOKEN':
          await chrome.storage.local.set({ authToken: message.token });
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown external message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    
    return true;
  }

  async captureSnippet(snippetData) {
    const { text, sourceUrl, compilationId, metadata } = snippetData;
    
    // Create snippet object
    const snippet = {
      snippetId: this.generateId(),
      compilationId: compilationId || 'default',
      text: text.trim(),
      sourceUrl,
      timestamp: new Date().toISOString(),
      metadata: {
        subreddit: this.extractSubreddit(sourceUrl),
        threadTitle: metadata?.threadTitle || '',
        author: metadata?.author || '',
        score: metadata?.score || 0,
        ...metadata
      }
    };

    // Store locally first
    const { compilations = [] } = await chrome.storage.local.get(['compilations']);
    
    // Find or create compilation
    let compilation = compilations.find(c => c.compilationId === snippet.compilationId);
    if (!compilation) {
      compilation = {
        compilationId: snippet.compilationId,
        title: metadata?.threadTitle || 'New Compilation',
        createdAt: new Date().toISOString(),
        snippets: []
      };
      compilations.push(compilation);
    }
    
    // Add snippet to compilation
    compilation.snippets.push(snippet);
    
    // Save to local storage
    await chrome.storage.local.set({ compilations });
    
    // Sync with backend if authenticated
    await this.syncSnippetToBackend(snippet);
    
    // Show notification
    this.showNotification('Snippet captured!', `Added to "${compilation.title}"`);
    
    return snippet;
  }

  async getCompilations() {
    const { compilations = [] } = await chrome.storage.local.get(['compilations']);
    return compilations;
  }

  async createCompilation(data) {
    const { title } = data;
    const compilation = {
      compilationId: this.generateId(),
      title,
      createdAt: new Date().toISOString(),
      snippets: []
    };
    
    const { compilations = [] } = await chrome.storage.local.get(['compilations']);
    compilations.unshift(compilation);
    
    await chrome.storage.local.set({ compilations });
    
    return compilation;
  }

  async syncWithWebApp() {
    // Sync local data with web app backend
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) return;
    
    try {
      const { compilations } = await chrome.storage.local.get(['compilations']);
      
      // Send data to backend
      const response = await fetch(`${this.apiUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ compilations })
      });
      
      if (response.ok) {
        const syncedData = await response.json();
        await chrome.storage.local.set({ 
          compilations: syncedData.compilations,
          lastSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async syncSnippetToBackend(snippet) {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) return;
    
    try {
      await fetch(`${this.apiUrl}/api/snippets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(snippet)
      });
    } catch (error) {
      console.error('Failed to sync snippet:', error);
    }
  }

  async getAuthStatus() {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    return { isAuthenticated: !!authToken };
  }

  isRedditUrl(url) {
    return /^https:\/\/(www\.|old\.)?reddit\.com/.test(url);
  }

  extractSubreddit(url) {
    const match = url.match(/\/r\/([^\/]+)/);
    return match ? match[1] : '';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title,
      message
    });
  }
}

// Initialize background script
new RedditScribeBackground();
