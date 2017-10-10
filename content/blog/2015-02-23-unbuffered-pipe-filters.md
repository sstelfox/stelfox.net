---
date: 2015-02-23 12:49:13 -0500
slug: unbuffered-pipe-filters
tags:
- linux
- tips
title: Unbuffered Pipe Filters
---

I need to filter a live logstream for only relevant events and quickly hit an
issue that I wasn't expecting. The `grep` in my pipe chain was waiting until it
received all the output from the prior command before it began to attempt to
filter it.

Reading through the grep man page I came across the `--line-buffered` flag
which provides exactly what I needed. I wasn't using the `tail` command but it
serves really well in this situation to demonstrate the use:

```
tail -f /var/log/maillog | grep --line-buffered -i error
```

Hope this saves someone a headache in the future!
