---
title: Ruby
type: note
---

# Ruby

## RVM

If using Gnome terminal, you have to set the 'Run command as login shell' check
box on the Title and Command tab inside of gnome-terminal's Settings page to
run the bashrc file upon opening the terminal. If you don't do this you'll
receive "RVM is not a function" error message.

Install all the packages needed to compile ruby...

```
yum install gcc-c++ patch readline readline-devel zlib zlib-devel \
  libyaml-devel libffi-devel openssl-devel make bzip2 autoconf automake \
  libtool bison libxml2 libxml2-devel sqlite sqlite-devel libxslt \
  libxslt-devel -y
```

Install RVM...

```
curl https://raw.github.com/wayneeseguin/rvm/master/binscripts/rvm-installer | bash -s stable
```

```
rvm install ruby-1.9.3
rvm use 1.9.3 --default
```

Create a global gemset:

```
rvm gemset create global
rvm gemset use global
```

And install a few gems useful globally:

```
gem install bundler pry
```

To make sure these get installed automatically for any other ruby versions that
get installed you can use some nifty information pulled from [RVM's
Documentation][1].

```
echo -e "bundler\npry" > ~/.rvm/gemsets/global.gems
```

### Ruby Optimization

By default RVM compiles ruby with no optimization flags. The flags will
increase the time it takes to compile a specific instance of Ruby, however, it
will also save running time with every execution of the code. For me this is a
very useful trade off as I run various Ruby commands hundreds of times a day
when I'm working on various programs. You can add the compilization flags by
creating an ".rvmrc" file in the root of your home directory and include the
following:

```
rvm_configure_env=(CFLAGS="-march=native -O2 -pipe")
```

These are "safe" optimization flags and will make optimizations automatically
based on the processor of the system that compiled it. This has the downside of
making the binaries non-portable (as in you can only move the compiled binaries
to systems with the same or newer processors).

As an additional level of optimizations rather than using the stock Ruby binary
you can use the "turbo" branch with the falcon patch which has decreased rails
load time by half or more. You install this version like so:

```
rvm install 1.9.3-turbo --patch falcon
```

If you encounter any errors about CFlags or compilation errors your RVM is
probably out of date and needs to be updated. On one machine I received the
following error:

```
Error running 'CFLAGS=-march=native -O2 ./configure
--prefix=/home/user/.rvm/rubies/ruby-1.9.3-p194-turbo --enable-shared
--disable-install-doc --with-libyaml --with-opt-dir=/home/user/.rvm/usr ',
please read /home/user/.rvm/log/ruby-1.9.3-p194-turbo/configure.logThere has
been an error while running configure. Halting the installation.
```

Which was quickly solved by running the following command and trying again:

```
rvm get stable
```

I did also encounter an error when that ran for me, but it fixed the issue and
I suspect the error was unrelated.

## RBEnv

http://hmarr.com/2012/nov/08/rubies-and-bundles/

[1]: https://rvm.io//gemsets/initial/

