#!/usr/bin/env bash
#
# One-command deploy for the video POC on any fresh Ubuntu server.
#
#   Usage:  ./setup.sh <your-domain>
#   Example: ./setup.sh yanchat.duckdns.org
#
# Idempotent: safe to run again (updates domain, rebuilds, restarts).
# It sets up swap (for low-RAM boxes), installs Docker, opens the OS
# firewall, writes .env, and launches the stack.
#
# NOTE: cloud providers with their own firewall (Oracle VCN Security List,
# AWS Security Groups, etc.) also need ports 80, 443, 7881/tcp, 7882/udp
# opened in their web console — this script only handles the OS firewall.

set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: ./setup.sh <your-domain>   e.g. ./setup.sh yanchat.duckdns.org"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> [1/5] Swap (needed to build on low-RAM boxes)"
if ! swapon --show | grep -q . && [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  echo "    2G swapfile created."
else
  echo "    swap already present, skipping."
fi

echo "==> [2/5] Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
  echo "    Docker installed."
else
  echo "    Docker already installed."
fi

echo "==> [3/5] OS firewall (80, 443, 7881/tcp, 7882/udp)"
open_port() {
  local proto="$1" port="$2"
  if ! sudo iptables -C INPUT -p "$proto" --dport "$port" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 1 -p "$proto" --dport "$port" -j ACCEPT
    echo "    opened $proto/$port"
  fi
}
open_port tcp 80
open_port tcp 443
open_port tcp 7881
open_port udp 7882
if ! command -v netfilter-persistent >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y netfilter-persistent iptables-persistent >/dev/null 2>&1 || true
fi
sudo netfilter-persistent save >/dev/null 2>&1 || true

echo "==> [4/5] .env"
if [ ! -f .env ]; then
  SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
DOMAIN=$DOMAIN
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=$SECRET
EOF
  echo "    created .env with a fresh secret."
else
  sed -i "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" .env
  echo "    updated DOMAIN in existing .env."
fi

echo "==> [5/5] Build & launch"
sudo docker compose up -d --build

echo ""
echo "Done. In ~30s (first cert issuance) open:  https://$DOMAIN"
echo "Logs:  sudo docker compose logs -f caddy"
