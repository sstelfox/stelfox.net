---
date: 2017-10-19 05:19:12
tags:
- security
title: Security Principles
---

While reviewing current security hardening practices put out by several
organizations and attempting to filter the good recommendations from the
outdated legislated requirements, I came across one of the best descriptions of
basic security principles. You can find it in the [NIST Guide to General Server
Security][1] (published in 2008).

I've replicated section 2.4 from the linked document (I have removed the
footnotes, but it is otherwise unchanged) in its entirety here for safe keeping
and to hopefully help expose this to more people.

When addressing server security issues, it is an excellent idea to keep in mind
the following general information security principles:

**Simplicity** --- Security mechanisms (and information systems in general)
should be as simple as possible. Complexity is at the root of many security
issues. 

**Fail-Safe** --- If a failure occurs, the system should fail in a secure
manner, i.e., security controls and settings remain in effect and are enforced.
It is usually better to lose functionality rather than security.

**Complete Mediation** --- Rather than providing direct access to information,
mediators that enforce access policy should be employed. Common examples of
mediators include file system permissions, proxies, firewalls, and mail
gateways.

**Open Design** --- System security should not depend on the secrecy of the
implementation or its components.

**Separation of Privilege** --- Functions, to the degree possible, should be
separate and provide as much granularity as possible. The concept can apply to
both systems and operators and users. In the case of systems, functions such as
read, edit, write, and execute should be separate. In the case of system
operators and users, roles should be as separate as possible. For example, if
resources allow, the role of system administrator should be separate from that
of the database administrator.

**Least Privilege** --- This principle dictates that each task, process, or
user is granted the minimum rights required to perform its job. By applying
this principle consistently, if a task, process, or user is compromised, the
scope of damage is constrained to the limited resources available to the
compromised entity.

**Psychological Acceptability** --- Users should understand the necessity of
security. This can be provided through training and education. In addition, the
security mechanisms in place should present users with sensible options that
give them the usability they require on a daily basis. If users find the
security mechanisms too cumbersome, they may devise ways to work around or
compromise them. The objective is not to weaken security so it is
understandable and acceptable, but to train and educate users and to design
security mechanisms and policies that are usable and effective.

**Least Common Mechanism** --- When providing a feature for the system, it is
best to have a single process or service gain some function without granting
that same function to other parts of the system. The ability for the Web server
process to access a back-end database, for instance, should not also enable
other applications on the system to access the back-end database.

**Defense-in-Depth** --- Organizations should understand that a single security
mechanism is generally insufficient. Security mechanisms (defenses) need to be
layered so that compromise of a single security mechanism is insufficient to
compromise a host or network. No "silver bullet" exists for information system
security.

**Work Factor** --- Organizations should understand what it would take to
break the system or network’s security features. The amount of work necessary
for an attacker to break the system or network should exceed the value that the
attacker would gain from a successful compromise.

**Compromise Recording** --- Records and logs should be maintained so that if a
compromise does occur, evidence of the attack is available to the organization.
This information can assist in securing the network and host after the
compromise and aid in identifying the methods and exploits used by the
attacker. This information can be used to better secure the host or network in
the future. In addition, these records and logs can assist organizations in
identifying and prosecuting attackers.

[1]: http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-123.pdf
