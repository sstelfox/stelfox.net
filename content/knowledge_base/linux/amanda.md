---
title: Amanda
---

Amanda, or the Advanced Maryland Automatic Network Disk Archiver is an open
source computer archiving tool that is able to back up data residing on
multiple computers on a network.

## Security Notes

The biggest in your face security hole that I see off the top of my head is
that amanda uses the xinetd to run it's services. xinetd while more secure than
it's predecessor inetd, still suffers from the problem that it allows any
arbitrary program to start up automatically and listen on any port (including
privileged ports) for incoming connections, there are many insecure daemons
that are traditionally run from xinetd that I do not want existing on my
network.

Higher security for the rest of the system and a very carefully tuned firewall
is my only defence against this evil service.

## Steps I took

```
yum install amanda amanda-client amanda-server
Edit /etc/xinetd.d/amanda and change disable to 'no'
Started xinetd
Verified it opened port 10080/udp
Opened port 10080/udp on firewall for server subnet
Added to /var/lib/amanda/.amandahosts: "localhost                               amandabackup
backup                                  amandabackup
backup.home.bedroomprogrammers.net      amandabackup
legba                                   root"
Set permissions on /var/lib/amanda/.amandahosts to 600
created folder /opt/backups and changed owner to amandabackup
and then i fucked up...
```

