#!/bin/bash

BASE_DIR=`dirname $0`

echo "Start Karma"

karma start $BASE_DIR/../config/karma.conf.js $*
