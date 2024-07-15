---
created_at: 2014-06-03T11:43:59-0400
tags:
  - docker
  - linux
slug: modifying-the-hosts-file-in-a-docker-container
title: Modifying the Hosts File in a Docker Container
---

Before I describe the issue that I encountered, let me be very clear. This hack
is *potentially dangerous and should absolutely only be done in development
environments*. This won't affect your host system, only the docker container so
the most damage you'll do is prevent hostname and possibly user/group lookups
within the container itself.

Alright with that out of the way, I was actively working on a codebase that
uses subdomains as part of the identifier. Rather than setup a full DNS server,
point my local system at it and load in the domains I wanted to simply modify
the /etc/hosts file inside the environment.

Docker mounts an /etc/hosts file inside it's containers, read-only, and the
container's 'root' user has had it's mount permissions revoked so it's not able
to be modified. Other users have encountered this issue, and a [novel
workaround was put forward][1]. The solution however makes use of Perl, and is
specific too Ubuntu base systems.

I'll explain the solution after showing a more general way to accomplish the
same thing. Different linux systems will store their libraries in different
directory structures. CentOS is different from Fedora, which is different from
Ubuntu and Debian. All of them name their libraries, in this case we're looking
for 'libnss_files.so.2'.

You can find where your copy of this library lives with the following command.
This should be run inside the docker container that you want to modify the
/etc/hosts file in.

```bash
find / -name libnss_files.so.2 -print 2> /dev/null
```

Pay attention to the path, multiple files may show up and you want the one that
matches your system's running kernel (generally x86_64 systems will have their
libraries in a lib64 directory).

Once you've found this add the following lines to your Dockerfile. Make sure
you modify the path in the copy in the first line to the path of your copy of
the library. Once done you'll use the /var/hosts file to modify your hosts file
instead.

```docker
RUN mkdir -p /override_lib && cp /etc/hosts /var/ && cp /usr/lib64/libnss_files.so.2 /override_lib
RUN sed -ie 's:/etc/hosts:/var/hosts:g' /override_lib/libnss_files.so.2
ENV LD_LIBRARY_PATH /override_lib
```

So what is this actually doing? On linux systems, name configurations such as
DNS, username, and group lookups are generally handled by the `nss` or name
service switch configuration tools including the hosts file. The library that
we're copying and modifying is a very specific to reading from files on the
system and includes the default paths to these files.

Generally you have to be very careful when you're manipulating strings within
compiled libraries. The length of the string is encoded along with it, so at a
minimum it's important that the string is *the same length or less*. You can
get away with less but it requires additionally writing an end of string
character as well.

Too make this hack simple, we're simply replacing the 'etc' with 'var', both
systems directories that regular users generally should have read access but
not write access too.

Finally we need to tell all programs that need to perform lookups using
hostnames in the hosts file to make use of our modified library instead of the
system one. Linux will look for shared libraries at runtime in any paths set in
in the LD_LIBRARY_PATH (colon delimited just like PATH) and this doesn't
require any privileges too set.

And the result? An editable hosts file, with no extra services. I can't stress
enough though, there could be bad ramifications from modifying libraries this
way. This is definitely not a 'production ready' hack.

[1]: https://stackoverflow.com/questions/19414543/how-can-i-make-etc-hosts-writable-by-root-in-a-docker-container
