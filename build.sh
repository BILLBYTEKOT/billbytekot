#!/bin/bash

# Build script for Vercel deployment
set -e

echo "Starting build process..."

# Navigate to frontend directory
cd frontend

echo "Cleaning up previous installations..."
rm -rf node_modules package-lock.json

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building the application..."
npm run build

echo "Build completed successfully!"

# Move build files to root for Vercel
cd ..
if [ -d "frontend/build" ]; then
    echo "Build directory found, deployment ready"
else
    echo "Error: Build directory not found"
    exit 1
fi
