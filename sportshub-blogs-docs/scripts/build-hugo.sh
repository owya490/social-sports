#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Hugo build and integration process..."

# Get the script directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HUGO_DIR="$PROJECT_ROOT/sportshub-blogs-docs"
VERCEL_PUBLIC_DIR="$PROJECT_ROOT/frontend/public"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Hugo directory: $HUGO_DIR"
echo "📁 Vercel public directory: $VERCEL_PUBLIC_DIR"

# Check if Hugo directory exists
if [ ! -d "$HUGO_DIR" ]; then
    echo "❌ Hugo directory not found at $HUGO_DIR"
    exit 1
fi

# Navigate to Hugo directory
cd "$HUGO_DIR"
echo "📂 Changed to Hugo directory: $(pwd)"

if [ ! -d "$HUGO_DIR/themes/hextra/layouts" ]; then
    echo "📦 Initializing Hextra theme submodule..."
    git -C "$PROJECT_ROOT" submodule update --init --recursive "sportshub-blogs-docs/themes/hextra"
fi

HUGO_VERSION=0.146.0
HUGO_DEB="hugo_${HUGO_VERSION}_linux-amd64.deb"

install_hugo() {
    echo "Installing Hugo version $HUGO_VERSION"
    wget "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_DEB}"
    sudo dpkg -i "$HUGO_DEB"
    rm -f "$HUGO_DEB"
}

if ! command -v hugo &> /dev/null
then
    echo "Hugo not found"
    install_hugo
else
    CURRENT_HUGO_VERSION="$(hugo version | sed -E 's/^hugo v([0-9]+\.[0-9]+\.[0-9]+).*/\1/')"
    if [ "$CURRENT_HUGO_VERSION" != "$HUGO_VERSION" ]; then
        echo "Hugo $CURRENT_HUGO_VERSION does not match required version $HUGO_VERSION"
        install_hugo
    else
        echo "Hugo $CURRENT_HUGO_VERSION already installed"
    fi
fi

# Delete the public directory
echo "🔨 Deleting public directory..."
rm -rf "$HUGO_DIR/public"

# Build Hugo static files
echo "🔨 Building Hugo static files..."
hugo --minify

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Hugo build failed"
    exit 1
fi

echo "✅ Hugo build completed successfully"

# Check if Hugo public directory exists
HUGO_PUBLIC_DIR="$HUGO_DIR/public"
if [ ! -d "$HUGO_PUBLIC_DIR" ]; then
    echo "❌ Hugo public directory not found at $HUGO_PUBLIC_DIR"
    exit 1
fi

# Create Vercel public directory if it doesn't exist
if [ ! -d "$VERCEL_PUBLIC_DIR" ]; then
    echo "📁 Creating Vercel public directory..."
    mkdir -p "$VERCEL_PUBLIC_DIR"
fi

echo "📋 Copying Hugo static files to Vercel public directory..."

# Copy directories: blogs, css, js, tags
for dir in "blogs" "docs" "css" "js" "tags"; do
    if [ -d "$HUGO_PUBLIC_DIR/$dir" ]; then
        echo "📁 Copying $dir directory..."
        cp -r "$HUGO_PUBLIC_DIR/$dir" "$VERCEL_PUBLIC_DIR/"
        echo "✅ Copied $dir directory"
    else
        echo "⚠️  Directory $dir not found in Hugo public, skipping..."
    fi
done

# Copy top-level files (excluding directories we already copied and sitemap.xml)
echo "📄 Copying top-level files..."
for file in "$HUGO_PUBLIC_DIR"/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Skip sitemap.xml and webmanifest files to avoid merge conflicts
        if [[ "$filename" = "sitemap.xml" || "$filename" =~ ^(.*\.webmanifest|site\.webmanifest)$ ]]; then
            echo "⏭️  Skipping $filename to avoid merge conflicts..."
            continue
        fi
        # Skip favicon and icon files (handled by Next.js in frontend/app)
        if [[ "$filename" =~ ^(favicon\.ico|favicon-16x16\.png|favicon-32x32\.png|apple-touch-icon\.png|android-chrome-.*\.png)$ ]]; then
            echo "⏭️  Skipping $filename (using Next.js icons)..."
            continue
        fi
        echo "📄 Copying $filename..."
        cp "$file" "$VERCEL_PUBLIC_DIR/"
        echo "✅ Copied $filename"
    fi
done

# Merge images directory
if [ -d "$HUGO_PUBLIC_DIR/images" ]; then
    echo "🖼️  Merging images directory..."

    # Create images directory in Vercel public if it doesn't exist
    if [ ! -d "$VERCEL_PUBLIC_DIR/images" ]; then
        mkdir -p "$VERCEL_PUBLIC_DIR/images"
    fi

    # Copy all files from Hugo images to Vercel images
    cp -r "$HUGO_PUBLIC_DIR/images"/* "$VERCEL_PUBLIC_DIR/images/" 2>/dev/null || true
    echo "✅ Merged images directory"
else
    echo "⚠️  Images directory not found in Hugo public, skipping..."
fi

# # Copy search-related files
# echo "🔍 Copying search-related files..."
# for file in "en.search.js" "en.search-data.json" "index.xml" "sitemap.xml"; do
#     if [ -f "$HUGO_PUBLIC_DIR/$file" ]; then
#         echo "📄 Copying $file..."
#         cp "$HUGO_PUBLIC_DIR/$file" "$VERCEL_PUBLIC_DIR/"
#         echo "✅ Copied $file"
#     fi
# done

echo "🎉 Hugo integration completed successfully!"
echo "📊 Summary of copied items:"
echo "   - Directories: blogs, css, js, tags, docs"
echo "   - Top-level files: HTML, XML, favicons, etc."
echo "   - Images: merged with existing public/images"
# echo "   - Search files: en.search.js, en.search-data.json, index.xml, sitemap.xml"

# Optional: List what was copied
echo ""
echo "📋 Files in Vercel public directory:"
ls -la "$VERCEL_PUBLIC_DIR" | head -20

echo ""
echo "✅ Hugo build and integration script completed!"