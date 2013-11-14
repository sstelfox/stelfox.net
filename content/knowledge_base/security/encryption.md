---
title: Encryption
---

## TRESOR

TRESOR is quite interesting as it's key never enters RAM and as such is not
vulnerable to extraction from RAM. It unfortunately doesn't seem to be merged
into the kernel yet, which means a custom kernel will need to be compiled with
it AND only for 2.6.36. However, it is also the best bet for the security of an
encrypted linux system.

## Linux Builtin Disk Ciphers

Finding what ciphers are available and compiled into the kernel can be
accomplished with the following command. This command will show ciphers and
hashes so you'll need to be intelligent about which ones to use.

```
cat /proc/crypto | grep name
```

I've compiled a speed test for various cipher combinations based on what was
available to me. There is generally a security/speed tradeoff with ciphers but
in some cases this isn't always true. I strongly recommend reading more about
the various ciphers before making your own decisions for high-security
information.

{| class="wikitable" border="1"
|-
!Cipher
!Read Speed
|-
| -c tnepres
|20.1 MB/s
|-
| -c serpent
|20.4 MB/s
|-
| -c seed-ecb-plain -s 256
|20.5 MB/s
|-
| -c fcrypt-pcbc-plain -s 64
|30.4 MB/s
|-
| -c khazad-ecb-plain -s 128
|31.7 MB/s
|-
| -c xtea-ecb-plain -s 128
|32.0 MB/s
|-
| -c arc4
|32.1 MB/s
|-
| -c xeta-ecb-plain -s 128
|32.1 MB/s
|-
| -c twofish
|34.2 MB/s
|-
| -c anubis-cbc-plain -s 256
|37.5 MB/s
|-
| -c anubis -s 256
|37.8 MB/s
|-
| -c tea-ecb-plain -s 128
|38.1 MB/s
|-
| -c anubis-ecb-plain -s 256
|39.6 MB/s
|-
| -c cast6-cbc-plain -s 256
|40.0 MB/s
|-
| -c cast6
|40.7 MB/s
|-
| -c des-ecb-plain -s 64
|42.0 MB/s
|-
| -c camellia -s 256
|42.2 MB/s
|-
| -c anubis -s 128
|46.4 MB/s
|-
| -c anubis-cbc-plain -s 128
|47.5 MB/s
|-
| -c anubis-ecb-plain -s 128
|49.4 MB/s
|-
| -c cast5-cbc-plain -s 128
|50.2 MB/s
|-
| -c camellia -s 128
|51.4 MB/s
|-
| -c aes -s 256
|55.9 MB/s
|-
| -c aes-cbc-plain -s 256
|56.4 MB/s
|-
| -c aes-cbc-benbi -s 256
|56.7 MB/s
|-
| -c aes-cbc-null -s 256
|57.0 MB/s
|-
| -c blowfish
|57.2 MB/s
|-
| -c aes-ecb-benbi -s 256
|58.8 MB/s
|-
| -c aes-ecb-null -s 256
|59.5 MB/s
|-
| -c aes-ecb-plain -s 256
|60.3 MB/s
|-
| -c blowfish-ecb-plain
|61.4 MB/s
|-
| -c aes-xts-plain -s 256
|61.6 MB/s
|-
| -c aes-lrw-plain -s 256
|62.8 MB/s
|-
| -c aes-cbc-plain -s 128
|66.8 MB/s
|-
| -c aes-ctr-plain -s 128
|67.0 MB/s
|-
| -c aes-cbc-null -s 128
|67.1 MB/s
|-
| -c aes-cbc-benbi -s 128
|67.4 MB/s
|-
| -c aes -s 128
|67.5 MB/s
|-
| -c aes-ecb-plain -s 128
|71.0 MB/s
|-
| -c aes-ecb-benbi -s 128
|71.2 MB/s
|-
| -c aes-ecb-null -s 128
|71.5 MB/s
|-
|None (Baseline)
|105 MB/s
|}

