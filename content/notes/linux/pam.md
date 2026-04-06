---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
title: PAM
tags:
  - linux
  - security
  - hardening
aliases:
  - /notes/pam/
---
## Overview

`/etc/pam.d/` directory contains the PAM configuration files for each PAM-aware
application. Each pam aware configuration file has lines in the format of:

```
<module interface> <control flag> <module> <module arguments>
```

## Module Interfaces

There are only four module interfaces:

* account - Verify access is allowed. Check if account has expired, time of day
  checks, etc
* auth - Authenticates use, verifies the validity of a password, set credentials
  & group memberships & kerberos tickets
* password - Used for updating credentials
* session - Additional tasks performed after access has been granted, stuff like
  mounting user directories and making users mailbox available.

A module can provide any or all module interfaces.

Module interface directives can be 'stacked' so that multiple modules are used
together for one purpose. The order of these directives. Commented out lines
start with '#'.

## Control flags

* include - The module name that is provided will not load a module, but rather
  include another pam configuration file at this point in the config.
* optional - The module result is ignored, this is only becomes necessary for
  successful authentication when no other modules reference the interface.
* required - The module result must be successful for authentication to
  continue. If the test fails at this point, the user is not notified until the
  results of all modules tests that reference that interface are complete.
* requisite - The module result must be successful for authentication to
  continue. If a test fails at this point, the uesr is notified immediately with
  a message reflecting the first failed required or requisite module test.
* sufficient - The module result is ignored if it fails. However, if the result
  of a module flagged sufficient is successful and no previous modules flagged
  required have failed, then no other results are required and the request
  succeeds.

## Module

Available modules can be found in `/lib/security` or `/lib64/security`
depending on the system architecture.

### Module Arguments

These are module dependent refer to the man page of the module.

## pam_pwquality

`pam_pwquality` (successor to `pam_cracklib`) allows quality control settings for passwords. It checks minimum requirements for different character types and validates against a dictionary.

Recommended (require one of each type, minimum length 14):

```
password  requisite  pam_pwquality.so try_first_pass retry=3 minlen=14 dcredit=-1 ucredit=-1 ocredit=-1 lcredit=-1
```

The credit system works by treating different character classes as contributing different amounts toward the minimum length. Negative values require at least that many of a given class. Positive values give bonus length credit for using that class. Be careful with positive credits as they can allow short passwords of a single character type.

## pam_passwdqc

`pam_passwdqc` is an alternative to `pam_pwquality` for password quality checking. If you use it, make sure `pam_pwquality` (or the legacy `pam_cracklib`) is not also configured in `/etc/pam.d/system-auth`.

You'll need to add this line to the `/etc/pam.d/system-auth`:

```
password  requisite  pam_passwdqc.so retry=3 min=disabled,disabled,22,16,12 passphrase=4 similar=deny enforce=users
```

What this does is it prevent any passwords with one or two character types.
Requires a password with three character types to be a minimum of 16 characters
and one with four character types to be a minimum of 12 characters.

The middle option (22) is the minimum length of a passphrase (grouping of words
found in the dictionary file). The minimum number of words is controlled by the
passphrase option.

It denies similar passwords as previous ones and only enforces quality control
for root passwords (since they're sha512 hashes they only have two character
  classes and would thus be denied).

This is untested but to the best of my knowledge passphrases still need to be
at least three character classes (since one and two are disabled).

## pam_faillock

`pam_faillock` (successor to `pam_tally2`) prevents brute force login attempts by locking accounts after repeated failures. It is recommended to only enable this for remote login services (like SSH) rather than system-wide to avoid locking out legitimate users.

Add to `/etc/pam.d/sshd`:

```
auth    required     pam_faillock.so preauth deny=5 audit silent
auth    required     pam_faillock.so authfail deny=5 audit
account required     pam_faillock.so
```

### Resetting a User's Account

```console
# faillock --user username --reset
```

### Viewing Failed Attempts

```console
# faillock --user username
```

### Automatic Unlocking

The `unlock_time` option (in seconds) allows automatic unlock after a specified period. Adding `unlock_time=1800` allows the user to log back in half an hour after the account has been locked.
