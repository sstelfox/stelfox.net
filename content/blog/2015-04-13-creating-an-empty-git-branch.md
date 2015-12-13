---
date: 2015-04-13 20:47:40 -0400
slug: "creating-an-empty-git-branch"
tags:
- git
- development
- programming
- tips
title: "Creating an Empty Git Branch"
---

Every now and then I find myself wanting to create a new empty branch in an
existing repository. It's useful for things such as [Github Pages][1] so you're
able to keep your content source in the master branch while only keeping the
output in the gh-pages branch. I've also used it for testing a complete rewrite
of a code base without the overhead of creating a new repo and copying access
permissions.

This is a pretty straight forward trick to do. You create the brach by
indicating you want the new branch to be an orphan by passing the '--orphan'
flag like so:

```sh
git checkout --orphan NEW_BRANCH_NAME
```

This leaves all the files in place but effectively uncommitted like you just
initialized a new repository. Add and commit any files you'd like to keep then
delete the rest, everything will still be preserved in the original branches.

With that done you should be able to easily switch just using a normal
'checkout' between your normal branches and this new tree.

[1]: https://pages.github.com/
