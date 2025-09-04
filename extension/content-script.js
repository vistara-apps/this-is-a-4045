// RedditScribe Content Script
// Runs on Reddit pages to enable text highlighting and snippet capture

class RedditScribeContentScript {
  constructor() {
    this.isActive = false;
    this.selectedText = '';
    this.selectionRange = null;
    this.highlightedElements = new Set();
    this.tooltipElement = null;
    this.init();
  }

  init() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Check if this is a Reddit page
    if (!this.isRedditPage()) return;
    
    // Add event listeners
    this.addEventListeners();
    
    // Create UI elements
    this.createTooltip();
    
    // Load existing highlights
    this.loadExistingHighlights();
    
    console.log('RedditScribe content script initialized');
  }

  addEventListeners() {
    // Text selection events
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('keyup', this.handleKeyboardSelection.bind(this));
    
    // Click outside to hide tooltip
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  handleTextSelection(event) {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 10) { // Minimum text length
        this.selectedText = selectedText;
        this.selectionRange = selection.getRangeAt(0);
        this.showTooltip(event.pageX, event.pageY);
      } else {
        this.hideTooltip();
      }
    }, 10);
  }

  handleKeyboardSelection(event) {
    // Handle keyboard-based text selection
    if (event.ctrlKey || event.shiftKey) {
      this.handleTextSelection(event);
    }
  }

  handleDocumentClick(event) {
    // Hide tooltip if clicking outside of it
    if (this.tooltipElement && !this.tooltipElement.contains(event.target)) {
      this.hideTooltip();
    }
  }

  handleKeyboardShortcuts(event) {
    // Ctrl+Shift+S to capture selected text
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      if (this.selectedText) {
        this.captureSnippet();
      }
    }
    
    // Escape to hide tooltip
    if (event.key === 'Escape') {
      this.hideTooltip();
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'TOGGLE_HIGHLIGHTING':
        this.isActive = message.active;
        sendResponse({ success: true });
        break;
        
      case 'HIGHLIGHT_EXISTING':
        this.highlightExistingSnippets(message.snippets);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
    
    return true;
  }

  createTooltip() {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.id = 'redditscribe-tooltip';
    this.tooltipElement.innerHTML = `
      <div class="rs-tooltip-content">
        <button id="rs-capture-btn" class="rs-btn rs-btn-primary">
          📝 Capture Snippet
        </button>
        <button id="rs-highlight-btn" class="rs-btn rs-btn-secondary">
          🖍️ Highlight Only
        </button>
        <div class="rs-tooltip-arrow"></div>
      </div>
    `;
    
    // Add event listeners to tooltip buttons
    this.tooltipElement.addEventListener('click', this.handleTooltipClick.bind(this));
    
    document.body.appendChild(this.tooltipElement);
  }

  showTooltip(x, y) {
    if (!this.tooltipElement) return;
    
    this.tooltipElement.style.display = 'block';
    this.tooltipElement.style.left = `${x}px`;
    this.tooltipElement.style.top = `${y - 60}px`;
    
    // Adjust position if tooltip goes off screen
    const rect = this.tooltipElement.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.tooltipElement.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.top < 0) {
      this.tooltipElement.style.top = `${y + 20}px`;
    }
  }

  hideTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.style.display = 'none';
    }
  }

  handleTooltipClick(event) {
    event.stopPropagation();
    
    if (event.target.id === 'rs-capture-btn') {
      this.captureSnippet();
    } else if (event.target.id === 'rs-highlight-btn') {
      this.highlightText();
    }
  }

  async captureSnippet() {
    if (!this.selectedText || !this.selectionRange) return;
    
    // Get context information
    const metadata = this.extractMetadata();
    
    // Create snippet data
    const snippetData = {
      text: this.selectedText,
      sourceUrl: window.location.href,
      metadata
    };
    
    try {
      // Send to background script
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_SNIPPET',
        data: snippetData
      });
      
      if (response.success) {
        // Highlight the captured text
        this.highlightText(true);
        this.showSuccessMessage('Snippet captured!');
      } else {
        this.showErrorMessage('Failed to capture snippet');
      }
    } catch (error) {
      console.error('Error capturing snippet:', error);
      this.showErrorMessage('Error capturing snippet');
    }
    
    this.hideTooltip();
  }

  highlightText(isCaptured = false) {
    if (!this.selectionRange) return;
    
    try {
      // Create highlight element
      const highlightElement = document.createElement('span');
      highlightElement.className = isCaptured ? 'rs-highlight rs-captured' : 'rs-highlight';
      highlightElement.title = isCaptured ? 'Captured snippet' : 'Highlighted text';
      
      // Wrap the selected text
      this.selectionRange.surroundContents(highlightElement);
      this.highlightedElements.add(highlightElement);
      
      // Clear selection
      window.getSelection().removeAllRanges();
      
    } catch (error) {
      console.error('Error highlighting text:', error);
    }
    
    this.hideTooltip();
  }

  extractMetadata() {
    const metadata = {
      threadTitle: this.getThreadTitle(),
      subreddit: this.getSubreddit(),
      author: this.getAuthor(),
      score: this.getScore(),
      timestamp: new Date().toISOString(),
      postType: this.getPostType()
    };
    
    return metadata;
  }

  getThreadTitle() {
    // Try different selectors for thread title
    const selectors = [
      'h1[data-test-id="post-content-title"]',
      '.Post h3',
      'h1.title',
      '.thing .title a',
      'h1'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    
    return document.title.replace(' : reddit', '').replace(' - Reddit', '');
  }

  getSubreddit() {
    const match = window.location.pathname.match(/\/r\/([^\/]+)/);
    return match ? match[1] : '';
  }

  getAuthor() {
    // Try different selectors for author
    const selectors = [
      '[data-test-id="post-content-author"]',
      '.author',
      '.Post__author',
      'a[href*="/user/"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim().replace(/^u\//, '');
      }
    }
    
    return '';
  }

  getScore() {
    // Try different selectors for score
    const selectors = [
      '[data-test-id="post-vote-score"]',
      '.score',
      '.Post__score',
      '.upvotes'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const score = element.textContent.trim();
        return parseInt(score.replace(/[^\d-]/g, '')) || 0;
      }
    }
    
    return 0;
  }

  getPostType() {
    if (window.location.pathname.includes('/comments/')) {
      return 'comment';
    } else if (window.location.pathname.includes('/r/')) {
      return 'post';
    }
    return 'unknown';
  }

  async loadExistingHighlights() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_HIGHLIGHTS_FOR_URL',
        data: { url: window.location.href }
      });
      
      if (response.success && response.data) {
        this.highlightExistingSnippets(response.data);
      }
    } catch (error) {
      console.error('Error loading existing highlights:', error);
    }
  }

  highlightExistingSnippets(snippets) {
    // Implementation for highlighting previously captured snippets
    // This would require storing text positions or using text matching
    snippets.forEach(snippet => {
      this.findAndHighlightText(snippet.text, true);
    });
  }

  findAndHighlightText(text, isCaptured = false) {
    // Simple text finding and highlighting
    // In a production version, this would be more sophisticated
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const index = node.textContent.indexOf(text);
      if (index !== -1) {
        try {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + text.length);
          
          const highlightElement = document.createElement('span');
          highlightElement.className = isCaptured ? 'rs-highlight rs-captured' : 'rs-highlight';
          range.surroundContents(highlightElement);
          
          this.highlightedElements.add(highlightElement);
          break; // Only highlight first occurrence
        } catch (error) {
          // Ignore errors (text might span multiple elements)
        }
      }
    }
  }

  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `rs-message rs-message-${type}`;
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 3000);
  }

  isRedditPage() {
    return /^https:\/\/(www\.|old\.)?reddit\.com/.test(window.location.href);
  }
}

// Initialize content script
new RedditScribeContentScript();
