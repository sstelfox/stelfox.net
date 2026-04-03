// Pagefind search initialization
(function() {
  'use strict';

  function initializeSearch() {
    console.log('Initializing Pagefind UI...');

    const searchElement = document.getElementById('search');
    if (!searchElement) {
      console.error('Search element not found');
      return;
    }

    if (typeof PagefindUI === 'undefined') {
      console.error('PagefindUI is not loaded');
      return;
    }

    try {
      new PagefindUI({
        element: "#search",
        showSubResults: true,
        showImages: false,
        excerptLength: 30,
        processResult: function(result) {
          // Clean up excerpt by removing code-like content
          if (result.excerpt) {
            // Remove content that looks like code/logs (has lots of special chars)
            result.excerpt = result.excerpt
              .replace(/\[.*?\]/g, '') // Remove bracketed content like timestamps
              .replace(/\{.*?\}/g, '') // Remove braced content
              .replace(/\d{4}-\d{2}-\d{2}/g, '') // Remove dates
              .replace(/\s+/g, ' ') // Collapse whitespace
              .trim();
          }
          return result;
        }
      });
      console.log('Pagefind UI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Pagefind UI:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
  } else {
    // DOM is already ready
    initializeSearch();
  }
})();
