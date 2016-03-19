#!/bin/bash

# ocs-restore-mdisks -b -p "-g auto -e1 auto -e2 -c -r -j2 -p true" $*

ocs-restore-mdisks -b -p "-g auto -e1 auto -e2 -nogui -v -r -j2 -p true" $*
