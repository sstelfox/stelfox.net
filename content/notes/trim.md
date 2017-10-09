---
title: Trim
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

## Configuring

This page is referring to TRIM support for SSDs. To enable it add
`noatime,discard` to the options on all of the fstab partition entries that
live on the drive. Be sure to disable any swap partitions that live on that
drive as well.

### Note on Encrypted Drives

Turning TRIM support on for an encrypted hard drive will not actually do
anything. `discard` is a file system level option and full disk encryption
lives below that. It makes sense that it doesn't work, writing a sector full of
0s to an encrypted partition will result in a sector of encrypted 0s which will
look more or less like random garbage.

There is a trick to allow this to work but I'm not will to go that route due to
the security implications of allowing attackers to see where the data lives on
my hard drive and where it doesn't, but for completeness, I'm documenting
(untested) what needs to be done to enable this.

You'll need to replace <your_device> with the DM mapper crypted partition such
as `/dev/mapper/vg_desktop-lv_root`. You'll want to do this for all of the
encrypted partitions on the drive.

```
dmsetup table <your_device> --showkeys
dmsetup load <your_device> --"<line above> 1 allow_discards"
dmsetup resume <your_device>
```

Even without TRIM support noatime and no swap partitions are still good
performance improvements.

## Testing

This requires you install the `hdparm` package on Fedora.

To test and make sure that trim support is working, make sure you're in a
directory that lives on a partition on the SSD, then create a test file like
so:

```
seq 1 1000 > trimtest
sync
hdparm --fibmap trimtest
```

You will get output like this:

```
trimtest:
 filesystem blocksize 4096, begins at LBA 0; assuming 512 byte sectors.
 byte_offset  begin_LBA    end_LBA    sectors
           0   25565616   25565623          8
```

The important thing to take into account is the `begin_LBA` column make note of
this number and use it in place in the following commands. You'll need to
replace `/dev/sda` with the device name matching your SSD.

```
hdparm --read-sector 25565616 /dev/sda
```

You'll receive output that looks a lot like the following:

```
/dev/sda:
reading sector 25565616: succeeded
bb2d 06dc 87c3 6bb6 c43c fab7 a0a9 12db
9e35 2246 4ae3 9eaf 373e 3ce3 ea75 2657
4bb9 e299 c9cf eee9 c74b bb86 9b25 b36c
5214 bf13 7f2b 0cf3 9866 6b7e 0344 8f33
4ea4 0cdc 6ad3 f3e2 8a72 4032 b0d5 7c8c
2002 82cc d631 6f80 0967 e698 5e7c b9c3
c660 9953 ed1e 832f 29a2 7c46 5fab f7e0
8705 6c74 10d2 3649 6b4c 136e e3ba b36f
21dd f96e 9d7c 7c9e 8596 0c0b 67df 76fe
6797 608c 0f42 145e b381 4efe 754f bd59
8575 d75e 95b0 7281 f454 c364 43ab 11dd
79a4 e3b2 1b11 67fa ec04 5d73 6ed9 d77b
bebe 3df2 086c 26e3 ac8e c6b3 0591 370f
5c9c ec7f 777e 15de 23e0 d432 5b8a 460a
132c d09c a81d 3683 79ff c7de 4631 f88f
fa53 5aa6 0286 1817 0dde 85c8 84bc 3a03
f8b1 60eb e1ca 5f1e 2094 eba9 ec61 6fe8
7214 1a0c 88e1 4dac 5f3c f3b7 9d29 7dfd
2c2a 6539 a675 a755 482b 31c8 755c 832c
e166 25b9 539d e0a2 2360 217b 79ec a7d9
9930 e7a7 3af7 d318 83aa 1098 81c2 161f
e55c 6c45 4641 b4e8 8aeb 58e3 e199 74d5
b6ff 93a1 da35 11e9 c3f3 e84d 10e8 ee5b
094f f905 af0e 2872 a683 4836 9d7b 1dba
c528 e972 f72d 1575 a116 bc3d 44b4 970c
db54 690e 2434 3c4e 9eec 2b60 6ccf 4765
6f90 b0bc 7f15 9bd5 6213 3b4b c477 9972
cb27 d777 afcb d95e 1528 2ecd 5d2e 63c9
a25e 9132 39af dab4 81db ea9e a168 204e
f162 8616 7c6a c7e3 bdb2 cb5c 7620 fd43
17af b869 978d 6b58 c54f fdc9 8a37 01d2
f82e b721 631b 3888 bb27 874c 872a 28e0
```

Now we'll remove the file, sync the filesystem and check that sector again:

```
rm -f trimtest
sync
hdparm --read-sector 25565616 /dev/sda
```

If trim support is working the sector read should be all 0s.
