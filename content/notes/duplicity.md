---
title: Duplicity
type: note
---

# Duplicity

Duplicity is a command line backup utility that makes use of the rsync
libraries to perform incremental backups. It also can use GPG public/private
keypairs to handle backing up and restoring files.

I personally want to use public / private key pairs for my backups and contrary
with what I do most of the time I share a single public / private key pair for
my backups, with a strong pass string on the private key.

This is an adequate level of security for me as the backups will all be
encrypted and can be decrypted and restored from any of the other machines as
needed.

The backups are performed to a remote system using SFTP and thus I handle
per-machine authentication using SSH keys (the setup of which I have documented
on the page for [my NSLU2 NAS][1]).

Duplicity supports more than SFTP as a backend, however, it will just make my
scripts less relevant too you.

## Installation

Fedora happily has a package available so this is as easy as:

```
sudo yum install duplicity python-paramiko -y
```

It also happily doesn't have a whole lot of dependencies.

You'll also need GPG installed if you want to make use of my scripts, this
won't trample on any GPG setup you may currently have. On Fedora this is
provided with the gpgme package and can be installed like so:

```
sudo yum install gpgme -y
```

I also strongly recommend you install and configure [rng-tools][2] on any
machine getting backed up that is headless with little to no user interaction,
as the encryption requires a lot of entropy.

### GPG Key Creation

You'll only need to perform this process once, afterwards you'll have the
exported keys to move and backup as you please. I've chosen to use a 4096 bit
RSA and RSA key that doesn't expire and has the name "System Backups" without
an email address or a comment.

I've also set a very long pass string on the key as you'll be relying on this
to protect all the data on all your systems you'll be backing up with this.
These settings are of course personal preference and a 4096 bit key may be
overkill for most uses, though I really enjoy overkill when it comes to
security and peace of mind.

```
gpg --keyring backup-pub.gpg --secret-keyring backup-sec.gpg \
  --no-default-keyring --gen-key
```

Now we need a way to securely move the generated keys around without worrying
about. I've chosen to export the public and private keys, encrypt them with a
symmetric pass string and move the resulting file between machines.

The private key should be encrypted anyway but it's one extra layer that can be
added on that allows me to feel comfortable enough to leave the whole blob in
the script without fear of compromising the private key in case that gets
cracked.

I refer to this password as the "installation key" as the script will use it to
decrypt and import the keys into the local GPG on other machines.

First you'll need to get the key ID of the key we just generated. This can be
done like so:

```
gpg --keyring backup-pub.gpg --list-keys
/home/user/.gnupg/backup-pub.gpg
------------------------------------
pub   4096R/01234567 2012-09-24
uid                  System Backups
sub   4096R/89ABCDEF 2012-09-24
```

Given the output above our key ID is `01234567`, you'll want to replace that in
the following commands with your own key ID. First we'll export the public key,
there isn't any security concerns here:

```
gpg --keyring backup-pub.gpg --output backup-pubkey.gpg --export 01234567
```

You now have the public key in the file `backup-pubkey.gpg`. Now we're going to
export the private key without saving it, combine it with the public key, and
encrypt the whole shebang into one file. Watch closely...

```
gpg --secret-keyring backup-sec.gpg --export-secret-key 01234567 |
  cat backup-pubkey.gpg - | gpg --armor --symmetric --cipher-algo AES256 \
  --output backup-keys.asc
```

You now have a block of base64 encoded encrypted goodness in the
`backup-keys.asc` file which you can import later on.

### GPG Key Import

```
cat export.asc | gpg2 --decrypt --batch --passphrase "PASSWORD" | gpg2 \
  --keyring backup-pub.gpg --secret-keyring backup-sec.gpg --import
```

[1]: ../../devices/nslu2/
[2]: ../rng_tools/

