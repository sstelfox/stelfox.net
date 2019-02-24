---
date: 2019-02-12 18:42:49+05:00
tags:
- development
- linux
- nginx
title: Secure Site Development Using Tunnels
---

I find myself regularly writing and testing small HTTP based APIs that need to
be accessible from the outside world for basic functionality. Most commonly
this is when it has it's own dedicated web server and relies on a third party
for authentication (OAuth from GitHub for example) or webhooks (such as from
Slack or Grafana). Running the server and test suite locally is fine and good,
but won't allow any basic integration tests with these external services.

There are tunneling software solutions to public endpoints that accomplish this
very task, but they generally have some downsides. The specific features I'm
interested in roughly ordered by priority are:

1. Allows remote access to a specific server running on my laptop from the
   internet as long as I have a connection to the internet.
2. Works on my laptop (Linux) without any fuss
3. Can tunnel HTTP traffic (others are a bonus but I've never had need of them)
4. Doesn't allow third parties access to credentials that may be passed through
   the tunnel (fully encrypted outside of the client and systems I don't
   personally control).
5. Can use a real fixed DNS name for external access that is easily remembered
   (and preferably something I can specify).
6. Ability to restrict external access to either specific IPs or those that
   have authenticated in some way.
7. Reasonably priced, I'm willing to pay for a service as long as the value to
   time trade off makes sense to me.

The closest off the shelf solution I've found is [Ngrok][1]. The free version
violates my fourth, fifth, and sixth requirement. The paid versions can get me
all of the features I'm looking for but not at a price point I'm willing to pay
for the convenience.

The solution for me was to leverage one of my already existing
Nginx<sup>1</sup> servers, and SSH. As a bonus this is even lower overhead than
Ngrok as I don't need to run any additional third party software beyond what
I'm already using locally, and I'll never have to reasonably worry about third
parties having access to application credentials.

Nginx is fantastic and commonly used reverse proxy. More likely than not when
you put whatever server into production you're working on it will be behind a
reverse proxy like Nginx. Using it as our front end will likely get you closer
to how it will be running production.

Setting up an Nginx server 

<small>
1. This was tested on Nginx version 1.12.1 on Fedora 28
</small>

[1]: https://ngrok.com/
