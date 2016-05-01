#!/bin/bash

mocha_option="-t 5000 --require ./node_modules/babel-register --recursive ./test/src -R spec"
./node_modules/.bin/mocha $mocha_option
