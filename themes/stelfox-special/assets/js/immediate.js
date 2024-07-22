// Set our default site wide theme (light/dark). This prefers dark mode unless
// the user has explicitly set a light theme or have indicated their preference
// that way. In all other cases we set the dark mode theme.
const setDefaultTheme = () => {
  const currentConfiguredTheme = localStorage.getItem('colorTheme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

  if (currentConfiguredTheme === 'light' || prefersLight) {
    document.documentElement.classList.remove('dark');
    return;
  }

  document.documentElement.classList.add('dark')
};

setDefaultTheme();
