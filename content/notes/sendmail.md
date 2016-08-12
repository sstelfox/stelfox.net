---
title: Sendmail
---

# Sendmail

Consider [Postfix][1] instead. It was written with security in mind.

* http://www.sendmail.com/sm/open_source/docs/m4/tweaking_config.html
* http://www.bga.org/~lessem/psyc5112/usail/mail/configuration/
* http://etutorials.org/Linux+systems/red+hat+linux+bible+fedora+enterprise+edition/Part+IV+Red+Hat+Linux+Network+and+Server+Setup/Chapter+19+Setting+Up+a+Mail+Server/Configuring+sendmail/
* http://www.fredshack.com/docs/sendmail.html

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

[1]: ../postfix/

