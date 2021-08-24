---
title: Introduction to nix-shell
date: 2021-08-23T21:49:10-04:00

description: |-
  A quick introduction to the nix-shell, what it brings to the table, and a
  cheat sheet of commands I found useful.

taxonomies:
  tags:
  - linux
---

Searching for available packages:

```
nix-env -qa 'risc.*'
```

Install a new package:

```
nix-env -i firefox
```

Uninstall a pacakge:

```
nix-env -e firefox
```

Update an individual package:

```
nix-env -u firefox
```

Update all packages:

```
nix-env -u
```

Do a dry run of an upgrade operation:

```
nix-env -u --dry-run
```

List known profiles:

```
ls -l /nix/var/nix/profiles/
```

Switch to a different profile:

```
nix-env --switch-profile /nix/var/nix/profiles/my-profile
```

Rollback the last change to the current profile:

```
nix-env --rollback
```

List generations for the current profile:

```
nix-env --list-generations
```

Switch to a specific generation:

```
nix-env --switch-generation 43
```

Delete old generation versions (anything not the current generation):

```
nix-env --delete-generations old
```

Delete generations older than a certain age (14 days here):

```
nix-env --delete-generations 14d
```

Run the garbage collector to pickup dangling bits after cleaning up
generations:

```
nix-store --gc
```
