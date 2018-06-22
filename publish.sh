#!/bin/bash

rm ../RollCall.zip

zip -r ../RollCall.zip . -x "*.git*" "*.idea*"

aws lambda update-function-code --function-name RollCall --zip-file fileb://../RollCall.zip
