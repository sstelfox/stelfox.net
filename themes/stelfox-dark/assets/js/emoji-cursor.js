// Easter egg: emoji cursors for family names in prose
(function() {
  'use strict';

  var NAMES = [
    { pattern: /\bSam\b/g, emoji: '🦊' },
    { pattern: /\bHannah\b/g, emoji: '🌻' },
    { pattern: /\bZelda\b/g, emoji: '🐝' },
    { pattern: /\bCookie\b/g, emoji: '🍪' }
  ];

  var containers = document.querySelectorAll('.content-body, .home-intro');
  if (!containers.length) return;

  var nodes = [];
  containers.forEach(function(container) {
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
  });

  nodes.forEach(function(node) {
    var text = node.textContent;
    var hasMatch = NAMES.some(function(n) {
      n.pattern.lastIndex = 0;
      return n.pattern.test(text);
    });

    if (!hasMatch) return;

    var frag = document.createDocumentFragment();
    var remaining = text;

    while (remaining.length > 0) {
      var earliest = null;
      var earliestIdx = remaining.length;
      var matchedEntry = null;

      NAMES.forEach(function(n) {
        n.pattern.lastIndex = 0;
        var m = n.pattern.exec(remaining);
        if (m && m.index < earliestIdx) {
          earliest = m;
          earliestIdx = m.index;
          matchedEntry = n;
        }
      });

      if (!earliest) {
        frag.appendChild(document.createTextNode(remaining));
        break;
      }

      if (earliestIdx > 0) {
        frag.appendChild(document.createTextNode(remaining.slice(0, earliestIdx)));
      }

      var span = document.createElement('span');
      span.textContent = earliest[0];
      span.className = 'emoji-cursor';
      span.dataset.emoji = matchedEntry.emoji;
      frag.appendChild(span);

      remaining = remaining.slice(earliestIdx + earliest[0].length);
    }

    node.parentNode.replaceChild(frag, node);
  });
})();
