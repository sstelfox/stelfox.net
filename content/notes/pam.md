---
title: PAM
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

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

### Confusing Lines I Don't Understand

```
account [default=bad success=ok user_unknown=ignore] pam_krb5.so
```

## pam_cracklib

`pam_cracklib` allows for quick quality control settings of passwords. It
allows minimum requirements of the number of different types of characters that
need to be used in a password before it can be used. It also checks the
password against a dictionary.

By default it checks against a dictionary but that really isn't enough for good
password security. Further password control can be accomplished using
`pam_passwdqc`.

Default:

```
password  requisite  pam_cracklib.so try_first_pass retry=3 type=
```

Recommended (require one of each type, minimum length 14):

```
password  requisite  pam_cracklib.so try_first_pass retry=3 minlen=14 dcredit=-1 ucredit=-1 ocredit=-1 lcredit=-1
```

Other (credit based):

```
password  requisite  pam_cracklib.so try_first_pass retry=3 minlen=22 dcredit=2 ocredit=4
```

The credit based system requires a bit of explaining, it requires a 22
character password and treats numbers as 2 characters and symbols as 4
characters. This can be dangerous as you can have an 11 digit number as a
password which isn't secure...

## pam_passwdqc

`pam_passwdqc` replaces `pam_cracklib` in checking the quality of the password.
To use it you need to comment out `pam_cracklib` in `/etc/pam.d/system-auth`.

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

## pam_tally2

`pam_tally2` comes with Fedora's pam package so it will be installed. It's very
useful to prevent bruteforce attempts BUT it can also used to lock access out
to a legitimate user. It is recommended to not turn this on for the entire
system but just remote login services that use pam (for example SSH).

To use it you need to add the following line to the services pam file. So for
SSH the file would be `/etc/pam.d/sshd`. The following is what needs to be
added:

```
auth    required     pam_tally2.so deny=5 onerr=fail audit silent
account     required     pam_tally2.so
```

You'll also need to change:

```
auth     sufficient     pam_unix.so nullok try_first_pass
```

To:

```
auth     required     pam_unix.so nullok try_first_pass
```

And get rid of the following two lines as they will interfere with the rest of
the changes:

```
auth     requisite    pam_succeed_if.so uid >= 500 quiet
auth     required     pam_deny.so
```

### Resetting a User's Account

Information about users password tally can be found in `/var/log/tallylog`.

```
[root@localhost ~]# /sbin/pam_tally2 --user username --reset
```

### Automatic Unlocking

Additionally adding `unlock_time=1800`. This allows the user to log back in
half an hour after the account has been locked.
