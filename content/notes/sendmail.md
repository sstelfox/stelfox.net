---
title: Sendmail
weight: 22

taxonomies:
  tags:
  - linux

extra:
  done: true
  outdated: true
---

Consider [Postfix][1] instead. It was written with security in mind.

* [Configuring Sendmail](https://etutorials.org/Linux+systems/red+hat+linux+bible+fedora+enterprise+edition/Part+IV+Red+Hat+Linux+Network+and+Server+Setup/Chapter+19+Setting+Up+a+Mail+Server/Configuring+sendmail/)
* [Quick & Dirty Guide to Sendmail](http://www.fredshack.com/docs/sendmail.html)

## Installation

```
yum install sendmail -y
```

## Configure

Any configuration changes need to be `re-compiled` by the m4 processor. This is
available in the `sendmail-cf` package which can be install using the following
command:

```
yum install sendmail-cf -y
```

[1]: @/notes/postfix.md
