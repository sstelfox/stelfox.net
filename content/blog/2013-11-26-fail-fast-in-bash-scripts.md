---
title: 'Fail Fast in Bash Scripts'
created_at: 2013-11-26 15:19:40 -0500
updated_at: 2013-11-26 15:19:40 -0500
kind: article
type: post
layout: blog_post
tags:
- cli
- bash
---

I found myself writing another bash script that should exit should any of the
few commands within it fail to run. As I began writing some error handling
after each command, and isolating the sections into bash functions I figured
there had to be a better way. After a little Googling and a trip through the
bash manpages sure enough:

```
#!/bin/bash

function error_handler() {
  echo "Error occurred in script at line: ${1}."
  echo "Line exited with status: ${2}"
}

trap 'error_handler ${LINENO} $?' ERR

set -o errexit
set -o errtrace
set -o nounset

echo "Everything is running fine..."

# A command outside of a conditional that will always return a exit code of 1
test 1 -eq 0

echo "This will never run, as a command has failed"
echo "Using unset variable ${TEST} will also cause this script to exit"
```

The first piece of that is setting up an error handler that will get run
whenever an error condition occurs with the script. You can use this section to
roll back any changes or cleanup your environment as well as give you some
debug information about the failure.

I'm then setting a few bash options, The following is a description taken more
or less directly from the bash man pages:

> -o errexit: Exit immediately if a pipeline (which may consist of a single
> simple command), a subshell command enclosed in parentheses, or one of the
> commands executed as part of a command list enclosed by braces exits with a
> non-zero status.
>
> -o errtrace: If set, any trap on ERR is inherited by shell functions, command
> substitutions, and commands execute in a subshell environment.
>
> -o nounset: Treat unset variables and parameters other than the special
> parameters "@" and "*" as an error when performing parameter expansion.

If anything goes wrong in the script it will fail once, fail fast, and let you
know where it died.

