---
created_at: 2013-01-01T00:00:01-0000
updated_at: 2026-04-05T00:00:00-0000
tags:
  - linux
  - security
  - cli
title: Gatekeeper Script for SSH
slug: gatekeeper-script-for-ssh
aliases:
  - /notes/gatekeeper-script-for-ssh/
---

The gatekeeper pattern adds a post-authentication challenge to SSH sessions
using ForceCommand. The concept was inspired by a scene in a movie where a
system required answering riddles before granting access. While not a substitute
for proper multi-factor authentication, it adds a lightweight additional
verification step.

If you have already set up SSH key authentication with a passphrase on your key,
you have a decent form of multi-factor authentication already. The gatekeeper
script layers on one more check by prompting the user with a challenge after
they have authenticated.

First we need to make a script to handle the additional authentication. Please
note that the following script is just an example. Most of the security is in
place but you will want to implement your own logic for the questions and
answers. I highly recommend using logic that changes periodically but can be
deduced remotely by the client.

```bash
#!/bin/sh
# gatekeeper.sh - Post-login access question script

# In the event that a user tries to get crafty and Ctrl-C out of the script
# we'll just kill the connection
trap jail INT
jail() {
  kill -9 $PPID
  exit 0
}

# Once a user logs in, check to see if they just wanted a shell.
# SSH_ORIGINAL_COMMAND will be null (-z) if they did
if [ -z "$SSH_ORIGINAL_COMMAND" ]; then
  # The answer the user needs to know, a function or call to another script
  # could be used to generate this answer based on any number of resources
  # available to the system. This could include querying an internal web
  # script to get a daily password user's of a site have access to (and
  # perhaps are supposed to be checking)
  local CORRECT_ANSWER="muffins"

  # Message displayed to the user before being prompted, I'm going to assume
  # the user knows the question in this case what's the admin's favorite
  # breakfast
  echo -n "Gatekeeper token authentication required: "

  # Get the user's answer. If the answer is correct execute the command.
  # If the answer is wrong, log the attempt and kill the connection.
  while read -s inputline; do
    RESPONSE="$inputline"
    echo

    if [ $CORRECT_ANSWER = "${RESPONSE}" ]; then
      echo "Gatekeeper authentication accepted."
      $SHELL -l
      exit 0
    else
      logger "Gatekeeper: $USER login failed from $SSH_CLIENT"
      kill -9 $PPID
      exit 0
    fi
  done
fi

# This command will bypass the gatekeeper script if the user tries to rsync as
# this script will break rsync. It creates a fresh shell just for good measure.
#if [ `echo $SSH_ORIGINAL_COMMAND | awk '{print $1}'` = rsync ]; then
#  $SHELL -c "$SSH_ORIGINAL_COMMAND"
#  exit 0
#fi

# If a user tried to execute something other than an 'approved' command just
# kill the session. This will prevent SCP and SFTP unless they are configured
# to bypass the script.
kill -9 $PPID
exit 0
```

Put this script in `/etc/ssh/gatekeeper.sh` and change its permissions to 755
with the owner being root. To make the SSH server pass off control to the
Gatekeeper script once its done authenticating a user, use the `ForceCommand`
directive in the SSHd config file (`/etc/ssh/sshd_config`). Add the following
line to the end of the config and restart the SSH daemon.

```
ForceCommand /etc/ssh/gatekeeper.sh
```

Assuming everything went according to plan, when you SSH into the remote server
once you are done authenticating it will ask for the token. Putting in 'muffins'
should get you to your shell, while anything else will kill the connection.
