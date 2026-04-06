---
created_at: 2013-01-01T00:00:01-0000
title: NFS
tags:
  - linux
  - storage
  - networking
  - services
aliases:
  - /notes/nfs/
---

# NFS

NFS (Network File System) allows sharing directories between Linux systems over a network. NFSv4 is the current recommended version and simplifies things by only requiring a single port (2049/tcp).

## Server Setup

Install the NFS utilities (package name varies by distro: `nfs-utils` on Fedora/Arch, `nfs-kernel-server` on Debian/Ubuntu).

Define exports in `/etc/exports`:

```text
/srv/shared    10.0.0.0/24(rw,sync,no_subtree_check)
/srv/readonly  10.0.0.0/24(ro,sync,no_subtree_check)
```

Common export options:
* `rw` / `ro` - Read-write or read-only access
* `sync` - Write data to disk before replying (safer, slower)
* `no_subtree_check` - Disables subtree checking, improves reliability
* `no_root_squash` - Allows root on the client to act as root on the server (use cautiously)
* `root_squash` - Maps root to nobody (default, more secure)

Apply changes and start the service:

```console
# exportfs -rv
# systemctl enable --now nfs-server
```

Verify what's being exported:

```console
$ exportfs -v
```

## Client Setup

Install `nfs-utils` (or `nfs-common` on Debian/Ubuntu) on the client.

Mount an NFS share:

```console
# mount -t nfs4 server:/srv/shared /mnt/shared
```

For persistent mounts, add to `/etc/fstab`:

```text
server:/srv/shared  /mnt/shared  nfs4  defaults,_netdev  0  0
```

The `_netdev` option tells the system to wait for network availability before attempting to mount.

## Firewall

NFSv4 only needs port 2049/tcp. Older versions (v2/v3) require additional ports for rpcbind, mountd, and lockd which makes firewall configuration more complex. Stick with v4 if possible.

## Troubleshooting

If the client gets a "wrong fs type" error, make sure `nfs-utils` is installed on the client side.

Check what a server is exporting from the client:

```console
$ showmount -e server
```

Debug mount issues with verbose output:

```console
# mount -t nfs4 -v server:/srv/shared /mnt/shared
```
