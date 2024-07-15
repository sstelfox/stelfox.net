---
created_at: 2013-01-01T00:00:01-0000
title: Hipache
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Installing and setting up hipache. To actually install this I had to open up
port `tcp/9418` outbound on the server.

```
yum install git npm -y
npm install hipache -g
```

Create an initial configuration file:

```
cat << EOF > /etc/hipache.json
{
  "server": {
    "accessLog": "/var/log/hipache_access.log",
    "port": 80,
    "workers": 5,
    "maxSockets": 100,
    "deadBackendTTL": 30,
    "address": ["0.0.0.0"],
    "address6": ["::"]
  },
  "redisHost": "192.168.122.101",
  "redisPort": 6379,
  "redisDatabase": 0,
  "redisPassword": "password"
}
EOF
```

Allow redis access to the local redis servers:

```
-A OUTPUT -m tcp -p tcp --dport 6379 -d 192.168.122.0/24 -j ACCEPT
```
