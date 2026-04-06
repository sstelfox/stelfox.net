---
created_at: 2017-10-10T00:28:32-0000
updated_at: 2026-04-05T00:00:00-0000
evergreen: true
public: true
tags:
  - hardware
  - linux
  - operations
  - security
title: Yubikey
aliases:
  - /notes/yubikey/
---

# YubiKey 5 Series

The YubiKey 5 series packs a lot of functionality into a small hardware token.
It supports FIDO2/WebAuthn for passwordless authentication, PIV smart card
operations, OpenPGP key storage, TOTP and HOTP one-time passwords, and static
password slots. Most of what you'd want for day-to-day security lives on one
device that fits on your keychain.

This note focuses on the YubiKey 5 series. If you're coming from a YubiKey NEO,
check the [migration notes](#neo-migration-notes) at the bottom.

## Initial Setup with YubiKey Manager

The `ykman` CLI tool is the primary way to configure a YubiKey 5. On Fedora:

```console
$ sudo dnf install yubikey-manager
```

On macOS with Homebrew:

```console
$ brew install ykman
```

Once installed, plug in your YubiKey and check the device info:

```console
$ ykman info
Device type: YubiKey 5 NFC
Serial number: 12345678
Firmware version: 5.4.3
Form factor: Keychain (USB-A)
Enabled USB interfaces: OTP, FIDO, CCID
NFC transport is enabled

Applications    USB             NFC
FIDO2           Enabled         Enabled
OTP             Enabled         Enabled
FIDO U2F        Enabled         Enabled
OATH            Enabled         Enabled
YubiHSM Auth    Disabled        Disabled
OpenPGP         Enabled         Enabled
PIV             Enabled         Enabled
```

You can selectively enable or disable applications per interface. For example,
if you only want FIDO2 and OpenPGP over USB and want to turn everything else
off:

```console
$ ykman config usb --enable FIDO2 --enable OPENPGP --disable OTP --disable U2F --disable OATH --disable PIV
```

## FIDO2 / WebAuthn

FIDO2 is probably the most broadly useful feature. It handles passwordless login
and second-factor authentication for websites and services that support
WebAuthn.

### Setting a FIDO2 PIN

Before you can use resident keys or some services that require user
verification, you need to set a PIN:

```console
$ ykman fido access change-pin
Enter your new PIN:
Confirm your new PIN:
New PIN set.
```

If you already have a PIN and want to change it:

```console
$ ykman fido access change-pin --pin OLD_PIN --new-pin NEW_PIN
```

### Registering with Services

Most services handle registration through the browser. When you hit "Add
security key" in a site's settings, the browser will prompt you to tap the
YubiKey. That's really all there is to it for basic WebAuthn.

### Resident Keys (Discoverable Credentials)

Resident keys store the credential on the YubiKey itself, which enables truly
passwordless flows where you don't even need to type a username. The YubiKey 5
can store around 25 resident keys depending on the credential size.

You can list stored credentials:

```console
$ ykman fido credentials list
```

And delete ones you no longer need:

```console
$ ykman fido credentials delete <credential_id>
```

## SSH with ed25519-sk

OpenSSH 8.2+ supports FIDO2-backed SSH keys. The `-sk` suffix means the private
key operation requires the hardware token to be present and touched.

### Generating a Key

```console
$ ssh-keygen -t ed25519-sk -C "yubikey-5"
```

This creates two files: a private key handle (which is useless without the
physical YubiKey) and the corresponding public key. The private key file doesn't
contain the actual secret material, it's just a reference that tells SSH to talk
to the token.

If you want a resident key that can be extracted from the YubiKey onto a new
machine:

```console
$ ssh-keygen -t ed25519-sk -O resident -C "yubikey-5"
```

You can then pull the key handle down on any machine with:

```console
$ ssh-keygen -K
```

### Touch Behavior

Every SSH operation (login, git push, tunneling) will require a physical tap on
the YubiKey. The key blinks when it's waiting for confirmation. This is a
feature not a bug, it means malware can't silently use your SSH key even if it
has access to the key handle file.

If you find yourself doing many operations in a row, you can configure
`ssh-agent` to cache the touch confirmation for a short window, but honestly the
tap-per-operation is worth the minor inconvenience.

## OpenPGP

The YubiKey 5 supports RSA up to 4096-bit and ECC keys for OpenPGP operations.
For full details on key generation, subkey management, and day-to-day GPG usage,
see the [GnuPG](gnupg) note.

### Touch Policy

You can require a physical touch for each OpenPGP operation. This is highly
recommended as it prevents silent signing or decryption by malware:

```console
$ ykman openpgp keys set-touch sig on
$ ykman openpgp keys set-touch enc on
$ ykman openpgp keys set-touch aut on
```

The options are `on`, `off`, `fixed` (cannot be changed without a full reset),
and `cached` (touch is cached for 15 seconds). Using `fixed` is the most
paranoid option since it can't be disabled without wiping the applet.

### PIN Management

Change the user PIN (default `123456`):

```console
$ ykman openpgp access change-pin
```

Change the admin PIN (default `12345678`):

```console
$ ykman openpgp access change-admin-pin
```

Set the reset code (allows user PIN reset without admin PIN):

```console
$ ykman openpgp access set-reset-code
```

Change the PINs from their defaults early. If you don't, anyone who has
temporary physical access to the key can take over the OpenPGP applet.

## PIV (Smart Card)

The PIV applet gives you a standard smart card interface, useful for system
login, VPN authentication, code signing, and anything that speaks PKCS#11.

### Default PINs

The PIV applet ships with its own set of defaults:

- PIN: `123456`
- PUK: `12345678`
- Management key: `010203040506070801020304050607080102030405060708`

Change all of these immediately:

```console
$ ykman piv access change-pin
$ ykman piv access change-puk
$ ykman piv access change-management-key
```

### Generating a Key and Certificate

Generate a key in slot 9a (used for PIV authentication):

```console
$ ykman piv keys generate --algorithm ECCP256 9a pubkey.pem
```

Then create a self-signed certificate for it:

```console
$ ykman piv certificates generate --subject "CN=sam" 9a pubkey.pem
```

For use with a CA, generate a CSR instead:

```console
$ ykman piv certificates request --subject "CN=sam" 9a pubkey.pem csr.pem
```

### Common PIV Slots

| Slot | Purpose |
|------|---------|
| 9a   | PIV Authentication |
| 9c   | Digital Signature |
| 9d   | Key Management |
| 9e   | Card Authentication |

### Using PIV for SSH

You can also use the PIV applet for SSH via the PKCS#11 interface. This is an
alternative to the `ed25519-sk` approach:

```console
$ ssh -I /usr/lib/opensc-pkcs11.so user@host
```

Or add it to your SSH config:

```
Host example
    PKCS11Provider /usr/lib/opensc-pkcs11.so
```

## TOTP / HOTP

The OATH applet handles time-based and counter-based one-time passwords. You can
store up to 32 TOTP/HOTP credentials on the key.

### Adding a TOTP Secret

When a service shows you a QR code for 2FA setup, it usually also offers a text
secret. Use that with ykman:

```console
$ ykman oath accounts add -t "ServiceName:username" JBSWY3DPEHPK3PXP
```

The `-t` flag requires a touch to generate codes, which is optional but
recommended.

### Retrieving Codes

Get all current codes:

```console
$ ykman oath accounts code
```

Get a code for a specific account:

```console
$ ykman oath accounts code "ServiceName:username"
```

### Listing and Removing

```console
$ ykman oath accounts list
$ ykman oath accounts delete "ServiceName:username"
```

The nice thing about keeping TOTP on the YubiKey rather than a phone app is that
the secrets never exist on a general-purpose computer or phone where they could
be extracted.

## Resetting Applets

Sometimes you need a clean slate. Each applet can be reset independently.

### FIDO2 Reset

This wipes all FIDO2 credentials and the PIN. The reset must happen within 5
seconds of inserting the key:

```console
$ ykman fido reset
```

You will need to re-register with every service.

### OpenPGP Reset

This wipes all OpenPGP keys and resets PINs to defaults:

```console
$ ykman openpgp reset
```

### PIV Reset

This wipes all PIV keys, certificates, and resets PINs to defaults:

```console
$ ykman piv reset
```

### OATH Reset

This wipes all TOTP/HOTP credentials:

```console
$ ykman oath reset
```

### Full Factory Reset

If you want to nuke everything, reset each applet individually. There's also the
nuclear option of resetting the entire config:

```console
$ ykman config reset
```

This disables all applets and resets the interface configuration. You'll need to
re-enable applications afterward.

## NEO Migration Notes

If you're coming from a YubiKey NEO, here's what changed with the 5 series:

- **No more mode switching.** The NEO required `ykpersonalize -m82` to enable
  CCID mode. The YubiKey 5 has all interfaces available by default and you
  toggle them through `ykman config` instead.
- **FIDO2 support.** The NEO only supported U2F (FIDO1). The 5 series adds full
  FIDO2/WebAuthn with resident keys and PIN protection.
- **Stronger crypto.** The NEO was limited to 2048-bit RSA for OpenPGP. The 5
  series supports 4096-bit RSA and ECC (curve25519 on newer firmware).
- **More storage.** More OATH credential slots and FIDO2 resident key capacity.
- **USB-C and Lightning form factors.** The NEO was USB-A only.
- **The old `ykpersonalize` tool is deprecated.** Use `ykman` for everything on
  the 5 series.
- **The 2015 OpenPGP vulnerability** that affected some NEO batches is not
  relevant to the 5 series. If you're still running a NEO, check
  [Yubico's advisory](https://developers.yubico.com/ykneo-openpgp/SecurityAdvisory%202015-04-14.html).
