// Easter egg: emoji cursors for family names in prose
(function() {
  'use strict';

  var el = document.querySelector('script[data-sam]');
  if (!el) return;

  var NAMES = [
    { pattern: /\bSam\b/g, cursor: el.dataset.sam },
    { pattern: /\bHannah\b/g, cursor: el.dataset.hannah },
    { pattern: /\bZelda\b/g, cursor: el.dataset.zelda },
    { pattern: /\bCookie\b/g, cursor: el.dataset.cookie }
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
      span.style.cursor = 'url("' + matchedEntry.cursor + '") 4 4, auto';
      frag.appendChild(span);

      remaining = remaining.slice(earliestIdx + earliest[0].length);
    }

    node.parentNode.replaceChild(frag, node);
  });
})();
