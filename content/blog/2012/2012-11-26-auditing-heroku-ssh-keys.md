---
title: Auditing Heroku SSH Keys
date: 2012-11-26T10:18:00-05:00

aliases:
  - /blog/2012/11/auditing-heroku-ssh-keys/
slug: auditing-heroku-ssh-keys

taxonomies:
  tags:
  - ruby
  - security
---

A good friend of mine recently left the organization I work for and the task of
resetting our passwords and auditing credentials fell on me. Since we use
Heroku for our development platform I needed to not only reset the credentials
for the web portion (which conveniently also handles resetting the API key) but
also revoke any SSH keys he may have added to access it.

<!-- more -->

Sadly Heroku does not seem to provide any web interface that I could find for
examining what keys were associated with the account. Searching for this
information also didn't turn up very valuable results; most people were looking
to add keys or resolve issues with missing keys rather than revoking them. I
suspect not many people think of SSH keys when it comes time to revoke access
which is a dire mistake.

I took to the command line to solve my issue as I knew you could list and add
keys that way, so it was a minor leap of logic to assume they could revoke keys
as well. I ran `heroku help keys` to get the syntax for the commands and was
pleasantly surprised to see an additional option listed in there:

```
keys:clear       #  remove all authentication keys from the current user
```

As a now two person web-shop it's not a terrible amount of work to add our keys
back in and looking through there were already some keys in there that should
have been revoked long ago. One command and our applications were safe from
mischief, though I know my former associate wouldn't abuse that privilege
beyond perhaps pointing out the security flaw I'd allowed.
