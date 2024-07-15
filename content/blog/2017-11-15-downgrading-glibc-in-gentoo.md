---
created_at: 2017-11-15T12:27:45-0000
evergreen: true
public: true
tags:
  - linux
  - gentoo
  - tips
slug: downgrading-glibc-in-gentoo
title: Downgrading Glibc in Gentoo
---

# Downgrading Glibc in Gentoo

While refining some automated setup scripts at some point I upgraded to a testing/unstable version of glibc. When I attempted to get the box back on to the stable version I hit a solid protection mechanism built into the portage scripts that prevents downgrading glibc. Attempts will give you the following error message:

```console
 * Sanity check to keep you from breaking your system:
 *  Downgrading glibc is not supported and a sure way to destruction
 * ERROR: sys-libs/glibc-2.25-r9::gentoo failed (pretend phase):
 *   aborting to save your system
```

It is correct in that this is a very dangerous thing to do. For my use case this was a non-production system that I was using to test various configurations and hardening procedures so didn't particularly care if the packages all became corrupt. I was also confident that my method would be relatively safe (fully bootstrapping the system).

To disable this check (you should seriously understand what you're doing and/or not care about the system you perform this on if you continue) you need to edit the appropriate eclass file which exists at "/usr/portage/eclass/toolchain-glibc.eclass". Locate the following line and disable it by prefixing it with a hash sign (#).

```console
die "aborting to save your system"
```

For the version I was editing it was line 507.

To do this downgrade safely I performed the following steps (this will take a while as it fully bootstraps your system):

* Review all use flags and accept keywords to ensure you'll be in the state you want to
* Sync the repository metadata ("emerge --sync")
* Disable the glibc safety check documented above
* Run the following commands to re-bootstrap the system and undo the safety check modification by re-syncing:

```console
$ /usr/portage/scripts/bootstrap.sh
$ emerge --emptytree --with-bdeps=y @world
$ emerge --depclean
$ emerge --sync
```

Reboot to ensure all running programs are on the correct versions and the system should be back in a happy state.
