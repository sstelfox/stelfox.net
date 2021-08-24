---
title: Downloading Google Photos
date: 2021-08-19T20:52:50-04:00

description: |-
  A quick workflow in Linux to download a copy of all Google Photos connected
  to your account as well albums that have been shared with you.

slug: downloading-google-photos

taxonomies:
  tags:
  - backups
  - linux
---

* Ensure ~/.local/bin is in your path
* Install python3-pip from package repo

```
mkdir -p ~/gphotos-sync
cd ~/gphotos-sync

# Note: this could probably be installed via the package manager as well...
python3 --user -m pip install pipenv

pipenv install gphotos-sync

# TODO: Need to configure the authentication bits...

pipenv run gphotos-sync --progress --archived ~/gphotos-sync/
```
