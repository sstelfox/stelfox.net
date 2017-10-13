---
date: 2017-10-12 23:09:01-04:00
slug: the-case-of-an-empty-executable
tags:
- linux
title: The Case of an Empty Executable
draft: true
---

I recently came across a [short article][1] written about a decade ago. It was
a curious thing already as it was hosted in a user's home directory off a
webserver with the standard '~<username>' showing up in the URL. The important
part that caught my eye was this:

> The "true" program does nothing; it merely exits with a zero exit status.
> This can be done with an empty file that's marked executable, and that's what
> it was in the earliest unix system libraries.

Being a curious sort, and presented with an old mystery, I had to try out this
little tidbit of information:

```sh
$ echo -n > test
$ chmod +x test
$ ./test
$ echo $?
0
```

Sure enough, an empty file can be successfully run. It obviously doesn't have a
known binary header, so it won't be interpretted as a valid executable on it's
own. Even scripts rely on the shebang header (`#!`) to be considered valid by
the kernel, so something else has to be executing this. We can confirm the
kernel isn't recognizing this by abusing `strace` into calling an explicit
execve on the file:

```
$ strace ./test
execve("./test", ["./test"], 0x7ffe74e0a720 /* 70 vars */) = -1 ENOEXEC (Exec format error)
fstat(2, {st_mode=S_IFCHR|0620, st_rdev=makedev(136, 3), ...}) = 0
write(2, "strace: exec: Exec format error\n", 32strace: exec: Exec format error
) = 32
getpid()                                = 24047
exit_group(1)                           = ?
+++ exited with 1 +++
```

This is exactly what I was expecting and the [Kernel source][2] reflects
exactly what I'd expect. I'll leave it up to you test the results on an empty
but otherwise valid shell script. With the kernel cleared of any odd behavior I
was left with only one suspect. A little shell by the name of bash.

Bash is a coy devil with several different mechanisms built-in to execute a
program. Likely one of these culprits are being used behind the scenes when we
run a program. A quick trip the [man page][3] and a late night cup of coffee
narrowed down my search to the following functions:

* command
* eval
* exec

I decided it was time to talk to each of them one by one and see what was up.
Putting them under the bright light I was surprised that they all were telling
the same story:

```
$ command ./test
$ echo $?
0
$ eval ./test
$ echo $?
0
$ exec ./test
-bash: /home/playground/test: Success
```

How sinister! Someone had gotten to them first, I have to go higher into their
organization. This calls for... the source. I quickly traverse into the builtin
directory and identify the commonality `parse_and_execute`. This is where it
gets a little fuzzy as bash is a rather complicated code base and I didn't want
to spend to much time on this in the middle of the night.

After parsing the file, it does seem to treat it as a script (as expected).
There are two possibilities here and I didn't trace down which was true. Either
parse_and_execute is simply returning with a success or it is sending the
contents to `execute_command_internal`, which in turn defaults to a successfuly
return value.

The motive remains unclear, but no harm seems to be getting done so I'm going
to call this one case closed. It'd be interesting to see how other shells
behave with empty files.

[1]: http://trillian.mit.edu/~jc/humor/ATT_Copyright_true.html
[2]: https://github.com/torvalds/linux/blob/c2315c187fa0d3ab363fdebe22718170b40473e3/fs/binfmt_script.c#L24
[3]: https://www.gnu.org/software/bash/manual/bash.txt
