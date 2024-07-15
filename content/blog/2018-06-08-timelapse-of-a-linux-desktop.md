---
created_at: 2018-06-08T16:37:39-0600
evergreen: true
public: true
tags:
  - linux
  - tips
title: Timelapse of a Linux Desktop
slug: time-lapse-of-a-linux-desktop
---

# Timelapse of a Linux Desktop

I have the privilege of working full remote. To stay connected with our other remote workers and the main office we keep a live video conference going all the time. It's pretty convenient and definitely allows me to continue to feel connected with the company.

During one of our stand ups, a coworker mentioned that they'd like to see how things looked over time. I have three 1440p monitors and largely leave the video conference on my right most window, which makes recording (an audio free) timelapse pretty easy with FFmpeg.

There are a couple of stack overflow posts about this but I wanted to use VP9 (really I wanted to use AV1, but it isn't well supported yet). This adds a bit of a trick as VP9 wants to analyze a bit of the video and will break if there aren't enough frames so some additional options are needed to get it to work.

These are the settings that worked well for me:

```console
$ ffmpeg -f x11grab -framerate 1 \
  -thread_queue_size 2048 -probesize 10M -analyzeduration 10M \
  -s 2560,1440 -i :1.0+5120,0 \
  -vf settb=\(1/30\),setpts=N/TB/30 -r 30 \
  -s 1280,720 -vcodec vp9 -crf 24 video_conference_$(date +%Y-%m-%d).mkv
```

I organized the parameters so they could easily be explained on a line by line basis. The first line captures the X11 render output (sorry wayland users, you'll have to look elsewhere) with a framerate of 1/second.

The second line holds the parameters that tune the analyze phase for the low bandwidth and low framerate, these values are byte size not duration (10M is 10Mb not 10 minutes).

That third line will likely need to be customized to your display setup. I wanted to capture the size of one of my monitors (-s 2560x1440) which is pretty straight forward. Unusually, my X display is ':1' (visible by printing the $DISPLAY environment variable) instead of the normal ':0'. Finally, x11grab treats multi-monitor displays as one buffer, so to get my right most monitor I have to add an X offset of the combined widths of my other two monitors (that's the 5120,0).

This fourth line is kind of black magic, but ultimately it's adding some metadata to the stream saying that the output will be 30fps, and don't complain that the original framerate was 1fps.

The last line controls the output, I wanted to resize the video down to 720p with a reasonable encode quality, using the VP9 codec I mentioned before, and storing it with a date stamped file name.

When your done recording just Ctrl-C out of it (and give it a few seconds, it may seem like it hung while writing out the data).

If I was going to make a recommendation, you may want to speed this up to 60fps instead of 30 as a full workday will be a tediously long 8 minute video to watch.
