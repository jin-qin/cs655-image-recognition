#!/bin/bash

cp -f ./src/config/app-config-dev.json ./src/config/app-config.json

yarn tsc

cd build && node app.js