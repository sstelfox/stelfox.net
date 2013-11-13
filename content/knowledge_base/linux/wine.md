---
title: Wine
---

## Installation

```
yum install wine -y
```

I opened up the "winecfg" binary to initialize all the required directories and
changed the Windows version to 7.

### Steam

Download the windows steam installer and attempt to install the MSI:

```
wget http://steampowered.com/download/SteamInstall.msi
wine msiexec /i SteamInstall.msi
```

The tahoma.ttf font is not included in the Microsoft core fonts package. To get
the font, google for "filetype:ttf inurl:tahoma", download it and put it into
your ~/.wine/drive_c/windows/fonts directory.

