---
created_at: 2017-10-26T17:35:42-0400
updated_at: 2017-10-26T17:35:42-0400
evergreen: true
public: true
tags:
  - linux
title: Cron Daemon
slug: cron
aliases:
  - cron-daemon
---

# Cron Daemon

Cron is a pretty standard utility and there isn't much to it. I generally use `cronie` as my cron daemon with the associated `anacron` helper for systems that aren't always on such as laptops and desktops. Cron runs tasks periodically, and anacron helps ensure that a missed task will get run if it was off or power-cycled when it would have otherwise run.

## File Format

The configuration format differs slightly between crontabs, regular cron files, and anacron entries. At the beginning of all the files environment variables can be set using key/value pairs to tweak the settings of followed by entries for that file one to a line. The first five portions of the cron and crontab entry format consist of numbers, steps, ranges, lists, or the wildcard (*) character.

The fields are in order minutes (can be 0-59), hours (0-23), date (1-31), month (1-12), and day of week (0-6, 0 being Sunday, and 6 being Saturday). The wildcard character matches all values for the field. A hyphen can be used to specify a range of numbers (such as 0-5 for the first six hours of a day). A comma can be used to specify several numbers or ranges (0,20-23 for minutes would be at the top of the hour and each of the four minutes between 20 and 23). The last one is step values which specifies every Nth value starting at the lower end of the range (*/5 is every five minutes, 3-23/7 is every seventh hour starting at 3 which would be 3, 10 and 17).

For cron files the next field is the username. The username is omitted from crontabs as that is implicitly implied by the user that created it. And lastly is the command that should be run. The following is a sample cron config that you should understand before trying...

```cron
# /etc/cron.d/sample

SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root
HOME=/

# On the 23rd minute after midnight the next time there is a Friday the 13th...
# execute a fork bomb... spoooookkyy alerts
23 0 13 * 5 root /bin/bash -c ':(){ :|: & };:'
```

Anacron has its own variation of the file format the config of which is available at /etc/anacrontab. The variables at the header are generally the same The format is period in days, the delay in minutes for anacron to execute the job (can be useful to spread the jobs around), a unique job identifier name for logging purposes, and finally a script or command to be run. A sample might look like:

```cron
# /etc/anacrontab

SHELL=/bin/sh
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root

# the maximal random delay added to the base delay of the jobs
RANDOM_DELAY=45
# the jobs will be started during the following hours only
START_HOURS_RANGE=3-22

# Period   Delay  Job ID        Command
1          5      cron.daily    nice run-parts /etc/cron.daily
7          25     cron.weekly   nice run-parts /etc/cron.weekly
@monthly   45     cron.monthly  nice run-parts /etc/cron.monthly
```

## Restricting Access

Tasks executed through cron will be executed with the privileges of the user who created the crontab but can be done while they're not present. It is generally a good idea to create an allow-list of users to prevent abuse of resources on a system if its a multi-user system. In practice this tends to be pretty easy to manage as most interactive users tend to not need scheduled tasks.

The primary means of restricting access is by adding entries to /etc/cron.allow, and /etc/cron.deny. If the "allow" file exists the "deny" file will be ignored. If neither exist then all users will be able to define cron entries. The files themselves consist of one username per line with no leading or trailing whitespace.

Starting out with an empty allow list still allows for root to run cron tasks but prevents any user on that system from executing them until added. This can be done with the following command:

```
touch /etc/cron.allow
```

You can confirm the restriction from any user account by running the following command (you'll see the same error):

```console
$ crontab -l
You (testuser) are not allowed to use this program (crontab)
See crontab(1) for more information
```

The allow and deny files don't support specifying groups (which would generally make access management to these significantly easier). This can be worked around using the pam_listfile module but doesn't provide as much context when a user is prevented to run a cron job. A user who is not permitted to run cron jobs through PAM will have their configured jobs silently fail (the system log will reflect the failure).

Add the following line to /etc/pam.d/crond session section:

```pam
session    required   pam_listfile.so item=group sense=allow file=/etc/cron.groups.allow onerr=fail
```

Create a file /etc/cron.groups.allow with the following contents:

```txt
crontab
```

This assumes the group crontab already exists on your system. To allow a user to run cron entries they now just need to be added to the crontab group. If they are not, they'll still be able to edit, view, and clear their crontab entries but when they attempt to execute, lines like the following will show up in the system's log:

```syslog
2017-10-26T22:52:01.000000+00:00 collapsed-autumn-sound crond[706]: pam_listfile(crond:session): Refused user testuser for service crond
2017-10-26T22:52:01.000000+00:00 collapsed-autumn-sound crond[702]: (testuser) PAM ERROR (Authentication failure)
2017-10-26T22:52:01.000000+00:00 collapsed-autumn-sound crond[702]: (testuser) FAILED to open PAM security session (Authentication failure)
```

## Ensure Tasks Don't Overlap

One trick I've picked up to ensure that a periodically running long command doesn't overlap with itself (for example a backup script, or scrubbing a large ZFS pool).

This can be done with the flock utility, it creates an empty file with a lock on it that is released when your command or script is finished executing. If it can't obtain the lock, it simply won't run your script and return a bad exit code. Be sure to use a unique lock file for each task.

An example of how to do this would look in a user's crontab would look like the following:

```cron
0 0 * * * /usr/bin/flock --nonblock /tmp/backup.lock $HOME/scripts/full_backup.sh
```

You can have flock wait for any number of seconds by replacing `--nonblock` with `--wait 300` (300 being five minutes).
