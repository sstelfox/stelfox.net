---
date: 2014-04-14 10:19:23 -0400
slug: disabling-gnomes-keyring-in-fedora-19
tags:
- linux
title: Disabling Gnome's Keyring in Fedora 19
---

An update too Fedora a while ago started causing some unexpected behavior with
my dotfiles. Specifically the way I was handling my SSH agent. My SSH keys when
added to my agent automatically expire after a couple of hours.

After the update, when that expiration came I started receiving errors in my
shell that looked similar to the following (Since I fixed it I am not able to
get the exact working again):

```
Warning: Unable to connect to SSH agent
```

I also noticed that periodically I got a Gnome keyring pop-up asking for my SSH
agent rather than my command-line client. I'm personally not a big fan of
Gnome, but I deal with because it's the default for Fedora, tends to stay out
of your way, and switching to something else is just not a project I've had
time for.

Now Gnome was very much getting in my way. I dealt with it for several months
now and finally got sick of it.

I tracked this down too the `gnome-keyring-daemon` which was starting up and
clobbering the contents of my `SSH_AUTH_SOCK` variable along with my
`GPG_AGENT_INFO` environment. Not very friendly.

There were a couple paths that I could've gone for for solving this situation.
The first, and easiest way to probably have dealt with this was too put some
logic into my `~/.bashrc` file that detected when the `gnome-keying-agent` was
running, kill it and clean up after it. It might look something like this:

```sh
if [ -n "${GNOME_KEYRING_PID}" ]; then
  if $(kill -0 ${GNOME_KEYRING_PID}); then
    kill -9 ${GNOME_KEYRING_PID}
  fi
fi

unset GNOME_KEYRING_CONTROL SSH_AUTH_SOCK GPG_AGENT_INFO GNOME_KEYRING_PID
```

I share my dotfiles along a lot of different systems and don't like
system-specific behavior getting in there. Instead I choose to find what was
starting up the keyring daemon and preventing it from doing so. Without a good
place to start and stubbornly refusing to Google this particular problem I took
the brute force approach of grep for the binary name in the `/etc` directory.

Sure enough in `/etc/xdg/autostart` I found a series of background daemons that
I definitely did not want nor need running. As root I ran the following command
to purge them from my system:

```sh
cd /etc/xdg/autostart
rm -f gnome-keyring-{gpg,pkcs11,secrets,ssh}.desktop
```

The first solution will keep your system in a default state, but this will
permanently prevent the obnoxious behavior on your system for all users and
prevents you from adding hacks to your bashrc to work around misbehaving
software.

I hope this helps someone else!
