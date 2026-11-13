#!/usr/bin/env bash
# Generate a client satellite repository from templates/.
# Usage: scripts/create-client.sh <client-slug> [target-parent-dir]
set -euo pipefail

usage() {
  echo "Usage: $0 <client-slug> [target-parent-dir]" >&2
  echo "  client-slug: lowercase kebab-case, e.g. tripseeds" >&2
  echo "  target-parent-dir: defaults to ../clients (relative to the repo root)" >&2
  exit 1
}

[[ $# -ge 1 ]] || usage
slug="$1"
if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: invalid client slug '$slug' (expected lowercase kebab-case)." >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
parent="${2:-$repo_root/../clients}"
target="$parent/$slug"

if [[ -e "$target" ]]; then
  echo "Error: '$target' already exists. Refusing to overwrite." >&2
  exit 1
fi

mkdir -p "$target"
cp -R "$repo_root/templates/commerce-core" "$target/core"
cp -R "$repo_root/templates/storefront-base" "$target/storefront"

# Replace the slug placeholder in text files only.
grep -rIl "__CLIENT_SLUG__" "$target" 2>/dev/null | while IFS= read -r file; do
  sed -i.bak "s/__CLIENT_SLUG__/$slug/g" "$file" && rm -f "$file.bak"
done

git -C "$target" init -q
echo "Client repo created at: $target"
echo "Next: see docs/03-CLIENT-PROVISIONING.md (D1, R2, deploy, brand registration)."
