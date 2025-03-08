#!/bin/bash

# Ensure the script is run from the repository root
ROOT_DIR=$(git rev-parse --show-toplevel)
HOOKS_SOURCE="$ROOT_DIR/frontend/scripts/hooks/pre-commit"
HOOKS_TARGET="$ROOT_DIR/.git/hooks/pre-commit"


echo "Installing pre-commit hook..."
if [ -f "$HOOKS_SOURCE" ]; then
  cp "$HOOKS_SOURCE" "$HOOKS_TARGET"
  chmod +x "$HOOKS_TARGET"
  echo "✅ Pre-commit hook installed successfully."
else
  echo "❌ Hook file not found at $HOOKS_SOURCE. Installation failed."
  exit 1
fi
