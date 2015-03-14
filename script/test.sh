#!/bin/bash

./script/build.sh
./script/build_test.sh

if [ "$1" == "coverage" ]
then
    ./node_modules/.bin/istanbul cover node_modules/mocha/bin/_mocha  -- --require out/test/src/espower-loader.js --require ./node_modules/babel/polyfill.js --recursive out/test/src -R tap
else
    ./node_modules/.bin/mocha  --require out/test/src/espower-loader.js --require ./node_modules/babel/polyfill.js --recursive out/test/src
fi
