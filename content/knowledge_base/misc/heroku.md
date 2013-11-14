---
title: Heroku
---

# Heroku Notes

This page is simple a collection of commands that are useful that I had to
lookup at one point or another and have been documented to make it easier for
me to find them again.

## Add Git Remotes

I have a staging and production instance of the same application and like them
being named appropriately so I know which one I'm pushing to. This does mean I
need to add them as appropriate remotes especially when working in a repo that
I hadn't directly created the heroku instance from here are the command to add
a remote to the repositories:

```sh
git remote add staging git@heroku.com:name-of-the-staging-app.git
git remote add production git@heroku.com:name-of-the-production-app.git
```

## Reset All SSH keys

Simply blow away all access, nice and simple. This revokes access to all
projects created under the authenticated account.

```sh
heroku keys:clear
```

