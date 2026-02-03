# Optimal Development Setup for M1 Mac (8GB RAM)

## 🎯 Goal
Finalize NextPik development smoothly without system crashes or slowdowns.

---

## ⚡ **Recommended Workflow (Choose One)**

### Option A: Hybrid Approach (BEST for Most Tasks) ⭐
**Use Case:** UI work, frontend features, styling
**Memory:** ~1.5GB total

```bash
# Terminal 1: Backend (Production Build - One Time)
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik
pnpm --filter=@nextpik/api build
pnpm --filter=@nextpik/api start:prod

# Terminal 2: Frontend (Ultra-Light)
pnpm dev:ultra-light

# Terminal 3: Docker (Minimal)
pnpm docker:minimal
```

**Pros:**
- ✅ Backend uses ~300MB (built version)
- ✅ Frontend uses ~1GB (ultra-light)
- ✅ Fast hot reload
- ✅ Stable and predictable

**Cons:**
- ⚠️ Need to rebuild backend after API changes

---

### Option B: Frontend Only (FASTEST) 🚀
**Use Case:** UI polish, styling, frontend-only features
**Memory:** ~1GB total

```bash
# Use deployed backend OR mock API
pnpm dev:ultra-light

# Optional: Mock API responses in code
```

**Setup Mock API:**
```typescript
// apps/web/src/lib/api/mock-mode.ts
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// In .env.local
NEXT_PUBLIC_USE_MOCK=true
```

---

### Option C: Full Stack (When Needed)
**Use Case:** Backend development, API testing, full integration
**Memory:** ~2.5GB total

```bash
# Terminal 1: Backend
pnpm dev:api

# Terminal 2: Frontend (Light Mode)
pnpm dev:light

# Terminal 3: Docker
pnpm docker:minimal
```

**Use only when:**
- Making API changes
- Testing full integration
- Working on backend features

---

## 🔧 **System Optimization**

### 1. macOS Settings
```bash
# Disable unnecessary services
sudo launchctl unload -w /System/Library/LaunchAgents/com.apple.notificationcenterui.plist 2>/dev/null

# Clear memory cache
sudo purge

# Check memory pressure
memory_pressure

# Disable Spotlight indexing for project (optional)
sudo mdutil -d /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik
```

### 2. Close Background Apps
**Before starting development:**
- [ ] Quit Slack
- [ ] Quit Spotify/Music
- [ ] Close all browser tabs except 2-3 for testing
- [ ] Close Mail, Messages, Calendar
- [ ] Quit Docker Desktop UI (keep daemon running)
- [ ] Close any other Electron apps

### 3. Browser Optimization
**Chrome/Edge:** Use these flags:
```
chrome://flags
- Enable: #back-forward-cache
- Enable: #reduce-user-agent
- Disable: #enable-webrtc-hide-local-ips-with-mdns
```

**Or use Safari** (uses less RAM):
- Open Developer menu (if needed)
- Keep only 2-3 tabs open

---

## 💻 **VS Code Configuration**

### Settings (`settings.json`)
```json
{
  // TypeScript optimization
  "typescript.tsserver.maxTsServerMemory": 2048,
  "typescript.tsserver.experimental.enableProjectDiagnostics": false,
  "typescript.disableAutomaticTypeAcquisition": true,

  // File watching optimization
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true,
    "**/.turbo/**": true,
    "**/build/**": true
  },

  // Search optimization
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/build": true
  },

  // Disable extensions you don't need
  "extensions.autoUpdate": false,

  // Editor optimization
  "editor.quickSuggestions": {
    "other": true,
    "comments": false,
    "strings": false
  },
  "editor.suggest.localityBonus": true,
  "editor.suggestSelection": "recentlyUsed",

  // Git optimization
  "git.autofetch": false,
  "git.autorefresh": false,

  // Terminal optimization
  "terminal.integrated.gpuAcceleration": "off"
}
```

### Recommended Extensions Only
**Keep only these enabled:**
- ESLint
- Prettier
- Prisma (if working with DB)
- Tailwind CSS IntelliSense

**Disable these during dev:**
- GitLens
- GitHub Copilot (enable only when needed)
- Docker
- Any AI assistants

---

## 📁 **Project Structure Optimization**

### Create `.gitignore` entries
```bash
# Add to .gitignore
.next/
.turbo/
node_modules/.cache/
*.log
.DS_Store
.vscode/settings.json.local
```

### Clean Up Regularly
```bash
# Add to package.json
"scripts": {
  "clean:cache": "rm -rf .next .turbo node_modules/.cache apps/**/.next",
  "clean:all": "pnpm clean:cache && rm -rf node_modules apps/*/node_modules packages/*/node_modules"
}

# Run weekly
pnpm clean:cache
```

---

## 🐳 **Docker Setup**

### Minimal Services (Default)
```bash
# Only run what you need
docker start nextpik-postgres nextpik-redis

# Stop others
docker stop nextpik-meilisearch 2>/dev/null
```

### Check Docker Resources
```bash
# Docker Desktop → Settings → Resources
- CPUs: 2
- Memory: 2GB
- Swap: 1GB
- Disk: 20GB
```

### Docker Compose Override (Already Created)
```yaml
# docker-compose.override.yml
services:
  postgres:
    mem_limit: 512m
    cpus: 1.0
  redis:
    mem_limit: 256m
    cpus: 0.5
```

---

## 🧪 **Testing Strategy**

### 1. Component Testing (No Server)
```bash
# Use Storybook (only when needed)
pnpm storybook

# Or use component testing library
pnpm test:components
```

### 2. API Testing (Use Postman/Insomnia)
- Save requests in collection
- Test API endpoints without running frontend
- Export collection for team

### 3. E2E Testing (Production Build)
```bash
# Build once
pnpm build

# Run built version (uses less memory)
pnpm start

# Run E2E tests
pnpm test:e2e
```

---

## 📊 **Monitoring Setup**

### Create Monitoring Script
```bash
# Create: monitor.sh
#!/bin/bash
watch -n 5 '
echo "=== Memory Usage ==="
ps aux | grep -E "node|next-server" | grep -v grep | awk "{print \$11, \$4\"%\"}" | sort -nrk2 | head -5

echo ""
echo "=== Docker ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "=== Ports ==="
lsof -i :3000,4000,5555 | grep LISTEN
'

# Make executable
chmod +x monitor.sh

# Run in separate terminal
./monitor.sh
```

---

## 📅 **Daily Workflow (Recommended)**

### Morning Routine
```bash
# 1. Clean start
pnpm kill:all
docker stop $(docker ps -q) 2>/dev/null

# 2. Check system memory
memory_pressure

# 3. Start minimal services
pnpm docker:minimal

# 4. Choose workflow based on task
# - UI work: Option A (Hybrid)
# - API work: Option C (Full Stack)
# - Polish: Option B (Frontend Only)
```

### During Development
```bash
# Monitor in separate terminal
./monitor.sh

# If memory gets high (> 80%)
sudo purge  # Clear cache
pnpm kill:all && pnpm dev:ultra-light  # Restart
```

### Before Committing
```bash
# 1. Type check
pnpm type-check

# 2. Lint
pnpm lint

# 3. Test critical paths
# (manual testing or automated)

# 4. Build test
pnpm build
```

### End of Day
```bash
# Clean up
pnpm kill:all
docker stop $(docker ps -q)

# Optional: Clear caches
pnpm clean:cache
```

---

## 🎨 **Feature-Specific Workflows**

### Working on UI/Styling
```bash
# Hybrid approach (BEST)
pnpm --filter=@nextpik/api start:prod  # Built backend
pnpm dev:ultra-light                    # Frontend
```

### Working on Forms/Validation
```bash
# Frontend only with mock data
export NEXT_PUBLIC_USE_MOCK=true
pnpm dev:ultra-light
```

### Working on API Endpoints
```bash
# Full stack
pnpm dev:api      # Terminal 1
pnpm dev:light    # Terminal 2
```

### Working on Database/Migrations
```bash
# Backend only
pnpm dev:api

# Or use Prisma Studio
pnpm prisma:studio
```

### Testing Payment Flow
```bash
# Use Stripe test mode
# Don't need local server - use Stripe CLI
stripe listen --forward-to localhost:4000/api/v1/payment/webhook
```

---

## 🚀 **Optimization Checklist**

### Before Each Session
- [ ] Close unnecessary apps
- [ ] Check memory pressure (`memory_pressure`)
- [ ] Clear browser cache if needed
- [ ] Choose appropriate workflow (A, B, or C)
- [ ] Start monitoring script

### Weekly Maintenance
- [ ] Clean Next.js cache (`pnpm clean:cache`)
- [ ] Update dependencies (if needed)
- [ ] Clear Docker unused images (`docker system prune`)
- [ ] Restart Mac (clears memory leaks)

### When System Slows Down
1. Check Activity Monitor (CPU & Memory tabs)
2. Run `sudo purge` to clear cache
3. Kill and restart dev server
4. Close and reopen VS Code
5. Restart Docker if needed

---

## 📈 **Expected Performance**

| Setup | Memory | CPU | Hot Reload | Stability |
|-------|--------|-----|------------|-----------|
| **Option A (Hybrid)** ⭐ | 1.5GB | 20% | Fast | High |
| **Option B (Frontend)** | 1.0GB | 15% | Very Fast | Very High |
| **Option C (Full Stack)** | 2.5GB | 35% | Moderate | Moderate |

---

## 🔧 **Advanced Tips**

### 1. Use Git Worktrees (If Working on Multiple Features)
```bash
# Create separate worktree for feature
git worktree add ../nextpik-feature-x feature/x

# Work in that directory (separate node_modules)
cd ../nextpik-feature-x
pnpm install
pnpm dev:ultra-light
```

### 2. Use tmux for Session Management
```bash
# Install tmux
brew install tmux

# Create session
tmux new -s nextpik

# Split panes
Ctrl+B %  # Split vertically
Ctrl+B "  # Split horizontally

# Run different commands in each pane
```

### 3. Create Shortcuts
```bash
# Add to ~/.zshrc or ~/.bashrc
alias np-start='cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik && ./start-light.sh'
alias np-kill='cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik && pnpm kill:all'
alias np-monitor='cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik && ./monitor.sh'
alias np-clean='cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/nextpik && pnpm clean:cache'
```

---

## 🆘 **Troubleshooting**

### Issue: "JavaScript heap out of memory"
```bash
# Increase Node memory temporarily
NODE_OPTIONS='--max-old-space-size=2048' pnpm dev:web
```

### Issue: Port already in use
```bash
# Kill specific port
lsof -ti:3000 | xargs kill -9
```

### Issue: Docker containers won't start
```bash
# Restart Docker
pkill -SIGHUP -f /Applications/Docker.app
sleep 5
open /Applications/Docker.app
```

### Issue: Hot reload not working
```bash
# Clear Next.js cache
rm -rf apps/web/.next
pnpm dev:ultra-light
```

### Issue: TypeScript errors but code works
```bash
# Skip type check temporarily
NEXT_SKIP_TYPECHECK=true pnpm dev:web
```

---

## 📝 **Pre-Deployment Checklist**

Before finalizing development:

- [ ] Run full type check: `pnpm type-check`
- [ ] Run linter: `pnpm lint`
- [ ] Test all critical user flows manually
- [ ] Test on production build: `pnpm build && pnpm start`
- [ ] Check bundle size: `pnpm build` (review output)
- [ ] Test payment flow with Stripe test cards
- [ ] Verify all API endpoints work
- [ ] Test with different user roles (Admin, Seller, Buyer)
- [ ] Check mobile responsiveness
- [ ] Verify all images load correctly
- [ ] Test error handling and edge cases

---

## 🎯 **Recommended Setup for YOU**

Based on your current situation (finalizing development):

### **Best Setup: Hybrid Approach (Option A)**

**Why:**
- ✅ Lowest memory usage (1.5GB total)
- ✅ Fast hot reload for UI changes
- ✅ Stable backend (no rebuilds)
- ✅ Can test full flow
- ✅ Best for UI polish and bug fixes

**How to start:**
```bash
# 1. Build backend once (do this now)
pnpm --filter=@nextpik/api build

# 2. Create start script
cat > start-hybrid.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Hybrid Mode..."

# Terminal 1: Backend (background)
pnpm --filter=@nextpik/api start:prod &
BACKEND_PID=$!

sleep 3

# Terminal 2: Frontend
pnpm dev:ultra-light

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
EOF

chmod +x start-hybrid.sh

# 3. Start development
./start-hybrid.sh
```

### **Alternative: Frontend-Only for UI Polish**
```bash
# If only working on styling/UI
pnpm dev:ultra-light
```

---

## 💡 **Pro Tips**

1. **Use Safari for testing** instead of Chrome (uses 50% less RAM)
2. **Keep Activity Monitor open** to catch memory spikes early
3. **Restart your Mac every 2-3 days** to clear memory leaks
4. **Use production build for backend** when working on frontend
5. **Close VS Code terminal** when not needed (uses memory)
6. **Use `pnpm` instead of `npm`** (already doing this ✅)
7. **Don't run type-check in watch mode** - run manually before commit

---

*Last Updated: January 2026*
*Optimized for: M1 MacBook Pro - 8GB RAM - Finalizing Development*
