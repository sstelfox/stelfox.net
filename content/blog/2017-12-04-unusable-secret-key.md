---
created_at: 2017-12-04T11:38:01-0500
evergreen: true
public: true
tags:
  - gpg
  - security
  - tips
title: Unusable Secret Key
slug: unusable-secret-key
---

# Unusable Secret Key

I use a Yubikey NEO to store subkeys used for signing and authentication. I started experiencing a weird issue with it. It coincided with me rebuilding my system so diagnosing it ended up being harder than normal. The behavior I experienced allowed me to use the key to authenticate (SSH'ing worked fine) but any attempt to sign new data resulted in an 'Unusuable secret key' error. For git this resulted in the following message:

```text
gpg: skipped "Sam Stelfox <sstelfox@bedroomprogrammers.net>": Unusable secret
key
gpg: signing failed: Unusable secret key
error: gpg failed to sign the data
fatal: failed to write commit object
```

There is a second Yubikey I use on occasion that contains my companies software signing key. When reviewing my available secret keys, it seemed like GPG was listing those private keys as available when they weren't. That was a red herring and unrelated (though still likely a bug). After resetting my GPG config as well as the agent, and re-importing my key the private keys were not be listed at all.

Ultimate the issue was that all of my subkeys were expired and only became visible when I used the following command:

```console
$ gpg2 --list-options show-unusable-subkeys --list-keys
/home/sstelfox/.gnupg/pubring.kbx
---------------------------------
pub   rsa4096/0x30856D4EA0FFBA8F 2016-04-26 [C] [expires: 2019-12-01]
      Key fingerprint = DC75 C8B8 7434 4360 FB30  3FC9 3085 6D4E A0FF BA8F
uid                   [ unknown] Sam Stelfox <sstelfox@bedroomprogrammers.net>
uid                   [ unknown] Sam Stelfox <sam@stelfox.net>
uid                   [ unknown] Sam Stelfox <sam@pwnieexpress.com>
uid                   [ unknown] [jpeg image of size 2803]
sub   rsa2048/0x5E2FD479ABDD395A 2016-04-26 [S] [expired: 2017-12-01]
sub   rsa2048/0xD87BD950C29A0FA2 2016-04-26 [E] [expired: 2017-12-01]
sub   rsa2048/0x4B218A4FB733A150 2016-04-26 [A] [expired: 2017-12-01]
```
