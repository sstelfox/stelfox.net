---
created_at: 2017-10-10T00:28:32-0000
evergreen: true
public: true
tags:
  - linux
  - operations
  - security
title: Yubikey
slug: yubikey
---

# Yubikey

## NEO

```console
$ dnf install ykpers -y
$ ykpersonalize -m82
```

Unplug and plug it back in and it should be usable as a smartcard.

## NFC / HTTP Auth

```console
$ dnf install ykpers -y
$ ykpersonalize -n https://api.stelfox.net/sessions/yknfc?t=
```

This will hit the API with a URL like `https://api.stelfox.net/session/yknfc?t=ccccccuddclhrkuvurcufviveulljleihvreukifegjh`.

The API can then return a token that for accessing additional functionality.

## Resetting

This will wipe all keys, user, and admin pins on the card.

This requires scdaemon and gpg-agent to be working and able to connect to the smartcard. It needs to be plugged into the computer and requires GPG version 2.0.22 or later. On yubikeys prior to the YubiKey4 check the version and confirm it's version 1.0.6 or later using the following command:

```console
$ gpg-connect-agent --hex "scd apdu 00 f1 00 00" /bye
D[0000]  01 00 06 90 00
```

Indicating version 1.0.6. To reset the applet you can use the following manual hex commands:

```console
$ cat <<EOF | gpg-connect-agent
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

## Using as a RNG source

* [This may allow me to use the Yubikey's hardware RNG to generate entropy on my host](https://github.com/infincia/TokenTools)

## Vulnerability

A vulnerability was published around YubiKey NEOs use as smartcards and [Yubico's](https://developers.yubico.com/ykneo-openpgp/SecurityAdvisory%202015-04-14.html) response is top notch. I recommend following the steps in checking on your key to see if you're affected.
