// Random page navigation via search index
(function() {
  'use strict';

  var link = document.getElementById('random-page-link');
  if (!link) return;

  link.addEventListener('click', function(e) {
    e.preventDefault();

    fetch('/search_index.json')
      .then(function(response) { return response.json(); })
      .then(function(documents) {
        if (documents.length === 0) return;
        var pick = documents[Math.floor(Math.random() * documents.length)];
        window.location.href = pick.url;
      })
      .catch(function(err) {
        console.error('Failed to load search index for random page:', err);
      });
  });
})();
