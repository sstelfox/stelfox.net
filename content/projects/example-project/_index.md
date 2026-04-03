---
title: Example Project
slug: example-project
created_at: 2024-01-01T00:00:00-00:00
draft: true
tags: [example, demo, template]

# Project metadata
status: "active"
source_url: "https://github.com/example/project"
demo_url: "https://demo.example.com"
tech_stack: ["Hugo", "Go", "Markdown", "CSS"]

# Make child pages render under this project
cascade:
  - target:
      kind: "page"
      path: "posts/**"
    url: "/projects/example-project/posts/:slug/"
  - target:
      kind: "page"
      path: "pages/**"
    url: "/projects/example-project/pages/:slug/"
---

This is an example project demonstrating the structure for Hugo project pages with integrated logs and reference documentation.

<!--more-->

Each project can have:

- **Posts** - Running log entries and updates (in `posts/` subdirectory)
- **Pages** - Static reference pages specific to this project (in `pages/` subdirectory)
- **Assets** - Project-specific JavaScript, CSS, images, etc. (in `assets/` subdirectory)

## Project Overview

Describe your project here. What are you building? What problem does it solve?

## Current Status

What's the current state of the project?

## Resources

- Links to related resources
- Documentation references
- External tools or libraries used
