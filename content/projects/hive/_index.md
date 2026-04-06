---
title: "Hive"
slug: hive
created_at: 2026-04-04T12:00:00-04:00
draft: false
tags: [ai, agents, rust, llm, personal-tools]

# Project metadata
status: "active"
source_url: ""
demo_url: ""
tech_stack: ["Rust", "Tokio", "PostgreSQL", "WASM", "Axum"]

# Make child pages render under this project
cascade:
  - target:
      kind: "page"
      path: "logs/**"
    url: "/projects/hive/logs/:slug/"
  - target:
      kind: "page"
      path: "pages/**"
    url: "/projects/hive/pages/:slug/"
---

Hive is a self-hosted agent harness written in Rust. It manages long-lived agents as durable processes, connects them to external communication channels, and enforces security boundaries between agents, data, and the outside world using kernel-level primitives rather than application-level trust.

<!--more-->

The core systems are functional and I'm using Hive daily for my own workflows. I plan to open-source it once the codebase is in a state I'm comfortable with.

Agents run in isolated environments with overlay filesystems, scoped capabilities, and per-process network filtering enforced through eBPF. A structured knowledge graph built on typed ontologies handles reasoning. A shared ticketing system coordinates work between agents and humans across sessions. Browser automation runs through a headless Firefox instance behind a filtering proxy.

The [architecture reference](/projects/hive/architecture/) covers the major components and how they connect. The [security model](/projects/hive/security-model/) documents the enforcement layers in detail.
