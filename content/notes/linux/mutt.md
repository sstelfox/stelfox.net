---
date: 2017-10-20 12:51:00-04:00
tags:
- cli
- email
- linux
title: Mutt
aliases:
  - /notes/mutt/
---

I keep a copy of my mutt config [here on the site][1].

## Vim

Since I use vim as my editor I also added the following line to my vim
configuration file to autowrap my lines at 72 characters, but only for mutt
composed messsages.

```
au BufRead /tmp/mutt-* set tw=72
```

[1]: /note_files/mutt/muttrc
