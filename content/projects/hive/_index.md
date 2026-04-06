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

Hive grew out of a lot of time spent experimenting with agent systems. I built several harnesses in Rust and Python, tried most of the popular frameworks, ran models from all the major providers and plenty of open ones, and collected a bunch of notes on where things tend to break down. These systems all have some common components, and knowing how those are constructed, what works and what doesn't makes me a better engineer. I also haven't quite liked any of the systems I've come across as they are either too narrow or frankly sketchy.

<!--more-->

The agent ecosystem right now is mostly focused on making it easy to get something running quickly, consequences be damned. That's fine for MVPs working with low-quality data, but when you want these systems to have agency over important parts of your life you end up with situations like OpenClaw and the attacks on regular users that came out of it. Security in most frameworks, even the ones that claim it as a focus, isn't backed by real threat modeling or pipeline evaluation. Frequently it's a thin set of checkbox controls that may or may not be wired in, built without an understanding of what that security layer is actually supposed to protect against.

Hive started out as a fork from [OpenFang](https://www.openfang.sh/), which in hindsight wasn't the foundation but it _sounded good_ (classic mistake on my part). After spending some time cleaning up one of the crate it became a modern challenge in its own right. What does it take to bring an entirely and poorly curated code base up to a decent operational standard? Welcome to the second objective of Hive. At the time of writing this post I'm sitting at 662 files changed, 67,557 insertions, and 103,013 deletions against what I forked Hive from. There isn't a single file left that contains more than 12% of its original content (and that's a file just containing types for other crates). Let's talk about high-level changes and a quick run-down of the efforts I've put in so far. As I bring in evaluate and expand on the functionality I'll put out more targeted project logs and blog posts as I go.

## Code Quality and Test Efficacy

When I've used language models to handle programming, especially on larger code bases, there are a couple of things that I've repetitively noticed and are a sign to me there isn't a driver in the seat:

- **Massive functions and files:** Whether you're a human or agent, sprawling functions and files are hard to reason about. God structs were all over the place, with the central coordinator struct have over 50 fields, with several functions whose length was measured in the _thousands_ of lines and _dozens_ of parameters. There were zero-tests over these large functions, and many of the tests present were trivial non-behavior tests such as ensuring that the default values match what they were set to. Zero dependency-injection, very little test coverage over behavior, or complex functions.
- **Disconnected functionality:** There were several layers of marketed security features that were simply not wired up.
- **No authentication:** This is only partially true, there was a partially implemented authentication mechanism but it wasn't reliably hooked up, was very basic and more or less came down to a single static API key.
- **Silently discarded results:** This isn't just discarding errors, there is a weird thing
- **Redundant Code:** There were so many different versions of truncate with or without UTF-8 support, pure functions being called without using the result, and errors that were silently being discarded.
- **Lack of Tests:** The code base had nearly 1,400 tests when I got to it. After manually reviewing all of them ~400 actually tested behavior and most of them were over pure functions or API handlers without covering _most_ of the system itself.

A lot of the code I've added in has been adding support for dependency injection in all of the pieces allowing them to be tested in isolation outside the rest of the system. This includes recorded LLM sessions that can be used for deterministic system testing directly.

## LLM Providers & Integrations

This project suffers from a marketing check-box problem. It seems it was adding every possible LLM provider, start-up, or social interaction mechanism that anyone could ever one primarily as a marketing gimmick. If you are planning on selling or marketing your project or want wide-spread support this can be good, but all of the integrations were using varying quality and some of them are frankly neither trustworthy, safe, or sane to actually use.

The various integrations and providers had different inconsistent levels of support so all of the dangerous, broken, or the ones I couldn't ever see myself actually trying all got the cut. This probably made up a good 12k lines of removed heavily redundant code.

## Memory and Knowledge Systems

While the original project had some level of capability restrictions and namespacing on agents, there was really any form of data provenance or trust tracing but not many projects are actually thinking that deeply about that data tracing. There was a form of knowledge graph system but it wasn't wired up very well and used the current fad short-cut of basically re-using embeddings and linking content semantically rather than building up an ontology and structured system that can actually support reasoning.

Information, results, and memories carry provenance and trust levels. Agents are scoped to their own domains and boundaries are enforced structurally rather than by hoping the model behaves. Taint tracking and domain isolation aren't new ideas.

Hive's knowledge system is founded on strict typed ontologies with inference rules and composable domain-specific or agent-specific schemas. It's a pretty big departure from semantic embedding associations and more of a return to classical ML roots. On the coordination side, a shared ticketing system lets agents and humans hand off work, track progress across sessions, and tie everything back to git history and an auditable event chain.

## Browser Support

I'm not quite sure why the original project took this direction, but they integrated the Chrome developer protocol (CDP) directly rather than using something like playwright (and even call out not using playwright as a feature). I'm not a Chrome user, and I do like Firefox. More power to a custom implementation here but I want my agents testing and using my daily driver Firefox, and a good chunk of that is for security. I don't think its safe browsing the internet myself without a meaningful ad-blocker, there are just too many ways to spread malware that way and with agents I DEFINITELY don't want them exposed to random ads.

I've cut out and replaced CDP with a connection to a remote headless playwright firefox container running some extensions and going through an intercepting HTTP(S) proxy which logs and filters the traffic similar to corporate proxies.

## Command and Process Filtering

This is one of the common pet-peeves I have coming from a security background. All of the agent harness I've seen out in the wild check the _direct_ command being executed such as `bash`, `sed`, `awk` or `python`, or `grep`. This is a surface level filtering that is trivial for LLMs to work around and you can see harnesses like claude code almost immediately work around some of these filters by executing commands indirectly or writing a custom python utility that accesses something they wouldn't otherwise have access to.

There is a solution beyond "run it in a container" that is much more lightweight and reliably, eBPF call filtering. As a bonus you're not limited to just commands, any child process can be filtered for all of its syscalls whether its a network, command, file read or write, you can be incredibly fine-grained about what your child permissions are able to do. There is an abuse pattern layer added in that is specifically looking for _any_ malicious behavior in child processes such as non-system ssh clients attempting to access SSH keys. This layer is basically a host-intrusion detection system but only running on processes executed from Hive.

Hive applies all of these to its child processes directly, ensuring that blocked commands can't simply be worked around and files outside the workspace can't be changed indirectly. These techniques have decades of literature behind them. I suspect a lot of the people building agent systems simply haven't worked with these primitives before.

## Containerization & Communication Filtering

Much like many others, this uses docker for containerization. That's basically the only game in town if you're on Mac (which is really just running a massive Linux VM behind the scenes) or Windows. If you only need to support Linux systems for hosting the processes `podman` allows you to drop the daemon running as root and fully isolate purely in userspace. As a bonus I can be even more strict with my system using SELinux contexts as an additional safety mechanism.

I've extended this mechanism to allow not just remote chats, but local tool call execution with per-client filters and configs. This also required a network proxy to allow the browser automation to interact with a locally running web-server. These proxied requests are _also_ filtered both locally and remotely to ensure only intentionally exposed services are accessible and the results of calls are run through the same series of filters and checks as all external content to attempt to catch command injections coming from the outside world.

## Remote Usage

There was the beginning of a peer-to-peer protocol built into the original code-base. I'm not sure what the intended use there was but it immediately got the cut. It may have been legitimately trying to solve a problem I kept encountering with different agent harnesses. I don't always want to run the agents where all my services are configured and running. I want from my desktop or laptop to be able to run the CLI just like I do with claude code. Have it operate on my local filesystem with the central configuration, coordination leaving the LLM, calls, and workflow mechanisms at the server.

## Conclusion

The core systems are functional and I'm using Hive daily. I plan to open-source it once the codebase is in a state I'm happy with. I've written up an [architecture reference](/projects/hive/architecture/) for the technical breakdown and documented the [security model](/projects/hive/security-model/) covering the different enforcement layers. I'll probably post some blogs on the more general gaps and patterns I've seen, and I'll keep updating this project's development log as I go.
