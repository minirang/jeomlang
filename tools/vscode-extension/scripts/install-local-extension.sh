#!/usr/bin/env bash

set -e

# Default install roots (Linux/macOS/Codespaces)
INSTALL_ROOTS=(
    "$HOME/.vscode-server/extensions"
    "$HOME/.vscode-remote/extensions"
    "$HOME/.vscode/extensions"
    "$HOME/.cursor/extensions"
)

# Repo root (script 위치 기준)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

VERSION=$(node -p "require('$REPO_ROOT/package.json').version")
EXTENSION_ID="local.jeom-vscode-runner-$VERSION"

FILES=(
    "package.json"
    "extension.js"
    "language-configuration.json"
    "README.md"
    "COMPATIBILITY.md"
)

DIRS=(
    "official"
    "snippets"
    "syntaxes"
)

EXTERNAL_ICON="$REPO_ROOT/../../assets/img/icon.png"

echo "Installing JEOM VS Code Runner v$VERSION"
echo "Extension ID: $EXTENSION_ID"
echo ""

for ROOT in "${INSTALL_ROOTS[@]}"; do
    if [ ! -d "$ROOT" ]; then
        echo "Skip (missing): $ROOT"
        continue
    fi

    # Remove old versions
    find "$ROOT" -maxdepth 1 -type d -name "local.jeom-vscode-runner-*" ! -name "$EXTENSION_ID" \
        -exec rm -rf {} + 2>/dev/null || true

    TARGET="$ROOT/$EXTENSION_ID"
    mkdir -p "$TARGET"

    # Copy files
    for f in "${FILES[@]}"; do
        cp -f "$REPO_ROOT/$f" "$TARGET/"
    done

    # Copy directories
    for d in "${DIRS[@]}"; do
        mkdir -p "$TARGET/$d"
        cp -r "$REPO_ROOT/$d/"* "$TARGET/$d/" 2>/dev/null || true
    done

    # Icon
    mkdir -p "$TARGET/assets"
    if [ -f "$EXTERNAL_ICON" ]; then
        cp -f "$EXTERNAL_ICON" "$TARGET/assets/icon.png"
    else
        echo "Warning: icon not found: $EXTERNAL_ICON"
    fi

    # Validate
    if [ ! -f "$TARGET/official/cli.js" ]; then
        echo "ERROR: official/cli.js missing in $TARGET"
        echo "Run npm run update-jeom first"
        exit 1
    fi

    echo "Installed to: $TARGET"
done

echo ""
echo "Reload VS Code / Cursor (Developer: Reload Window)"
echo "Then open .jeom file"
