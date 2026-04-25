---
title: "The Postgres Migration"
date: 2026-04-24T12:00:00-04:00
draft: false
tags: [rust, security, architecture]
url: /projects/hive/logs/the-postgres-migration/
---

Another big structural for Hive. 723 files changed, 90,471 insertions, 132,463 deletions against upstream main at the fork point. SQLite is gone. PostgreSQL with pgvector is the only storage backend now. No migration path as this still isn't a real code base. The previous setup had `Arc<Mutex<Connection>>` contention, `spawn_blocking` wrappers everywhere because rusqlite isn't async, and client-side cosine similarity computation that should have been happening in the database all along.

<!--more-->

The new setup uses a dual connection pool architecture with separate writer and reader pools mapped to distinct database roles. Writers can INSERT/UPDATE/DELETE, readers can only SELECT, and migrations run under a third admin role with DDL privileges. Vector similarity now uses pgvector's `<=>` cosine distance operator server-side, which let me delete the client-side similarity math entirely and it is a significant improvement over the code that was already present.

Setting up a fresh instance is straightforward. `just pg-start` spins up a Podman container with PostgreSQL, pgvector, and PostGIS (setting up for future plans). `hive db setup` can bootstrap the roles and database from scratch. `hive db migrate` applies the schema. There's a `just dev-db` recipe that chains all of this together for local development.

## Naming Things

Terminology got cleaned up across the board. "Workspace" became "agent home" because every tool in the ecosystem already uses "workspace" to mean something else and the collisions were impacting agent performance. The agent home is the agent's personal directory for identity files, memory, sessions, and skills. Config field is `agent_homes_dir`, default path is `~/.hive/agent_homes/`. I personally _hate_ the term "hands" for sub-agents that seems to becoming the officially recognized term. I don't have a better general name but at least in this codebase they're "drones", which at least fits the hive theme.

## Auth Got Real

Auth was already mandatory after the last security pass but the backing store was still still a static account in a config file. Now users live in the database with Argon2id password hashes. Per-user API keys replace the old global shared key. The login endpoint does timing-safe dummy hash verification to prevent username enumeration. Not likely to actually be a problem but it was a trivial extra protection and I've been mired in the compliance world so I checked the box.

The server-side content and code are served based on your auth status instead of the client-side `checkAuth()` dance and a setup page when no users exist. `hive security create-user`, `create-api-key`, `list-users`, `delete-user`, and `change-password` cover the full lifecycle from the CLI for server side management before being setup (and can be used as an administrative back door still so you still need to be careful exposing this tool to your agents when they're running on the same system).

## Kernel Sandboxing

Agent subprocesses are now sandboxed at the kernel level using seccomp-bpf and Landlock LSM. It's applied in `pre_exec` between fork and exec so no privileges are required. Seccomp blocks dangerous syscalls like `ptrace`, `mount`, `bpf`, `kexec`, and `unshare` with configurable profiles (Default, Strict, Permissive). Landlock confines filesystem access to the workspace plus system read paths and enforces noexec. On kernel 6.7+ it can also restrict TCP connect and bind ports.

This is the kind of security boundary I was talking about in the first post. Not command-level filtering that any model can work around, but syscall-level enforcement that applies to every child process regardless of how it was spawned. The `sandbox` cargo feature is enabled by default. The `auto` mode degrades gracefully if the kernel doesn't support the required features.

## Projects

Projects are a new first-class concept. They're database-managed objects with per-project environment variables and extensible metadata. Agents can be granted access to specific projects and switch between them at runtime via `switch_project`. The important part is what happens to the sandbox when a project is active: the agent's file and shell access narrows to just that project directory. The agent home is no longer reachable except through the specialized agent tools, so a compromised project can't tamper with the agent's identity or memory files directly. The memory boundary will be getting detection filters for potentially dangerous memories and this forces all those changes through that path. Kernel-internal operations like session mirroring and daily memory logs still write to the agent home since those are system concerns, not agent-initiated. `list_projects` shows what's available, and the system prompt updates dynamically to reflect the active project and alternatives.

## CLI Overhaul

The ratatui-based TUI is gone. All 19,500 lines of it. Most of it didn't work, what did work was unstable, and ultimately it was just a glorified config system with a bad chat interface. `hive start -d` backgrounds the daemon properly now. `hive login` and `hive logout` are top-level commands instead of buried under `hive config`. `hive dashboard` no longer silently spawns a background daemon. `hive new` became `hive scaffold` for clarity. Bare `hive` shows help instead of launching an interactive menu. There's a global `--json` flag (or `HIVE_JSON=1`) for scripting that outputs compact single-line JSON on any command. Never underestimate json output from a CLI tool when paired with `jq`, it is so much easier to work with than trying to scrape random text output.

## Agent Communication

`agent_send` was fundamentally broken. The old synchronous RPC design had a 60-second hardcoded deadline, any longer session would get killed mid-flight and it is designed to call into agents that will be doing multi-session turns on their own, potentially even calling to other agents. The new approach tries synchronous first with a 90-second timeout (still allowing agents to directly "background" the task). If the target agent replies in time, the agent gets the response inline like any other tool call. If it times out, it falls back to background dispatch and informs the calling agent of the background status along with an ID for the job. Eventually when it completes, the target agent will open a private session with the original with context about the original calling context and the result allowing an agent like the assistant to decide how to handle the response without user involvement. The `DispatchRegistry` tracks background dispatch lifecycle with zombie detection at 15 minutes and stale entry eviction at one hour.

This necessitated a change to the call depth tracking moved from a `tokio::task_local` to an explicit parameter threaded through the context. The task_local was breaking across spawn boundaries, which is exactly the kind of bug that only shows up under real concurrency with multiple agents calling each other.

## Local Inference

Ollama got removed entirely, it's a bad project and people really shouldn't be using it. Convenient sure, but bad maintainers that don't announce that most of their platform is just llama.cpp with a bad frontend and bad registry. Local inference users should use vLLM, LM Studio, or llama.cpp directly instead. llama.cpp is now a first-class provider using llama-server's OpenAI-compatible API. BIG change was also adding in support for stable-diffusion API (the example server in that project) for local image generation with a fire-and-poll REST API and 20-minute timeouts for large models if they're running CPU only.

All provider configs, local and not, now have an explicit `enabled` boolean. They used to attempt to infer whether they were configured or not but a lot of the local providers came with default configurations. This largely showed up in the bad health checks reporting spurious "Local provider offline" warnings for everything with a default config.

## Vision and Browser Tools

`browser_screenshot` now returns actual images to the LLM when the model supports vision. The agent loop checks `supports_vision` from the model catalog and injects image content blocks alongside the tool result text. Non-vision models still get text-only metadata. Images are stripped from session history on the next turn to prevent context bloat from accumulating base64 data.

Chrome is gone and I'm not sad about it. The 1,250-line CDP client, the Chromium process launcher, the platform-specific browser discovery code, all of it deleted. The browser backend is now a containerized Playwright Firefox service. I use Firefox daily and I don't think it's safe browsing the internet without a real ad-blocker, especially when agents are doing the browsing. The container routes all traffic through a filtering Squid proxy for now as the seccomp domain and IP filters can't apply to the browser directly, and provides another layer to record, detect, and protect against dangerous data and diagnostics. As a nice bonus that allowed dropping another dependency from the code base `tokio-tungstenite`.

## Test Harness

This is probably the change that matters most for long-term velocity. There's now a full integration mock test harness that can be instantiated for in-depth feature and system testing. All major components are injectable with different implementations for testing, mocking, and stable persistent tracking. LLM interactions use recorded sessions with consistent ideal and degenerate responses so tests are deterministic and don't burn API credits. The E2E tests use a mock browser HTTP service and mock LLM driver to verify full flows end-to-end. Not many significant tests yet, only 13 new Rust integration tests mostly over the auth lifecycle, CSRF, user and API key CRUD, and password changes. There are also 5 Playwright E2E tests cover login through logout and the user management API.

Previously un-awaited `kernel.shutdown()` calls in 17 test functions across 6 files were silently skipping async state persistence. Those all properly await now. The `Drop` impls on `TestServer` that were calling async shutdown from sync context got removed entirely.

## Extended Thinking

Agent and model configs now support independent thinking and response token limits. Per-agent thinking config in the manifest, global config as a fallback, and runtime toggle via `/think` channel command or the REST API. The provider-specific arithmetic is a bit annoying: Anthropic wants `thinking: {type: "enabled", budget_tokens: N}` with a combined `max_tokens` envelope, llama.cpp uses combined `max_completion_tokens` with `-1` for unlimited, and OpenAI reasoning models add the budget to `max_completion_tokens`. The dashboard chat has a thinking toggle button that persists state to the backend.
