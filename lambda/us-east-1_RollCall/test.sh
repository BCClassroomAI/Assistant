#!/bin/bash
echo "Testing lambda"
lambda-local -l index.js -h handler -e local-event.json