---
title: "Security Model"
date: 2026-04-04T12:00:00-04:00
draft: false
url: /projects/hive/security-model/
---

Hive's security model is organized around two principles: defense in depth and risk tracing. Multiple independent enforcement layers mean no single mechanism is trusted to be the whole story. Information flow tracking means you can reason about where data came from, how trusted it is, and where it's allowed to go.

A big part of the security work on Hive has been subtractive. Removing dangerous integrations, code paths, and features from the inherited OpenFang codebase. Fixing error handling that silently swallowed failures. Wiring up mechanisms that existed in code but weren't actually connected. The most reliable way to prevent a dangerous capability from being misused is to not have it in the system.

## Enforcement Layers

Security enforcement in Hive happens at three independent levels that don't depend on each other to function correctly.

At the **application level**, every action an agent takes is gated by typed capabilities declared in its manifest. The capability system supports glob patterns for scoping: `ToolInvoke("file_*")` allows file tools but not shell tools, `NetConnect("*.openai.com:443")` allows connections to OpenAI but nothing else, `MemoryRead("project-alpha")` restricts which memory namespace an agent can see. Capabilities are validated at spawn time and a child agent can never have more capabilities than its parent (enforced by `validate_capability_inheritance()`, not by convention).

At the **kernel level**, Linux BPF programs provide a second enforcement layer that operates independently of Hive's own code. Syscall filters restrict what system calls agent subprocesses can make. Executable restrictions control which binaries can actually run. Per-agent network firewall rules constrain network access. If the application-level checks have a bug or get bypassed, the BPF filters still hold because they're enforced by the Linux kernel itself.

At the **container level**, Podman runs workloads in userspace without a root daemon. Docker's architecture routes every container operation through a daemon running as root, which is a meaningful privilege escalation surface. Podman's rootless model reduces the blast radius if a container escape occurs.

## Data Isolation and Trust Tracking

Capabilities control what agents *can do*. Domain isolation and trust tracking control what they *can see* and where data *can flow*.

Memory namespaces, channel bindings, and knowledge graph scoping create hard boundaries between information domains. An agent handling email can't peek at IRC history. An agent researching a topic can't access personal notes. These boundaries are enforced at the kernel level, not by trusting agents to respect them. Neither domain isolation nor trust tracking existed in the original OpenFang codebase.

Data flowing through the system carries a trust level based on its origin. External network responses, raw user input, and output from untrusted agents all enter the system at a low trust level. As data moves through the pipeline, its trust level reflects the least trusted source that contributed to it. When two pieces of data combine, the result inherits the lower trust level.

Some operations can mechanically increase trust. Parsing structured data, validating against a known schema, or sanitizing content through well-defined transformations produce output that can be tagged with an updated trust level. This isn't automatic promotion. The operation itself has to be one the system recognizes as genuinely reducing risk. A JSON parser that successfully extracts a known field produces more trustworthy output than the raw HTTP response it came from.

Before data reaches a sensitive operation (a "sink"), the system checks whether the data's trust level meets the minimum threshold for that destination. Shell execution requires high trust. Network requests that could carry secrets require high trust. Inter-agent messages have their own thresholds. Violations produce clear errors that identify the data source, its trust level, and why the destination rejected it.

Explicit trust promotion is supported for cases where you've done your own validation. This is a deliberate decision made in code, not something that happens by default.

## Knowledge Representation

The knowledge graph is one of the areas where Hive diverges most from the original OpenFang design and from most agent systems in general.

The common approach to agent knowledge is entity-relation storage with vector similarity search. You embed text chunks, store them in a vector database, and retrieve "similar" results. This works fine for RAG-style document retrieval but it's not reasoning. You can't express that "all employees of company X have access to project Y" or derive that "if A depends on B and B is compromised, then A is at risk." Similarity search finds things that look related. It doesn't draw conclusions.

Hive uses logic models with typed nodes, directed edges, reasoning rules, and custom ontologies. Agents can define domain-specific schemas that describe the entities and relationships meaningful to their work. Inference rules derive new facts from existing ones. Queries use real logical predicates, not proximity matching.

There's a dedicated ontology agent whose job is to assist other agents in building and refining their domain ontologies. When a new agent needs to work in a domain, the ontology agent helps define the entity types, relationship types, and inference rules that make sense for that context. This keeps individual agents focused on their actual work rather than having every agent reinvent knowledge modeling from scratch.

On top of the ontology layer, there's a skill for making deductive leaps. It takes an agent's structured ontology, combines it with external information, and leverages the LLM's ability to bridge inferential gaps. The logic model provides the formal structure, the knowledge graph provides the known facts, and the model brings the reasoning "over the finish line" by making the deductive connections that pure symbolic logic would need more premises for. It's a deliberate hybrid of formal and probabilistic reasoning.

## Authentication and Authorization

The original OpenFang authentication was replaced entirely. The new system is a full username/password authentication layer with mandatory multi-factor authentication. Users create accounts with credentials, enroll MFA, and get assigned custom roles.

The role system maps directly to the same capability model that agents use. Rather than the coarse-grained roles from the original (Viewer, User, Admin, Owner), human operators now get fine-grained capability sets. An operator who manages deployment agents gets the capabilities relevant to that work without automatically getting access to agents handling personal communications or financial data. This means the same permission model governs both human and agent access, which simplifies reasoning about who can do what.

Service accounts allow non-human integrations to authenticate with their own scoped capability sets, keeping automated systems properly bounded.

## Task Coordination

Hive includes a project-based ticketing system that goes well beyond a simple task queue. Projects organize work into boards where tasks flow through swim lanes based on status. The progression is familiar if you've used Linear or similar tools: backlog, in progress, review, done, with customizable states.

What makes it interesting in the context of an agent system is the workflow triggers tied to state transitions. Moving a ticket to "in review" can automatically spawn a QA agent to run against the work. Moving it to "ready for deploy" can trigger a deployment workflow. These transitions are defined per-project and connect the ticketing system directly to the agent orchestration layer.

Agents can search and reference tickets intelligently. When an agent is working on a task, it can pull up the ticket's full history, read comments from other agents and human operators, and understand the context of what's been done. This uses a model similar to the "beads" concept from some other agent frameworks, where individual task references keep agents focused and on-track with or without persistent memory. An agent doesn't need to remember everything about a project if it can always look up the current state of the relevant tickets.

Tickets carry full comment history and change tracking, allowing progressive work across multiple sessions and agents. A development agent can start work on a ticket, leave notes about what was attempted and what's still open, and a different agent (or a human) can pick it up later with full context. Review agents can add their findings as comments. The whole progression is traceable.

References between tickets, git commits, and agent sessions are all captured in the system's audit log. When a commit references a ticket, when an agent session produces work on a ticket, when a ticket's state change triggers a workflow, all of these connections are recorded. This gives you a complete trace from "why was this change made" through "who worked on it" to "what was the outcome."

The tooling, agents, and CLI are all git-aware. Projects defined in the ticketing system connect to git repositories, and work happens in git worktrees scoped to specific tasks. An agent working on ticket #42 gets its own worktree branched from the appropriate base, does its work there, and the results are tied back to the ticket when complete.

## WASM Sandbox

Skills can run in a WASM sandbox powered by Wasmtime with dual metering. Fuel metering counts WASM instructions and catches CPU-intensive computation loops. Epoch interruption uses a watchdog thread with a configurable wall-clock timeout and catches host call blocking that fuel metering misses. Both are necessary because they cover different failure modes. The sandbox also enforces a memory limit and runs with only the capabilities explicitly granted to the skill.

## Filesystem Isolation

Each agent instantiation gets a transparent writable overlay filesystem. The agent sees a normal filesystem rooted at its project directory, but all writes go to a private overlay layer unique to that agent instance. The underlying project files are never modified directly.

This overlay is snapshotable. A QA agent can start in exactly the state a development agent left behind, even if the dev agent failed to commit its work. The snapshot captures the full overlay, including any in-progress changes, temporary files, and build artifacts. This makes handoffs between agents clean and reproducible without depending on git commits as the sole state transfer mechanism.

The overlay also provides natural isolation between concurrent agent instances. Two agents working on the same project in parallel can't step on each other's changes because each has its own overlay layer.

## Audit Trail

Every significant action is recorded in a Merkle hash chain where each entry includes the SHA-256 hash of the previous entry. Modifying or deleting any record breaks the chain. `verify_integrity()` walks the entire history, recomputes every hash, and detects tampering at any point.

The audit trail is also where cross-references between tickets, git commits, and agent sessions are recorded, providing end-to-end traceability for all work in the system.

## Process Hardening

Subprocess spawning clears the environment with `env_clear()` and selectively re-adds only safe variables (PATH, HOME, TMPDIR, LANG, LC_ALL, TERM) to prevent secret leakage to child processes. Commands execute without shell invocation to prevent injection. File operations reject `..` path components and canonicalize paths to resolve symlinks as an additional layer on top of capability checks.

All outbound HTTP requests pass through SSRF validation that blocks private IP ranges, cloud metadata endpoints, and non-HTTP schemes. DNS resolution results are checked against private ranges to defeat rebinding attacks.

## Malicious Behavior Detection

The BPF monitoring system extends beyond simple allow/deny filtering into active detection of suspicious behavior patterns. Combined with a transparent intercepting HTTPS proxy, it forms a per-agent host intrusion detection system (HIDS) that watches for the kinds of things that indicate accidental exposure, supply chain attacks, or deliberate exfiltration attempts.

File access monitoring tracks when processes touch sensitive content in ways that don't match expected usage patterns. A non-SSH client reading an SSH private key, or something other than the AWS CLI accessing AWS credentials, triggers alerts. When sensitive files are accessed, their content can be masked with convincing fake values that the system tracks. If those fake values later appear in the body of an outgoing HTTP or HTTPS request (visible through the intercepting proxy), that's a strong signal that something is trying to exfiltrate credentials. The combination of sensitive file access and network connections from the same process tree is itself a detection signal even before content matching kicks in.

A rule engine evaluates these signals against patterns that cover common attack scenarios: credential harvesting, data exfiltration over HTTP, attempts to establish persistence in userspace, and supply chain compromise patterns where a dependency reaches for files or network destinations it has no business touching.

When the HIDS triggers, it isolates the agent session immediately and captures a snapshot of the agent's overlay filesystem for evidence preservation. The snapshot gives you the full state of the agent's working environment at the moment of detection, including any files it created, modified, or staged. This means you can investigate what happened without worrying about the agent cleaning up after itself, and without the detection event contaminating other running agents.

The result is essentially an intrusion detection system scoped to each individual agent session, acting as an isolating tripwire. If something goes wrong, the blast radius is contained to that one agent instance and you have a frozen copy of the evidence.

## What Was Fixed

A lot of the security work on Hive has been fixing things that were already supposed to be working. The inherited codebase had security mechanisms that were partially implemented or not connected at all. Error handling that silently swallowed failures meant problems were invisible. Logging gaps made it impossible to understand what the system was doing during incidents. There were integrations that appeared functional but weren't, and dangerous code paths with no clear purpose. Removing broken things and fixing quiet failures has been just as important as adding new capabilities.
