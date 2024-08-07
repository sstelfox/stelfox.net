---
created_at: 2013-01-01T00:00:01-0000
title: GPIO
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

I came across this python script that accesses GPIO pins in linux. It's
potentially very useful so I'm including it here, in it's entirety. I can later
on reference this for use in my own programs.

```
"""Arduino-like library for Python on BeagleBone"""
import time

HIGH = "HIGH"
LOW = "LOW"
OUTPUT = "OUTPUT"
INPUT = "INPUT"
pinList = [] # needed for unexport()
startTime = time.time() # needed for millis()
digitalPinDef = {
  "P8.3":   38,
  "P8.4":   39,
  "P8.5":   34,
  "P8.6":   35,
  "P8.11":  45,
  "P8.12":  44,
  "P8.14":  26,
  "P8.15":  47,
  "P8.16":  46,
  "P8.17":  27,
  "P8.18":  65,
  "P8.20":  63,
  "P8.21":  62,
  "P8.22":  37,
  "P8.23":  36,
  "P8.24":  33,
  "P8.25":  32,
  "P8.26":  61,
  "P8.27":  86,
  "P8.28":  88,
  "P8.29":  87,
  "P8.30":  89,
  "P8.39":  76,
  "P8.40":  77,
  "P8.41":  74,
  "P8.42":  75,
  "P8.43":  72,
  "P8.44":  73,
  "P8.45":  70,
  "P8.46":  71,
  "P9.12":  60,
  "P9.15":  48,
  "P9.23":  49,
  "P9.25":  117,
  "P9.27":  115,
  "P9.42":  7
}

analogPinDef = {
  "P9.33":  "ain4",
  "P9.35":  "ain6",
  "P9.36":  "ain5",
  "P9.37":  "ain2",
  "P9.38":  "ain3",
  "P9.39":  "ain0",
  "P9.40":  "ain1"
}

def pinMode(pin, direction):
  """pinMode(pin, direction) opens (exports)  a pin for use and 
  sets the direction"""
  if pin in digitalPinDef:
    fw = file("/sys/class/gpio/export", "w")
    fw.write("%d" % (digitalPinDef[pin]))
    fw.close()
    fileName = "/sys/class/gpio/gpio%d/direction" % (digitalPinDef[pin])
    fw = file(fileName, "w")
    if direction == INPUT:
      fw.write("in")
    else:
      fw.write("out")
    fw.close()
    pinList.append(digitalPinDef[pin])
  else:
    print "pinMode error: Pin " + pin + " is not defined as a digital I/O pin in the pin definition."


def digitalWrite(pin, status):
  """digitalWrite(pin, status) sets a pin HIGH or LOW"""
  if pin in digitalPinDef:
    fileName = "/sys/class/gpio/gpio%d/value" % (digitalPinDef[pin])
    fw = file(fileName, "w")
    if status == HIGH:
      fw.write("1")
    if status == LOW:
      fw.write("0")
    fw.close()
  else:
    print "digitalWrite error: Pin " + pin + " is not defined as a digital I/O pin in the pin definition."

def digitalRead(pin):
  """digitalRead(pin) returns HIGH or LOW for a given pin."""
  if pin in digitalPinDef:
    fileName = "/sys/class/gpio/gpio%d/value" % (digitalPinDef[pin])
    fw = file(fileName, "r")
    inData = fw.read()
    fw.close()
    if inData == "0\n":
      return LOW
    if inData == "1\n":
      return HIGH
  else:
    print "digitalRead error: Pin " + pin + " is not defined as a digital I/O pin in the pin definition."
    return -1;

def analogRead(pin):
  """analogRead(pin) returns analog value for a given pin."""
  if pin in analogPinDef:
    fileName = "/sys/devices/platform/tsc/" + (analogPinDef[pin])
    fw = file(fileName, "r")
    return fw.read()
  fw.close()
else:
  print "analogRead error: Pin " + pin + " is not defined as an analog in pin in the pin definition."
    return -1;

def pinUnexport(pin):
  """pinUnexport(pin) closes a pin in sysfs. This is susally 
  called by cleanup() when a script is exiting."""
  fw = file("/sys/class/gpio/unexport", "w")
  fw.write("%d" % (pin))
  fw.close()

def cleanup():
  """ takes care of stepping through pins that were set with
  pinMode and unExports them. Prints result"""
  def find_key(dic, val):
    return [k for k, v in dic.iteritems() if v == val][0]
  print ""
  print "Cleaning up. Unexporting the following pins:",
  for pin in pinList:
    pinUnexport(pin)
    print find_key(digitalPinDef, pin),

def delay(millis):
  """delay(millis) sleeps the script for a given number of 
  milliseconds"""
  time.sleep(millis/1000.0)

def millis():
  """millis() returns an int for the number of milliseconds since 
  the script started."""
  return int((time.time() - startTime) * 1000)

def run(setup, main): # from PyBBIO by Alexander Hiam - ahiam@marlboro.edu - www.alexanderhiam.com https://github.com/alexanderhiam/PyBBIO
  """ The main loop; must be passed a setup and a main function.
  First the setup function will be called once, then the main
  function wil be continuously until a stop signal is raised, 
  e.g. CTRL-C or a call to the stop() function from within the
  main function. """
  try:
    setup()
    while (True):
      main()
  except KeyboardInterrupt:
    # Manual exit signal, clean up and exit happy
    cleanup()
  except Exception, e:
    # Something may have gone wrong, clean up and print exception
    cleanup()
    print e
```
