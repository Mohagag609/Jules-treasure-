#!/usr/bin/env bash
# Start script for Render
# This script runs when starting the application on Render

set -o errexit

echo "🚀 Starting application on Render..."

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate || echo "⚠️ Migration might have already been applied"

# Start the application
echo "✨ Starting Next.js application..."
npm run start