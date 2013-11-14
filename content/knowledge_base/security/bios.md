---
title: BIOS
---

## Security Notes

Most BIOS's have a few settings that can make it more difficult for a physical
attacker to gain entry to the system. These are:

* Ensure system devices are running latest firmware
* Disable all but the default boot device (especially PXE boot)
* Disable unused SATA/IDE controllers
* Protect BIOS settings with a strong password (usually referred to as the "setup" password)
* Turn off keyboard alerts
* Turn on extended memory testing
* Disable wake on ethernet if not needed for the machine's operation
* Turn on hard drive monitoring if available (SMART)
* Turn on case intrusion detection if available
* Turn on [[Security/TPM]] module if available
* Disable virtualization extensions if not needed

Even if the BIOS is secure it can be reset back to the factory default by
removing the BIOS battery from the mother board for a few seconds and inserting
it back in. This can be prevented through good [[Security/Physical]].

If the machine has a [[Security/TPM]] module and configured to use it, it is
possible to detect these kinds of resets and prevent the system from booting
into the OS afterwards, however, it won't protect against an attacker from
booting their own OS. This can be mitigated by implementing some form of
[[Security/Encryption]]. If the hard disk can be encrypted based off a key
stored in the TPM device, tampering would effectively permanently destroy
access to all data on the hard drive (so you better have off-site backups).

Most new machines have a place for a padlock to be connected. An extremely
determined physical attacker can either cut these off or if they are skilled in
[[Security/Lockpicking]] pick the lock. This shouldn't be necessary however in
the machine is already in a physically secured location.

## Default Passwords

A large number of BIOS passwords can be bypassed using default passwords built
into the system by the manufacturer. The system should be tested for these even
if there isn't any way to disable them. A few of the common one are listed
below:

* j262
* AWARD_SW
* AWARD_PW
* lkwpeter
* Biostar
* AMI
* Award
* bios
* BIOS
* setup
* cmos
* AMI!SW1
* AMI?SW1
* password
* hewittrand
* shift + s y x z

It is a good idea to test and see if the BIOS has this kind of vulnerability.

