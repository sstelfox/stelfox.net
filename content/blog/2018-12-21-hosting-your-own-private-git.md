---
date: 2018-12-21 18:53:30+00:00
tags:
- linux
- tips
title: Hosting Your Own Private Git Repo
---

Git was built and developed with the intention of being a distributed reversion
control system. Most people now use it with one or another central repository
even when working on large teams which is perfectly fine if that model works
for you and your team.

It can be useful to quickly work with others on private repositories without
requiring them to get on your platform of choice, or for sensitive repositories
keep the repository entirely under your control. Occasionally platforms like
GitHub have service outages, and while you won't have access to any of your
integrations a private repository can quickly allow your team to keep
collaborating.

If you're using Linux or Mac OS X, setting up a local repo that you can push to
is trivial. You simply create a place for it, initialize it as a git repo, then
push to it like so:

```
mkdir -p ~/repos/private_repo.git
cd ~/repos/private_repo.git
git init --bare
```

In the directory that contains your current repository add the new repo
destination as an origin and push the contents to it:

```
git remote add local ~/repos/private_repo.git
git push local --all
```

Having another copy of your repository locally doesn't do you much good. To
push your repository to another system, the only requirements is an account on
an SSH server that has the git binary installed.

Log in to your SSH server and setup the repository like before:

```
ssh user@my-remote-system.example.tld
mkdir ~/repos/private_repo.git
cd ~/repos/private_repo.git
git init --bare
```

In the local copy of your current repository you add an origin just like
before, but use a slightly different syntax to indicate its on a remote system
instead:

```
git remote add remote user@my-remote-system.example.tld:~/repos/private_repo.git
git push remote --all
```

To clone from it you would use the same syntax as you did for the origin:

```
git clone user@my-remote-system.example.tld:~/repos/private_repo.git
```

If multiple users are allowed on the SSH hosts and you want to allow them
access to the repository, you'll need to place the directory in a place all
users can access and handle permissions on.

You can have as many origins as you'd like and push / pull from them
independently.
