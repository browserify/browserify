#!/bin/bash
browserify -r ./robot.js > static/common.js
browserify -i ./robot.js beep.js > static/beep.js
browserify -i ./robot.js boop.js > static/boop.js
