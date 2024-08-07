/* todo(sstelfox): rewrite the theme selection as the persistence isn't working */

var themeDarkIcon = document.getElementById('theme-toggle-dark');
var themeLightIcon = document.getElementById('theme-toggle-light');
var themeSystemIcon = document.getElementById('theme-toggle-system');

function setThemeVisibility(themeParameter) {
  switch (themeParameter) {
    case 'system':
      themeSystemIcon.classList.toggle('hidden');
      break;
    case 'light':
      themeLightIcon.classList.toggle('hidden');
      break;
    case 'dark': themeDarkIcon.classList.toggle('hidden');
  }
}

function changeTheme() {
  if (themeSystemIcon.classList.contains('hidden') == false) {
    themeSystemIcon.classList.toggle('hidden');
    themeLightIcon.classList.toggle('hidden');

    localStorage.setItem('color-theme', 'light');
    document.documentElement.classList.remove('dark');
  } else if (themeLightIcon.classList.contains('hidden') == false) {
    themeLightIcon.classList.toggle('hidden');
    themeDarkIcon.classList.toggle('hidden');

    localStorage.setItem('color-theme', 'dark');
    document.documentElement.classList.add('dark');
  } else if (themeDarkIcon.classList.contains('hidden') == false) {
    themeDarkIcon.classList.toggle('hidden');
    themeSystemIcon.classList.toggle('hidden');

    localStorage.removeItem('color-theme');
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } else {
    /* default fallback to system preference */
    themeSystemIcon.classList.remove('hidden');
    themeLightIcon.classList.add('hidden');
    themeDarkIcon.classList.add('hidden');

    localStorage.removeItem('color-theme');
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
}

if (localStorage.getItem('color-theme') === 'dark') {
  var themeParameter = 'dark';
} else if (localStorage.getItem('color-theme') === 'light') {
  var themeParameter = 'light';
} else {
  var themeParameter = 'system';
}

window.addEventListener('DOMContentLoaded', () => {
  setThemeVisibility(themeParameter);
  document.getElementById('theme-toggle').addEventListener('click', changeTheme);
});


/* If the page has mermaid loaded, detect it and set the theme appropriately. */
if (typeof mermaid !== 'undefined') {
  var isDarkTheme = document.documentElement.classList.contains('dark');

  /* todo(sstelfox): the theme toggle needs to update the marmaid theme as well... */
  if (isDarkTheme) {
    var chosenTheme = 'dark';
  } else {
    var chosenTheme = 'default';
  }

  // Should do a whole lot more in the theming department once I have a color scheme:
  // * https://mermaid.js.org/config/theming.html
  mermaid.initialize({
    "darkMode": isDarkTheme,
    "startOnLoad": true,
    "theme": chosenTheme,
  });
}
