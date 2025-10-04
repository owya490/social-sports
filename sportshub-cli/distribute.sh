#!/bin/bash

# Sportshub CLI Distribution Script
# Creates a distributable package for installation on other computers

set -e

echo "📦 Creating distribution package for Sportshub CLI..."

# Clean and build
echo "🧹 Cleaning previous builds..."
npm run clean

echo "🔨 Building project..."
npm run build

# Create distribution directory
DIST_DIR="sportshub-cli-dist"
echo "📁 Creating distribution directory: $DIST_DIR"
rm -rf "$DIST_DIR"
mkdir "$DIST_DIR"

# Copy necessary files
echo "📋 Copying files..."
cp -r dist/ "$DIST_DIR/"
cp package.json "$DIST_DIR/"
cp README.md "$DIST_DIR/"
cp install.sh "$DIST_DIR/"

# Create a simple installation README for the distribution
cat > "$DIST_DIR/INSTALL.md" << 'EOF'
# Sportshub CLI Installation

## Quick Install

1. Run the installation script:
   ```bash
   ./install.sh
   ```

## Manual Install

1. Install dependencies:
   ```bash
   npm install --production
   ```

2. Install globally:
   ```bash
   npm install -g .
   ```

## Usage

1. Configure your Jira credentials:
   ```bash
   sportshub configure
   ```

2. Create lead tickets:
   ```bash
   sportshub leads create --organiserName "Name" --website "example.com"
   ```

For full documentation, see README.md
EOF

# Create archive
echo "🗜️  Creating archive..."
tar -czf "sportshub-cli-dist.tar.gz" "$DIST_DIR"

echo "✅ Distribution package created successfully!"
echo ""
echo "📦 Files created:"
echo "   - $DIST_DIR/ (directory)"
echo "   - sportshub-cli-dist.tar.gz (archive)"
echo ""
echo "🚀 To distribute:"
echo "   1. Copy the archive to target computer"
echo "   2. Extract: tar -xzf sportshub-cli-dist.tar.gz"
echo "   3. cd sportshub-cli-dist"
echo "   4. ./install.sh"
