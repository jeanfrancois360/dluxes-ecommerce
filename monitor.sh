#!/bin/bash

# Real-time monitoring for NextPik development
# Shows memory usage, CPU usage, and running processes

clear

while true; do
  clear
  echo "================================================"
  echo "🔍 NextPik Development Monitor"
  echo "================================================"
  echo ""

  # System Memory
  echo "💾 SYSTEM MEMORY"
  echo "----------------"
  TOTAL_MEM=$(sysctl hw.memsize | awk '{print int($2/1073741824)}')
  FREE_MEM=$(vm_stat | grep "Pages free" | awk '{print int($3 * 4096 / 1073741824)}')
  INACTIVE_MEM=$(vm_stat | grep "Pages inactive" | awk '{print int($3 * 4096 / 1073741824)}')
  WIRED_MEM=$(vm_stat | grep "Pages wired down" | awk '{print int($4 * 4096 / 1073741824)}')

  USED_MEM=$((TOTAL_MEM - FREE_MEM))
  MEMORY_PERCENT=$((USED_MEM * 100 / TOTAL_MEM))

  echo "Total:    ${TOTAL_MEM}GB"
  echo "Used:     ${USED_MEM}GB (${MEMORY_PERCENT}%)"
  echo "Free:     ${FREE_MEM}GB"
  echo "Inactive: ${INACTIVE_MEM}GB"
  echo "Wired:    ${WIRED_MEM}GB"
  echo ""

  # Memory Pressure
  PRESSURE=$(memory_pressure 2>&1 | grep "System-wide memory" | awk '{print $4}')
  if [ -n "$PRESSURE" ]; then
    echo "Pressure: ${PRESSURE}"
  fi
  echo ""

  # Node Processes
  echo "🚀 NODE PROCESSES"
  echo "----------------"
  ps aux | grep -E "node|next-server" | grep -v grep | awk '{printf "%-30s %5s%% CPU  %5s%% MEM  PID: %s\n", $11, $3, $4, $2}' | head -10
  echo ""

  # Ports
  echo "🔌 ACTIVE PORTS"
  echo "----------------"
  lsof -i :3000 -sTCP:LISTEN 2>/dev/null | grep -v COMMAND | awk '{print "Port 3000: Frontend (" $2 ")"}'
  lsof -i :4000 -sTCP:LISTEN 2>/dev/null | grep -v COMMAND | awk '{print "Port 4000: Backend  (" $2 ")"}'
  lsof -i :5555 -sTCP:LISTEN 2>/dev/null | grep -v COMMAND | awk '{print "Port 5555: Prisma   (" $2 ")"}'

  if ! lsof -i :3000,4000,5555 -sTCP:LISTEN &>/dev/null; then
    echo "No services running"
  fi
  echo ""

  # Docker
  echo "🐳 DOCKER CONTAINERS"
  echo "--------------------"
  if docker ps &>/dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep nextpik || echo "No NextPik containers running"
  else
    echo "Docker not running"
  fi
  echo ""

  # Docker Stats
  if docker ps -q | grep -q .; then
    echo "🐳 DOCKER RESOURCE USAGE"
    echo "------------------------"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep nextpik
    echo ""
  fi

  # CPU Load
  echo "⚡ CPU LOAD"
  echo "----------"
  uptime | awk -F'load averages:' '{print "Load Avg: " $2}'
  echo ""

  # Swap Usage
  echo "💿 SWAP USAGE"
  echo "-------------"
  sysctl vm.swapusage | awk -F'=' '{print $2}'
  echo ""

  # Timestamp
  echo "Updated: $(date '+%H:%M:%S')"
  echo ""
  echo "Press Ctrl+C to exit | Refreshing in 5s..."

  sleep 5
done
