---
title: Steam
type: note
---

# Steam

## Installation

### Thing that Didn't Work

Ensure you have the RPMFusion repositories setup.

Install the dependencies:

```
yum install libtxc_dxtn.{i686,x86_64} mesa-libGL-devel.{i686,x86_64} \
  openal-soft.i686 mate-dialogs mesa-libGLU.{x86_64,i686} \
  xorg-x11-fonts-100dpi -y
```

Ensure the 100dpi fonts are in your font path. Add the following line to the
end of the `~/.xinitrc` file:

```
xset +fp /usr/share/fonts/X11/100dpi
```

Add the OpenSUSE Fedora game repository, `/etc/yum.repos.d/games.repo`:

```
[games]name=Games (Fedora_17)
type=rpm-md
baseurl=http://download.opensuse.org/repositories/games/Fedora_17/
gpgcheck=1
gpgkey=http://download.opensuse.org/repositories/games/Fedora_17/repodata/repomd.xml.key
enabled=1
```

The repository seems to have taken down all the steam packages as of January
7th, 2013. It seems incredibly unreliable, other repositories seem to be
getting taken down for now. In the meantime it seems like it may be better to
figure out how to install the .deb file.

### Something else That Didn't work...

```
yum install dpkg -y
wget http://media.steampowered.com/client/installer/steam.deb -O ~/Downloads/steam.deb
mkdir ~/steam
dpkg -x ~/Downloads/steam.deb ~/steam
sudo cp ~/steam/usr/bin/steam /usr/bin/
sudo cp -r ~/steam/* /
sudo restorecon -R /usr/lib/steam/ /usr/bin/steam /etc
sudo yum install libpng.i686 libpng-compat.i686 gtk2.i686 -y
```

