---
created_at: 2023-04-13T20:51:02-0400
public: true
evergreen: false
tags:
  - rust
  - programming
  - tracing
slug: chained-tracing-subscribers
title: Combining "Subscribers" in Rust's Tracing Library
---

# Combining "Subscribers" in Rust's Tracing Library

Tracing is a fantastic Rust library that I've found immensely useful. At first glance, the distinctions and roles of Subscribers, Layers, Filters, and Writers seem clear and well-documented. But when dealing with less common use cases, understanding their interactions and handling trait-based errors can become challenging.

Based off the nomenclature alone I would guess multiple "Subscribers" would be needed for outputting the same events to different outputs for the various events being traced. The names are unfortunately a bit misleading. What are actually needed are "Layers". The documentation does mention this in the Layers section, but you kind of need to know that's what you're after in the first place to find it. Filters and Writers, on the other hand, are more straightforward. But I kept running into confusion in StackOverflow posts and example code from closed issues. These sources often refer to an outdated API, with filters chained onto builders, creating a tangled mess and leaving me wondering which subscriber has what filter and which output they'll be writing to.

In my experience, I usually run into this issue when I want to combine tokio-console with an existing subscriber for temporary diagnostics. My go-to workaround has been to simply swap them out, perform the diagnostics, and then swap the production one back in. However, I recently took the time to explore a better solution in a personal project. Now, this is my default tracing configuration:

```rust
use std::time::Duration;

use console_subscriber::ConsoleLayer;
use tracing::Level;
use tracing_subscriber::{EnvFilter, Layer};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

#[tokio::main]
async fn main() {
    let console_layer = ConsoleLayer::builder()
        .retention(Duration::from_secs(30))
        .spawn();

    let (non_blocking_writer, _guard) = tracing_appender::non_blocking(std::io::stderr());
    let env_filter = EnvFilter::builder()
        .with_default_directive(Level::INFO.into())
        .from_env_lossy();
    let stderr_layer = tracing_subscriber::fmt::layer()
        .compact()
        .with_writer(non_blocking_writer)
        .with_filter(env_filter);

    tracing_subscriber::registry()
        .with(console_layer)
        .with(stderr_layer)
        .init();

    tracing::info!("sample program starting up");
}
```

The dependency section in my `Cargo.toml` file looks like:

```toml
[dependencies]
console-subscriber = "^0.1"
tokio = "^1"
tracing = "^0.1"
tracing-appender = "^0.2"
tracing-subscriber = "^0.3"
```

I hope this configuration helps you in your Rust adventures! Happy coding!
