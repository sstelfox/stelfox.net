---
title: MongoDB
---

# MongoDB

## Installation

```
yum install mongodb-server -y
```

```
systemctl enable mongod.service
systemctl start mongod.service
```

## Configuration

There are a lot of insecure defaults in `/etc/mongodb.conf` that would need to
get changed in production. I only needed the service running for a quick test
of a third party application so I haven't gotten around to enumerating it's
configuration yet.

