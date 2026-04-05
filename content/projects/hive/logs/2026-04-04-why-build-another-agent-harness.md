---
title: "Why Build Another Agent Harness"
date: 2026-04-04T12:00:00-04:00
draft: false
tags: [ai, agents, rust, philosophy]
url: /projects/hive/logs/why-build-another-agent-harness/
---

There are a lot of agent harnesses out there right now. A genuinely unreasonable number. So why am I building another one?

I've been working with LLM agents for a while now. Not just using existing tools but building my own in both Rust and Python. Small focused systems exploring different approaches to task management, tool collections, and context handling. I've tried many of the popular harnesses, run models from all the major providers and a good handful of the open ones, done custom hosting with custom LoRA layers, and experimented with spec-driven task systems defined entirely in structured documents. Every setup taught me something about where these systems break down in practice and I collected a lot of notes along the way.

What I kept wanting was specific but not exotic. A system that runs on my hardware, manages agents as durable long-lived processes, integrates with communication channels I already use daily, and enforces real security boundaries between agents and data. Capability-based access control is well-understood computer science. Taint tracking has decades of literature. Domain isolation is a solved problem in OS design. Per-process network filtering is something Linux has had solid tools for since BPF matured. None of this is moonshot territory. The agent ecosystem just hasn't prioritized these things yet because everyone's chasing different problems.

<!--more-->

At some point I found OpenFang, a Rust-based agent harness. On paper it had most of what I was after. Multi-provider LLM support, channel integrations for Telegram, Discord, IRC, email, Mastodon and others. A workflow engine, a capability system. Written in Rust, which is the language I wanted to be spending my free time with.

I cloned it, got it building, pointed it at an API key, and sent a few messages through Telegram. It worked. The architectural ideas were genuinely good. Sensible crate boundaries, real separation of concerns, a thoughtful attempt at layered security.

Then I read the source code.

Around 125,000 lines of Rust bearing all the hallmarks of early, aggressive code generation without much human review. Functions that looked correct at first glance but handled errors by silently swallowing them. Abstractions that existed to have abstractions. Duplicated logic across channel adapters that should have been a shared trait. Tests that tested nothing meaningful. Security features half-wired or not connected at all. Dangerous code paths with no clear purpose.

Machine-generated code at this scale *looks* right. It follows patterns, uses reasonable names, handles the happy path. But the connective tissue is weak. The error paths are aspirational. The architecture was shaped by whatever the model thought was a good idea at generation time rather than by deliberate choices. Codebases like this are becoming more common and they share particular failure modes worth understanding.

So the fork became two things running in parallel. My wife named it. Her first suggestion was "The Harem" on account of all the agents. I vetoed that one. Her second attempt, "The Hive," stuck.

The first is building the agent system I actually want. Taking the ideas from OpenFang that were well-conceived and building real implementations around them. The capability system now has Linux BPF-based execution filters underneath it so security enforcement happens at the kernel level, not just in application code. Each agent gets per-agent firewall rules. Domain isolation and trust tracking (neither existed in the original) follow data through tool call chains and enforce information flow boundaries. The knowledge graph was rebuilt on actual logic models with reasoning rules and custom ontologies, replacing the simpler similarity-search approach. Container execution moved to Podman for rootless operation. The authentication system was replaced with proper user and service management. There's a Linear-style ticket system shared between agents and human operators for coordinating ongoing work.

The second is the codebase recovery. Systematically going through the inherited code and turning it into something I'd be happy maintaining. Ripping out dangerous integrations and features I don't need. Fixing the endless subtle silent failures. Making the error handling real. Getting logging to a state where I can actually understand what the system is doing. Removing dead code, deduplicating adapter implementations, wiring up the things that were supposed to be connected but weren't.

Both halves feed each other in a way I didn't anticipate. The recovery work forces me to understand the codebase deeply enough to know where the real improvements need to happen. The improvement work gives me a reason to keep pushing through the tedious cleanup. Rust turns out to be a good language for this kind of forensic code work. Pattern matching exhaustiveness, the borrow checker flagging dubious ownership, type mismatches revealing incorrect assumptions. The compiler catches a lot.

Hive is functional for my daily use now. The cleanup and hardening phase is honestly the most interesting part of the project so far. I plan to open-source it when the codebase reflects the project I want it to be.
