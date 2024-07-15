---
created_at: 2013-01-01T00:00:01-0000
title: Gatekeeper Script for SSH
---

If you've already implemented the SSH keys for authentication and have a
password on your key then you've already achieved multi-factor authentication
to a certain degree.

The gatekeeper script is something that I haven't come across on any other
systems that other people administer. Perhaps it's too much trouble for them
without much gain. I had the idea for this while watching a James Bond movie.

A Russian systems engineer put riddles on one of his machines that you had to
go through in order to access the system, while this alone isn't secure, asking
the user random questions after authentication couldn't hurt security. I highly
recommend using some logic that changes periodically, but the client can
remotely deduce.

First we need to make a script to handle the additional authentication. Please
note that the following script is just an example, most of the security is in
place but you'll want to implement your own logic for the questions and
answers.

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

Put this script in `/etc/ssh/gatekeeper.sh` and change it's permissions to 755
with the owner being root. To make the SSH server pass off control to the
Gatekeeper script once it's done authenticating a user, we'll use the
'ForceCommand' command in SSHd's config file (`/etc/ssh/sshd_config`). Add the
following line to the end of the config and restart the SSH daemon.

```
ForceCommand /etc/ssh/gatekeeper.sh
```

Assuming everything went according to plan, when you SSH into the remote server
once your done authenticating it'll ask for the token. Putting in 'muffins'
should get you to your shell, while anything else will kill the connection.
