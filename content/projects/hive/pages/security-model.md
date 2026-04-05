---
title: "Security Model"
date: 2026-04-04T12:00:00-04:00
draft: false
url: /projects/hive/security-model/
---

Hive's security model is organized around two principles: defense in depth and risk tracing. Multiple independent enforcement layers mean no single mechanism has to be the whole story. Information flow tracking means you can reason about where data came from, how trusted it is, and where it's allowed to go.

## Enforcement Layers

Security enforcement happens at three independent levels.

At the **application level**, every action an agent takes is gated by typed capabilities declared in its manifest. The capability system supports glob patterns for scoping: `ToolInvoke("file_*")` allows file tools but not shell tools, `NetConnect("*.openai.com:443")` allows connections to OpenAI but nothing else, `MemoryRead("project-alpha")` restricts which memory namespace an agent can see. Capabilities are validated at spawn time and a child agent can never have more capabilities than its parent.

At the **kernel level**, Linux eBPF programs provide a second enforcement layer that operates independently of Hive's own code. Syscall filters restrict what system calls agent subprocesses can make. Executable restrictions control which binaries can run. Per-agent network firewall rules constrain network access. If the application-level checks have a bug, the eBPF filters still hold because they're enforced by the kernel itself.

At the **container level**, Podman runs workloads in userspace without a root daemon. This reduces the blast radius if a container escape occurs compared to Docker's architecture where every container operation routes through a daemon running as root.

On systems with SELinux enabled, Hive manages SELinux contexts for agent processes and their workloads as an additional mandatory access control layer. This runs independently of the eBPF filters and application-level capabilities, providing yet another enforcement boundary that doesn't depend on Hive's own code to function correctly.

## Data Isolation and Trust Tracking

Capabilities control what agents *can do*. Domain isolation and trust tracking control what they *can see* and where data *can flow*.

Memory namespaces, channel bindings, and knowledge graph scoping create hard boundaries between information domains. An agent handling email can't peek at IRC history. An agent researching a topic can't access personal notes. These boundaries are enforced at the kernel level, not by trusting agents to respect them.

Data flowing through the system carries a trust level based on its origin. External network responses, raw user input, and output from untrusted agents all enter at a low trust level. As data moves through the pipeline, its trust level reflects the least trusted source that contributed to it. When two pieces of data combine, the result inherits the lower trust level.

Some operations can mechanically increase trust. Parsing structured data, validating against a known schema, or sanitizing content through well-defined transformations produce output that can be tagged with an updated trust level. This isn't automatic promotion. The operation itself has to be one the system recognizes as genuinely reducing risk. A JSON parser that successfully extracts a known field produces more trustworthy output than the raw HTTP response it came from.

Before data reaches a sensitive operation (a "sink"), the system checks whether the data's trust level meets the minimum threshold for that destination. Shell execution requires high trust. Network requests that could carry secrets require high trust. Inter-agent messages have their own thresholds. Violations produce clear errors identifying the data source, its trust level, and why the destination rejected it.

Explicit trust promotion is supported for cases where you've done your own validation. This is a deliberate decision made in code, not something that happens by default.

## Knowledge Representation

Most agent systems use entity-relation storage with vector similarity search for knowledge. You embed text chunks, store them in a vector database, and retrieve "similar" results. This works well for RAG-style document retrieval but it's not reasoning. You can't express that "all employees of company X have access to project Y" or derive that "if A depends on B and B is compromised, then A is at risk."

Hive uses logic models with typed nodes, directed edges, reasoning rules, and custom ontologies. Agents define domain-specific schemas describing the entities and relationships meaningful to their work. Inference rules derive new facts from existing ones. Queries use logical predicates, not proximity matching.

A dedicated ontology agent helps other agents build and refine their domain ontologies. When a new agent needs to work in a domain, the ontology agent helps define the entity types, relationship types, and inference rules that make sense for that context.

On top of the ontology layer, a reasoning skill takes an agent's structured ontology and combines it with external information, using the LLM's ability to bridge inferential gaps that pure symbolic logic would need more premises for. It's a deliberate hybrid of formal and probabilistic reasoning.

## Authentication and Authorization

Human users authenticate through a web interface with username/password and mandatory MFA. CLI tools and service integrations authenticate using short-lived mutual TLS certificates that are automatically renewed. This keeps long-lived secrets out of config files and lets you revoke access instantly by refusing to renew a cert.

The role system maps directly to the same capability model that agents use, so human operators get fine-grained capability sets rather than coarse role tiers. An operator who manages deployment agents gets the capabilities relevant to that work without automatically getting access to agents handling personal communications. The same permission model governs both human and agent access, which simplifies reasoning about who can do what.

## Task Coordination

Hive includes a project-based ticketing system that goes beyond a simple task queue. Projects organize work into boards where tasks flow through swim lanes by status. The progression is familiar if you've used Linear or similar tools: backlog, in progress, review, done, with customizable states.

Workflow triggers tied to state transitions connect the ticketing system to the agent orchestration layer. Moving a ticket to "in review" can spawn a QA agent. Moving it to "ready for deploy" can trigger a deployment workflow. These transitions are defined per-project.

Agents can search and reference tickets intelligently. When an agent is working on a task, it can pull up the ticket's full history, read comments from other agents and human operators, and understand the context of what's been done. This uses a model similar to the "beads" concept from some agent frameworks, where task references keep agents focused and on-track with or without persistent memory.

Tickets carry full comment history and change tracking, allowing progressive work across multiple sessions and agents. A development agent can start work on a ticket, leave notes about what was attempted and what's still open, and a different agent or a human can pick it up later with full context.

The tooling, agents, and CLI are all git-aware. Projects connect to git repositories and work happens in git worktrees scoped to specific tasks. References between tickets, commits, and agent sessions are all captured in the audit log.

## WASM Sandbox

Skills can run in a WASM sandbox powered by Wasmtime with dual metering. Fuel metering counts WASM instructions and catches CPU-intensive computation loops. Epoch interruption uses a watchdog thread with a configurable wall-clock timeout and catches host call blocking that fuel metering misses. Both are necessary because they cover different failure modes. The sandbox also enforces a memory limit and runs with only the capabilities explicitly granted to the skill.

## Filesystem Isolation

Each agent instantiation gets a transparent writable overlay filesystem. The agent sees a normal filesystem rooted at its project directory, but all writes go to a private overlay layer unique to that instance. The underlying project files are never modified directly.

The overlay is snapshotable, making agent handoffs clean and reproducible. A QA agent can start in exactly the state a development agent left behind, even if the dev agent didn't commit their work. The snapshot captures the full overlay including in-progress changes, temporary files, and build artifacts. Two agents working on the same project in parallel can't step on each other's changes because each has its own overlay layer.

## Audit Trail

Every significant action is recorded in a Merkle hash chain where each entry includes the SHA-256 hash of the previous entry. Modifying or deleting any record breaks the chain. `verify_integrity()` walks the entire history, recomputes every hash, and detects tampering at any point.

The audit trail is also where cross-references between tickets, commits, and agent sessions are recorded, providing end-to-end traceability for all work in the system.

## Process Hardening

Subprocess spawning clears the environment with `env_clear()` and selectively re-adds only safe variables (PATH, HOME, TMPDIR, LANG, LC_ALL, TERM) to prevent secret leakage. Commands execute without shell invocation to prevent injection. File operations reject `..` path components and canonicalize paths to resolve symlinks on top of capability checks.

All outbound HTTP requests pass through SSRF validation that blocks private IP ranges, cloud metadata endpoints, and non-HTTP schemes. DNS resolution results are checked against private ranges to defeat rebinding attacks.

## Malicious Behavior Detection

The BPF monitoring system extends beyond allow/deny filtering into active detection of suspicious behavior patterns. Combined with a transparent intercepting HTTPS proxy, it forms a per-agent host intrusion detection system (HIDS).

File access monitoring tracks when processes touch sensitive content in ways that don't match expected usage patterns. A non-SSH client reading an SSH private key, or something other than the AWS CLI accessing AWS credentials, triggers alerts. When sensitive files are accessed, their content can be masked with convincing fake values that the system tracks. If those fake values later appear in outgoing HTTP or HTTPS request bodies (visible through the intercepting proxy), that's a strong signal something is trying to exfiltrate credentials.

A rule engine evaluates these signals against patterns covering common attack scenarios: credential harvesting, data exfiltration over HTTP, persistence attempts, and supply chain compromise patterns where a dependency reaches for files or network destinations it has no business touching.

When the HIDS triggers, it isolates the agent session immediately and captures a snapshot of the agent's overlay filesystem for evidence preservation. The blast radius is contained to that one agent instance and you get a frozen copy of the evidence.
