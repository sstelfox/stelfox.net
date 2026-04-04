// Custom Lunr.js-based search with field boosting
(function() {
  'use strict';

  let searchIndex;
  let searchDocuments;
  let currentSection = 'all';
  let searchInput;
  let searchResults;
  let searchCount;

  function initializeSearch() {
    console.log('Initializing Lunr search...');

    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');
    searchCount = document.getElementById('search-count');
    const searchClear = document.getElementById('search-clear');
    const sectionFilters = document.querySelectorAll('.section-filter');

    console.log('Search elements found:', {
      searchInput: !!searchInput,
      searchResults: !!searchResults,
      searchCount: !!searchCount,
      searchClear: !!searchClear,
      sectionFilters: sectionFilters.length
    });

    if (!searchInput || !searchResults) {
      console.error('Search elements not found - missing required elements');
      return;
    }

    // Load search index
    fetch('/search_index.json')
      .then(response => response.json())
      .then(documents => {
        searchDocuments = documents;

        // Build Lunr index with field boosting
        searchIndex = lunr(function() {
          this.ref('id');
          this.field('title', { boost: 10 });
          this.field('summary', { boost: 5 });
          this.field('content', { boost: 3 });
          this.field('tags', { boost: 7 });
          this.field('section');

          documents.forEach(doc => {
            this.add(doc);
          });
        });

        console.log(`Search index built with ${documents.length} documents`);
        searchInput.removeAttribute('disabled');
        searchInput.placeholder = 'Search across all posts, notes, and projects...';

        // Check if there's a query parameter to search for
        checkQueryParameter();
      })
      .catch(error => {
        console.error('Failed to load search index:', error);
        searchInput.placeholder = 'Search unavailable';
      });

    // Handle search input
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.trim();

      if (query.length < 2) {
        searchResults.innerHTML = '';
        searchCount.textContent = '';
        // Clear query parameter
        const url = new URL(window.location);
        url.searchParams.delete('q');
        window.history.replaceState({}, '', url);
        return;
      }

      performSearch(query);

      // Update URL with query parameter
      const url = new URL(window.location);
      url.searchParams.set('q', query);
      window.history.replaceState({}, '', url);
    });

    // Handle section filters
    sectionFilters.forEach(filter => {
      filter.addEventListener('click', function(e) {
        e.preventDefault();

        // Update active state
        sectionFilters.forEach(f => f.classList.remove('active'));
        this.classList.add('active');

        // Set current section
        currentSection = this.dataset.section;

        // Re-run search if there's a query
        const query = searchInput.value.trim();
        if (query.length >= 2) {
          performSearch(query);
        }
      });
    });

    // Handle clear button
    const clearButton = document.getElementById('search-clear');
    if (clearButton) {
      clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchCount.textContent = '';
        searchInput.focus();
      });
    }
  }

  function performSearch(query) {

    if (!searchIndex) {
      return;
    }

    try {
      // Perform search with Lunr
      const results = searchIndex.search(query);

      // Filter by section if needed
      let filteredResults = results;
      if (currentSection !== 'all') {
        filteredResults = results.filter(result => {
          const doc = searchDocuments[result.ref];
          return doc.section === currentSection;
        });
      }

      // Display results
      if (filteredResults.length === 0) {
        searchResults.innerHTML = '<p class="search-no-results">No results found.</p>';
        searchCount.textContent = '';
        return;
      }

      const resultCount = filteredResults.length;
      const resultText = resultCount === 1 ? 'result' : 'results';
      searchCount.textContent = `${resultCount} ${resultText}`;

      const resultsHTML = filteredResults.slice(0, 20).map(result => {
        const doc = searchDocuments[result.ref];
        const excerpt = createExcerpt(doc.summary || doc.content, query, 60);

        return `
          <article class="search-result">
            <div class="search-result-header">
              <h3 class="search-result-title">
                <a href="${escapeHtml(doc.url)}">${highlightMatches(escapeHtml(doc.title), query)}</a>
              </h3>
              <span class="search-result-section section-${escapeHtml(doc.section)}">${escapeHtml(doc.section)}</span>
            </div>
            ${doc.date ? `<time class="search-result-date">${escapeHtml(doc.date)}</time>` : ''}
            <p class="search-result-excerpt">${excerpt}</p>
            ${doc.tags && doc.tags.length > 0 ? `
              <div class="search-result-tags">
                ${doc.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
              </div>
            ` : ''}
          </article>
        `;
      }).join('');

      searchResults.innerHTML = resultsHTML;
    } catch (error) {
      console.error('Search error:', error);
      searchResults.innerHTML = '<p class="search-error">Search error occurred. Please try a different query.</p>';
    }
  }

  function createExcerpt(text, query, wordCount) {
    if (!text) return '';

    // Convert code blocks to placeholder markers before processing
    let processedText = text;
    const codeBlocks = [];
    const inlineCode = [];

    // Extract and preserve code blocks
    processedText = processedText.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
      codeBlocks.push(match);
      return `__CODEBLOCK_${codeBlocks.length - 1}__`;
    });

    // Extract and preserve inline code
    processedText = processedText.replace(/<code[^>]*>(.*?)<\/code>/gi, (match, content) => {
      inlineCode.push(content);
      return `__INLINECODE_${inlineCode.length - 1}__`;
    });

    // Strip remaining HTML tags
    const cleanText = stripHtml(processedText);

    // Find the query in the text (case insensitive)
    const lowerText = cleanText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const queryIndex = lowerText.indexOf(lowerQuery);

    let excerpt;
    let prefix = '';
    let suffix = '';

    if (queryIndex === -1) {
      // Query not found, return beginning
      const words = cleanText.split(/\s+/).slice(0, wordCount);
      excerpt = words.join(' ');
      suffix = words.length === wordCount ? '...' : '';
    } else {
      // Extract context around the match
      const words = cleanText.split(/\s+/);
      let startIndex = 0;
      let currentPos = 0;

      for (let i = 0; i < words.length; i++) {
        if (currentPos >= queryIndex) {
          startIndex = Math.max(0, i - Math.floor(wordCount / 2));
          break;
        }
        currentPos += words[i].length + 1;
      }

      const endIndex = Math.min(words.length, startIndex + wordCount);
      excerpt = words.slice(startIndex, endIndex).join(' ');
      prefix = startIndex > 0 ? '...' : '';
      suffix = endIndex < words.length ? '...' : '';
    }

    // Restore code blocks and inline code with proper formatting
    excerpt = excerpt.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => {
      const block = codeBlocks[parseInt(index)];
      const codeContent = stripHtml(block);
      // Truncate long code blocks in excerpts
      const lines = codeContent.split('\n').slice(0, 3);
      const truncated = lines.join('\n') + (codeContent.split('\n').length > 3 ? '\n...' : '');
      return `\`\`\`\n${truncated}\n\`\`\``;
    });

    excerpt = excerpt.replace(/__INLINECODE_(\d+)__/g, (match, index) => {
      return `\`${inlineCode[parseInt(index)]}\``;
    });

    // Escape HTML and then convert markdown code syntax to HTML
    let escapedExcerpt = escapeHtml(excerpt);

    // Convert markdown code blocks to HTML
    escapedExcerpt = escapedExcerpt.replace(/```\n([\s\S]*?)\n```/g, (match, code) => {
      return `<pre><code>${code}</code></pre>`;
    });

    // Convert markdown inline code to HTML
    escapedExcerpt = escapedExcerpt.replace(/`([^`]+)`/g, (match, code) => {
      return `<code>${code}</code>`;
    });

    return prefix + highlightMatches(escapedExcerpt, query) + suffix;
  }

  function highlightMatches(text, query) {
    if (!text || !query) return text;

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function stripHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || div.innerText || '';
  }

  // Check for query parameter on page load
  function checkQueryParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query && searchInput) {
      searchInput.value = query;
      // Trigger search after index loads
      if (searchIndex) {
        performSearch(query);
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
  } else {
    initializeSearch();
  }
})();
