---
created_at: 2017-10-16T12:25:58-0400
evergreen: true
public: true
tags:
  - news
  - security
title: Vulnerable Smart Cards
---

# Vulnerable Smart Cards

In addition to the [WiFi vulnerability](2017-10-16-a-krack-in-the-defenses) a much more limited vulnerability was [announced](https://crocs.fi.muni.cz/public/papers/rsa_ccs17) around private GPG keys that were generated using [Infineon's RSA Library version v1.02.013](https://www.commoncriteriaportal.org/files/epfiles/0782V2a_pdf.pdf).

The vulnerability lies in shortcuts taken to speed up the key generation using the library. The performance increase makes the private key vulnerable to factorization attacks using an extension to [Coppersmith's attack](https://en.wikipedia.org/wiki/Coppersmith%27s_attack).

It has been [confirmed that YubiKey 4s](https://www.yubico.com/2017/10/infineon-rsa-key-generation-issue/) are effected as are many nations national ID cards. Earlier versions of YubiKey were not affected (including my preference the Neo). This brings up a controversial decision [made by Yubico](https://www.yubico.com/2016/05/secure-hardware-vs-open-source/) a little over a year ago to switch from tested open source and widely inspected libraries, to closed source versions.

This led some very [respected individuals](https://plus.google.com/+KonstantinRyabitsev/posts/fjgYKfPMF13) to accuse Yubico that they were relying on [security through obscurity](https://en.wikipedia.org/wiki/Security_through_obscurity) as core to their security and I have to agree. Would a FOSS implementation guaranteed this would have been spotted sooner? No, absolutely not.

If this implementation was open source the fix could be assessed to ensure it was complete. This very public vulnerability would have also driven passionate security researchers to look and test other parts of the code, after all exposing one bug statistically indicates the presence of many more.

One amusing anecdote from the Yubico blog post I've already linked to is this snippet:

> Yubico has developed the firmware from the ground up. These devices are loaded by Yubico and cannot be updated.

It seems they didn't roll their own crypto library, which is good but also belies the first part of this sentence. The latter part is concerning. If they can't be updated all YubiKey 4s out there can not and should never ever be used for key generation and there is nothing consumers that have already purchased the devices can do about their existing faulty devices without purchasing a new one or with any luck have Yubico replace them with a non-vulnerable version as they did with [CVE-2015-3298](https://developers.yubico.com/ykneo-openpgp/SecurityAdvisory%202015-04-14.html).

While this doesn't directly effect me, I did distinctly notice a mention that this effects TPM chips used in many laptops, and the keys used by Windows BitLocker. If your laptop uses an affected chip, your full disk encryption could be broken by a determined individual over the course of a year or a well financed attacker in under a month.

If you have a GPG key, or the public portion of any RSA key that may be affected you can test it using a [convenient online analyzer](https://keychest.net/roca).

***Update:*** Yubico is providing mitigation recommendations and optional [YubiKey replacements](https://www.yubico.com/keycheck). There are also reports rolling in that GitHub is taking the proactive step of disabling all keys that have been found to be weak according to the ROCA tests (Well done GitHub!).
