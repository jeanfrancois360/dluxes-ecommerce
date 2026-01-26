#!/bin/bash

# M1 Mac Ultra-Light Development Mode Startup Script
# This script optimizes your development environment for M1 MacBooks with limited RAM

echo "🚀 NextPik M1 Ultra-Light Mode"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Kill existing processes
echo -e "${YELLOW}1. Cleaning up existing processes...${NC}"
lsof -ti:3000,4000,5555 | xargs kill -9 2>/dev/null || echo "  ✓ No processes to kill"
sleep 2

# Step 2: Check Docker
echo ""
echo -e "${YELLOW}2. Checking Docker services...${NC}"
if docker ps -q &>/dev/null; then
  RUNNING=$(docker ps --format '{{.Names}}' | grep nextpik | wc -l | tr -d ' ')
  if [ "$RUNNING" -gt 0 ]; then
    echo -e "${GREEN}  ✓ Docker services running ($RUNNING containers)${NC}"
  else
    echo -e "${BLUE}  → Starting minimal Docker services (PostgreSQL + Redis)...${NC}"
    docker start nextpik-postgres nextpik-redis 2>/dev/null || pnpm docker:minimal
  fi
else
  echo -e "${RED}  ✗ Docker not running. Please start Docker Desktop.${NC}"
  exit 1
fi

# Step 3: Check memory
echo ""
echo -e "${YELLOW}3. Checking system memory...${NC}"
TOTAL_MEM=$(sysctl hw.memsize | awk '{print int($2/1073741824)}')
FREE_MEM=$(vm_stat | grep "Pages free" | awk '{print int($3 * 4096 / 1073741824)}')
echo "  Total RAM: ${TOTAL_MEM}GB"
echo "  Free RAM: ${FREE_MEM}GB"

if [ "$FREE_MEM" -lt 2 ]; then
  echo -e "${RED}  ⚠️  Warning: Low memory! Consider closing other apps.${NC}"
fi

# Step 4: Clear Next.js cache
echo ""
echo -e "${YELLOW}4. Clearing Next.js cache...${NC}"
rm -rf apps/web/.next 2>/dev/null
echo -e "${GREEN}  ✓ Cache cleared${NC}"

# Step 5: Show mode selection
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Select development mode:${NC}"
echo ""
echo "  1) Ultra-Light (< 1GB RAM) - No type checking"
echo "  2) Light (< 1.5GB RAM) - Minimal type checking"
echo "  3) Normal (< 2.5GB RAM) - Full features"
echo "  4) Backend only"
echo ""
read -p "Choose mode (1-4): " MODE

case $MODE in
  1)
    echo ""
    echo -e "${GREEN}🚀 Starting Ultra-Light Mode...${NC}"
    echo -e "${BLUE}Expected RAM: ~800MB - 1.2GB${NC}"
    echo ""
    NODE_OPTIONS='--max-old-space-size=1024' NEXT_SKIP_TYPECHECK=true pnpm --filter=@nextpik/web dev
    ;;
  2)
    echo ""
    echo -e "${GREEN}🚀 Starting Light Mode...${NC}"
    echo -e "${BLUE}Expected RAM: ~1.2GB - 1.8GB${NC}"
    echo ""
    NODE_OPTIONS='--max-old-space-size=1536' pnpm --filter=@nextpik/web dev
    ;;
  3)
    echo ""
    echo -e "${GREEN}🚀 Starting Normal Mode...${NC}"
    echo -e "${BLUE}Expected RAM: ~2.0GB - 2.5GB${NC}"
    echo ""
    pnpm dev:web
    ;;
  4)
    echo ""
    echo -e "${GREEN}🚀 Starting Backend Only...${NC}"
    echo -e "${BLUE}Expected RAM: ~500MB - 800MB${NC}"
    echo ""
    pnpm dev:api
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac
