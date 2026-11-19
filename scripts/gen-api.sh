#!/usr/bin/env bash
# Generates the API client types from the backend OpenAPI contract.
# Uses a lightweight Node.js script (no Java, no TS compiler API).
# Usage: npm run gen:api

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKEND_CONTRACT="$HOME/Documents/GitHub/uvoluntapp-backend/contracts/openapi.yaml"
LOCAL_CONTRACT="$PROJECT_ROOT/contracts/openapi.yaml"

# 1. Copy contract from backend
if [ ! -f "$BACKEND_CONTRACT" ]; then
  echo "ERROR: Backend contract not found at $BACKEND_CONTRACT"
  echo "Make sure the backend repo is cloned at ~/Documents/GitHub/uvoluntapp-backend"
  exit 1
fi

mkdir -p "$PROJECT_ROOT/contracts"
cp "$BACKEND_CONTRACT" "$LOCAL_CONTRACT"
echo "✓ Contract copied from backend"

# 2. Generate TypeScript client
node "$SCRIPT_DIR/gen-api.mjs"
