---
title: Beets
---

# Beets

[Documentation][1]

## Installation

```
sudo yum install python-pip chromaprint-tools -y
sudo pip-python install beets
sudo pip-python install pyacoustid
sudo pip-python install rgain
sudo pip-python install pylast
```

Configure ~/.beetsconfig like so:

```ini
[beets]
path_format: $artist/$album/$track - $title
import_copy: yes
import_write: yes
import_resume: ask
import_art: yes
import_quiet_fallback: skip
import_timid: no
ignore: .AppleDouble ._* *~ .DS_Store
threaded: yes
color: yes
plugins: chroma embedart lastgenre replaygain scrub

[paths]
default: $albumartist/$album/$track - $title
singleton: $artist/$title
comp: Compilations/$album/$track - $title

[replaygain]
overwrite: yes
```

## Usage

The following command will import music from the given path and copy it into
the directory specified in the configuration file.

```
beet import /path/to/music
```

Adding the `-C` will do the same thing but will update the files in place
rather than copying them elsewhere:

```
beet import -C /path/to/music
```

And finally if you want the metadata to only exist in the database (not update
the files) you can pass it the `-W` flag like so:

```
beet import -W /path/to/music
```

The `-A` flag will import the music without checking the tags. And finally the
`-q` will suppress the prompts and only import the files that have a 95% chance
of matching.

[1]: http://readthedocs.org/docs/beets/en/1.0b12/index.html

