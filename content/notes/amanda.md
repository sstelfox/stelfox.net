---
date: 2017-10-09T14:50:23+0000
tags:
- backups
- linux
title: Amanda
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

* http://arstechnica.com/civis/viewtopic.php?t=1206963
* http://www.tandbergdata.com/knowledge-base/index.cfm/are-there-any-guidelines-for-cleaning-the-lto-tape-drive/

## Encryption

* http://linux.die.net/man/8/amcheck
* https://wiki.zmanda.com/index.php/How_To:Set_up_data_encryption
* https://serverfault.com/questions/68487/tape-encryption-management-best-practices
