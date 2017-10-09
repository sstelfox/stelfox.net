---
title: Session Recording
---

# Session Recording

## Bash Builtins

The script utility which I've found in Fedora as a default package (or it's a
bash builtin). You can record a session and the timing data about it exit and
then view it like an in console video.

Record a session with it's timing data...

```
[user@host ~]$ script -t 2> example.timing -a example.session
Script started, file is example.session
[user@host ~]$ # DO STUFF
[user@host ~]$ exit
Script done, file is example.session
```

And replay it later:

```
[user@host ~]$ scriptreplay example.timing example.session
```

