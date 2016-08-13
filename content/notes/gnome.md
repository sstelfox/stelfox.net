---
title: Gnome
type: note
---

# Gnome

## Gnome Tweak Tool

```
yum install gnome-tweak-tool -y
```

The settings I use in it:

* Shell
  * Show date in clock: On
  * Arrangement of buttons on the titlebar: All
  * Workspaces only on primary monitor: Off
  * Dynamic workspaces: Off (4)

## Disable PackageKit Software Updates

I manually and automatically update my software and I do not want any
background process holding the yum lock. To disable PackageKit checking for
software open the application "Software Settings" or `/usr/bin/gpk-prefs`.

Change "Check for updates" to Never, Automatically install "Nothing, and "Check
for major upgrades" to Never.

## Prevent Applications from Stealing Focus

Man this bothered me for so long, inside a user's terminal session execute this
command to prevent applications from stealing focus:

```
gconftool-2 -s -t string /apps/metacity/general/focus_new_windows "strict"
```

## Useful Extensions

* https://extensions.gnome.org/extension/106/remove-user-name/
* https://extensions.gnome.org/extension/112/remove-accesibility/
* https://extensions.gnome.org/extension/323/multiple-monitor-panels/
* https://extensions.gnome.org/extension/153/nothingtodo/

