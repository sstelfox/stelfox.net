---
title: Fedora Desktop
type: note
---

# Fedora Desktop

This page just notes some of the steps broken out about setting up my Fedora
desktop/laptops (basically anything not acting as a server). It's a good idea
to reboot the system fresh after performing all of these.

Please note that I only use 64 bit machines now-a-days and everything below
reflects that. I think the only thing this actually effects is the adobe
install though.

This was last tested and was working with Fedora 17.

## Fast and hard updated version

```
sudo yum localinstall --nogpgcheck http://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-stable.noarch.rpm -y
sudo yum localinstall --nogpgcheck http://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-stable.noarch.rpm -y
sudo yum update -y
sudo yum localinstall --nogpgcheck http://rpm.livna.org/livna-release.rpm -y
sudo yum install libdvdcss -y
sudo yum install vlc pidgin gstreamer-plugins-{bad,bad-free,bad-nonfree,good,ugly} tmux vim-enhanced git ruby bash-completion -y
sudo yum install gcc-c++ patch readline readline-devel zlib zlib-devel libyaml-devel libffi-devel openssl-devel make bzip2 autoconf automake libtool bison libxml2 libxml2-devel sqlite sqlite-devel libxslt libxslt-devel -y

sudo systemctl stop sshd.service
sudo systemctl disable sshd.service

ssh-keygen -b 4096 -t rsa -f $HOME/.ssh/id_rsa -q

git clone git://github.com/sstelfox/dotfiles.git $HOME/.dotfiles
$HOME/.dotfiles/install
```

Edit: $HOME/.dotfiles/system-specific/git-user-info.sh

```
curl https://raw.github.com/wayneeseguin/rvm/master/binscripts/rvm-installer | bash -s stable
```

Close and reopen your terminal

```
echo -e "bundler\npry" > ~/.rvm/gemsets/global.gems

rvm install ruby-2.0.0-p247
rvm use ruby-2.0.0-p247 --default
rvm gemset create global
rvm gemset use global

gem install bundler pry
```

Put the following information in `/etc/yum.repos.d/google-chome.repo`

```ini
[google-chrome]
name=google-chrome
baseurl=http://dl.google.com/linux/chrome/rpm/stable/x86_64
enabled=1
gpgcheck=1
```

```
sudo yum install google-chrome-stable --nogpgcheck -y
```

Open Chrome and install a few plugins available at the following URLs:

* http://redditenhancementsuite.com/download-chrome.html

```
sudo yum install levien-inconsolata-fonts freetype-freeworld -y

gsettings set org.gnome.settings-daemon.plugins.xsettings hinting slight
gsettings set org.gnome.settings-daemon.plugins.xsettings antialiasing rgba

echo 'Xft.lcdfilter: lcddefault' >> $HOME/.Xresources
```

Open up Terminal -> Edit -> Profile Preferences, and ensure the following
settings match:

* General -> Don't use system fixed width font
* General -> Font -> Inconsolata Medium -> 10
* General -> Allow bold text
* General -> Disable Terminal bell
* Title and Command -> Run command as a login shell
* Title and Command -> Update login records when command is launched
* Colors -> Don't use colors from system theme
* Built-in schemes: White on black
* Built-in schemes: XTerm
* Scrolling -> Scrollback is unlimited

```
sudo yum install virt-manager kvm libvirtd libvirt libvirt-daemon-kvm \
  libvirt-daemon-lxc libvirt-daemon-qemu libvirt-sandbox -y

sudo systemctl enable libvirtd.service
sudo systemctl start libvirtd.service
```

## Update

First things first update everything as soon as you are capable of it:

```
sudo yum update -y
```

## Supporting TRIM for SSDs

Add `noatime,discard` to every fstab entry of partitions that live on the hard
drive and disable the swap partition.

## RPM Fusion Repository

The following command needs to be run as root and will install the
[RPMFusion][1] free and non-free repositories.

```
yum localinstall --nogpgcheck http://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-stable.noarch.rpm -y
yum localinstall --nogpgcheck http://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-stable.noarch.rpm -y
yum update -y
```

## Livna Repository (Only needed for DVD playback)

Livna was merged into RPM Fusion quite some time ago, but RPM Fusion didn't
want to have libdvdcss in their repository so Livna has lived on for this
reason alone. To install the repository and then the package you'll want to
execute the following commands as root:

```
yum localinstall --nogpgcheck http://rpm.livna.org/livna-release.rpm -y
yum install libdvdcss -y
```

## Install Standard Package Set

Requires RPM Fusion repository

```
yum install vlc pidgin gstreamer-plugins-{bad,bad-free,bad-nonfree,good,ugly} \
  tmux vim-enhanced git ruby bash-completion -y
```

## Generate a new SSH key ##

If this is a reformat ensure the old machine's keys are revoked.

```
ssh-keygen -b 4096
```

## Setup My Dotfiles ##

Run as local user.

```
git clone git://github.com/sstelfox/dotfiles.git ~/.dotfiles
~/.dotfiles/install
```

Edit `~/.dotfiles/system-specific/git-user-info.sh` to reflect your email and
name.

## Install Flash

Please note that as of [Google Chrome][2] version 20, you do not need to
install the unsupported and unupdated version of Adobe flash. Google Chrome 20
for linux comes with a secure updated and sandboxed version of flash that is
fully compatible with Adobe flash. If you need flash for any other applications
then you'll need to install this.

```
yum localinstall http://linuxdownload.adobe.com/linux/x86_64/adobe-release-x86_64-1.0-1.noarch.rpm -y
yum install flash-plugin nspluginwrapper -y
```

## Install ATI Video Drivers (If needed)

Yeah these are pretty brutal... and not stable at all :( Lesson learned don't
buy ATI cards... This requires the RPM Fusion repository and DOES NOT WORK ON
FEDORA 17. The packages haven't been built for this kernel yet, and I've found
a few posts recommending to stick with the stock radeon driver... Either way
I'm leaving this here for later.

There are two different ways to handle these, the akmod version and the kmod
version. Seems like the difference is that akmod supposedly compiles the
drivers for your specific kernel but I think that's bull since that would
require ATI to release their drivers open source which isn't the case... Either
way akmod seems more stable to me so I go that route. If you want to use kmod
instead just s/akmod/kmod/g on all the packages installed here:

```
yum install akmod-catalyst xorg-x11-drv-catalyst xorg-x11-drv-catalyst-libs -y
```

Then you'll want to setup the display's using the catalyst control center:

```
sudo amdcccle
```

And finally reboot.

## Optional Post-Install Steps

* Configure [Google Chrome][2]
* Configure [Firefox][3]
* Configure [Google Earth][4]
* Configure [Pidgin][5]
* Configure [Thunderbird][6]
* Setup [Arduino][7] Development Environment

[1]: http://rpmfusion.org/
[2]: ../../applications/google_chrome/
[3]: ../../applications/firefox/
[4]: ../../applications/google_earth/
[5]: ../../applications/pidgin/
[6]: ../../applications/thunderbird/
[7]: ../arduino/


