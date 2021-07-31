---
title: Amanda
weight: 15

taxonomies:
  tags:
  - backups
  - linux

extra:
  done: true
---

Amanda, or the Advanced Maryland Automatic Network Disk Archiver is an open
source computer archiving tool that is able to back up data residing on
multiple computers on a network.

I am not a huge fan of having xinetd or perl on my system and this is reliant
on both, however, there does not currently seem to be any reasonable open
source alternatives that support managing a tape library.

My notes on setting this up were incomplete and woefully outdated so I removed
them. I have included a couple of references to sources of specific information
I either do or did find useful:

## Cleaning a Tape Library

> Any LTO cleaning tape may be used in any LTO drive

* [Tape Drives - How often do yours need cleaning?](https://arstechnica.com/civis/viewtopic.php?t=1206963)
* [Guidelines for Cleaning LTO Tape Drives](https://www.tandbergdata.com/knowledge-base/index.cfm/are-there-any-guidelines-for-cleaning-the-lto-tape-drive/)

## Encryption

* [amcheck manpage](https://linux.die.net/man/8/amcheck)
* [How To:Set up data encryption](https://wiki.zmanda.com/index.php/How_To:Set_up_data_encryption)
* [Tape encryption management & best practices](https://serverfault.com/questions/68487/tape-encryption-management-best-practices)
