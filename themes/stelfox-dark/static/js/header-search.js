// Simple header search - navigates to search page
(function() {
  'use strict';

  const searchInput = document.getElementById('header-search-input');

  if (!searchInput) {
    return;
  }

  // Navigate to search page on Enter key
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = '/search/?q=' + encodeURIComponent(query);
      }
    }
  });
})();
