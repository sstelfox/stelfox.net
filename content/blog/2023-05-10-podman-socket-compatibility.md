---
created_at: 2023-05-10T22:41:02-0400
evergreen: false
public: true
tags:
  - docker
  - linux
  - podman
slug: podman-socket-compatibility
title: Podman Socket Compatibility for Docker Tools
---

While using a tool that unexpectedly was running part of its build using the docker daemon on Linux. I need to quickly come up with a workaround. Most Linux distributions have natively moved away from Docker in favor of the more secure and community maintained "podman" project.

The specific error I was seeing was:

```text
requests.exceptions.ConnectionError: ('Connection aborted.', FileNotFoundError(2, 'No such file or directory'))
```

Connection aborted and file not found together... You generally only see that combination with unix sockets... Which is what tipped me off that this tool was doing something unusual. After a quick use of strace I saw it was trying to access the docker daemon's unix control socket. There is luckily an environment variable that most docker client implementations respect `DOCKER_HOST`, and a podman socket compatibility layer that lets you keep that sweet rootless permission model:

```bash
systemctl --user start podman.socket
export DOCKER_HOST=http+unix:///run/user/$(id -u)/podman/podman.sock
```

Some tools are also shelling out to the `docker` executable behind the scenes as well. The creators of podman maintained CLI compatibility with the docker client which very nicely allows us to use a shell alias to replace the last bit of docker. I keep the following alias in user's my shell config:

```bash
alias docker=podman
```

It's not a 100% solution but it handles most cases and the remaining ones tends to be bugs in the software (such as automatically modifying the URL when not the default with an HTTP prefix "to be helpful").
