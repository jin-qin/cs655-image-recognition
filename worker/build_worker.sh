#!/bin/bash

echo 'building worker...'

cd server && yarn
yarn build

echo 'building server... OK'
echo 'finish building server.'
echo 'run master: ./run_worker.sh'