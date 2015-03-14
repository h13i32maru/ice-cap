#!/bin/bash

rm -rf out/test
mkdir -p out/test/src
./node_modules/.bin/babel --out-dir out/test/src/ test/src
