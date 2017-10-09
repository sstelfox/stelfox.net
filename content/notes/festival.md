---
title: Festival
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Festival is packaged in a way on Fedora in a standalone mode, it does not come
with an init script to startup it's server on boot so the following is an
adaptation of another one custom written to handle this. It's primarily used in
Fedora for Gnome's usability support which doesn't run the server as a daemon.

Listening to the samples of the stock voices, I've found that `ked` sounds the
best in my opinion and at least until we here try and make our own diphone
database this is the voice that I'm going to use.

Packages:

* festival
* asterisk-festival
* festvox-ked-diphone

In Fedora the voices are stored in the directory
`/usr/share/festival/lib/voices/*/` directories. These are the voice that you
have to choose from when configuring festival. The configuration files live in
`/etc/festival/`.

We're only interested in `/etc/festival/festival.scm` which doesn't exist by
default. The following file has the `ked` voice set to be the default. I left
the other voice in there commented out in case I wanted to switch back some
other time.

```
(defvar server_home ".")

;; Enable access to localhost so asterisk can connect (no one else needs to connect)
(set! server_access_list '("[^.]+" "127.0.0.1" "localhost.*" "argus.lounge.gentlemenslounge.org"))

(cd server_home)
(set! default_access_strategy 'direct)

;; Set the voice to 'ked' the other one is left in case I wish to switch later
(set! voice_default 'voice_ked_diphone)
;(set! voice_default 'voice_nitech_us_awb_arctic_hts)

; Preload ked voice to make the server more responsive
(voice_ked_diphone)

;; Asterisk command
"(define (tts_textasterisk STRING MODE)
Apply tts to STRING. This function is specifically designed for use in
server mode so a single function call may synthesize the string. This function
name may be added to the server safe functions."
(let ((wholeutt (utt.synth (eval (list 'Utterance 'Text string)))))
(utt.wave.resample wholeutt 8000)
(utt.wave.rescale wholeutt 5)
(utt.send.wave.client.wholeutt)))
;; End Asterisk command

;(provide 'siteinit)
```
