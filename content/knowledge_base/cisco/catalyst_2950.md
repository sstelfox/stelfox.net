---
title: Catalyst 2950
---

## Configuration Wipe

```sh
cisco2950# write erase
Erasing the nvram filesystem will remove all files! Continue? [confirm]y[OK]
Erase of nvram: complete
cisco2950# delete vlan.dat
Delete filename [vlan.dat]? 
Delete flash:vlan.dat? [confirm]
cisco2950# reload
```

## Firmware Upgrade

A firmware upgrade requires a TFTP server running locally. In the examples
below the TFTP server is running on 192.168.0.103. The tar upgrade file is
named "c2950-i6q4l2-tar.121-22.EA7.tar" on the TFTP server. The bin upgrade
file is named "c2950-i6q4l2-mz.121-22.EA7.bin"

Because of potential incompatibilities between firmware versions it's always a
good idea to clear the configuration before rebooting. This is included in the
instructions below. You will of course need to re-configure the system as if it
was new each time.

### Tar Upgrade

A Tar upgrade usually includes the html files for the web interface as well as
the system binary, as such it's usually necessary (and recommended) to delete
the html directory to make room for the new files even if you have no intention
of using the web interface.

```sh
cisco2950# delete /recursive html
Delete filename [html]? 
Examine files in directory flash:html? [confirm]
...
(Confirm all the file deletes)
...
cisco2950# archive tar /x tftp://192.168.0.103/c2950-i6q4l2-tar.121-22.EA7.tar flash:
Loading c2950-i6q4l2-tar.121-22.EA7.tar from 192.168.0.103 (via Vlan100):
...
(The switch will extract all of the files)
...cisco2950# config terminal
cisco2950 (config)# boot system flash:/c2950-i6q4l2-mz.121-22.EA7.bin
cisco2950 (config)# exit
cisco2950# write erase
Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]
[OK]
Erase of nvram: complete
cisco2950# reload

System configuration has been modified. Save? [yes/no]: n
Proceed with reload? [confirm]
Connection closed by foreign host.
```

### Bin Upgrade

A Bin upgrade ''does not'' include html files for the web interface. Do not
remove them if there is need for a web interface.

```sh
cisco2950# copy tftp://192.168.0.103/c2950-i6q4l2-mz.121-22.EA7.bin flash:
...
(The switch will copy the file)
...
cisco2950# config terminal
cisco2950 (config)# boot system flash:/c2950-i6q4l2-mz.121-22.EA7.bin
cisco2950 (config)# exit
cisco2950# write erase
Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]
[OK]
Erase of nvram: complete
cisco2950# reload

System configuration has been modified. Save? [yes/no]: n
Proceed with reload? [confirm]
Connection closed by foreign host.
```

