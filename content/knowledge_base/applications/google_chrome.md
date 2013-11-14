---
title: Google Chrome
---

## Install The Repository

Put the contents of the following file into /etc/yum.repos.d/google-chrome.repo

```ini
[google-chrome]
name=google-chrome
baseurl=http://dl.google.com/linux/chrome/rpm/stable/x86_64
enabled=1
gpgcheck=1
```

## Install Google Chrome

```
yum install google-chrome-stable -y
```

