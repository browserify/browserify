#!/bin/bash
echo -n 'testling user: '
read user

stty -echo
echo -n 'password: '
read pass
stty echo

function tick () {
    cat <(echo 'process={};') ../builtins/__browserify_process.js tick.js \
        | curl -sSNT- -u "$user:$pass" testling.com
}

function util () {
    tar -cf- util.js ../builtins/util.js |
        curl -sSNT- -u "$user:$pass" \
        'http://testling.com/?main=util.js&noinstrument=builtins/util.js'
}

function timers () {
    tar -cf- timers.js ../builtins/timers.js |
        curl -sSNT- -u "$user:$pass" \
        'http://testling.com/?main=timers.js'
}

if test -z "$1"; then
    tick
    util
    timers
elif test "$1" == 'tick'; then
    tick
elif test "$1" == 'util'; then
    util
elif test "$1" == 'timers'; then
    timers
fi
