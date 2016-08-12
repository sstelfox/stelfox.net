---
title: NFS
---

# NFS

Install packages `nfs-utils` and `nfs4-acl-tools`

This installation sets `rpcbind`, `rpcgssd`, `rpcidmapd` and `nfslock` to all
automatically start on boot... That pisses me off properly, so I set them all
too disabled for testing... I'll turn them back on as needed (hopefully I won't
have too).

I started `nfs` and `rpcbind`... lets see if thats enough.

/etc/exports on server:

```
/media/storage/Media           10.13.37.51(rw,sync)  
/media/storage/HomeDrives      10.13.37.51(rw,sync)
/media/storage/SharedDocuments 10.13.37.51(rw,sync)
```

Run the following

```
exportfs -rv
```

Apparently the client needs the `nfs-utils` installed as well, if the client
doesn't have it they'll receive this error:

```
mount: wrong fs type, bad option, bad superblock on 10.1.1.1:/home/nfs,
missing codepage or helper program, or other error
(for several filesystems (e.g. nfs, cifs) you might
need a /sbin/mount. helper program)
In some cases useful info is found in syslog - try
dmesg | tail  or so
```

* http://www.cyberciti.biz/faq/centos-fedora-rhel-nfs-v4-configuration/
* http://fedorasolved.org/post-install-solutions/nfsv4-fedora  <-- ++
* http://www.server-world.info/en/note?os=Fedora_15&p=nfs
* http://tldp.org/HOWTO/NFS-HOWTO/security.html
* http://www.linuxjournal.com/article/4880
* `http://www.copiouscom.com/2010/05/open-directory-kerberos-single-sign-on-sso-and-centos-with-ssh-and-kerberized-nfs-home-directories/` (Dead link)

