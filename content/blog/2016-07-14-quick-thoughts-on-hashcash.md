---
date: 2016-09-14 01:36:59-04:00
tags:
- thoughts
title: Hash Cash
---

This is an interesting proof of work concept. The first example I have found of
this in the wild is to prevent abuse for [anonymous account registration on an
IRC network][1].

I reviewed it's source and found that it requests a seed, and payload from a
backend PHP script. It assumes that a target collision will happen within
1,000,000 iterations.

This is broken up into 10 iterations. A pool of four WebWorkers are spawned.
Each one iterates through their assigned iterations, appending the iteration
value to the salt then calculating the SHA256 value for that iteration. When
the iteration is found that matches the payload all workers are stopped and the
found value is injected into a hidden form on the field.

They have it set pretty aggressively at several hours per registration attempt,
that does work pretty well as a mechanism against certain types of abuse,
though with a poisoned ad campaign you could have plenty of registration
attempts from random host all over the internet.

[Actual HashCash][2] uses an interesting and well thought out header. Each
component needed to validate the work was done is included in the header and
part of that is the data being submitted.

[1]: https://www.hackint.org/ihashcash
[2]: https://en.wikipedia.org/wiki/Hashcash
