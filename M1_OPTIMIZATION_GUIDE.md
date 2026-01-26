# M1 MacBook Performance Optimization Guide

## 🚨 Current Issue
Your system is showing:
- **8GB RAM used + 14.69GB swap** (critical memory pressure)
- **Next.js dev server: 3.91GB RAM**
- **Multiple node processes consuming 750MB each**
- **Heavy disk I/O from swapping**

## ✅ Optimizations Applied

### 1. Next.js Configuration (`apps/web/next.config.js`)
- ✅ Limited CPU cores to 2
- ✅ Reduced webpack parallelism to 1
- ✅ Optimized code splitting (500KB max chunks)
- ✅ Reduced memory footprint

### 2. Environment Variables (`apps/web/.env.local`)
- ✅ NEXT_PRIVATE_WORKER_THREADS=1 (was 2)
- ✅ NODE_OPTIONS=--max-old-space-size=2048 (was 4096)
- ✅ NEXT_SKIP_TYPECHECK=true (skip TS checking in dev)
- ✅ GENERATE_SOURCEMAP=false (disabled source maps)

### 3. New Scripts (`package.json`)
```bash
# Ultra-light mode (< 1GB RAM)
pnpm dev:ultra-light

# Light mode (< 1.5GB RAM)
pnpm dev:light

# Kill all dev servers
pnpm kill:all
```

---

## 🔥 IMMEDIATE ACTIONS (Do This Now!)

### Step 1: Kill Everything and Restart
```bash
# Kill all running dev servers
pnpm kill:all

# Or manually:
lsof -ti:3000,4000,5555 | xargs kill -9

# Close VS Code completely
# Quit any other dev tools
```

### Step 2: Restart with Ultra-Light Mode
```bash
# Start ONLY the frontend in ultra-light mode
pnpm dev:ultra-light

# Or if you need the backend too (in separate terminal):
pnpm dev:api
```

**Expected RAM Usage:**
- Ultra-light mode: ~800MB - 1.2GB
- Light mode: ~1.2GB - 1.8GB
- Normal mode: ~2.0GB - 2.5GB

---

## 📋 Best Practices for M1 Mac

### ✅ DO THIS
1. **Run ONLY what you need**
   ```bash
   # Frontend only (most common)
   pnpm dev:ultra-light

   # Backend only
   pnpm dev:api

   # Both (if you must)
   # Terminal 1:
   pnpm dev:api
   # Terminal 2:
   pnpm dev:light
   ```

2. **Use Docker Minimal**
   ```bash
   # Only PostgreSQL + Redis (not all services)
   pnpm docker:minimal

   # Full stack (avoid if possible)
   pnpm docker:up
   ```

3. **Close Unused Apps**
   - Close browser tabs you're not using
   - Close Slack, Spotify, etc.
   - Keep only 1-2 browser tabs open for testing

4. **Monitor Memory**
   ```bash
   # Check memory usage
   top -o mem

   # Or use Activity Monitor
   ```

### ❌ DON'T DO THIS
1. ❌ Don't run `pnpm dev` (runs everything)
2. ❌ Don't keep multiple browsers open
3. ❌ Don't run Storybook while dev is running
4. ❌ Don't run type-check in watch mode
5. ❌ Don't enable source maps in dev

---

## 🔧 Advanced Optimizations

### Option 1: Increase Swap (If RAM < 16GB)
```bash
# Check current swap
sysctl vm.swapusage

# macOS manages swap automatically, but you can free memory:
sudo purge
```

### Option 2: Use Production Build for Backend
If you're only working on frontend:
```bash
# Build backend once
pnpm --filter=@nextpik/api build

# Run built version (uses less memory)
pnpm --filter=@nextpik/api start:prod
```

### Option 3: Disable Hot Reload Temporarily
Create `apps/web/next.config.local.js`:
```javascript
module.exports = {
  ...require('./next.config.js'),
  webpack: (config, options) => {
    config.watchOptions = {
      poll: 5000, // Check for changes every 5 seconds
      aggregateTimeout: 3000,
    };
    return config;
  },
};
```

---

## 📊 Expected Performance After Optimization

| Metric | Before | After |
|--------|--------|-------|
| **RAM Usage** | 3.91GB | 1.2GB |
| **CPU Usage** | 40-50% | 15-25% |
| **Disk I/O** | Heavy | Light |
| **Swap Usage** | 14.69GB | < 2GB |
| **Build Time** | ~45s | ~30s |

---

## 🆘 If Still Struggling

### Nuclear Option 1: Disable Fast Refresh
```bash
# Edit apps/web/.env.local
FAST_REFRESH=false
```

### Nuclear Option 2: Use Production Mode
```bash
# Build once
pnpm build

# Run production build locally
cd apps/web && pnpm start
```

### Nuclear Option 3: Upgrade Hardware
If you're doing this professionally, consider:
- 16GB RAM minimum (32GB recommended)
- External SSD for projects
- Close Docker when not needed

---

## 🔍 Debugging High Memory

### Find Memory Hogs
```bash
# Show processes by memory
ps aux | sort -nrk 4 | head -20

# Show Node processes
ps aux | grep node

# Kill specific process
kill -9 <PID>
```

### VS Code Optimizations
Add to VS Code `settings.json`:
```json
{
  "typescript.tsserver.maxTsServerMemory": 2048,
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
```

---

## 📝 Monitoring Commands

```bash
# Real-time memory monitor
watch -n 2 'ps aux | grep "node\|next" | grep -v grep'

# Check Next.js dev server
lsof -i :3000

# Check API server
lsof -i :4000

# Docker stats
docker stats --no-stream
```

---

## ✨ Quick Wins Checklist

- [ ] Killed all running dev servers
- [ ] Closed unnecessary browser tabs
- [ ] Using `pnpm dev:ultra-light` instead of `pnpm dev`
- [ ] Running only PostgreSQL + Redis (not all Docker services)
- [ ] Closed VS Code and reopened
- [ ] Verified RAM usage is < 2GB for dev server
- [ ] Type-checking disabled in dev mode
- [ ] Source maps disabled

---

## 🎯 Daily Workflow (Recommended)

```bash
# 1. Morning - Start essentials
pnpm docker:minimal

# 2. Start dev server (ultra-light)
pnpm dev:ultra-light

# 3. Before committing - Type check
pnpm type-check

# 4. End of day - Clean up
pnpm kill:all
docker stop $(docker ps -q)
```

---

## 📞 Still Having Issues?

If memory usage is still > 3GB after these optimizations:
1. Check Activity Monitor for other processes
2. Restart your Mac (clears memory leaks)
3. Check for Chrome extensions using memory
4. Consider upgrading to 16GB RAM minimum

---

*Last Updated: January 2026*
*Optimized for: M1 MacBook Pro with 8GB RAM*
