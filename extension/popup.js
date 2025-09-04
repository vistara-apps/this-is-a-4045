// RedditScribe Popup Script
// Handles the extension popup interface

class RedditScribePopup {
  constructor() {
    this.webAppUrl = 'https://localhost:5173';
    this.init();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  async setup() {
    // Add event listeners
    this.addEventListeners();
    
    // Load initial data
    await this.loadData();
    
    // Show main content
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
  }

  addEventListeners() {
    // Action buttons
    document.getElementById('open-webapp').addEventListener('click', this.openWebApp.bind(this));
    document.getElementById('sync-data').addEventListener('click', this.syncData.bind(this));
    document.getElementById('new-compilation').addEventListener('click', this.createNewCompilation.bind(this));
    
    // Footer links
    document.getElementById('settings-link').addEventListener('click', this.openSettings.bind(this));
    document.getElementById('help-link').addEventListener('click', this.openHelp.bind(this));
    document.getElementById('feedback-link').addEventListener('click', this.openFeedback.bind(this));
  }

  async loadData() {
    try {
      // Get auth status
      const authResponse = await chrome.runtime.sendMessage({
        type: 'GET_AUTH_STATUS'
      });

      if (authResponse.success) {
        this.updateAuthStatus(authResponse.data.isAuthenticated);
      }

      // Get compilations data
      const dataResponse = await chrome.runtime.sendMessage({
        type: 'GET_COMPILATIONS'
      });

      if (dataResponse.success) {
        this.updateStats(dataResponse.data);
        this.updateRecentActivity(dataResponse.data);
      }

    } catch (error) {
      console.error('Error loading popup data:', error);
      this.showError('Failed to load data');
    }
  }

  updateAuthStatus(isAuthenticated) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (isAuthenticated) {
      indicator.classList.add('active');
      statusText.textContent = 'Connected to RedditScribe';
    } else {
      indicator.classList.remove('active');
      statusText.textContent = 'Not signed in';
    }
  }

  updateStats(compilations) {
    const compilationsCount = compilations.length;
    const snippetsCount = compilations.reduce((total, comp) => total + comp.snippets.length, 0);
    
    document.getElementById('compilations-count').textContent = compilationsCount;
    document.getElementById('snippets-count').textContent = snippetsCount;
  }

  updateRecentActivity(compilations) {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';

    // Get recent snippets across all compilations
    const recentSnippets = [];
    compilations.forEach(compilation => {
      compilation.snippets.forEach(snippet => {
        recentSnippets.push({
          ...snippet,
          compilationTitle: compilation.title
        });
      });
    });

    // Sort by timestamp and take the 5 most recent
    recentSnippets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recent = recentSnippets.slice(0, 5);

    if (recent.length === 0) {
      activityList.innerHTML = `
        <div class="activity-item">
          <div class="activity-text" style="text-align: center; color: #71717a;">
            No recent activity
          </div>
        </div>
      `;
      return;
    }

    recent.forEach(snippet => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      
      const timeAgo = this.getTimeAgo(snippet.timestamp);
      const truncatedText = snippet.text.length > 40 
        ? snippet.text.substring(0, 40) + '...' 
        : snippet.text;

      activityItem.innerHTML = `
        <div class="activity-icon">📝</div>
        <div class="activity-text">${truncatedText}</div>
        <div class="activity-time">${timeAgo}</div>
      `;
      
      activityList.appendChild(activityItem);
    });
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }

  async openWebApp() {
    try {
      await chrome.tabs.create({
        url: this.webAppUrl
      });
      window.close();
    } catch (error) {
      console.error('Error opening web app:', error);
    }
  }

  async syncData() {
    const syncButton = document.getElementById('sync-data');
    const originalText = syncButton.textContent;
    
    try {
      syncButton.textContent = '🔄 Syncing...';
      syncButton.disabled = true;
      
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_WITH_WEBAPP'
      });
      
      if (response.success) {
        syncButton.textContent = '✅ Synced!';
        await this.loadData(); // Refresh data
        
        setTimeout(() => {
          syncButton.textContent = originalText;
          syncButton.disabled = false;
        }, 2000);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      syncButton.textContent = '❌ Failed';
      
      setTimeout(() => {
        syncButton.textContent = originalText;
        syncButton.disabled = false;
      }, 2000);
    }
  }

  async createNewCompilation() {
    const title = prompt('Enter compilation title:');
    if (!title) return;
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_COMPILATION',
        data: { title }
      });
      
      if (response.success) {
        await this.loadData(); // Refresh data
        this.showSuccess('Compilation created!');
      } else {
        throw new Error('Failed to create compilation');
      }
    } catch (error) {
      console.error('Error creating compilation:', error);
      this.showError('Failed to create compilation');
    }
  }

  async openSettings() {
    try {
      await chrome.tabs.create({
        url: `${this.webAppUrl}/settings`
      });
      window.close();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  async openHelp() {
    try {
      await chrome.tabs.create({
        url: `${this.webAppUrl}/help`
      });
      window.close();
    } catch (error) {
      console.error('Error opening help:', error);
    }
  }

  async openFeedback() {
    try {
      await chrome.tabs.create({
        url: 'https://github.com/redditscribe/feedback/issues/new'
      });
      window.close();
    } catch (error) {
      console.error('Error opening feedback:', error);
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
      ${type === 'success' ? 'background: #10b981; color: white;' : 'background: #ef4444; color: white;'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
          notification.parentNode.removeChild(notification);
        }, 300);
      }
    }, 3000);
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  isRedditTab(tab) {
    return tab && /^https:\/\/(www\.|old\.)?reddit\.com/.test(tab.url);
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize popup
new RedditScribePopup();
