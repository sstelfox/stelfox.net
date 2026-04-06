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

The agent ecosystem right now is mostly focused on making it easy to get something running quickly. That's fine for MVPs working with low-quality data, but when you want these systems to have real agency over important parts of your life you end up with situations like OpenClaw and the attacks on regular users that came out of it. Security in most frameworks, even the ones that claim it as a focus, isn't backed by real threat modeling or pipeline evaluation. Frequently it's a thin set of checkbox controls that may or may not be wired in, built without an understanding of what that security layer is actually supposed to protect against.

I found [OpenFang](https://www.openfang.sh/), a Rust-based agent harness that had a lot of what I was looking for architecturally. Good crate boundaries, real separation of concerns, a thoughtful approach to layered security. I started building on top of it. My wife named the project. Her first suggestion was "The Harem" on account of all the agents. I vetoed that one. Her second attempt, "The Hive," stuck.

In hindsight it wasn't quite the foundation it appeared to be (classic mistake on my part), but it was a starting point and the cleanup process taught me a lot. At the time of writing I'm sitting at 662 files changed, 67,557 insertions, and 103,013 deletions against what I forked from. There isn't a single file left that contains more than 12% of its original content, and that outlier is just a types file shared between crates.

## What I Found

When I've used language models for programming, especially on larger code bases, there are a couple of patterns that show up repeatedly and signal to me there isn't a driver in the seat.

**Massive functions and files.** Whether you're a human or agent, sprawling functions are hard to reason about. The central coordinator struct had over 50 fields. Several functions measured their length in thousands of lines and dozens of parameters. There were no tests over any of these large functions. Many of the tests that did exist were trivial non-behavior checks like verifying that default values matched what they were set to. Zero dependency injection, very little coverage over actual behavior.

**Disconnected functionality.** There were several layers of security features that were simply not wired up. The code existed, the marketing existed, the integration did not.

**Silently discarded results.** This goes beyond just swallowing errors. Pure functions called without using the return value. Results from operations that could fail quietly dropped on the floor. There were multiple redundant implementations of things like string truncation (with varying levels of UTF-8 correctness) scattered around the codebase. (If you're using LLMs with Rust I _STRONGLY_ encourage the pedantic clippy lints being enforced, the `#[must_use]` lint alone solves a lot of these edge cases.

**No real authentication.** There was a partially implemented authentication mechanism but it wasn't reliably connected to anything. It came down to a single static API key.

**Test theater.** The code base had nearly 1,400 tests. After manually reviewing all of them, roughly 400 actually tested behavior. Most of those were over pure functions or API handlers. The core system itself was almost entirely untested.

## What I Changed

A lot of the code I've added has been making the codebase testable. Dependency injection throughout the system so components can be tested in isolation. Recorded LLM sessions that can be replayed for deterministic system testing. Actual behavior tests.

### Provider and Integration Cleanup

The original project had a marketing checkbox problem. It seemed to be adding every possible LLM provider, start-up, or social platform integration primarily as a feature list item. The integrations had inconsistent levels of support and quality, and some of them are frankly neither trustworthy nor safe to actually use. Everything dangerous, broken, or that I couldn't see myself ever trying got cut. This probably made up a good 12k lines of removed heavily redundant code.

### Memory and Knowledge

The original project had some level of capability restrictions and namespacing on agents, but there wasn't any real data provenance or trust tracing (to be fair, not many projects are thinking that deeply about it). There was a knowledge graph system but it wasn't wired up well and used the current shortcut of re-using embeddings and linking content semantically rather than building up structured representations that can actually support reasoning.

Hive's knowledge system is built on typed ontologies with inference rules and composable domain-specific schemas. It's a departure from semantic embedding associations and more of a return to classical ML roots. Information, results, and memories carry provenance and trust levels. Agents are scoped to their own domains, and boundaries are enforced structurally rather than by hoping the model behaves. Taint tracking and domain isolation aren't new ideas, they just haven't been applied here yet.

On the coordination side, a shared ticketing system lets agents and humans hand off work, track progress across sessions, and tie everything back to git history and an auditable event chain.

### Browser Automation

I'm not quite sure why the original project integrated the Chrome developer protocol (CDP) directly rather than using something like playwright (they even called out not using playwright as a feature). I'm not a Chrome user and I like Firefox. More importantly, I don't think it's safe browsing the internet without a meaningful ad-blocker. There are just too many ways to spread malware that way, and with agents I definitely don't want them exposed to random ads.

I replaced CDP with a connection to a remote headless playwright Firefox container running extensions and going through an intercepting HTTPS proxy that logs and filters traffic, similar to how corporate proxies work.

### Command and Process Filtering

This is one of my consistent pet-peeves coming from a security background. Every agent harness I've seen in the wild checks the direct command being executed: `bash`, `sed`, `python`, `grep`. This is surface level filtering that is trivial for LLMs to work around. You can watch harnesses like Claude Code almost immediately circumvent some of these filters by executing commands indirectly or writing a custom Python utility that accesses something they wouldn't otherwise have access to.

There is a solution beyond "run it in a container" that is much more lightweight and reliable: eBPF syscall filtering. You're not limited to just commands. Any child process can be filtered for all of its syscalls, whether it's network access, file reads, file writes, or command execution. You can be incredibly fine-grained about what child processes are allowed to do.

There is also an abuse pattern layer that specifically looks for malicious behavior in child processes, things like non-system SSH clients attempting to access SSH keys. This layer is basically a host intrusion detection system scoped to processes spawned by Hive.

These techniques have decades of literature behind them. I suspect a lot of the people building agent systems simply haven't worked with these primitives before.

### Containerization

The original project used Docker for containerization. That's basically the only option if you're on Mac (which is really just running a massive Linux VM) or Windows. If you only need to support Linux, Podman lets you drop the root daemon and fully isolate in userspace. As a bonus, SELinux contexts provide an additional mandatory access control layer.

I extended the container system to support not just remote chats but local tool call execution with per-client filters and configs. A network proxy allows browser automation to interact with locally running web servers. All proxied requests are filtered both locally and remotely to ensure only intentionally exposed services are accessible. Results from external calls run through the same series of filters and checks as all other external content to catch command injections coming from the outside world.

### Remote Usage

There was the beginning of a peer-to-peer protocol built into the original codebase. I'm not sure what the intended use was but it immediately got cut. It may have been legitimately trying to solve a problem I kept running into with different agent harnesses: I don't always want to run agents on the same machine where all my services are configured. I want to run the CLI from my desktop or laptop, just like I do with Claude Code, have it operate on my local filesystem while the central coordination, LLM calls, and workflow engine stay on the server.

## Current State

The core systems are functional and I'm using Hive daily. I plan to open-source it once the codebase is in a state I'm happy with. I'll keep updating this project's log as things progress, and I'll probably write some posts on the more general gaps and patterns I've seen in the agent ecosystem.
