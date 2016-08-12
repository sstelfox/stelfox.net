---
title: Motion
---

# Motion

## Installation

```
yum install motion -y
```

Make sure all your camera's are on and connected.

## Configuration

### SELinux Woes

SELinux by default block motion's access to it's logfile `/var/log/motion.log`,
to allow this write the following out to a file `motion_log_file_access.log`:

```
type=AVC msg=audit(1361649114.076:677): avc:  denied  { open } for  pid=25482 comm="motion" path="/var/log/motion.log" dev="dm-1" ino=6293030 scontext=system_u:system_r:zoneminder_t:s0 tcontext=unconfined_u:object_r:var_log_t:s0 tclass=filetype=SYSCALL msg=audit(1361649114.076:677): arch=c000003e syscall=2 success=no exit=-13 a0=1dc3160 a1=441 a2=1b6 a3=238 items=0 ppid=25481 pid=25482 auid=4294967295 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 ses=4294967295 tty=(none) comm="motion" exe="/usr/bin/motion" subj=system_u:system_r:zoneminder_t:s0 key=(null)
type=SERVICE_START msg=audit(1361649114.103:678): pid=1 uid=0 auid=4294967295 ses=4294967295 subj=system_u:system_r:init_t:s0 msg=' comm="motion" exe="/usr/lib/systemd/systemd" hostname=? addr=? terminal=? res=failed'
```

Run the following commands to generate and install the new policy:

```
cat motion_log_file_access.log | audit2allow -M motion_log_file_access
semodule -i motion_log_file_access.pp
```

It can also help to restore the SELinux contexts on the entire `/var/motion`
directory like so:

```
restorecon -R /var/motion
```

### Disable Auto-Focus on a Camera

I found the LifeCam was regularly refocusing itself much to my annoyance... It
shows up as `/dev/video2` for me so this is how I turned it off:

```
uvcdynctrl -d /dev/video2 -s 'Focus, Auto' 0
```

