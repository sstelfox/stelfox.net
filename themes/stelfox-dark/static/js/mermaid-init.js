// Wait for the mermaid UMD bundle to load, then initialize
document.addEventListener('DOMContentLoaded', function() {
  if (typeof mermaid === 'undefined') {
    return;
  }

  var isDark = localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme');

  mermaid.initialize({
    startOnLoad: true,
    theme: isDark ? 'dark' : 'base',
    themeVariables: {
      darkMode: isDark,
      background: '#0d1117',
      primaryColor: '#58a6ff',
      primaryTextColor: '#c9d1d9',
      primaryBorderColor: '#30363d',
      lineColor: '#8b949e',
      secondaryColor: '#21262d',
      tertiaryColor: '#161b22'
    }
  });
});
