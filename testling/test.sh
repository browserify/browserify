#!/bin/bash
echo -n 'testling user: '
read user

stty -echo
echo -n 'password: '
read pass
stty echo

cat <(echo 'process={};') ../wrappers/process.js tick.js \
    | curl -sSNT- -u "$user:$pass" testling.com
