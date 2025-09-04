// RedditScribe Reddit Highlighter
// Advanced text highlighting functionality specifically for Reddit pages

class RedditHighlighter {
  constructor() {
    this.highlights = new Map();
    this.observers = [];
    this.init();
  }

  init() {
    // Initialize highlighting system
    this.setupMutationObserver();
    this.loadExistingHighlights();
    this.enhanceTextSelection();
  }

  setupMutationObserver() {
    // Watch for dynamic content changes on Reddit
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processNewContent(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(observer);
  }

  processNewContent(element) {
    // Process newly loaded Reddit content (infinite scroll, etc.)
    const textElements = element.querySelectorAll(
      '.Post, .Comment, .thing, [data-test-id="comment"], [data-test-id="post-content"]'
    );
    
    textElements.forEach(el => {
      this.enhanceElement(el);
    });
  }

  enhanceElement(element) {
    // Add Reddit-specific enhancements to text elements
    if (element.dataset.redditScribeEnhanced) return;
    
    element.dataset.redditScribeEnhanced = 'true';
    
    // Add hover effects for better UX
    element.addEventListener('mouseenter', () => {
      if (window.getSelection().toString().length === 0) {
        element.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
      }
    });
    
    element.addEventListener('mouseleave', () => {
      if (!element.classList.contains('rs-highlight')) {
        element.style.backgroundColor = '';
      }
    });
  }

  enhanceTextSelection() {
    // Improve text selection experience on Reddit
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        this.handleSelectionChange(selection);
      }
    });
  }

  handleSelectionChange(selection) {
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 10) {
      // Add visual feedback for valid selections
      const range = selection.getRangeAt(0);
      this.addSelectionHighlight(range);
    } else {
      this.removeSelectionHighlight();
    }
  }

  addSelectionHighlight(range) {
    // Add temporary highlight to show selection is valid
    this.removeSelectionHighlight();
    
    try {
      const span = document.createElement('span');
      span.className = 'rs-selection-preview';
      span.style.cssText = `
        background-color: rgba(16, 185, 129, 0.2);
        border-radius: 2px;
        padding: 1px;
      `;
      
      range.surroundContents(span);
      this.currentSelectionHighlight = span;
    } catch (error) {
      // Selection might span multiple elements
    }
  }

  removeSelectionHighlight() {
    if (this.currentSelectionHighlight) {
      const parent = this.currentSelectionHighlight.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(this.currentSelectionHighlight.textContent),
          this.currentSelectionHighlight
        );
        parent.normalize();
      }
      this.currentSelectionHighlight = null;
    }
  }

  async loadExistingHighlights() {
    // Load highlights for current page
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_HIGHLIGHTS_FOR_URL',
        data: { url: window.location.href }
      });
      
      if (response.success && response.data) {
        response.data.forEach(highlight => {
          this.restoreHighlight(highlight);
        });
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  }

  restoreHighlight(highlightData) {
    // Restore a previously saved highlight
    const { text, position, metadata } = highlightData;
    
    // Try to find and highlight the text
    this.findAndHighlightText(text, {
      isCaptured: true,
      metadata,
      position
    });
  }

  findAndHighlightText(text, options = {}) {
    const { isCaptured = false, metadata = {}, position } = options;
    
    // Use more sophisticated text matching for Reddit content
    const contentSelectors = [
      '.Post .md',
      '.Comment .md',
      '.thing .md',
      '[data-test-id="comment"] p',
      '[data-test-id="post-content"] p',
      '.usertext-body',
      '.entry .md'
    ];
    
    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (this.highlightTextInElement(element, text, options)) {
          return true; // Found and highlighted
        }
      }
    }
    
    return false;
  }

  highlightTextInElement(element, text, options) {
    const { isCaptured = false, metadata = {} } = options;
    
    // Create a tree walker to find text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const nodeText = node.textContent;
      const index = nodeText.toLowerCase().indexOf(text.toLowerCase());
      
      if (index !== -1) {
        try {
          // Create range for the found text
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + text.length);
          
          // Create highlight element
          const highlight = document.createElement('span');
          highlight.className = isCaptured ? 'rs-highlight rs-captured' : 'rs-highlight';
          highlight.title = this.createTooltipText(metadata);
          highlight.dataset.highlightId = this.generateHighlightId();
          
          // Add click handler for highlight management
          highlight.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleHighlightClick(highlight, metadata);
          });
          
          // Surround the text with highlight
          range.surroundContents(highlight);
          
          // Store highlight reference
          this.highlights.set(highlight.dataset.highlightId, {
            element: highlight,
            text,
            metadata,
            url: window.location.href
          });
          
          return true;
        } catch (error) {
          console.error('Error highlighting text:', error);
        }
      }
    }
    
    return false;
  }

  createTooltipText(metadata) {
    const parts = [];
    
    if (metadata.subreddit) {
      parts.push(`r/${metadata.subreddit}`);
    }
    
    if (metadata.author) {
      parts.push(`by u/${metadata.author}`);
    }
    
    if (metadata.score) {
      parts.push(`${metadata.score} points`);
    }
    
    return parts.join(' • ') || 'RedditScribe highlight';
  }

  handleHighlightClick(highlightElement, metadata) {
    // Show context menu for highlight management
    this.showHighlightMenu(highlightElement, metadata);
  }

  showHighlightMenu(highlightElement, metadata) {
    // Remove existing menu
    this.removeHighlightMenu();
    
    const menu = document.createElement('div');
    menu.className = 'rs-highlight-menu';
    menu.innerHTML = `
      <div class="rs-menu-item" data-action="view">👁️ View in App</div>
      <div class="rs-menu-item" data-action="edit">✏️ Edit Note</div>
      <div class="rs-menu-item" data-action="remove">🗑️ Remove</div>
    `;
    
    // Position menu near the highlight
    const rect = highlightElement.getBoundingClientRect();
    menu.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 5}px;
      left: ${rect.left}px;
      background: #1a1a3a;
      border: 1px solid #10b981;
      border-radius: 6px;
      padding: 4px;
      z-index: 10000;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // Add event listeners
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleMenuAction(action, highlightElement, metadata);
      }
    });
    
    document.body.appendChild(menu);
    this.currentHighlightMenu = menu;
    
    // Remove menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.removeHighlightMenu.bind(this), { once: true });
    }, 100);
  }

  removeHighlightMenu() {
    if (this.currentHighlightMenu) {
      this.currentHighlightMenu.remove();
      this.currentHighlightMenu = null;
    }
  }

  async handleMenuAction(action, highlightElement, metadata) {
    this.removeHighlightMenu();
    
    switch (action) {
      case 'view':
        // Open web app to view this highlight
        chrome.runtime.sendMessage({
          type: 'OPEN_HIGHLIGHT_IN_APP',
          data: { highlightId: highlightElement.dataset.highlightId }
        });
        break;
        
      case 'edit':
        // Allow editing highlight note
        const note = prompt('Add a note to this highlight:', metadata.note || '');
        if (note !== null) {
          await this.updateHighlightNote(highlightElement.dataset.highlightId, note);
        }
        break;
        
      case 'remove':
        // Remove highlight
        if (confirm('Remove this highlight?')) {
          await this.removeHighlight(highlightElement.dataset.highlightId);
        }
        break;
    }
  }

  async updateHighlightNote(highlightId, note) {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_HIGHLIGHT_NOTE',
        data: { highlightId, note }
      });
      
      // Update local metadata
      const highlight = this.highlights.get(highlightId);
      if (highlight) {
        highlight.metadata.note = note;
        highlight.element.title = this.createTooltipText(highlight.metadata);
      }
    } catch (error) {
      console.error('Error updating highlight note:', error);
    }
  }

  async removeHighlight(highlightId) {
    try {
      await chrome.runtime.sendMessage({
        type: 'REMOVE_HIGHLIGHT',
        data: { highlightId }
      });
      
      // Remove from DOM
      const highlight = this.highlights.get(highlightId);
      if (highlight && highlight.element) {
        const parent = highlight.element.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(highlight.element.textContent),
            highlight.element
          );
          parent.normalize();
        }
      }
      
      // Remove from local storage
      this.highlights.delete(highlightId);
    } catch (error) {
      console.error('Error removing highlight:', error);
    }
  }

  generateHighlightId() {
    return 'highlight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  destroy() {
    // Clean up observers and event listeners
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Remove all highlights
    this.highlights.forEach(highlight => {
      if (highlight.element && highlight.element.parentNode) {
        const parent = highlight.element.parentNode;
        parent.replaceChild(
          document.createTextNode(highlight.element.textContent),
          highlight.element
        );
        parent.normalize();
      }
    });
    
    this.highlights.clear();
  }
}

// Add CSS for highlight menu
const style = document.createElement('style');
style.textContent = `
  .rs-highlight-menu {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .rs-menu-item {
    padding: 6px 12px;
    cursor: pointer;
    color: #d1d5db;
    border-radius: 4px;
    margin: 2px 0;
    transition: background-color 0.2s ease;
  }
  
  .rs-menu-item:hover {
    background-color: #374151;
  }
  
  .rs-selection-preview {
    animation: selectionPulse 1s ease-in-out infinite alternate;
  }
  
  @keyframes selectionPulse {
    from { background-color: rgba(16, 185, 129, 0.2); }
    to { background-color: rgba(16, 185, 129, 0.4); }
  }
`;
document.head.appendChild(style);

// Initialize Reddit highlighter
window.redditHighlighter = new RedditHighlighter();
