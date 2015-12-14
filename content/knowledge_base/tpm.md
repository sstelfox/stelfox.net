---
title: TPM
tags:
- bios
- physical
- security
---

TPM is an advanced feature that establishes a chain of trust between the a chip
on the motherboard, the BIOS, the bootloader, and the OS. Properly configuring
TPM can be time consuming and needs to be done carefully. In the event that an
attacker physically removes the hard drive and trys to boot it on another
machine, overwrites the BIOS or bootloader with their own, or otherwise
interferes with the boot process the OS can detect and protect itself from the
intrusion.

For TPM to work the motherboard, BIOS, bootloader and OS all need to support
it. Grub (A port of it called trusted-grub) and Linux (via kernel modules and
the trousers package) both support TPM so it comes down to an issue of whether
the motherboard has a TPM chip (If the motherboard has this chip, the BIOS more
likely than not supports it).

I will have to save detailed configuration of TPM for a later date.
