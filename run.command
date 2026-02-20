#!/bin/bash

# Navigate to the directory where this script is located
cd "$(dirname "$0")"

# Check if node_modules exists, install dependencies if not
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Launch the application
echo "Starting briizOS..."
npm run dev
