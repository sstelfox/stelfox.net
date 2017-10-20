---
tags:
- linux
- security
title: Tails Setup Notes
---

This is relevant for TAILS version 2.5 and basically follows their install
guide.

I needed 2 USB sticks each at least 4Gb in size, and a spare laptop to take
these notes on and read the instructions.

I downloaded a copy of the Tails GPG key from several machines located on
wildly disparate internet connections like so:

```sh
curl -s https://tails.boum.org/tails-signing.key -o tails-signing-local.key
for i in ircp io proc; do
  ssh $i 'curl -s https://tails.boum.org/tails-signing.key' > tails-signing-$i.key
done
```

I pulled them all on to the machine I'm installing from and ensured all their
contents matched:

```sh
diff -qs --from-file tails-signing-*.key
```

With the key validated I can relatively safely import it (the Key ID was this:
0xDBB802B258ACD84F):

```sh
gpg --import tails-signing-local.key
gpg --refresh-keys
```

Now I need the ISO, the safest method is via torrent. The torrent was available
at the following URL: https://tails.boum.org/torrents/files/tails-i386-2.5.torrent

```sh
curl -s https://tails.boum.org/torrents/files/tails-i386-2.5.torrent -o tails-i386-2.5.torrent
```

After downloading the torrent file's content, it's signature needs to be
verified then installed directly to the first USB stick (/dev/sdb) like so:

```sh
gpg --keyid-format 0xlong --verify tails-i386-2.5.iso.sig tails-i386-2.5.iso
dd if=tails-i386-2.2.1.iso of=/dev/sdb bs=1M oflag=sync
```

With this setup, we need to boot into the TAILS usb drive. Start it up and
choose the 'Live' boot menu option.

Wait for the tails greeter appears and click Login.

When the desktop appears plug in the second USB stick. Open up 'Applications'
-> 'Tails' -> 'Tails Installer'. Choose 'Install by cloning'. Choose the other
USB drive and begin the installation. Boot into the second TAILS usb drive.

We want to create an encrypted persistent storage as well once booted back in.
Choose 'Applications' > 'Tails' > 'Configure persistent volume'. Specify a long
strong passphrase and click 'Create'. Active 'Personal Data', consider the
other options but they're not officially recommended.

Restart into the USB drive again, but activate the 'Use persistence?' flag and
enter your passphrase before clicking on 'Login'. Anything stored in the Places
-> Persistent location will be saved between environments.
