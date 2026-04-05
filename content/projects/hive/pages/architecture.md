---
title: "Architecture"
date: 2026-04-04T12:00:00-04:00
draft: false
url: /projects/hive/architecture/
---

Hive is a Rust workspace organized into several crates, each owning a distinct concern. This page covers the major components and how they connect.

## The Agent Loop

The agent loop is the core of what Hive actually does. Each iteration builds a conversation context, sends it to the model, parses the response, executes any tool calls, and feeds the results back in. Sounds simple. In practice this is where everything breaks.

The loop guard tracks tool call signatures by hashing the tool name and serialized parameters. When an agent starts making the same call repeatedly, the system escalates through warnings injected into the conversation, blocking that specific call, and eventually circuit-breaking the entire loop. Calls with different parameters are tracked independently, so a batch of unique queries won't trip the guard.

Session repair runs before every LLM call to fix structural problems that accumulate in conversation histories over time. Tool results get orphaned when their corresponding tool-use messages are removed during compaction. Empty messages show up from cancelled generations. Consecutive same-role messages violate the alternation rules most model APIs expect. Left alone, any of these can produce unpredictable model behavior. The repair pass catches and fixes them before they cause problems.

## Authorization

Agents and humans share the same capability model. Every action an agent takes is gated by typed capabilities declared in its TOML manifest, and human operators get assigned capability sets through the same system. An operator managing deployment agents gets the capabilities relevant to that work without automatically having access to agents handling personal communications.

When an agent spawns a child, every capability the child requests must be a subset of what its parent holds. This is enforced at spawn time, so an invalid manifest is rejected before the agent ever runs. Message handling flows through additional gates on top of capabilities: channel policy enforcement (per-channel rules for DMs, specific users, etc.) and quota verification. Only after passing all of these does a message get dispatched to the runtime.

Platform identities map to Hive user accounts, so the system knows who's talking regardless of which channel the message arrives through.

## Memory Substrate

All persistent state runs through PostgreSQL. The memory crate exposes several storage layers through a unified async interface.

The **key-value store** provides per-agent namespaced storage plus a shared namespace. Simple but heavily used for agent state that needs to survive restarts.

**Semantic search** stores vector embeddings alongside source text and supports cosine similarity queries, scoped per-agent so one agent's indexed documents don't bleed into another's results.

The **knowledge graph** uses logic models with typed nodes, directed edges, reasoning rules, and custom ontologies. Agents define domain-specific schemas and inference rules derive new facts from existing ones. Queries use logical predicates rather than proximity matching. A dedicated ontology agent helps other agents build and refine their domain models, and a reasoning skill combines structured ontologies with external information to bridge inferential gaps that pure symbolic logic would need more premises for.

The **session manager** persists conversation histories with full token tracking. Sessions support compaction (summarizing older context to stay within model limits) while preserving important messages. Canonical sessions let an agent's memory span across channels, so a conversation started on Telegram can continue on Discord.

**Usage tracking** records per-agent, per-model token consumption and estimated cost, feeding into the metering engine for budget enforcement.

## Task Coordination

The ticketing system is one of the more important pieces of Hive's architecture. Agents need a way to hand off work, track what's been done, and pick up where someone else left off. This is separate from the memory substrate because it's not a storage layer, it's a coordination system.

Projects organize work into boards where tasks flow through swim lanes by status. The progression is familiar if you've used Linear or similar tools: backlog, in progress, review, done, with customizable states. Tickets carry full comment history and change tracking, so a development agent can start work, leave notes about what was attempted and what's still open, and a different agent or human can pick it up later with full context.

Agents search and reference tickets using a [bead-style](https://github.com/steveyegge/beads) focus model (of [Gas Town](https://github.com/steveyegge/gastown) fame) that keeps them on task with or without persistent memory. An agent doesn't need to remember everything about a project if it can always look up the current state of the relevant tickets.

The whole system is git-aware. Projects connect to repositories and work happens in git worktrees scoped to specific tasks. An agent working on a ticket gets its own worktree branched from the appropriate base, does its work there, and the results tie back to the ticket when complete. Each agent's mutual TLS certificate key can optionally double as an SSH certificate for remote systems. This gives agents their own git identities with command filtering support, so they can push and pull changes to their own branches (prefixed with their agent name) while remote restrictions prevent force pushes or any pushes to protected branches. References between tickets, commits, and agent sessions are all traced in the audit log.

## Workflow Engine

Workflows define multi-step processes combining agent reasoning with deterministic logic. Each step specifies an agent and a prompt template, and variable substitution links step outputs together so later steps can reference results from earlier ones.

Steps can run sequentially, fan out in parallel, collect parallel results, branch conditionally, or loop until a termination condition is met. Steps have configurable timeouts and error modes, and can export named variables for downstream consumption. The workflow engine connects directly to the ticketing system through state transition triggers. Moving a ticket to "in review" can spawn a QA agent. Moving it to "ready for deploy" can kick off a deployment workflow. These triggers are defined per-project and bridge the gap between task management and agent orchestration.

## LLM and Channel Integration

The driver abstraction layer defines a unified trait with streaming and non-streaming message methods. Native implementations cover the major API shapes: Anthropic's Messages API, Google's Gemini API, and an OpenAI-compatible driver that handles the many providers converging on that request format. Each agent can independently override its provider, model, and credentials.

Hive connects to messaging platforms natively rather than sitting behind a single API endpoint. Each channel adapter handles the complexity of its platform: connection management, message splitting, output formatting, rate limiting, reconnection with backoff, and graceful shutdown. Per-channel overrides let you configure which model and system prompt an agent uses on each platform, set DM and group policies, and control threading behavior.

The channel and provider lists have been deliberately narrowed from what was originally available. Smaller, sketchier integrations and fast-but-questionable providers were removed both for security and maintainability. Each adapter and driver is real code that needs real maintenance, and every external integration is attack surface. The most secure code is the code that isn't there.

API keys are wrapped in `Zeroizing<String>` so they get cleared from memory on drop. Retry logic handles rate limiting and overload with exponential backoff.

## Filesystem Isolation

Each agent instantiation gets a transparent writable overlay filesystem. The agent sees a normal filesystem rooted at its project directory, but all writes go to a private overlay layer unique to that instance. The underlying project files are never modified directly.

The overlay is snapshotable, which makes agent handoffs clean and reproducible. A QA agent can start in exactly the state a development agent left behind, even if the dev agent didn't commit their work. Two agents working on the same project in parallel can't step on each other's changes because each has its own overlay layer. This works alongside the git worktree integration in the ticketing system, where task-scoped worktrees provide the base layer and the overlay captures in-progress state on top.

## The Hive Kernel

To avoid confusion with the Linux kernel (which plays a very real role in Hive's security enforcement), I'll call this the Hive kernel. It's the central coordinator that wires together the specialized crates and mediates communication between them through a publish-subscribe event bus. The agent registry, scheduler, capability manager, workflow engine, trigger engine, metering, and model router all hang off of it. The Hive kernel doesn't implement the heavy logic for any of these. It orchestrates. This keeps it thin while giving it full visibility into everything happening in the system.
