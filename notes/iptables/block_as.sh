#!/bin/bash

ASLIST="$@"

for ASNO in $ASLIST; do
  SUFFIX="$ASNO";
  #SUFFIX="" # enable this to gather all rules in one chain
  echo "iptables -N reject_as$SUFFIX";
  echo "ip6tables -N reject_as$SUFFIX";
  whois -B -i origin "AS$ASNO" \
    | grep '^route' \
    | while read proto prefix rest; do
        case "$proto" in
          route:) prog=iptables; ;;
          route6:) prog=ip6tables; ;;
          *) prog=echo; ;;
        esac
        echo "$prog -A "reject_as$SUFFIX" -s $prefix -j REJECT";
      done;
done
