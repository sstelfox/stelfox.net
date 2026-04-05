---
title: "Architecture"
date: 2026-04-04T12:00:00-04:00
draft: false
url: /projects/hive/architecture/
---

Hive is a Rust workspace organized into several crates, each owning a distinct concern. This page covers the major components, how they connect, and the design decisions behind the structure.

## The Kernel

The kernel is the central coordinator. It owns the agent registry, scheduler, capability manager, event bus, workflow engine, trigger engine, auth, metering, and model router. It doesn't implement the heavy logic for any of these directly. Instead it wires together specialized crates and mediates communication between them through a publish-subscribe event bus. This keeps the kernel thin while giving it full visibility into everything happening in the system.

The capability manager needs to be fast since checks happen on every tool call and agent action. The design prioritizes concurrent read access so permission checks don't serialize the agent loop.

The model catalog tracks built-in models across all the major families with aliases (so you can say `claude` and get the latest Sonnet), pricing data for cost estimation, and provider auth status detection. Auth detection checks whether the right environment variables are set for a given provider without ever reading the actual secret values. This lets the system know which providers are available without handling credentials at the catalog level.

## Agent Lifecycle

Agents have three states: **Running**, **Suspended**, and **Terminated**. The transitions between them are the interesting part.

Spawning an agent starts with generating an ID and creating a fresh session, then parsing the agent's TOML manifest to extract its declared capabilities, tools, model preferences, and system prompt. Before the agent can run, the kernel validates capability inheritance. If this agent was spawned by another agent, every capability it requests must be a subset of what its parent holds. This is enforced at spawn time, not at execution time, so an invalid manifest is rejected before the agent ever runs. After validation, capabilities are granted, the agent registers with the scheduler, gets persisted to PostgreSQL for durability, and the kernel publishes a spawn event.

Message handling flows through a series of gates. First RBAC checks whether the user has permission to interact with the target agent. Then channel policy enforcement applies per-channel rules (some channels might only allow DMs, or only respond to specific users). Quota verification checks whether the agent has budget remaining. Only after all of that does the message get dispatched to the runtime for LLM interaction.

Killing an agent reverses the spawn process cleanly: remove from registry, stop any active loops, unregister from the scheduler, revoke all capabilities, unsubscribe from events, remove triggers, delete from persistent storage.

## The Agent Loop

The runtime's agent loop is where LLM interaction actually happens, and it's been heavily hardened because this is where things go wrong in practice.

The **loop guard** tracks tool call signatures by hashing the tool name and its serialized parameters. Repeated identical calls get progressively escalated from warnings injected into context, to blocking the individual call, to circuit-breaking the entire loop. Different parameters are tracked separately, so many unique queries are fine while repeated identical queries trigger intervention.

**Session repair** runs before every LLM call and handles the structural damage that accumulates in conversation histories. Tool results can become orphaned when their corresponding tool-use messages get removed during compaction. Empty messages can appear from cancelled generations. Consecutive same-role messages violate the alternation requirement that most model APIs enforce. The repair pass detects and fixes all of these, which matters because a malformed conversation history produces unpredictable model behavior.

## Memory Substrate

All persistent state runs through PostgreSQL. The memory crate exposes several distinct storage layers through a unified async interface.

The **key-value store** provides per-agent namespaced storage plus a shared namespace. It's the simplest layer but gets used heavily for agent state that needs to survive restarts.

**Semantic search** stores vector embeddings alongside their source text and supports cosine similarity queries. This is the standard RAG retrieval pattern but scoped per-agent so one agent's indexed documents don't bleed into another's results.

The **knowledge graph** is where Hive diverges most from other agent systems. Rather than entity-relation storage with vector similarity queries, Hive uses logic models with typed nodes, directed edges, reasoning rules, and custom ontologies. Agents define domain-specific schemas that describe the entities and relationships meaningful to their work. Inference rules derive new facts from existing ones, and queries use real logical predicates rather than proximity matching. A dedicated ontology agent assists other agents in building and refining their domain ontologies, and a reasoning skill combines structured ontologies with external information to make deductive leaps by leveraging the LLM's ability to bridge inferential gaps that pure symbolic logic would need more premises for.

The **session manager** persists conversation histories with full token tracking. Sessions support compaction (summarizing older context to stay within model limits) while preserving the messages that matter. Canonical sessions allow an agent's memory to span across channels, so a conversation started on Telegram can continue on Discord.

The **task board** is a project-based ticketing system for coordinating work between agents and human operators. Tasks flow through swim lanes based on status, and workflow triggers fire on state transitions (moving a ticket to "in review" can automatically spawn a QA agent, for example). Tickets carry full comment history and change tracking for progressive work across sessions. Agents can search and reference tickets intelligently using a bead-style focus model that keeps them on task with or without persistent memory. The ticketing system is git-aware, with projects connecting to repositories and work happening in git worktrees scoped to specific tasks. References between tickets, git commits, and agent sessions are all traced in the audit log.

**Usage tracking** records per-agent, per-model token consumption and estimated cost, feeding into the metering engine for budget enforcement.

## LLM Integration

The driver abstraction layer defines a unified trait with streaming and non-streaming message methods. Three native implementations cover the major API shapes: one for Anthropic's Messages API, one for Google's Gemini API, and an OpenAI-compatible driver that handles the many providers who have converged on that request format.

Each agent can independently override its provider, model, and credentials. This means you can have one agent running Claude for nuanced conversation and another running a local Llama instance for classification, all managed by the same kernel.

Retry logic handles rate limiting and overload responses with exponential backoff. API keys are wrapped in `Zeroizing<String>` so they get cleared from memory on drop.

## Channel System

Hive connects to messaging platforms natively rather than hiding behind a single API endpoint. Each channel adapter handles the full complexity of its platform: connection management, message splitting for character limits, output formatting, rate limiting, reconnection with backoff, and graceful shutdown. Adapters cover the major chat platforms, email, social media, IRC, MQTT, and generic webhooks.

Per-channel overrides let you configure which model and system prompt an agent uses on each platform, set DM and group policies, tune rate limits, and control threading behavior. Output formatting automatically converts Markdown to whatever the platform expects natively.

## Workflow Engine

Workflows define multi-step processes that combine agent reasoning with deterministic logic. Each step specifies an agent and a prompt template. Variable substitution links step outputs together so later steps can reference results from earlier ones.

Steps can run sequentially (each receiving the previous output), fan out in parallel, collect parallel results, branch conditionally, or loop until a termination condition is met. Steps have configurable timeouts and error modes, and can export named variables for downstream consumption. The workflow engine is decoupled from the kernel through closures, making it testable in isolation.

## Authentication

Hive has a full username/password authentication system with mandatory multi-factor authentication. Users create accounts, enroll MFA, and get assigned custom roles with capability sets that map directly to the same permission model agents use. This means fine-grained access control rather than coarse role tiers. An operator managing deployment agents gets capabilities relevant to that work without automatically having access to agents handling personal communications. Service accounts let non-human integrations authenticate with their own scoped capability sets.

Platform identities map to Hive user accounts, so the system knows who's talking regardless of which channel the message arrives through.

## Filesystem Isolation

Each agent instantiation gets a transparent writable overlay filesystem. The agent sees a normal filesystem rooted at its project directory, but all writes go to a private overlay layer unique to that instance. The underlying project files are never modified directly.

The overlay is snapshotable, which makes agent handoffs clean and reproducible. A QA agent can start in exactly the state a development agent left behind, even if the dev agent didn't commit their work. Two agents working on the same project in parallel can't step on each other's changes because each has its own overlay layer. This works alongside the git worktree integration in the ticketing system, where task-scoped worktrees provide the base layer and the overlay captures in-progress state on top.
