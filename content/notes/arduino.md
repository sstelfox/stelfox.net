---
title: Arduino
type: note
---

# Arduino

## GUI

The screen package isn't necessary but it's useful as a way to access the
serial port.

```
sudo yum install arduino screen -y
```

Add the required groups to your user account.

```
sudo usermod -a -G uucp,dialout,lock $USER
```

You'll need to log out of your desktop environment and back in for the group
settings to take effect.

## Command-line Replacement

```
sudo yum install arduino-core -y
git clone git://github.com/amperka/ino.git
cd ino
sudo make install
```

* http://inotool.org/

