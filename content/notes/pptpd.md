---
title: PPtP
weight: 20

date: 2019-06-05T09:55:58-05:00
updated: 2019-06-05T09:55:58-05:00

taxonomies:
  tags:
  - linux
  - networking
---

I never got this working there was some kind of authentication issue between
the client and server but there are almost not diagnostic messages here. Old
software doesn't feel good.

## Server

Was done on Gentoo.

```
emerge net-vpn/pptpd

cat << 'EOF' > /etc/pptpd.conf
# /etc/pptpd.conf

option /etc/ppp/options.pptpd
logwtmp

# 10.202.254.128
localip 172.16.45.5
remoteip 172.16.45.100-200
EOF

cat << 'EOF' > /etc/ppp/options.pptpd
name pptpd

refuse-pap
refuse-chap
refuse-mschap

require-mschap-v2
require-mppe-128

ms-dns 1.1.1.1
ms-dns 1.0.0.1

#proxyarp

lock
nobsdcomp
novj
novjccomp
nologfd

# May not be valid / needed
noipx
mtu 1490
mru 1490
EOF

cat << 'EOF' > /etc/ppp/chap-secrets
# /etc/ppp/chap-secrets
# Secrets for authentication using CHAP

# client    server    password          IP addresses
test-user   *         test-password     *
EOF

sysctl -w net.ipv4.ip_forward=1
```

## Client

This was on Fedora 29

```
dnf install pptp -y

cat << 'EOF' > /etc/ppp/chap-secrets
# /etc/ppp/chap-secrets

# client    server    password          IP addresses
test-user   *         test-password     *
EOF

cat << 'EOF' > /etc/ppp/peers/test-connection
pty "pptp 10.202.254.128 --nolaunchpppd"
name test-user
remotename PPTP
require-mppe-128
file /etc/ppp/options.pptp
ipparam test-connection
EOF

pppd call test-connection
tail -f /var/log/messages
```
