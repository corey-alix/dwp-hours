#!/usr/bin/env bash
set -euo pipefail

log() {
  printf "\n==> %s\n" "$1"
}

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required to run this script." >&2
  exit 1
fi

log "Updating apt metadata"
sudo apt update

log "Installing prerequisites"
sudo apt install -y software-properties-common curl ca-certificates

log "Updating Git to latest via git-core PPA"
sudo add-apt-repository ppa:git-core/ppa -y
sudo apt update
sudo apt install -y git

git --version

log "Installing Node.js (LTS) via NodeSource"
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

node --version
npm --version

log "Installing pnpm"
curl -fsSL https://get.pnpm.io/install.sh | sh -

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

pnpm --version

log "Installing project dependencies"
pnpm install

log "Installing Playwright system dependencies (Chromium only)"
pnpm exec playwright install-deps chromium

log "Installing Playwright browser (Chromium only)"
pnpm exec playwright install chromium

log "Done"
