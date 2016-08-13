---
title: Iodine
type: note
---

# Iodine

On the server side:

```
yum install iodine-server -y
```

Edit the `/etc/sysconfig/iodine-server` file and put the following options in:

```
OPTIONS="-P somepassword 172.16.0.1 t.0x378.net"
```

Create an `A` or `CNAME` record for `iodine-01.0x378.net` pointing at the FQDN
of the server running `iodine` and a `NS` record pointing at
`iodine-01.0x378.net` for the domain `t.0x378.net` (shorter is better, allows
for higher speed).

And firewall rules...

filter table:

```
# Allow access to the iodine server
-A INPUT -i eth0 -m udp -p udp --dport 53 -j ACCEPT
-A INPUT -i eth0 -m tcp -p tcp --dport 53 -j ACCEPT

# Accept tunneled traffic from iodine
-A FORWARD -i dns+ -o eth0 -j ACCEPT
-A FORWARD -i eth0 -o dns+ -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
```

nat table:

```
*nat
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]

-A POSTROUTING -s 172.16.0.0/24 -o eth0 -j MASQUERADE

COMMIT
```

