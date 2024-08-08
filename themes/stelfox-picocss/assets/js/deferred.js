/* If the page has mermaid loaded, detect it and set the theme appropriately. */
if (typeof mermaid !== 'undefined') {
  // Should do a whole lot more in the theming department once I have a color scheme:
  // * https://mermaid.js.org/config/theming.html
  mermaid.initialize({
    'darkMode': true,
    'startOnLoad': true,
    'theme': 'dark',
  });
}
