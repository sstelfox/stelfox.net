---
created_at: 2024-07-26T15:27:46-04:00
updated_at: 2024-07-26T15:27:46-04:00
evergreen: true
public: true
tags:
  - hardware
  - linux
  - secure-boot
  - security
title: Secure Boot on Older and Unstable Motherboards
---

# Secure Boot on Older and Unstable Motherboards

Recently I found my desktop motherboard was vulnerable booting malicious payloads due to [the use of a developer reference key in production firmware](https://www.tomshardware.com/software/security-software/secure-boot-key-compromised-in-2022-is-still-in-use-in-over-200-models). I have a Gigabyte Aorus X570 Elite motherboard which is known to have a rather problematic UEFI BIOS.

Turning secure boot on, without the Microsoft keys present, would prevent any graphical output. The system was booting behind the scenes and I could SSH into it, only graphical output was affected. This is something that has been on my todo list for a while and was low priority enough I never got around to resolving it. This fresh news article gave me the drive to solve it.

If you have the same motherboard, you can recover from this issue by resetting the BIOS CMOS settings. You do have to physically remove the inconveniently located battery, as the jumper was ineffective. You also have to fully switch off or unplug your power supply during the removal.

Once reset you need to disable the legacy boot (called CSM support) to allow secure boot to be turned on, enable the secure boot setup mode, turn on the fTPM device (explained later) and boot back into Linux. I already had my kernel images signed with a custom key I just needed to enroll it.

Now we get to the troublesome part. The issue is ultimately that some internal firmware blob is signed with the Microsoft 3rd party UEFI key. This isn't something you have access to or can sign independently. Microsoft has not had a great track record of security, and this particular key has signed many keys that are known to be compromised including this latest one.

As of last year, the `sbsign` utility has had the ability to harvest firmware payload identities using built-in TPM devices via its generated event log. You can enroll your custom key, and include signatures for the firmware on the board using the following command as root:

```console
# sbctl enroll-keys --tpm-event-log --yes-this-might-brick-my-machine
```

That scary CLI flag is no joke. If you can't reset the BIOS that might permanently brick your machine. On these motherboards, since we can reset the BIOS, its not that risky but your mileage may vary. I imagine this works for other motherboards that experience this kind of issue as well. I'm not sure when the option was added but it worked like a charm and I have a slightly more secure system thanks to it.
