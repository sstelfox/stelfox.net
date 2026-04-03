/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './themes/stelfox-dark/layouts/**/*.html',
    './content/**/*.md',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg-primary': '#0d1117',
        'dark-bg-secondary': '#161b22',
        'dark-bg-tertiary': '#21262d',
        'dark-text-primary': '#c9d1d9',
        'dark-text-secondary': '#8b949e',
        'dark-text-tertiary': '#6e7681',
        'dark-accent': '#58a6ff',
        'dark-accent-hover': '#79c0ff',
        'dark-border': '#30363d',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
