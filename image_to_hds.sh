#!/bin/bash
# My first script

ocs-restore-mdisks -b -p "-g auto -e1 auto -e2 -c -r -j2 -p true" $*

# echo $*
