#!/bin/bash

./script/build.sh

mocha_option="-t 5000 --recursive ./out/test/src -R spec"

if [ "$TRAVIS" == "1" ]
then
    ./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- $mocha_option && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js
else
    ./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha  -- $mocha_option
fi
