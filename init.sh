#!/bin/bash

# Stop on error
set -e

echo "🔍 Checking for npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm first."
    exit 1
fi

echo "✅ npm found."

echo "🔍 Checking for Astro..."
if ! npx --yes astro --version &> /dev/null; then
    echo "❌ Astro not found. Installing it locally..."
    npm install astro --save-dev
else
    echo "✅ Astro is available."
fi

echo "📦 Installing dependencies..."
npm install

echo "🚀 Starting Astro dev server..."
npm run dev

