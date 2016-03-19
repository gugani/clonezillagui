#!/bin/bash

# x-terminal-emulator -e /usr/sbin/ocs-sr -q2 -c -j2 -z1p -i 2000 -p choose savedisk $*
# /usr/sbin/ocs-sr -q2 -c -j2 -z1p -i 2000 -p choose savedisk $*
# /usr/sbin/ocs-sr -q2 -c -j2 -z1p -i 2000 -p choose savedisk test_disk_5G sdc

/usr/sbin/ocs-sr -q2 -j2 -nogui -rm-win-swap-hib -z1p -i 2000 -p true savedisk $*
