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

Hive grew out of a lot of time spent experimenting with agent systems. I built several harnesses in Rust and Python, tried most of the popular frameworks, ran models from all the major providers and plenty of open ones, and collected a bunch of notes on where things tend to break down. I kept wanting the same thing: a system that runs on my hardware, manages agents as persistent processes, connects to the communication channels I already use, and enforces real isolation between agents and data. Early work on the project drew from [OpenFang](https://www.openfang.sh/), though about 80% of the codebase has been rewritten, replaced, or removed at this point and we're just getting started.

<!--more-->

The agent ecosystem right now is mostly focused on making it easy to get something running quickly, consequences be damned. That's fine for MVPs working with low-quality data, but when you want these systems to have agency over important parts of your life you end up with situations like OpenClaw and the attacks on regular users that came out of it. Security in most frameworks, even the ones that claim it as a focus, isn't backed by real threat modeling or pipeline evaluation. Frequently it's a thin set of checkbox controls that may or may not be wired in, built without an understanding of what that security layer is actually supposed to protect against. Hive stacks independent enforcement layers from application code down through the kernel and into process isolation, properly wired in, with failure modes individually considered and assessed.

Information, results, and memories carry provenance and trust levels. Agents are scoped to their own domains and boundaries are enforced structurally rather than by hoping the model behaves. Taint tracking and domain isolation aren't new ideas, and neither is syscall filtering. Hive applies all of these to its child processes directly, ensuring that blocked commands can't simply be worked around and files outside the workspace can't be changed indirectly. These techniques have decades of literature behind them. I suspect a lot of the people building agent systems simply haven't worked with these primitives before.

Hive's knowledge system is founded on strict typed ontologies with inference rules and composable domain-specific or agent-specific schemas. It's a pretty big departure from semantic embedding associations and more of a return to classical ML roots. On the coordination side, a shared ticketing system lets agents and humans hand off work, track progress across sessions, and tie everything back to git history and an auditable event chain.

The core systems are functional and I'm using Hive daily. I plan to open-source it once the codebase is in a state I'm happy with. I've written up an [architecture reference](/projects/hive/architecture/) for the technical breakdown and documented the [security model](/projects/hive/security-model/) covering the different enforcement layers. I'll probably post some blogs on the more general gaps and patterns I've seen, and I'll keep updating this project's development log as I go.
