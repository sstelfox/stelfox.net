---
title: Arch Linux
type: note
---

# Arch Linux

## Updating

Update all the things:

```
pacman -Syu
```

## Pacman

### Package Signature Verification

First we need to initialize the key database:

```
pacman-key --init
```

Ensure package signatures are enabled for all repositories by editing
`/etc/pacman.conf`. In the general options make sure the following option is
set.

```
SigLevel = Required DatabaseOptional
```

