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

A personal LLM agent harness forked from OpenFang, heavily gutted, and reshaped into something that fits how I actually want to work with agents.

<!--more-->

Before Hive existed I spent a lot of time exploring the agent space. I tried many of the popular harnesses and models, but I also built several of my own in both Rust and Python. Small focused systems exploring different approaches to task management, tool collections, and context handling. Most of them were throwaway experiments but they taught me a lot about where these systems break down in practice. I collected a pile of notes on failure modes, security gaps, and architectural dead-ends that I kept coming back to.

With that background, I found [OpenFang](https://www.openfang.sh/), a Rust-based agent harness with a genuinely compelling feature set. Multi-provider LLM support, native integrations with messaging platforms I actually use, a workflow engine, capability-based security. The architectural ideas behind it were solid. Good crate boundaries, sensible separation of concerns, a real attempt at layered security. I cloned it, tried it out, and it worked well enough at the surface.

Then I read the source code and found around 125,000 lines of Rust that bore all the hallmarks of early, aggressive code generation without much human oversight. Silent error handling. Abstractions for the sake of abstraction. Duplicated logic everywhere. Security features half-wired or not connected at all. Tests that didn't test anything meaningful.

So Hive became two projects running in parallel. The first is reshaping the system into precisely what I want: Linux BPF-based execution filters layered under the capability system so security doesn't depend solely on application code, domain isolation and taint tracking that follow data through tool call chains (neither existed in the original), knowledge graphs built on actual logic models with reasoning rules and custom ontologies, Podman for rootless container execution, a real user and service management system, and a Linear-style ticket system shared between agents and humans.

The second project is the codebase recovery itself. Finding out what it takes to turn a large, machine-generated Rust project into something genuinely maintainable. Removing dangerous integrations and dead code. Fixing silent failures. Making error handling actually handle errors. Getting logging to a state where you can understand what the system is doing. This part has turned out to be the more interesting half, honestly.

The core agent loop, channel integrations, workflow engine, and security infrastructure are all functional. I'm deep in the cleanup and hardening phase right now. I'll open-source it once the codebase is in a state I'm happy with.

See the [architecture reference](/projects/hive/architecture/) for the technical breakdown and the [security model](/projects/hive/security-model/) for how the permission and isolation systems work.
