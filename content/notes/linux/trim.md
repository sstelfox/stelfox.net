---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-06T00:00:00-0000
evergreen: false
public: true
tags:
  - encryption
  - linux
  - storage
title: Trim
aliases:
  - /notes/trim/
---

# TRIM

TRIM tells an SSD which blocks are no longer in use so the drive can erase them in the background. Without it, the drive has to erase-before-write on every operation, which degrades performance over time.

## Configuring

Add `discard` to the mount options for any filesystem on an SSD in `/etc/fstab`. While you're at it, `noatime` is also worth adding since it avoids unnecessary write cycles from access time updates.

```
/dev/sda1  /  ext4  defaults,noatime,discard  0  1
```

Alternatively, rather than continuous TRIM via the `discard` mount option, you can use periodic TRIM with a systemd timer. Most distributions ship a `fstrim.timer` unit that runs weekly:

```console
# systemctl enable --now fstrim.timer
```

Periodic TRIM can be less disruptive to I/O performance than continuous discard on some drives.

### Note on Encrypted Drives

TRIM on an encrypted volume requires the encryption layer to pass discard commands through to the underlying device. By default LUKS does not do this because it leaks information about which blocks contain data and which are empty. That metadata can reveal filesystem structure and usage patterns to someone with physical access to the drive.

If you are willing to accept that tradeoff, you can enable it by adding `discard` to the LUKS options in `/etc/crypttab`:

```
sda1_crypt  /dev/sda1  none  luks,discard
```

Or for an already-open LUKS volume, you can enable it at the dmsetup level:

```console
$ dmsetup table <your_device> --showkeys
$ dmsetup load <your_device> --table "<line above> 1 allow_discards"
$ dmsetup resume <your_device>
```

Replace `<your_device>` with your DM mapper device (for example `/dev/mapper/root`).

Even without TRIM, using `noatime` is still a worthwhile performance improvement on SSDs.

## Testing

The `hdparm` package provides a way to verify TRIM is working. The approach is to write a file, find its physical location on disk, delete the file, then check whether the drive zeroed out that location.

Create a test file on a filesystem that lives on your SSD:

```console
$ seq 1 1000 > trimtest
$ sync
$ hdparm --fibmap trimtest
```

Note the `begin_LBA` value from the output. Read that sector directly (replace `/dev/sda` with your SSD device):

```console
# hdparm --read-sector <begin_LBA> /dev/sda
```

You should see non-zero data. Now delete the file and sync:

```console
$ rm -f trimtest
$ sync
```

Read the same sector again:

```console
# hdparm --read-sector <begin_LBA> /dev/sda
```

If TRIM is working, the sector should now be all zeros.
