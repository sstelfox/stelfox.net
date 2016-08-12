---
title: Data Recovery
---

# Data Recovery

## Recovering Data from Swap

Sometimes useful bits of information can be recovered from swap. Whether it's
encryption keys, documents that were being worked on or anything else that
might've ended up in RAM. To search through the swap for interesting bits (and
depending on the size this might take a while) you can execute the following
command as root or sudo to do it:

```
[root@localhost ~]# strings `/bin/swapon -s | tail -1 | awk '{print $1}'` | less
```

The command above uses the swapon utility to list all of the swap devices in
use; look at the last line of the output (most people only have one swap
device); extract only the path to the device node. Run the strings utility
(which prints only printable strings of text from whatever you run through it)
on the swap device. Break the output down by pages.

A lot of the output will look like junk, but if you're patient some interesting
things can pop out at you.

