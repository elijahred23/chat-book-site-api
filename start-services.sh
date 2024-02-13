#!/bin/bash

# Start npm run dev in the background
npm run dev &
P1=$!

# Start the Node.js server in the background
node api/server.js &
P2=$!

# Wait for both background processes to finish
wait $P1 $P2