# Stelfox Dark Theme

A minimal, dark-first theme for Hugo with no external dependencies.

## Features

- **Dark-first design** with clean, readable typography
- **Self-hosted assets** - all fonts, JS, and CSS served from the site
- **Conditional loading** - MathJAX and Mermaid only load when needed
- **Custom JavaScript support** - add project-specific JS via frontmatter
- **Responsive design** - mobile-first layout
- **Syntax highlighting** - GitHub Dark inspired theme

## Build Process

### Content Builds

Regular content builds only require Hugo:

```bash
make build    # Production build
make server   # Development server
```

No npm or JavaScript build tools are needed for content builds. The theme uses pre-built CSS that's committed to the repository.

### Style Builds (Optional)

If you want to modify styles using Tailwind CSS:

1. Install Node.js and npm (only needed for style changes)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Modify `themes/stelfox-dark/src/css/tailwind-source.css` or templates
4. Build new CSS:
   ```bash
   make styles
   ```
5. Commit the generated `themes/stelfox-dark/static/css/style-tailwind.css`

The generated Tailwind CSS is committed to git, so collaborators don't need npm installed unless they're changing styles.

### Search

The theme includes client-side search powered by Pagefind:

1. Install Pagefind:
   ```bash
   cargo install pagefind
   ```
2. Search index is automatically built during `make build`

## Frontmatter Options

Enable optional features via frontmatter:

```yaml
---
title: My Post
mathjax: true      # Enable MathJAX for math equations
mermaid: true      # Enable Mermaid for diagrams
customCSS:         # Add custom stylesheets
  - /css/custom.css
customJS:          # Add custom JavaScript (project-specific widgets)
  - /js/custom.js
---
```

MathJAX and Mermaid are automatically detected from content, but you can force-enable them with frontmatter.

## Directory Structure

```
stelfox-dark/
├── layouts/
│   ├── _default/
│   │   ├── baseof.html    # Base template
│   │   ├── list.html      # Section listings
│   │   ├── single.html    # Single pages/posts
│   │   └── search.html    # Search page
│   ├── partials/
│   │   ├── head.html
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── mathjax.html   # MathJAX loader
│   │   └── mermaid.html   # Mermaid loader
│   └── index.html         # Homepage
├── static/
│   ├── css/
│   │   ├── style.css          # Main styles (hand-written)
│   │   ├── style-tailwind.css # Tailwind build (generated)
│   │   ├── syntax.css         # Code syntax highlighting
│   │   └── pagefind-dark.css  # Search UI dark theme
│   └── js/
│       ├── mathjax.tex-svg.dist.min.js  # MathJAX (self-hosted)
│       └── mermaid-10.9.1.dist.min.js   # Mermaid (self-hosted)
├── src/
│   └── css/
│       └── tailwind-source.css  # Tailwind input file
├── tailwind.config.mjs
├── postcss.config.mjs
└── README.md
```

## Customization

### Colors

The theme uses CSS variables for easy customization. Edit `static/css/style.css`:

```css
:root {
  --bg-primary: #0d1117;
  --text-primary: #c9d1d9;
  --accent-primary: #58a6ff;
  /* etc. */
}
```

### Tailwind Colors

If using Tailwind, custom colors are defined in `tailwind.config.mjs`:

```js
colors: {
  'dark-bg-primary': '#0d1117',
  'dark-text-primary': '#c9d1d9',
  'dark-accent': '#58a6ff',
}
```

### Typography

Font stacks are defined in CSS variables:

```css
--font-sans: -apple-system, BlinkMacSystemFont, ...;
--font-mono: 'SF Mono', Monaco, ...;
```

## License

MIT
