---
title: Samba
type: note
---

# Samba

FEAR FOR THOSE WHO TREAD THESE WATERS FOR THEY ARE DEEP AND EVIL.

## SELinux Adjustments

SELinux hates Samba and with good reason. To allow authenticated clients to
access the contents of a samba share you need to label the share. The easiest
way to make this persistent is by adjusting the targeted SELinux config. In the
following example the only samba share is location at /media/sharing.

Add this to `/etc/selinux/targeted/contexts/files/file_contexts`:

```
/media/storage(/.*)?    system_u:object_r:samba_share_t:s0
```

Then run this command:

```
[root@localhost ~]# restorecon -R /media/storage
```

## On Anonymous Access

If you intend to allow anonymous browsing of shares and/or access to a share,
you will need to create a 'nobody' user with no password and add a few lines to
the configuration file. Add the user by following the instructions in 'Managing
Users'

## Managing Users

To add a samba user make sure they have an account on the local machine, and
run the command:

```
[root@localhost ~]# pdbedit -a <username>
```

To list samba users:

```
[root@localhost ~]# pdbedit -L
```

To delete a samba user:

```
[root@localhost ~]# pdbedit -x <username>
```

## Configuration

### /etc/samba/smb.conf

```ini
[global]
# ----------------------- Network-Related Options -------------------------

        workgroup = Pantheon
        server string = For Sexual Favors
        netbios name = Moirae
        interfaces = eth0:0
        bind interfaces only = yes
        hosts allow = 10.13.37.0/24
        guest account = nobody
        map to guest = bad user
        force directory mode = 0777
        force create mode = 0666

        # Force master browser elections to choose this server
        domain master = no
        local master = yes
        preferred master = yes
        os level = 60

        socket options = TCP_NODELAY
        read raw = yes
        write raw = yes

        security = user
        passdb backend = tdbsam

# --------------------------- Logging Options -----------------------------

        # log files split per-machine:
        log file = /var/log/samba/log.%m

        # maximum size of 50KB per log file, then rotate:
        max log size = 50

# --------------------------- Printing Options -----------------------------
# Disable printing altogether

        load printers = no
        printcap name = /dev/null
        printing = bsd
        disable spoolss = yes

# --------------------------- File System Options ---------------------------

;       map archive = no
;       map hidden = no
;       map read only = no
;       map system = no
;       store dos attributes = yes


#============================ Share Definitions ==============================

[Hidden]
        comment = I'm a secret!
        browsable = no
        path = /media/storage/Dropbox
        public = no
        writable = no
        printable = no
        write list = @users
        guest ok = no

[Anonymous Dropbox]
        comment = Public File Drop Be Nice
        browsable = yes
        path = /media/storage/Dropbox
        public = yes
        writable = yes
        printable = no
        guest ok = yes

[Media]
        comment = Public Media Shares
        browsable = yes
        path = /media/storage/Media
        public = yes
        writable = no
        printable = no
        write list = @users
        guest ok = yes
```

