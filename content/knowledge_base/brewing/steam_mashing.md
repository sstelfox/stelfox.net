---
title: Steam Mashing
---

[Source][1]

In case someone is interested, I've done the preliminary analysis and
investigation and I'm going to be building a steam boiler from a corny keg to
supply steam for heating my mash.

Its not nearly as scary as it sounds.

Description

The corny keg will get a 4.5KW hot water heater element installed in the
bottom. A temperature sensor will be installed in the top. A small $35 computer
will monitor the temp (and other things about the brewing process) and turn the
heater element on and off with a set point of 240F. A laptop computer will be
used to control and monitor the process computer.

The pressure in the keg will be about 10 PSI. Corny kegs are rated for 130 PSI.
A 15 PSI pressure relief valve will be installed to prevent any over pressure
situations from occurring. Keep in mind that this is less pressure than a
typical automotive cooling system. The keg will be pressure tested to 30 PSI
with tap water before being fired up.

The keg will be equipped with a simple valve manual or computer controlled
on-off valve for delivering the steam to the mash.

Parts List

The parts list is this thus far (McMasterCarr part numbers where applicable.)

1 good corny keg 1 4.5 KW hot water heater element, screw in (3555K32) $6.80 1
self sealing nut (5530K23) $4.90 1 pressure relief valve (4893K25) $7.70 1 bulk
head fitting, nickel finish 5483K93 $9.80 for 2 5 feet high temp NFS hose
3184K1 $1.47 per foot 1 high temp electric solenoid valve 4807t21 $51.02

There are a few misc fittings missing from this list as well as the computer
and relays or SCRs for turning the heater and control valve on and off.
Temperature measurement will be done with a $3 thermistor.

Usage

The computer will be programmed from a PC to bring the strike water in the HLT
and boiler up to their start temps (135F and 240F) respectively. It will take
about 20 minutes to bring a nearly full keg up to 240F. The HLT will be
electric heat as well, so that will take another 15 minutes or so.

Dough in will occur. There will be a temp sensor in the mash vessel, actually
multiple of them on a floating thermometer setup.

When the computer senses a temperature differential in the bed, it will turn on
the recirc pump to even things out.

When the computer senses the bed is too cool, it will modulate the steam valve
a few times, injecting some steam, to heat it up.

As soon as the temp in the boiler drops, the heating element will be turned on
to bring it back up.

At the first mash temp step the computer will change the temp setpoint from 130
to 155F and open the steam valve accordingly. The recirc pump will kick in. The
operator will be encouraged to stir the bed.

The thermodynamics are such that the steam created from a corny nearly full of
240F water is enough to heat the mash from strike temp to mash out. The steam
can be added as fast or slow as desired by throttling the flow. It will be
possible to raise the temp of a bed containing 10 pounds of grain by over 20F
per minute. Gone are the days of waiting around for the bed to get to the next
temp. Multiple temp mash schedules should be a breeze.

The amount of water in the injected steam to heat the mash from strike to mash
out will be small, less than a quart.

The boiler will contain 15 Litres of 210F water at the end of the mash out. It
can be used for cleaning or sterilizing the counter flow chiller. It could also
be used to top up the boiler if the sparge volume is less than the boil volume.

I don't think there is much system inertia. I don't think overshoot will be an
issue. It will be interesting to see. Hopefully I can just open the valve and
watch the temp. When the temp gets to the setpoint, shut the valve.

Unlike other systems, the thermal capacitance of the heating components in the
mash is just about zero. I guess we will see.

Here is an email I sent a guy on this topic.

So here is my attempt at mash boiler thermodynamics. Be kind… I am really rusty
with my steam calcs.

My data source is [Chesterton Steam Table][2]

Water and steam at 1atm, 212F. The liquid has an enthalpy of 180 btu/lb and the
steam portion has energy of 1150 btu/lb

Water and steam at 25 PSIA (10 PSI), the temp will be 240F. The liquid has an
enthalpy of 208 btu/lb and the steam portion is 1160 btu/lb

Straight liquid at 126F at 2PSI has an enthalpy of 94 btu per pound. Straight
liquid at 170F at 6 psia has 138 btu per pound. For now we will ignore the
energy due to pressure because water is nearly incompressible and that energy
change is near nothing.

So to heat water (our mash) from 126 to 170F takes 138-94 = 44 btu per pound.
Which makes sense because the temp spread is 44F and water has a specific heat
of 1btu/lb.

Lets say we are brewing a beer that uses 10 pounds of grains. Using [this
page][3] and a water ratio of 1.25 q/lb, it will take 3.93 gallons of volume.
Lets say that is all water at 8.33 pounds per gallon, we'd have 32.7 pounds of
“water”. In reality, it will be both lighter than that and have a lower heat
capacity. But using these numbers, the total energy to raise our mash from 126
to 170 would be 32.7 x 44 btu = 1440 btu.

If we were direct heating, a 4.5KW element puts out 15,354 btu/hour or 256
btu/minute. Our water weighs 32.7 pounds so we would get 256/32.7 = 7.8F per
minute. That is a pretty good heating rate as far as these systems go. Most are
3F or less per minute.

Now cooling steam from 240F to water at 170F will release 1160-138 = 1022
btu/lb. We need 1440 btu, so that is 1440/1022 = 1.4 pounds of steam = 0.17
gallons = 0.676 quarts. A little over 2 cups of water. Pretty incredible, isn't
it!

Now how much energy is stored in the corny ? Assume we have 10L of water (22
pounds) and 9L of steam.

First the water part. When the valve is opened, the pressure will drop to 1 atm
and any water over 212F will boil away as steam. And all that will be left is
hot water at 212F. Neglecting the change in mass, we go from hot water at 240F
to 212F, so that is 28btu/lb x 22 pounds = 616 btu.

Now the steam part. We have 9 L of steam at 16.31 ft^ per pound. 16.31 ft^3 x
1728 in^3/ft^3 /61 in^3/litre = 462 litres per lb. 9L/462L/lb = 1.94 x 10e-2
pounds. That steam has an energy of 1160 btu/lb so 1162 btu/lb x 1.94 x10e-2
lbs = 22.6 btu. Not nearly as much as the hot water because there is little
mass.

The boiler energy storage will best work on the principle of heating the water
up to a temperature higher than boiling at atmospheric pressure. Like 240F at
25psia. Then when the valve is opened, the pressure drops in the boiler and the
water boils, making steam. Just like if you open the radiator cap on a hot car
engine.

That is much different than a pressure cooker principle, where one is just
capturing what the stove is boiling off as it boils.

Now... if one had the whole corny full of 240F water, then we'd have 19L x 2.2
lbs/litre x 28 btu/lb = 1170 btu stored up ready to go. Almost enough to do our
whole batch. We need 1440 btu to go from 128 to 170F.

One could probably release the 1170 btu in about 2 minutes. That would give us
a heating power of 1170 btu x 60 minutes/2minutes = 35,100 btu per hour from
the hot water alone. 1 KW = 3412 btu/hr so 35100/3412 = 10.2KW. Plus the 4.5 kw
element will cut in and add to that, so we have about 14.8 KW of of steam power
going to the mash ! That is 50,453 btu/hr or 840 btu per minute. Our mash
weighs 32.7 pounds, so the temp rise would be 25.7F per minute !

So a mash temp rise from 128 to 154F would be 32.7lbs x 26 btu = 850 btu, which
is almost exacly 1 minute. One would have to throttle the steam flow so that
you didn't overshoot on the temp. But on the other hand, you know how many btus
is going into the mash from the boiler temp change if you wanted to get fancy !
The computer could measure the temp before and then watch it until it drops the
right amount.

Now... how much energy are we putting into heating the water ?

19L x 2.2 = 41.8 pounds. The temp rise will be 240-60F = 180 btu/lb. So 41.8 x
180 = 7524 btu. 1 KWhr is 3412 btu/hr so 2.2 KW Hr of power or about 20 cents
worth to get the water ready in the boiler. WIth a 4.5KW element, that should
take 7524 btu/256 btu per minute = 29 minutes. If one started the element when
the mash started, it would be ready before the first step. Cool ! At the end of
the run, one will have 42 pounds of water at 212F for washing ! The energy in
that water is 212F - 70F x 42 = 6000 btus. One could do a good job of
sterilizing a counter flow chiller by pumping that water through it. I also
capture the water that goes through the counterflow chiller in the HLT for
washing purposes, so neither of that energy is totally wasted.

So... did I get my math and thermodynamics right ?

What do you think of the boiler operation ?

I like how fast it would raise the temp of the mash ! No more sitting around
waiting for the temps to rise. If they are going to rise that quickly, I think
I want to manually control the valve and stir at the same time. I think I am
going to make a floating thermometer for my mash vessel, with multiple
thermistors to get the bed temp at various depths automatically.

I don't understand the pros and cons of wet, dry, saturated, and superheated
steam, and why one would want one versus the other. Do you know?” Yes. Lets
leave those terms out of it and talk about superheated water.

Superheated water is water heated above its normal boiling point (212F) but
kept as water by applying pressure to keep it from converting to steam. If we
keep the water under about 10 PSI of pressure, we can heat it to 240F without
it boiling.

So at 240F and 10 PSI, I will have a boiler full of water. There won't be any
steam. The reason I want this is because water is very dense compared to steam
and thus I can have my boiler hold a lot of energy.

Now, when I open the valve on my boiler, the pressure drops. And when the
pressure drops, that superheated water starts to boil. In effect, the liquid
water under pressure releases energy as steam. It will go from 240F down to
212F as the pressure goes from 10PSI down to 0 PSI. It will reach equilibrium
at 212F and 0 PSI. The energy lost between going from 240F to 212F is the
amount of steam energy it will release.

The difference between storing superheated water and generating steam by
boiling water is that superheated water stores energy that can be used to heat
the mash quickly. When I open the valve on my boiler, all the energy in the
water from 240F down to 212F will be released as steam, plus the energy of the
element if it is on.

When one boils water in a pot without any backpressure, there is no superheated
water and there is no pressure change. Very little energy is stored. The energy
you get is that of the heating element and that's it.

Superheated steam is steam heated above its boiling point. Steam will absorb
more energy than it does at its boiling point. So we could superheat steam at 0
PSI to 240F. (Normal boiling point is 212F, so we get 28F of superheating. The
problem with superheating the steam is that steam is very light compared to
water and it would take a very large vessel to store enough steam to absorb the
same amount of energy as superheated water. In fact, steam takes 1600x the
volume that water does for the same weight. (Steam stores more energy per pound
though… but it still takes tons more volume to store energy as steam than as
superheated water.)

Quote: I like your corny steam vessel idea, but I just wonder if it will be
safe enough… and there are a lot of commercially produced items that might be
as effective and possibly safer since they were designed to make steam rather
than to serve beverages. A corny keg is a pressure vessel. 240F is way below
the temp at which stainless steel or brass or copper or even plain steel starts
to weaken. The nice thing about using an electric heating element is that there
are no electric or flame burners heating parts of the keg up to 5 or 600F or
1000F or higher, because those sorts of temps can change materials over time
and make them subject to failure.

Standard testing procedure for steam pressure vessels is to pressurize them
with water to 2 or 3x their working pressure and watch for leaks. Once
everything holds that kind of pressure, the vessel is considered sound and
rated for the working pressure. Model railroaders test their steam boilers this
way.

The relief valve and shutting the element off when the water reaches a maximum
safe temp (240F) will ensure the vessel never gets over pressured. The maximum
pressure vaporized water can make at 240F is 10 PSI.

Liquid water is another matter ! If the corny was filled entirely to the brim
with no air space and then heated to 240F, it could generate enormous pressures
because water is incompressible. Luckily we have a pressure relief valve to
limit the pressure is these sorts of circumstances. However, with a void space
above the water, the liquid water can expand and the vaporized water (steam)
will only generate 10PSI of pressure.

There are 2 sorts of things that could go wrong with my steam vessel.

1. Leakage or failure at rated pressure, 10PSI. Corny kegs are rated to 130PSI.
   I'll be pressure testing mine to 30PSI. People carbonate beer at 15 PSI all
   the time. When was the last time you heard of a corny failing doing this ?
2. Failure because of over pressure. My kegs setup will have 3 things to
   prevent this.
  1. A pressure relief valve.
  2. A temperature sensor
  3. A mechanical pressure gage.

Multiple things have to fail and the temperature would really have to rise
before my corny would get to an over pressure situation.

I think my steam boiler will be a lot safer than working under an HLT suspended
6 feet in the air.

Quote: For example, check out the JR/AR 1.5 to 8KW steamers on the Reimers Inc
site. Like I wonder if the little 1.5KW version of this one would do the trick.
Of course, unless found used and for a steal, it is likely to be a lot more
expensive than your solution. There is nothing wrong with using a premade steam
generator. A pressure cooker heated by a 1.5KW stove element will provide 1.5KW
of energy to the mash, less the heat lost from the burner and tubing and steam
leakage loses.

My corny will have a 4.5KW element in it. So even if I didn't store any
superheated water, I'll be heating my mash with 4.5KW of power, less any
losses. That is nothing to sneeze at!

Storing the superheated water is icing on the cake. I'll dough in and do a
protein rest while the heating element in my boiler is getting the water up to
temp. Then, when its time to do a mash step, I open the valve and release heat
at the rate of 10 to 15KW into the mash. I'll be able to raise the temp of my
mash very quickly, all without exposing it to temps any higher than 240F ! That
is a very gentle heat compared to a RIM system.

I dislike 3 things about using a flame to make steam. 1) It is possible to
generate very hot super heated steam. In my system the steam will be at 240F
maximum. As soon as it touches the cooler mash bed, its temp will be lower. Its
a gentle heat, good for the wort and mash bed. 2) flames and electric burners
generate high temperatures which weaken the boiler and tubing materials over
time. The 240F water in my system doesn't get hot enough weaken anything. A
flame easily does and without proper materials engineering, vessel or tubing
failure can occur. 3) the flame chemistry comes into play. Using a flame with
excess oxygen to heat metal things can really affect the metal things over
time.

Does your 4.5KW heater require 220 volt service or can it run on 110? The 4.5KW
elements I've found are 240VAC.

The max current for a 120VAC circuit is 15A as far as I know, unless one goes
to an RV plug. One could get 3600 watts by running 2 1800 watt 120VAC elements,
each on its own breaker, of course. One would have to run 2 solid state relays
to control each circuit to do that, if one wanted computerized control.

Quote: How will the heating element be mounted in the corny keg? Drill a hole
in the bottom and bolt it in. Thus the 30 PSI pressure test. There are heating
elements that could be put into the keg through small compression fittings, but
they are more expensive.

Quote: Isn't this another possible point of pressure failure? Or is it on the
outside? It is a point of pressure failure, yes. One could use one of several
external wrap around heating elements from McMasterCarr as well. Hmmm… you have
me thinking now.

Quote: (You may have covered this, already, just tell me if so and I'll go back
and read the thread from the beginning.) There is no such thing as a dumb
question ! I've gotten a lot of ideas from the comments and such that people
have made along the way.

Edit: I just checked McMasterCarr. Item #35765K187 is a 2160 Watt 12 x 18” heat
blanket. $80.56 ea. You'd need 2 of them to equal the power of my hot water
heater element. 2 would just fit. Item 3671K162 is a 1500 Watt band heater.
$46.88 ea. You'd need 3 of them. Pretty hard to beat 35555k32 water heater
element. 4500 Watts, $6.50 ea. Uses 1” NPSM threads.

I'll let you know how the drilling and pressure testing goes. I'll do the
element hole first.

[1]: http://www.homebrewtalk.com/f11/steam-injected-mash-system-18008
[2]: http://www.chesterton.com/interactive/tables/steam/
[3]: http://www.rackers.org/calcs.shtml 
