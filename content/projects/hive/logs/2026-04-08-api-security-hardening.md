---
title: "API Security Hardening"
date: 2026-04-08T16:09:31-04:00
draft: false
tags: [security, rust, api, authentication]
url: /projects/hive/logs/api-security-hardening/
---

This security pass wouldn't have been possible without first cleaning up the pedantic lint issues and expanding test coverage. Auth was optional, password hashing was SHA-256, and the GCRA rate limiter had a bug where it never actually rejected requests, this one I stumbled upon by accident while writing end-to-end tests. The nested `Result<Result<_, NegativeOutcome>, InsufficientCapacity>` return was only being checked at the outer level so every request that should have been limited was getting waved through. Not ideal.

Auth is mandatory now but the first-time user experience isn't great. You get a 503 on everything until you use `hive security set-password` on the server side to manually create a user. Query parameter tokens were previously being used and have since entirely been removed. Putting credentials in query params is a very easy way to get live credentials in logs, referrer headers, and browser history. Password hashing moved to Argon2id, SHA-256 is not acceptable for user credentials. There's now a real user system backed by the database with per-user API keys (`hive_` prefixed so they're easy to spot if they leak). CLI persistent authentication similar to other tools like the AWS CLI, and first class support for remote servers both in the config and via a `--host` flag.

Session cookies now require a CSRF token on mutating requests. Logout actually revokes the session instead of just clearing the cookie. Security headers are set properly (HSTS, CSP, CORP, Permissions-Policy, the usual list). CORS is locked to explicit method and header allow-lists instead of `tower_http::cors::Any`. Public endpoints went from around 40 to about 10, so the dashboard has to authenticate before it can read anything. Added a 2MB body size limit and 120-second request timeout for non-streaming endpoints.

Brought in and configured Playwright for end-to-end testing of the web interface and confirming that the various security features are working (auth enforcement, CSRF, rate limiting, body limits, and session revocation). Went with headless Firefox intentionally, it's my daily driver. I set up mocked LLM backends for the end-to-end testing but haven't really wired that up or used it yet, I don't really want to bother writing a lot of tests against the front-end when it's going to get a wholesale replacement once I'm happy with the backend and CLI. Workspace lints moved into `Cargo.toml` rather than just CI flags, and can now enforce `unsafe_code = "deny"` across all crates.

Tightening things up, starting to feel good about being able to actually run an instance exposed to the internet but it's not quite there yet.
