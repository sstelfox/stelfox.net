---
title: Splunk
type: note
---

# Splunk

[Download the RPM][1]

```
sudo yum localinstall splunk*.rpm -y
```

Then setup the boot scripts:

```
sudo /opt/splunk/bin/splunk enable boot-start
/etc/init.d/splunk start
```

You'll need to open up port `tcp/8000` as well (which is where the interface
lives).

When you access the interface for the first time, you'll need to login with
'admin' and password 'changeme' and it will prompt you to change the password.

After logging in I closed the tutorial page, and clicked on the large "Add
Data" button on the right, from there I chose "Syslog", followed by "Consume
any syslog files or directories on this Splunk server". All of my network host
logs live in nested directories in `/var/log/hosts`. Although the wizard says
files or directories it really means just files. For this I had to chose "Skip
preview", chose "Continuously index data from a file or directory this Splunk
instance can access". I expanded the "More settings" field.

At this point it occurred to me I'd have to change my rsyslog settings to
something that splunk could handle. I adjusted it so the IP was the root
directory of my hosts rather than the year. I set the field "Set host *" to
"regex on path" with the value "/var/log/hosts/([0-9.]+)" All the other fields
I left at the default.

I think there might have been other services that weren't started by
`/etc/init.d/splunk start` so I rebooted the log server hoping the rest will
come up.

Nothing major came of it so I started poking around in the settings. Under
"Settings" -> "System settings" -> "General settings". I changed the "Pause
indexing if free disk space (in MB) falls below" from 5000 to 2000 (I had 5.2Gb
of disk free but maybe it was close enough).

I now have events!

[1]: http://www.splunk.com/download

