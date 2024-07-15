---
created_at: 2014-07-22T21:54:59-0400
tags:
  - android
  - security
slug: unregistering-from-whisperpush-after-flashing-a-new-rom
title: Unregistering From WhisperPush After Flashing a New ROM
---

I've been playing around with my Nexus 5 lately. It was quickly rooted and I
began playing with various ROMs that had been pre-built for the Nexus 5. My
first stop was the CyanogenMod. Since I'd last used CyanogenMod they added a
built-in framework that provides [transparent text][2] message encryption
called WhisperPush.

WhisperPush is an implementation of [Moxie Marlinspike's][4] highly respected
TextSecure and I was very excited at the possibility of using it. I immediately
signed up for the service.

After a day of use I found CyanogenMod far too unstable too use on my primary
device. It locked up multiple times the first day and mobile data simply
wouldn't work all day. I promptly formatted and flashed my phone, I haven't
settled on a new ROM but that's not what this post is about.

It occurred to me after flashing the phone I was still subscribed to
WhisperPush. If anyone that texts me was signed up as well. I'd never receive
even an encrypted blob, it would just silently fail.

Searching around I found there is very little information on it, and no
official way to unregister, especially after you've wiped your device and no
longer have your credentials. Ultimately I found a fairly easy solution, just
re-register and perform the backdoor steps too de-register.

I wiped my phone again and installed a new copy of the CyanogenMod nightly.
Booted it up and re-enabled WhisperPush. It didn't even note that my number was
registered in the past.

I found the solution somewhere in the CyanogenMod forums (though I lost the
link, and I'm now too lazy to go find it again). You can unregister by
performing the following steps:

1. Connect your computer with ADB too the phone and pair the computer with the
   phone.
2. Enable developer options by opening the system settings, choosing 'About
   phone' and clicking on the 'Build number' about 7 times (it will start
   counting down).
3. Open up the developer options found in the root of the system settings menu
   and enable root access for 'Apps and ADB'.
4. On the computer use `adb shell` to get a shell on the device.
5. Switch to root using the `su` command.
6. Run the following command too view the WhisperPush internal settings:

    ```
    cat /data/user/0/org.whispersystems.whisperpush/shared_prefs/org.whispersystems.whisperpush_preferences.xml`
    ```

7. Note down the value for `pref_registered_number` (this should be your phone
   number with a preceding '+') and `pre_push_password`.
8. Exit the shell.

Finally too unregister we need too make a DELETE request against the
WhisperPush API. The classic HTTP swiss army knife `curl` is going to help us
on this front. Run the following command on any linux computer with curl
installed, replacing the registered number and registered password with the
value you recorded earlier.

```bash
curl -v -k -X DELETE --basic --user ${pref_registered_number}:${pre_push_password} https://whisperpush.cyanogenmod.org/v1/accounts/gcm
```

Be sure too include the '+' in your pref_registered_number. You should end up
with a status code of 204. The output will look something like the following
(credentials removed).

```
* About to connect() to whisperpush.cyanogenmod.org port 443 (#0)
*   Trying 54.201.5.27...
* Connected to whisperpush.cyanogenmod.org (54.201.5.27) port 443 (#0)
* Initializing NSS with certpath: sql:/etc/pki/nssdb
* skipping SSL peer certificate verification
* SSL connection using TLS_DHE_RSA_WITH_AES_128_CBC_SHA
* Server certificate:
*   subject: OU=Operations,O="Cyanogen, Inc.",E=ops@cyngn.com,C=US,ST=Washington,L=Seattle,CN=whisperpush.cyanogenmod.org
*   start date: Nov 26 05:39:18 2013 GMT
*   expire date: Nov 24 05:39:18 2023 GMT
*   common name: whisperpush.cyanogenmod.org
*   issuer: E=ops@cyngn.com,CN=Authority,OU=Operations,O="Cyanogen, Inc.",L=Seattle,ST=Washington,C=US
* Server auth using Basic with user '${pref_registered_number}'
> DELETE /v1/accounts/gcm HTTP/1.1
> Authorization: Basic ${encoded credentials}
> User-Agent: curl/7.29.0
> Host: whisperpush.cyanogenmod.org
> Accept: */*
> 
< HTTP/1.1 204 No Content
< Server: nginx/1.1.19
< Date: Wed, 23 Jul 2014 01:45:25 GMT
< Connection: keep-alive
< 
* Connection #0 to host whisperpush.cyanogenmod.org left intact
```

I don't have any way too check that I'm unregistered but it seems too have
worked. Here is hoping this helps some else out in the future.

[2]: https://whispersystems.org/blog/cyanogen-integration/
[4]: http://thoughtcrime.org/
