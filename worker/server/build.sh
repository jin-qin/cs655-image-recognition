#!/bin/bash

cp -f ./src/config/app-config-prod.json ./src/config/app-config.json

yarn tsc

cp -f ../run_mobilenet_v2.py ./build/