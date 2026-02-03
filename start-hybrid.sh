#!/bin/bash

# Hybrid Development Mode - BEST for Finalizing Development
# Backend (Built) + Frontend (Ultra-Light) = ~1.5GB RAM

echo "🚀 NextPik Hybrid Mode (Recommended for M1 Mac)"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Kill existing processes
echo -e "${YELLOW}1. Cleaning up...${NC}"
lsof -ti:3000,4000,5555 | xargs kill -9 2>/dev/null
sleep 2
echo -e "${GREEN}   ✓ Cleared${NC}"

# Step 2: Check if backend is built
echo ""
echo -e "${YELLOW}2. Checking backend build...${NC}"
if [ ! -d "apps/api/dist" ]; then
  echo -e "${BLUE}   → Building backend (one-time, ~2 minutes)...${NC}"
  pnpm --filter=@nextpik/api build
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ Backend built${NC}"
  else
    echo -e "${RED}   ✗ Build failed${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}   ✓ Backend already built${NC}"
fi

# Step 3: Start Docker
echo ""
echo -e "${YELLOW}3. Starting Docker services...${NC}"
if docker ps &>/dev/null; then
  docker start nextpik-postgres nextpik-redis 2>/dev/null
  sleep 2
  echo -e "${GREEN}   ✓ Docker running${NC}"
else
  echo -e "${RED}   ✗ Docker not running. Start Docker Desktop first.${NC}"
  exit 1
fi

# Step 4: Start backend (production build)
echo ""
echo -e "${YELLOW}4. Starting backend (production mode)...${NC}"
cd apps/api
NODE_ENV=production pnpm start:prod > /tmp/nextpik-api.log 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 3

# Check if backend started
if lsof -i:4000 -sTCP:LISTEN &>/dev/null; then
  echo -e "${GREEN}   ✓ Backend running on http://localhost:4000${NC}"
  echo -e "${BLUE}   Memory: ~300-500MB${NC}"
else
  echo -e "${RED}   ✗ Backend failed to start. Check /tmp/nextpik-api.log${NC}"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# Step 5: Show memory usage
echo ""
echo -e "${YELLOW}5. System status:${NC}"
FREE_MEM=$(vm_stat | grep "Pages free" | awk '{print int($3 * 4096 / 1073741824)}')
echo -e "   Free RAM: ${FREE_MEM}GB"

# Step 6: Start frontend
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎯 Starting Frontend (Ultra-Light Mode)${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Expected total RAM usage: ~1.5GB${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}Backend:  http://localhost:4000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  echo -e "${GREEN}✓ Stopped${NC}"
  exit 0
}

trap cleanup INT TERM

# Start frontend (ultra-light mode)
NODE_OPTIONS='--max-old-space-size=1024' NEXT_SKIP_TYPECHECK=true pnpm --filter=@nextpik/web dev

# If frontend exits, cleanup
cleanup
