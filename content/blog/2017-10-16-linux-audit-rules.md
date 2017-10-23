---
date: 2017-10-16 23:20:20-04:00
tags:
- linux
- tips
title: Linux Audit Rule Paths
---

I encountered a little bit of confusion while rewriting my [auditd rules][1]
which some Googling did not help me solve.

When monitoring a file or directory there are two forms the rules can take.
They are effectively equivalent in their functionality. The simpler form is the
following format:

```
-w /etc/shadow -p wa
-w /boot -p wa
-w /etc/dont_readme -p r
```

These three rules are all behaving slightly differently. The first will audit
any writes or attribute changes to the shadow file. The second, being a
directory, will be recursively watched for writes and attribute changes
(including the directory itself). The last line will create an audit record
whenever the file is read.

The second form is more consistent with the syscall rule types but more
verbose. Examples are given in the man page for converting between the two
forms. Before I show you an example of those rules, this is the part of the man
page that ultimately confused me:

> If you place a watch on a file, its the same as using the -F path option on a
> syscall rule.

Simple enough, this is what the first line of the first example would look like
in this style:

```
-a always,exit -F path=/etc/shadow -F perm=wa
```

Before changing my rules over to this form I checked a couple to ensure they
were behaving correctly then migrated the rest. After applying the new rules I
found quite a few audit records I'd expect missing. If I had kept reading (the
next line from the last man page) I would have found this:

> If you place a watch on a directory, its the same as using the -F dir option
> on a syscall rule.

So the correct way to represent the second line in the first example would be
like this:

```
-a always,exit -F dir=/boot -F perm=wa
```

The long and short of it, is that the watch flag (`-w`) has different behaviors
depending on what it is pointing at. Having only read the first sentence, I
assumed the `path=` argument would behave the same as a watch. Attempts to
Google whether or not `path=` was recursive didn't turn up anything. Now that
I've read the man page while writing up this point it is very clearly stated
that it is not.

If anyone else comes across this, `path=` is not recursive, `dir=` is. Be
careful when translating your rules.

[1]: {{< relref "notes/auditd.md" >}}
