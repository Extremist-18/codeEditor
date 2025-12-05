#!/bin/bash

g++ -std=c++17 /sandbox/main.cpp -O2 -o /sandbox/a.out 2> /sandbox/err.txt
if [ $? -ne 0 ]; then exit 1; fi

timeout 2s /sandbox/a.out < /sandbox/input.txt
