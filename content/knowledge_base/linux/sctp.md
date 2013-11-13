---
title: SCTP
---

Looks like F17 & F18 don't support SCTP out of the box. You can however get it
through an extra packages like so:

```
yum install kernel-modules-extra -y
modprobe sctp
```

The module doesn't seem to load automatically on boot.

