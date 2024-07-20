export default {
  // todo(sstelfox): In a production build I want this to only look at the
  // generated public directory so it can tree-shake out CSS styles that aren't
  // actually used anywhere.
  content: ['content/**/*.md', 'layouts/**/*.html'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
