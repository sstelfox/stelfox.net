---
date: 2023-05-10T22:41:02-04:00
tags:
- docker
- kubernetes
- linux
- metalk8s
- podman
title: Podman Socket Compatibility for Metalk8s
---

I've long appreciated what a project called [metalk8s][1] has been doing... Making Kubernetes run in an opinionated way for private data centers. I don't agree with all their opinions but it's open source and customizable. There is a problem though...

The `docker` binary and daemon are largely being replaced and deprecated in favor of `podman` in the RedHat distros that metalk8s targets. I fully support this change, `podman` is a great open source tool that listens to user feedback and has far outstripped Docker in capabilities and security features.

I've poked at the project a few times for various reasons, but up to this point I haven't built and deployed a proper cluster using their project. Metalk8s unfortunately still relies on `docker` being installed to build its base ISO images. 

Let me be clear `docker` is a hard requirement the project explicitly lists, but I really don't want to install it and the build will fail quickly without it. Let's see if we can work around it.

After checking out [the repository][1], assuming you have the dependencies installed you should just be able to run `./doit.sh` and get an ISO out that can be used to bootstrap your cluster. Running it without docker will get you fairly far with the output successfully reporting a few images being downloaded... But then `nginx`... You get a long backtrace ending with the following line:


requests.exceptions.ConnectionError: ('Connection aborted.', FileNotFoundError(2, 'No such file or directory'))
```
What an odd error. Connection aborted and file not found together. You only see that combination with unix sockets... Oh... Docker... The running as root service that runs arbitrary code also as root using a unix socket with minimal permission control... Right...

Whelp there is a local override that works as a compatibility shim using `podman` that almost always works. You need to startup a systemd socket service as the user and point anything looking for the Docker daemon at that which is pretty straight forward...

```sh
systemctl --user start podman.socket
export DOCKER_HOST=http+unix:///run/user/$(id -u)/podman/podman.sock
```

For most applications a simple `alias docker=podman` suffices, unfortunately not for this one. And unfortunately this won't 100% solve the problem. The build script will get through pulling all the remote docker images but will fail once it gets to the local ones using the `skopeo` utility as the `metalk8s`project appears to be adding an extra `http://` in front of the socket path that doesn't belong there.

It's getting late and I'm hitting the end of this diagnostics section. Stay tuned for a PR most likely to `metalk8s`.

[1]: https://github.com/scality/metalk8s
