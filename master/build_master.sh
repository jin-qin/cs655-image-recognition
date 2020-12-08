#!/bin/bash

echo 'clear cache'

rm -rf server/build

echo 'building server...'
cd server && yarn
yarn build
echo 'building server ... OK'

echo 'building client...'
cd ../client && yarn
yarn build
yarn deploy
echo 'building client... OK'

echo 'finish building master.'

echo 'run master: ./run_master.sh'