---
date: 2014-06-30 21:43:02 -0400
slug: "fixing-erratic-bmc-controller-on-poweredge-c6100"
tags:
- server
- c6100
title: "Fixing Erratic BMC Controller on PowerEdge C6100"
type: post
---

I randomly started experiencing an issue with one blade in one of my PowerEdge
C6100 blades. It wouldn't obey all commands issued too it via IPMI or through
the BMC's web interface. Additionally the blade would randomly power on when
off, and the front light would consistently blink as if a hardware fault was
detected.

This has been bothering me for a while, but it was my spare blade and wasn't
affecting my lab in anyway so I've ignored it. I finally needed it for a
project and looked into what may be causing the issue.

A [thread][1] on the Serve the Home forums lead to me too a solution, even
though my symptoms didn't quite match up with what I was experiencing.

I downloaded the [PowerEdge C6100 Owner's Manual][2] for the jumper
information, and found it too be redudant. The board itself has each of the
jumpers clearly labeled.

After pulling the affected chassis out of the server I connected the pins for
the CMOS reset, CMOS password reset, and system reset for about 15 seconds. I
pulled the jumpers, reinstalled the blade and it's happy once again. Problem
solved.

*Update:* After performing a few commands via the web interface the issue
returned. I'm still looking for a solution too the problem.

*Update 2:* I'm now suspecting that the issue may be related too me not
updating the FSB, which is responsible for handling power management of
individual nodes as well as reporting temperature and command response from the
BMC.

[1]: http://forums.servethehome.com/index.php?threads/dell-c6100-anyone-brick-a-board-yet.1448/
[2]: http://ftp.dell.com/Manuals/all-products/esuprt_ser_stor_net/esuprt_cloud_products/poweredge-c6100_Owner%27s%20Manual_en-us.pdf
