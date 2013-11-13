---
title: Grub
---

## Security
### Password Protection

If left unchecked a malicious user with console access can add or remove kernel
parameters or chain-boot onto another device when booting using grub. You can
prevent this by requiring the user to enter a password to modify the run-time
configuration of grub on boot.

You can use the 'Bootloader Password' option during a CentOS or Fedora install
however it's uses md5 to hash the password which is a known broken scheme.
''grub-crypt'' which comes installed by default on Fedora allows you to use
sha512 to hash the password like so:

```
[root@localhost ~]# grub-crypt --sha-512
Password: 
Retype password: 
$6$Um4l/Bido.ySrD.H$uuQjipx3uCu/XwGAfqOQsdIw1m1dphRbUbKOsoT5EpCt4LGi0kGdckDE3SPj2eS3pJ9DCJy3V/TqlqJOjjMvJ1
```

Note: Do not use the hash displayed it above, it is not secure (I used
"password")

You would then add the following line (or replace an existing one) to
''/etc/grub.conf''

```
password --sha-512 $6$Um4l/Bido.ySrD.H$uuQjipx3uCu/XwGAfqOQsdIw1m1dphRbUbKOsoT5EpCt4LGi0kGdckDE3SPj2eS3pJ9DCJy3V/TqlqJOjjMvJ1
```

### Protect the Configuration

Since the grub configuration file has a password hash in it (regardless of the
current state of security of that hash type), as additional information about
the server it should be restricted to only be readable and writeable by root
like so:

```
[root@localhost ~]# chmod 600 /etc/grub.conf
```

