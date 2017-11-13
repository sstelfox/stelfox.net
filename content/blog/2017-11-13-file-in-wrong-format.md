---
date: 2017-11-13T13:44:00-04:00
tags:
- linux
- tips
title: File in Wrong Format
---

I have been recently attempting to cross compile a custom Gentoo profile
targetting a Xilinx board as I found their distribution to be unmanageable
(PetaLinux as hacked together sub-distro of Yocto). I had several issues with
the default profile (embedded) conflicting with other critical packages. I'll
do a detailed post later on for building that entire root filesystem.

I came across one issue which didn't seem to have a well-documented solution.
While compiling several packages (most notably [GMP][1] which is required for a
native GCC) I kept coming across a linker issue late in the compilation:

```
libtool: link: g++ ...<snip>..../.libs/libgmp.so: error adding symbols: File in wrong format
```

Since it got so late in the compilation (this is pretty much the last link) I
assumed it was an issue with the linker itself. Digging through the ebuilds,
and wrappers around the developer environment I couldn't find anything suspect.

Ultimate I went back and read through the entire build log where I found this
in the configure output:

```
checking for arm-xilinx-linux-gnueabi-g++... no
checking for arm-xilinx-linux-gnueabi-c++... no
checking for arm-xilinx-linux-gnueabi-gpp... no
checking for arm-xilinx-linux-gnueabi-aCC... no
checking for arm-xilinx-linux-gnueabi-CC... no
checking for arm-xilinx-linux-gnueabi-cxx... no
checking for arm-xilinx-linux-gnueabi-cc++... no
checking for arm-xilinx-linux-gnueabi-cl.exe... no
checking for arm-xilinx-linux-gnueabi-FCC... no
checking for arm-xilinx-linux-gnueabi-KCC... no
checking for arm-xilinx-linux-gnueabi-RCC... no
checking for arm-xilinx-linux-gnueabi-xlC_r... no
checking for arm-xilinx-linux-gnueabi-xlC... no
checking for g++... g++
configure.wrapped: WARNING: using cross tools not prefixed with host triplet
```

The configure script was unable to find a native g++ compiler for my target
environment and thus fell back on to the system's native compiler... which is
not compatible with my binaries. I had only performed a stage 3 crossdev setup.
Stage 4 is when a C++ compiler and libstdc++ becomes available. I was able to
upgrade my crossdev environment in Gentoo using the following command:

```
crossdev --stable -s4 -v -t arm-xilinx-linux-gnueabi
```

You will likely want to replace my system triple with your target.

[1]: https://gmplib.org/
