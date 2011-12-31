#!/bin/bash
echo -n 'testling user: '
read user
cat <(echo 'process={};') ../wrappers/process.js test.js \
    | curl -sSNT- -u $user testling.com
