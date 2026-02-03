# 🚀 Quick Start Guide - M1 Mac Optimized

## ⚡ START HERE - Recommended Setup

### **Option 1: Hybrid Mode (BEST)** ⭐
**For:** UI work, styling, most development tasks
**Memory:** ~1.5GB | **Speed:** Fast

```bash
./start-hybrid.sh
```

**What it does:**
- ✅ Backend (built, 300MB)
- ✅ Frontend (ultra-light, 1GB)
- ✅ Docker (minimal)
- ✅ Total: ~1.5GB RAM

---

### **Option 2: Ultra-Light Mode** 🏃
**For:** Frontend-only work, UI polish
**Memory:** ~1GB | **Speed:** Very Fast

```bash
pnpm dev:ultra-light
```

---

### **Option 3: Full Stack** 🔥
**For:** API development, backend changes
**Memory:** ~2.5GB | **Speed:** Moderate

```bash
# Terminal 1
pnpm dev:api

# Terminal 2 (separate terminal)
pnpm dev:light
```

---

## 📊 Monitor System

```bash
# Run in separate terminal
./monitor.sh
```

Shows:
- Memory usage
- CPU usage
- Running processes
- Docker stats

---

## 🛑 Stop Everything

```bash
pnpm kill:all

# Or manually
lsof -ti:3000,4000,5555 | xargs kill -9
```

---

## 🔧 Common Tasks

### Before Committing
```bash
pnpm type-check
pnpm lint
```

### Clear Cache (If Slow)
```bash
rm -rf apps/web/.next
pnpm dev:ultra-light
```

### Restart Fresh
```bash
pnpm kill:all
./start-hybrid.sh
```

### Rebuild Backend (After API Changes)
```bash
pnpm --filter=@nextpik/api build
```

---

## 💡 Tips

1. **Close Chrome tabs** - Keep only 2-3 open
2. **Use Safari** for testing (uses less RAM)
3. **Close VS Code terminal** when not using it
4. **Quit Slack/Spotify** before starting dev
5. **Restart Mac** every 2-3 days to clear memory

---

## 🆘 If System Slows Down

```bash
# 1. Clear memory
sudo purge

# 2. Restart dev server
pnpm kill:all
./start-hybrid.sh

# 3. Check memory
./monitor.sh
```

---

## 📁 Important Files

- `OPTIMAL_DEV_SETUP.md` - Complete guide
- `M1_OPTIMIZATION_GUIDE.md` - Performance tips
- `start-hybrid.sh` - Hybrid mode (recommended)
- `start-light.sh` - Interactive mode selector
- `monitor.sh` - System monitoring

---

## ⚡ Memory Targets

| Mode | Target RAM | Max RAM |
|------|-----------|---------|
| Ultra-Light | 1.0GB | 1.3GB |
| Hybrid ⭐ | 1.5GB | 2.0GB |
| Full Stack | 2.5GB | 3.0GB |

**If exceeding max:** Restart with `pnpm kill:all`

---

## 🎯 Your Daily Workflow

```bash
# 1. Morning
./start-hybrid.sh

# 2. Monitor (optional, separate terminal)
./monitor.sh

# 3. Work on your features...

# 4. Before commit
pnpm type-check

# 5. End of day
pnpm kill:all
```

---

**Need help?** Check `OPTIMAL_DEV_SETUP.md` for detailed instructions.
