#!/bin/bash

# Sportshub CLI Installation Script
# This script builds and installs the CLI tool locally

set -e

echo "🏃‍♂️ Installing Sportshub CLI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16.0.0 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 16.0.0 or higher."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Fix permissions
echo "🔧 Setting permissions..."
chmod +x dist/index.js

# Install globally
echo "🌐 Installing globally..."
npm link

# Fix global permissions if needed
NPM_PREFIX=$(npm config get prefix)
if [ -f "$NPM_PREFIX/lib/node_modules/sportshub-cli/dist/index.js" ]; then
    chmod +x "$NPM_PREFIX/lib/node_modules/sportshub-cli/dist/index.js"
fi

echo "✅ Sportshub CLI installed successfully!"
echo ""
echo "🎉 You can now use 'sportshub' from anywhere in your terminal."
echo "📋 Run 'sportshub configure' to get started."
echo ""
echo "For help, run: sportshub --help"
