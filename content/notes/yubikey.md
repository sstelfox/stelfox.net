---
date: 2017-10-10 00:28:32+00:00
tags:
- linux
- security
title: Yubikey
---

## Smart Card NEO

```
dnf install ykpers -y
ykpersonalize -m82
```

Unplug and replug it back in and it should be usable as a smartcard.

## NFC / HTTP Auth

```
dnf install ykpers -y
ykpersonalize -n https://api.stelfox.net/sessions/yknfc?t=
```

This will hit the API with a URL like: https://api.stelfox.net/session/yknfc?t=ccccccuddclhrkuvurcufviveulljleihvreukifegjh

The API can then return a token that for accessing additional functionality.

## Resetting

This will wipe all keys, user, and admin pins on the card.

This requires scdaemon and gpg-agent to be working and able to connect to the
smartcard. It needs to be plugged into the computer and requires GPG version
2.0.22 or later. On yubikeys prior to the YubiKey4 check the version and
confirm it's version 1.0.6 or later using the following command:

```
gpg-connect-agent --hex "scd apdu 00 f1 00 00" /bye
```

You'll get back a line that looks like:

```
D[0000]  01 00 06 90 00
```

Indicating version 1.0.6. To reset the applet create a file with the following
contents:

```
/hex
scd serialno
scd apdu 00 20 00 81 08 40 40 40 40 40 40 40 40
scd apdu 00 20 00 81 08 40 40 40 40 40 40 40 40
scd apdu 00 20 00 81 08 40 40 40 40 40 40 40 40
scd apdu 00 20 00 81 08 40 40 40 40 40 40 40 40
scd apdu 00 20 00 83 08 40 40 40 40 40 40 40 40
scd apdu 00 20 00 83 08 40 40 40 40 40 40 40 40
scd apdu 00 20 00 83 08 40 40 40 40 40 40 40 40
scd apdu 00 20 00 83 08 40 40 40 40 40 40 40 40
scd apdu 00 e6 00 00
scd apdu 00 44 00 00
/echo Card has been successfully reset.
/bye
```

And cat it into `gpg-connect-agent` like so:

```
cat FILE | gpg-connect-agent
```

## Using as a RNG source

This may allow me to use the yubikey's hardware RNG to generate entropy on my
host:

https://github.com/infincia/TokenTools

## Vulnerability

A vulnerability was published around YubiKey NEOs use as smartcards and
[Yubico's][1] response is top notch. I recommend following the steps in
checking on your key to see if you're affected.

[1]: https://developers.yubico.com/ykneo-openpgp/SecurityAdvisory%202015-04-14.html
