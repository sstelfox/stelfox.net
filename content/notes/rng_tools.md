---
title: RNG Tools
---

# RNG Tools

`rng-tools` allows you too supplement the `/dev/random` device with data from
other entropy sources including `/dev/urandom`. Contrary to a lot of people's
understanding `/dev/urandom` does produce fairly high quality random numbers
and will continue to do so as long as SHA1 doesn't get cracked and there is a
flaw allowing the escape of kernel measured data.

`rng-tools` also checks the quality of the random numbers before passing them
into `/dev/random`.

## Installation

```
yum install rng-tools -y
```

## Testing /dev/urandom ###

If you don't have a hardware random number generator (which is very common
especially with virtual machines), you'll need to use `/dev/urandom` to seed
`/dev/random`.

You should probably and test the quality of those waters before drinking them,
the following shows a test of the quality of random numbers using the `rngtest`
utility provided by the `rng-tools` package.

```
cat /dev/urandom | rngtest -c 1000
```

As you can see it is FAST and it passed every one of the FIPS 140-2 tests.
Compared to `/dev/random`:

```
TODO
```

## Configuration

