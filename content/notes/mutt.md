---
title: Mutt
weight: 33

taxonomies:
  tags:
  - cli
  - linux

extra:
  done: true
---

I keep a copy of my mutt config both [here on the site][1] as well as in my
[public dotfiles][2]. Eventually I'll likely document my reasoning, preferences
and the tradeoffs made in that config (and change my mind on most in the
process).

## Vim

Since I use vim as my editor I also added the following line to my vim
configuration file to autowrap my lines at 72 characters, but only for mutt
composed messsages.

```
au BufRead /tmp/mutt-* set tw=72
```

[1]: muttrc
[2]: https://github.com/sstelfox/dotfiles
