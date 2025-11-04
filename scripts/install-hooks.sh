#!/usr/bin/env bash
set -e

# Installer for git hooks in this repository.
# It sets the repo's core.hooksPath to .githooks and makes the hooks executable.

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

git config core.hooksPath .githooks
chmod +x .githooks/* || true

echo "Installed git hooks path: .githooks"
echo "Make sure to commit the .githooks directory if you want others to install it too (they must run scripts/install-hooks.sh or set core.hooksPath themselves)."
