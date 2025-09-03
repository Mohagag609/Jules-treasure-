#!/usr/bin/env bash
# Build script for Render
# This script runs during the build process on Render

set -o errexit

echo "🔨 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the Next.js application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"