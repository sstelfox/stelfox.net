---
title: SELinux
weight: 35

date: 2016-09-13T01:01:45-04:00
updated: 2017-11-17T13:39:51-05:00

taxonomies:
  tags:
  - linux
  - security
  - selinux

---

## Current Status

Very useful information:

```
# sestatus
SELinux status:                 enabled
SELinuxfs mount:                /sys/fs/selinux
SELinux root directory:         /etc/selinux
Loaded policy name:             strict
Current mode:                   enforcing
Mode from config file:          enforcing
Policy MLS status:              disabled
Policy deny_unknown status:     denied
Memory protection checking:     actual (secure)
Max kernel policy version:      30
```

## Toggling Enforcement

```
# getenforce
Enforcing
# setenforce 0
# getenforce
Permissive
# setenforce 1
# getenforce
Enforcing
```

I believe the ability to disable SELinux at runtime can be completedly
disabled. The relevant options are `CONFIG_SECURITY_SELINUX_DISABLE`,
`CONFIG_SECURITY_SELINUX_DEVELOP`, and `CONFIG_SECURITY_SELINUX_BOOTPARAM`. I
need to research this more to figure out the extent of restrictions that can be
applied (as well as through the SELinux policy itself).

## Users and Logins

Viewing your current assigned context:

```
id -Z
```

Users to role mapping in the strict gentoo selinux policy:

* `unconfined_u` -> `unconfined_r`
* `user_u` -> `user_r`
* `staff_u` -> `staff_r,sysadm_r -> newrole_t,semanage_t`
* `sysadm_u` -> `sysadm_r -> newrole_t,semanage_t`
* `system_u` -> `system_r`

## Quick Command Reference

* View selinux login mappings: `semanage login -l`
* Create a new mapping: `semanage login -a -s staff_u sstelfox`
* Modify existing mapping: `semanage login -m -s user_r sstelfox`
* When mappings have changed be sure to update that user's home directory: `restorecon -RF /home/sstelfox`
* Deleting a mapping: `semanage login -d sstelfox`
* View selinux users: `semanage user -l`
* Add a new user: `semanage user -a -R "staff_r dbadm_r" dbadm_u`
* Modifying: `semanage user -m -R "dbadm_r" dbadm_u`
* Removing: `semanage user -d dbadm_u`
