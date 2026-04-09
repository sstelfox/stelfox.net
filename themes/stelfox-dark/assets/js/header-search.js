// Header search and cross-page query sync
(function() {
  'use strict';

  var headerInput = document.getElementById('header-search-input');
  var sectionInputs = document.querySelectorAll('.section-search-input');
  var urlParams = new URLSearchParams(window.location.search);
  var query = urlParams.get('q');

  // Populate all search fields from ?q= param
  if (query) {
    if (headerInput) {
      headerInput.value = query;
    }
    sectionInputs.forEach(function(input) {
      input.value = query;
    });
  }

  // Header input navigates to search page on Enter
  if (headerInput) {
    headerInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var q = headerInput.value.trim();
        if (q) {
          window.location.href = '/search/?q=' + encodeURIComponent(q);
        }
      }
    });
  }
})();
