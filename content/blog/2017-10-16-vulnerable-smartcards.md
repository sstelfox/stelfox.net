---
date: 2017-10-16 12:25:58-04:00
tags:
- security
title: Vulnerable Smart Cards
---

In addition to the [WiFi vulnerability][1] a much more limited vulnerability
was [announced][2] around private GPG keys that were generated using [Infineon's
RSA Library version v1.02.013][3].

The vulnerability lies in shortcuts taken to speed up the key generation using
the library. The performance increase makes the private key vulnerable to
factorization attacks using an extension to [Coppersmith's attack][4].

It has been [confirmed that YubiKey 4s][10] are effected as are many nations
national ID cards. Earlier versions of YubiKey were not affected (including my
preference the Neo). This brings up a controversial decision [made by
Yubico][5] a little over a year ago to switch from tested open source and
widely inspected libraries, to closed source versions.

This led some very [respected individuals][6] to accuse Yubico that they were
relying on [security through obscurity][7] as core to their security and I have
to agree. Would a FOSS implementation guaranteed this would have been spotted
sooner? No, absolutely not.

If this implementation was open source the fix could be assessed to ensure it
was complete. This very public vulnerability would have also driven passionate
security researchers to look and test other parts of the code, after all
exposing one bug statistically indicates the presence of many more.

One amusing anecdote from the Yubico blog post I've already linked to is this
snippet:

> Yubico has developed the firmware from the ground up. These devices are
> loaded by Yubico and cannot be updated.

It seems they didn't roll their own crypto library, which is good but also
belies the first part of this sentence. The latter part is concerning. If they
can't be updated all YubiKey 4s out there can not and should never ever be used
for key generation and there is nothing consumers that have already purchased
the devices can do about their existing faulty devices without purchasing a
new one or with any luck have Yubico replace them with a non-vulnerable
version as they did with [CVE-2015-3298][8].

While this doesn't directly effect me, I did distinctly notice a mention that
this effects TPM chips used in many laptops, and the keys used by Windows
BitLocker. If your laptop uses an affected chip, your full disk encryption
could be broken by a determined individual over the course of a year or a well
financed attacker in under a month.

If you have a GPG key, or the public portion of any RSA key that may be
affected you can test it using a [convenient online analyzer][9].

***Update:*** Yubico is providing mitigation recommendations and optional
[YubiKey replacements][11]. There are also reports rolling in that GitHub is
taking the proactive step of disabling all keys that have been found to be weak
according to the ROCA tests (Well done GitHub!).

[1]: {{< relref "blog/2017-10-16-a-krack-in-the-defenses.md" >}}
[2]: https://crocs.fi.muni.cz/public/papers/rsa_ccs17
[3]: https://www.commoncriteriaportal.org/files/epfiles/0782V2a_pdf.pdf
[4]: https://en.wikipedia.org/wiki/Coppersmith%27s_attack
[5]: https://www.yubico.com/2016/05/secure-hardware-vs-open-source/
[6]: https://plus.google.com/+KonstantinRyabitsev/posts/fjgYKfPMF13
[7]: https://en.wikipedia.org/wiki/Security_through_obscurity
[8]: https://developers.yubico.com/ykneo-openpgp/SecurityAdvisory%202015-04-14.html
[9]: https://keychest.net/roca
[10]: https://www.yubico.com/2017/10/infineon-rsa-key-generation-issue/
[11]: https://www.yubico.com/keycheck
