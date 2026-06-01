#!/bin/sh
# Setup git hooks
HOOKS_DIR=".git/hooks"
cp .hooks/pre-commit "$HOOKS_DIR/pre-commit"
cp .hooks/commit-msg "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/commit-msg"
echo "✅ Git hooks installed."
