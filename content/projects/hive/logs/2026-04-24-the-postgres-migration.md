---
title: "The Postgres Migration"
date: 2026-04-24T12:00:00-04:00
draft: false
tags: [rust, security, architecture]
url: /projects/hive/logs/the-postgres-migration/
---

This is the biggest structural change Hive has gone through since I forked it. 723 files changed, 90,471 insertions, 132,463 deletions against upstream main at the fork point. SQLite is gone. PostgreSQL with pgvector is the only storage backend now and there's no migration path from the old data. That sounds dramatic but it was the right call. The previous setup had `Arc<Mutex<Connection>>` contention, `spawn_blocking` wrappers everywhere because rusqlite isn't async, and client-side cosine similarity computation that should have been happening in the database all along.

<!--more-->

The new setup uses a dual connection pool architecture with separate writer and reader pools mapped to distinct database roles. Writers can INSERT/UPDATE/DELETE, readers can only SELECT, and migrations run under a third admin role with DDL privileges. This isn't novel database design, it's just good practice that wasn't possible with a single SQLite file. Vector similarity now uses pgvector's `<=>` cosine distance operator server-side, which let me delete the client-side similarity math entirely.

Setting up a fresh instance is straightforward. `just pg-start` spins up a Podman container with PostgreSQL 17, pgvector, and PostGIS. `hive db setup` can bootstrap the roles and database from scratch without needing Docker at all. `hive db migrate` applies the schema. There's a `just dev-db` recipe that chains all of this together for local development.

## Naming Things

Terminology got cleaned up across the board. "Workspace" became "agent home" because every tool in the ecosystem already uses "workspace" to mean something else and the collisions were getting confusing. The agent home is the agent's personal directory for identity files, memory, sessions, and skills. Config field is `agent_homes_dir`, default path is `~/.hive/agent_homes/`. Similarly, spawned sub-agents were called "hands" which never sat right with me. They're "drones" now, which fits the hive theme and is a lot less weird to read in logs.

## Auth Got Real

Auth was already mandatory after the last security pass but the backing store was still a single admin account in config.toml. Now users live in the database with Argon2id password hashes. Per-user API keys replace the old global shared key. The login endpoint does timing-safe dummy hash verification to prevent username enumeration, which is the kind of thing you only remember to do after you've seen it exploited.

The server-side dashboard gating is a nice improvement. Instead of the client-side Alpine.js auth modal doing a `checkAuth()` dance, the server now serves different HTML based on auth state: a setup page when no users exist, a login page when unauthenticated, or the full SPA when you're in. The old client-side modal is gone. `hive security create-user`, `create-api-key`, `list-users`, `delete-user`, and `change-password` cover the full lifecycle from the CLI. Web API endpoints mirror all of this for the dashboard.

## Kernel Sandboxing

This one I'm particularly happy about. Agent subprocesses are now sandboxed at the kernel level using seccomp-bpf and Landlock LSM. It's applied in `pre_exec` between fork and exec so no privileges are required. Seccomp blocks dangerous syscalls like `ptrace`, `mount`, `bpf`, `kexec`, and `unshare` with configurable profiles (Default, Strict, Permissive). Landlock confines filesystem access to the workspace plus system read paths and enforces noexec. On kernel 6.7+ it can also restrict TCP connect and bind ports.

This is the kind of security boundary I was talking about in the first post. Not command-level filtering that any model can work around, but syscall-level enforcement that applies to every child process regardless of how it was spawned. The `sandbox` cargo feature is enabled by default. The `auto` mode degrades gracefully if the kernel doesn't support the required features.

## Projects

Projects are a new first-class concept. They're database-managed objects with per-project environment variables and extensible metadata. Agents can be granted access to specific projects and switch between them at runtime via `switch_project`. The important part is what happens to the sandbox when a project is active: the agent's file and shell access narrows to just that project directory. The agent home is no longer reachable through agent-facing tools, so a compromised project can't tamper with the agent's identity or memory files. Kernel-internal operations like session mirroring and daily memory logs still write to the agent home since those are system concerns, not agent-initiated. `list_projects` shows what's available, and the system prompt updates dynamically to reflect the active project and alternatives. Full CRUD over the REST API for managing projects and access grants.

## CLI Overhaul

The ratatui-based TUI is gone. All 19,500 lines of it. Most of it didn't work, what did work was unstable, and the time spent maintaining it was better spent improving the actual system. `hive start -d` backgrounds the daemon properly now. `hive login` and `hive logout` are top-level commands instead of buried under `hive config`. `hive dashboard` no longer silently spawns a background daemon. `hive new` became `hive scaffold` because `hive new` was confusing next to `hive agent new`. Bare `hive` shows help instead of launching an interactive menu. There's a global `--json` flag (or `HIVE_JSON=1`) for scripting that outputs compact single-line JSON on any command.

## Agent Communication

`agent_send` was fundamentally broken for local models. The old synchronous RPC design had a 60-second hardcoded deadline, which meant llama.cpp calls taking 2-3 minutes would get killed mid-flight. The new approach tries synchronous first with a 90-second timeout. If the target agent replies in time, you get the response inline. If it times out, it falls back to background dispatch and automatically delivers the result to the calling agent when it's done. The `DispatchRegistry` tracks background dispatch lifecycle with zombie detection at 15 minutes and stale entry eviction at one hour.

Call depth tracking moved from a `tokio::task_local` to an explicit parameter threaded through the context. The task_local was breaking across spawn boundaries, which is exactly the kind of bug that only shows up under real concurrency with multiple agents calling each other.

## Local Inference

Ollama got removed entirely. The provider support was shallow, the model definitions were hardcoded, and the health probe endpoint was non-standard. Local inference users should use vLLM, LM Studio, or llama.cpp instead. Speaking of which, llama.cpp is now a first-class provider using llama-server's OpenAI-compatible API. There's also stable-diffusion.cpp support for local image generation with a fire-and-poll REST API and 20-minute timeouts for large models.

All provider configs now have an explicit `enabled` boolean. Cloud providers default to enabled, local providers default to disabled. Health checks only probe enabled providers, which eliminates the spurious "Local provider offline" warnings that were firing at every startup when you didn't have a local model running.

## Vision and Browser Tools

`browser_screenshot` now returns actual PNG images to the LLM when the model supports vision. The agent loop checks `supports_vision` from the model catalog and injects image content blocks alongside the tool result text. Non-vision models still get text-only metadata. Images are stripped from session history on the next turn to prevent context bloat from accumulating base64 data.

Chrome is gone and I'm not sad about it. The 1,250-line CDP client, the Chromium process launcher, the platform-specific browser discovery code, all of it deleted. The browser backend is now a containerized Playwright Firefox service. I use Firefox daily and I don't think it's safe browsing the internet without a real ad-blocker, especially when agents are doing the browsing. The container routes all traffic through a Squid proxy which gives me tight visibility into exactly what the browser is doing, what it's requesting, and where data is going. `tokio-tungstenite` dropped from `hive-runtime` as a nice bonus.

## Test Harness

This is probably the change that matters most for long-term velocity. There's now a full integration mock test harness that can be instantiated for in-depth feature and system testing. All major components are injectable with different implementations for testing, mocking, and stable persistent tracking. LLM interactions use recorded sessions with consistent ideal and degenerate responses so tests are deterministic and don't burn API credits. The E2E tests use a mock browser HTTP service and mock LLM driver to verify full flows end-to-end. 13 new Rust integration tests cover the auth lifecycle, CSRF, user and API key CRUD, and password changes. 5 Playwright E2E tests cover login through logout and the user management API.

Previously un-awaited `kernel.shutdown()` calls in 17 test functions across 6 files were silently skipping async state persistence. Those all properly await now. The `Drop` impls on `TestServer` that were calling async shutdown from sync context got removed entirely.

## Extended Thinking

Agent and model configs now support independent thinking and response token limits. Per-agent thinking config in the manifest, global config as a fallback, and runtime toggle via `/think` channel command or the REST API. The provider-specific arithmetic is a bit annoying: Anthropic wants `thinking: {type: "enabled", budget_tokens: N}` with a combined `max_tokens` envelope, llama.cpp uses combined `max_completion_tokens` with `-1` for unlimited, and OpenAI reasoning models add the budget to `max_completion_tokens`. The dashboard chat has a thinking toggle button that persists state to the backend.
