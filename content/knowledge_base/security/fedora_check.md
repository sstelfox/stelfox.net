---
title: Fedora Check Script
---

# Fedora Check Script

## TODO

* Find a way to only update files affected by the update and no others.
* Only update the aide database ''if there were updates to be applied''
* Keep the SHA1 and MD5 hashes in a file outside of the scripts

## Source

You will more likely than not need to update the SHA1 and MD5 signatures of the
files. Ensure that all of the binaries are available on the system.

```sh
#!/bin/sh

# Executables used by this script
YUM="/usr/bin/yum"
AIDE="/usr/sbin/aide"
RPM="/bin/rpm"
SHA1="/usr/bin/sha1sum"
MD5="/usr/bin/md5sum"
AWK="/bin/awk"

# These are used to verify the integrity of our HIDS early in the script
AIDE_SHA1="a380c8f2fdfda50366eeb51476fb6508ebfcbf0c"
AIDE_MD5="88ddf45c648ad336201d7fa986eeccc9"
AIDECONF_SHA1="06283206d37c0f6ee5a45d29ca50ee61b7ae66f1"
AIDECONF_MD5="38ab9065a05f329bc04737f9a774cdde"

# This function should get triggered if there are any signs of a potential
# security breach on this system. It would be nice to be able to leave a tag
# somewhere with a message so I know to be careful when bringing this system
# back online, but that can be added in the future since this is the only
# place it'll need to change.
function disaster() {
        echo "
A critical system change has occurred outside of normal means.
To ensure the integrity of this system and the overall network,
this machine will be forced off."
        #halt
}

# This will check to ensure that the AIDE binary and configuration files
# have not been tampered with.
C_AIDE_SHA1=`$SHA1 $AIDE | $AWK '{print $1}'`
C_AIDE_MD5=`$MD5 $AIDE | $AWK '{print $1}'`
C_AIDECONF_SHA1=`$SHA1 /etc/aide.conf | $AWK '{print $1}'`
C_AIDECONF_MD5=`$MD5 /etc/aide.conf | $AWK '{print $1}'`

if [ "$C_AIDE_SHA1" != "$AIDE_SHA1" ]; then
        echo "sha1 mismatch for $AIDE"
        disaster
fi
if [ "$C_AIDE_MD5" != "$AIDE_MD5" ]; then
        echo "md5 mismatch for $AIDE"
        disaster
fi
if [ "$C_AIDECONF_SHA1" != "$AIDECONF_SHA1" ]; then
        echo "sha1 mismatch for /etc/aide.conf"
        disaster
fi
if [ "$C_AIDECONF_MD5" != "$AIDECONF_MD5" ]; then
        echo "md5 mismatch for /etc/aide.conf"
        disaster
fi

# Ensure that no one has tampered with the system. If anyone has we need
# trigger full disaster mode.
echo "Checking AIDE..."
nice -n 19 $AIDE --check > /dev/null
if [ "$?" -ne 0 ]; then
        echo "Failed the AIDE check"
        disaster
fi

# Check to make sure our system is intact as far as the RPM database knows about
# this could be another potential sign that someone has been tampering with the
# system and should also trigger full disaster mode.
echo "Checking RPM database..."
CHNGES=`nice -n 19 rpm -qVa | awk '$2!="c" {print $0}'`
CHNGCOUNT=`echo "$CHNGES" | wc -l`
if [ "$CHNGCOUNT" -ne 0 ]; then
        echo "The RPM database appears to be corrupted."
        echo $CHNGES
        disaster
fi

# We want to update yum before we update anything else to minimize
# any bugs that may have been fixed. This can also find errors with
# the installation system before they update a process-critical
# package
echo "Updating yum..."
$YUM -e 0 -d 0 update yum -y

echo "Updating the rest of the system..."
# Update the rest of the system
$YUM -e 0 -d 0 update -y

# If any updates happened they would have altered AIDE's database, we need to
# rebuild it and move it into position.
echo "Rebuilding new AIDE database..."
nice -n 19 $AIDE --init > /dev/null
if [ "$?" -eq 0 ]; then
        mv -f /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
        if [ "$?" -ne 0 ]; then
                echo "Unable to move new AIDE database into position!"
                disaster
        fi
else
        echo "Unable to rebuild AIDE database"
        disaster
fi
```

