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
sudo apt update || log "apt update failed, continuing anyway"

log "Installing prerequisites"
sudo apt install -y software-properties-common curl ca-certificates

log "Updating Git to latest via git-core PPA"
sudo add-apt-repository ppa:git-core/ppa -y
sudo apt update || log "apt update after adding PPA failed, continuing anyway"
sudo apt install -y git

git --version
version=$(git --version | awk '{print $3}')
if [[ "$(printf '%s\n' "$version" "2.50" | sort -V | head -n1)" != "2.50" ]]; then
  echo "Error: Git version $version is too old. Git 2.50 or greater is required for worktree support."
  echo "Please update Git manually:"
  echo "  sudo add-apt-repository ppa:git-core/ppa"
  echo "  sudo apt update"
  echo "  sudo apt install git"
  echo "Then re-run this script."
  exit 1
fi

log "Installing worktree alias scripts"
worktrees=$(git worktree list --porcelain | grep '^worktree ' | awk '{print $2}')
for worktree in $worktrees; do
  name=$(basename "$worktree")
  cat > "$HOME/.${name}.sh" << EOF
#!/bin/bash
cd $worktree
source scripts/set-port.sh
EOF
  chmod +x "$HOME/.${name}.sh"
  if ! grep -q "alias $name=" "$HOME/.bashrc"; then
    echo "alias $name='source ~/.${name}.sh'" >> "$HOME/.bashrc"
  fi
done

log "Installing Node.js (LTS) via NodeSource"
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

node --version
npm --version

if command -v pnpm >/dev/null 2>&1; then
  pnpm_version=$(pnpm --version)
  if [[ "$(printf '%s\n' "$pnpm_version" "10.29.2" | sort -V | head -n1)" == "10.29.2" ]]; then
    log "pnpm $pnpm_version already installed (>= 10.29.2), skipping"
    pnpm --version
  else
    log "pnpm $pnpm_version is too old, upgrading"
    curl -fsSL https://get.pnpm.io/install.sh | sh -

    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"

    pnpm --version
  fi
else
  log "Installing pnpm"
  curl -fsSL https://get.pnpm.io/install.sh | sh -

  export PNPM_HOME="$HOME/.local/share/pnpm"
  export PATH="$PNPM_HOME:$PATH"

  pnpm --version
fi

log "Installing update port script"
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd "$script_dir/.." && pwd)
install -m 644 "$repo_root/.update_port.sh" "$HOME/.update_port.sh"

log "Activating automatic port updates"
if ! grep -q "source ~/.update_port.sh" "$HOME/.bashrc"; then
  echo "source ~/.update_port.sh" >> "$HOME/.bashrc"
fi
if ! grep -q "PROMPT_COMMAND=\"__update_port_for_workspace\"" "$HOME/.bashrc"; then
  echo "PROMPT_COMMAND=\"__update_port_for_workspace\"" >> "$HOME/.bashrc"
fi

log "Installing project dependencies"
pnpm install

log "Installing Playwright system dependencies (Chromium only)"
pnpm exec playwright install-deps chromium

log "Installing Playwright browser (Chromium only)"
pnpm exec playwright install chromium

log "Done"
