#!/bin/bash

# Build the frontend
npm run build

# Start the unified Express server (which serves both frontend + API)
node api/server.js
