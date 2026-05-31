#!/usr/bin/env bash
# =============================================================================
# NextPik — Production Deployment Script
# =============================================================================
# Usage (from your local machine):
#   ./scripts/deploy-production.sh
#
# What it does:
#   1. Merges develop → main and pushes (triggers App Platform frontend build)
#   2. SSH into the Droplet and rebuilds the API Docker container
#   3. Runs pending Prisma migrations inside the container
#   4. Verifies the API health endpoint
#
# Prerequisites:
#   - SSH key configured for root@152.42.138.178
#   - You are on the `develop` branch with all changes committed and pushed
# =============================================================================

set -euo pipefail

DROPLET="root@152.42.138.178"
APP_DIR="/var/www/nextpik"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
PRISMA="/app/packages/database/node_modules/.bin/prisma"
SCHEMA="--schema=/app/packages/database/prisma/schema.prisma"
HEALTH_URL="https://api.nextpik.com/api/v1/health"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

step()  { echo -e "\n${BLUE}▶ $*${NC}"; }
ok()    { echo -e "${GREEN}✔ $*${NC}"; }
warn()  { echo -e "${YELLOW}⚠ $*${NC}"; }
die()   { echo -e "${RED}✖ $*${NC}"; exit 1; }

# ── 1. Guard: must be on develop ─────────────────────────────────────────────
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "develop" ]]; then
  die "You must be on the 'develop' branch to deploy. Currently on: $CURRENT_BRANCH"
fi

# ── 2. Guard: no uncommitted changes ─────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "You have uncommitted changes. Commit or stash them before deploying."
fi

# ── 3. Push develop to origin ────────────────────────────────────────────────
step "Pushing develop to origin..."
git push origin develop
ok "develop pushed"

# ── 4. Merge develop → main ──────────────────────────────────────────────────
step "Merging develop → main..."
git checkout main
git pull origin main
git merge develop --no-ff -m "chore(release): merge develop → main [deploy $(date +%Y-%m-%d)]"
git push origin main
ok "main pushed — App Platform frontend build triggered automatically"
git checkout develop

# ── 5. SSH: pull latest, rebuild API, migrate ────────────────────────────────
step "Connecting to Droplet and deploying backend..."

ssh "$DROPLET" bash <<REMOTE
set -euo pipefail

cd $APP_DIR

echo ""
echo "── git pull ──────────────────────────────────────────────────────"
git pull origin main

echo ""
echo "── Rebuild API container ─────────────────────────────────────────"
$COMPOSE build api

echo ""
echo "── Restart API container ─────────────────────────────────────────"
$COMPOSE up -d api

echo ""
echo "── Wait for container to be healthy ──────────────────────────────"
for i in \$(seq 1 20); do
  STATUS=\$($COMPOSE ps api --format json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health','') if isinstance(d,dict) else [x.get('Health','') for x in d][0])" 2>/dev/null || echo "unknown")
  if [[ "\$STATUS" == "healthy" ]]; then
    echo "Container is healthy"
    break
  fi
  echo "  Waiting... (\$i/20)"
  sleep 3
done

echo ""
echo "── Run Prisma migrations ─────────────────────────────────────────"
$COMPOSE exec -T api sh -c '$PRISMA migrate deploy $SCHEMA'

echo ""
echo "── Verify API health ─────────────────────────────────────────────"
curl -sf $HEALTH_URL && echo ""

REMOTE

ok "Backend deployed successfully"

# ── 6. Final summary ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✔ Deployment complete                            ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Frontend  →  App Platform building (check cloud.digitalocean.com)"
echo "  Backend   →  https://api.nextpik.com/api/v1/health"
echo "  Site      →  https://nextpik.com"
echo ""
