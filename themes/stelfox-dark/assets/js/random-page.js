// Random page navigation via page list
(function() {
  'use strict';

  var link = document.getElementById('random-page-link');
  if (!link) return;

  link.addEventListener('click', function(e) {
    e.preventDefault();

    var pages = window.__pageList;
    if (!pages || pages.length === 0) return;

    var pick = pages[Math.floor(Math.random() * pages.length)];
    window.location.href = pick;
  });
})();
