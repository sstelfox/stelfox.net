---
title: "Why Build Another Agent Harness"
date: 2026-04-04T12:00:00-04:00
draft: false
tags: [ai, agents, rust, philosophy]
url: /projects/hive/logs/why-build-another-agent-harness/
---

There are a lot of agent harnesses out there. So why build another one?

I've spent a lot of time in this space. I built several small agent systems in both Rust and Python, tried most of the popular frameworks, ran models from all the major providers and a bunch of open ones, experimented with custom LoRA layers and spec-driven task systems. Every setup taught me something about where things break down and I kept notes along the way.

What I wanted wasn't exotic. A system that runs on my hardware, manages agents as durable long-lived processes, connects to the communication channels I already use, and enforces real security boundaries between agents and data. Capability-based access control, taint tracking, domain isolation, per-process network filtering. These are all well-understood ideas with decades of prior art. The agent ecosystem just hasn't prioritized them yet because everyone's working on different problems.

<!--more-->

I found [OpenFang](https://www.openfang.sh/), a Rust-based agent harness with a lot of what I was looking for. Multi-provider LLM support, channel integrations for the platforms I use, a workflow engine, a capability system. I liked the architectural thinking behind it. Good crate boundaries, real separation of concerns, a thoughtful approach to layered security. It was also written in Rust, which is the language I wanted to be spending my free time with. It had good bones.

So I started building on top of it. My wife named the project. Her first suggestion was "The Harem" on account of all the agents. I vetoed that one. Her second attempt, "The Hive," stuck.

The work has been two things running in parallel. The first is building the agent system I actually want. BPF-based execution filters at the kernel level backing the capability system. Per-agent firewall rules. Domain isolation and trust tracking that follow data through tool call chains. A knowledge graph built on logic models with reasoning rules and custom ontologies. Podman for rootless container execution. A proper user and service management system. A Linear-style ticket system shared between agents and human operators. Overlay filesystems so agents can work on the same project without stomping on each other.

The second is a big cleanup and hardening pass. Tightening up error handling, improving logging, deduplicating shared logic, removing things I don't need, and wiring up things that should have been connected. This part has been surprisingly interesting. Rust is a really good language for this kind of work. Exhaustive pattern matching, the borrow checker flagging questionable ownership, type mismatches revealing incorrect assumptions. The compiler does a lot of the heavy lifting.

Both halves feed each other in a way I didn't expect. The cleanup forces me to understand the codebase deeply enough to know where the real improvements need to happen. The improvements give me a reason to keep pushing through the tedious parts.

Hive is functional and I'm using it daily. I plan to open-source it once the codebase is in a state I'm happy with.
