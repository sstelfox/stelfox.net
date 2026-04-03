# Project Archetype

This archetype creates a complete project structure with sample content.

## Usage

Create a new project:

```bash
hugo new projects/my-project-name
```

This will create:

```
content/projects/my-project-name/
├── _index.md                    # Main project page
├── posts/
│   ├── _index.md                # Project log section
│   └── 2024-01-01-initial-setup.md  # Sample log entry
└── pages/
    ├── _index.md                # Reference pages section
    ├── architecture.md          # Sample reference page
    └── api.md                   # Sample API docs
```

## Project Assets

For project-specific assets (images, custom JavaScript, CSS, data files), place them in the project's page bundle. Hugo will automatically make them available as page resources.

For example, to add an image to your project:
1. Place the image file in `content/projects/my-project-name/` (next to `_index.md`)
2. Reference it in your markdown: `![Description](image.png)`

For more complex assets, you can use Hugo's [page resources](https://gohugo.io/content-management/page-resources/).

## Configuration

Edit `_index.md` to configure your project:

### Front Matter Fields

- **title**: Project name
- **status**: One of: `planning`, `active`, `on-hold`, `maintenance`, `archived`
- **source_url**: Optional link to source code repository
- **demo_url**: Optional link to live demo/running instance
- **tech_stack**: Array of technologies used

### Example

```yaml
---
title: "My Awesome Project"
status: "active"
source_url: "https://github.com/username/project"
demo_url: "https://project.example.com"
tech_stack: ["Go", "PostgreSQL", "React", "Docker"]
---
```

## Project Log Posts

Add development updates in the `posts/` directory:

```bash
hugo new projects/my-project-name/posts/2024-04-03-progress-update.md
```

Posts support full blog-style content with:
- Code blocks
- Images
- Diagrams (Mermaid, math via MathJax)
- All standard markdown features

**Important**: Each post needs an explicit `url` field in the front matter to ensure proper nesting:

```yaml
---
title: "Progress Update"
date: 2024-04-03T15:00:00-07:00
url: /projects/my-project-name/posts/2024-04-03-progress-update/
---
```

## Reference Pages

Add documentation pages in the `pages/` directory:

```bash
hugo new projects/my-project-name/pages/deployment.md
```

These are for more static documentation like architecture, API reference, deployment guides, etc.

**Important**: Each page needs an explicit `url` field in the front matter. Reference pages should be at the project root level:

```yaml
---
title: "Deployment Guide"
url: /projects/my-project-name/deployment/
---
```

## Status Badges

The project layout will display a colored status badge based on the `status` field:

- **planning**: Blue - Early stage, planning and design
- **active**: Green - Actively being developed
- **on-hold**: Yellow - Temporarily paused
- **maintenance**: Orange - Feature-complete, maintenance mode
- **archived**: Gray - No longer maintained
