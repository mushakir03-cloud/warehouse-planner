#!/bin/sh
# Starts the Warehouse Planner dev server (uses the portable Node in ~/.local/node)
export PATH="$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")"
exec npm run dev
