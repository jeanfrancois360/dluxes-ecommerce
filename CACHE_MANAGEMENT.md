# NextPik Cache Management & Auto-Update System

## 🔄 Overview

NextPik implements a multi-layered cache management system that automatically detects new deployments and prompts users to refresh, eliminating the need for manual cache clearing.

---

## 🎯 Implemented Solutions

### 1. **Automatic Version Detection** ✅

**Component:** `apps/web/src/components/version-checker.tsx`

**How it works:**

- Checks for new version every 5 minutes in production
- Compares current version with server version
- Shows elegant update prompt when new version detected
- Allows users to refresh immediately or dismiss temporarily

**Features:**

- 🎨 Beautiful UI with Framer Motion animations
- ⏰ Configurable check intervals (default: 5 minutes)
- 🔄 Hard refresh with cache clearing on update
- ⏸️ Snooze option (30 minutes if dismissed)
- 🚫 Automatically disabled in development

**User Experience:**

```
┌─────────────────────────────────────────┐
│ 🔄  Update Available                    │
│                                         │
│ A new version of NextPik is available. │
│ Please refresh to get the latest       │
│ features and improvements.             │
│                                         │
│ Current: 2.6.0 → New: 2.7.0            │
│                                         │
│ [Refresh Now] [Later]              ✕   │
└─────────────────────────────────────────┘
```

---

### 2. **Build-Time Version Generation** ✅

**Script:** `apps/web/scripts/generate-version.js`

**Automatically runs before every build:**

```bash
pnpm build
# ↓ Runs prebuild script
# ↓ Generates public/version.json
# ↓ Builds Next.js app
```

**Generated version.json:**

```json
{
  "version": "2.6.0",
  "buildTime": "2026-02-11T21:00:00.000Z",
  "gitHash": "dea5d45"
}
```

**Data sources:**

- `version`: From `package.json`
- `buildTime`: Current timestamp
- `gitHash`: From `git rev-parse --short HEAD`

---

### 3. **Proper Cache Headers** ✅

**File:** `apps/web/next.config.js`

**Strategy:**

| Resource Type                                | Cache Strategy          | Max Age   |
| -------------------------------------------- | ----------------------- | --------- |
| **Static Assets** (`/static/*`, `/images/*`) | Public, immutable       | 1 year    |
| **Version File** (`/version.json`)           | No cache                | 0         |
| **HTML Pages** (`/`)                         | Public, must-revalidate | 1 hour    |
| **Next.js Build Assets**                     | Automatic hash-based    | Immutable |

**Benefits:**

- ✅ Fast loading for static assets
- ✅ Always fresh version checks
- ✅ Balanced performance and freshness

---

### 4. **Next.js Built-in Cache Busting** ✅

Next.js automatically:

- Adds content hashes to all JavaScript/CSS bundles
- Generates unique filenames per build
- Invalidates old files automatically

**Example:**

```
Before: main.js
After:  main-a1b2c3d4.js (hash changes every build)
```

---

## 🚀 Deployment Workflow

### **Step 1: Build**

```bash
pnpm build
```

- Runs `prebuild` script
- Generates `public/version.json` with new version
- Builds Next.js app with new content hashes

### **Step 2: Deploy**

- Upload new build to server
- New version.json is deployed
- New hashed assets are deployed

### **Step 3: User Detection** (Automatic)

- VersionChecker polls `/version.json` every 5 minutes
- Detects version mismatch
- Shows update prompt to user

### **Step 4: User Refresh**

- User clicks "Refresh Now"
- All caches cleared
- Page hard reloaded
- New version loaded

---

## 📋 Configuration

### Update Check Interval

Edit `apps/web/src/components/version-checker.tsx`:

```typescript
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes (default)
// Or
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CHECK_INTERVAL = 1 * 60 * 1000; // 1 minute (aggressive)
```

### Snooze Duration

```typescript
// Show again after 30 minutes if dismissed
setTimeout(() => setShowUpdatePrompt(true), 30 * 60 * 1000);
```

### Version Source

Edit `apps/web/package.json`:

```json
{
  "version": "2.7.0" // Increment this for each release
}
```

---

## 🧪 Testing

### Test Version Detection

1. **Start dev server:**

   ```bash
   pnpm dev:web
   ```

2. **Manually change version.json:**

   ```bash
   # Edit public/version.json
   {
     "version": "999.0.0",  // Changed version
     "buildTime": "2026-02-11T21:00:00.000Z",
     "gitHash": "test"
   }
   ```

3. **Wait 5 minutes or refresh page**
   - Update prompt should appear
   - Click "Refresh Now" to test reload

### Test Cache Headers

```bash
# Check version.json headers
curl -I http://localhost:3000/version.json

# Should see:
# Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

---

## 🔧 Advanced Options

### Option 1: Service Worker (Future Enhancement)

Add a service worker for:

- Offline support
- Background sync
- Push notifications for updates
- More granular cache control

### Option 2: WebSocket Update Notifications

For instant updates without polling:

- Server pushes update notification via WebSocket
- Client shows prompt immediately
- No 5-minute delay

### Option 3: Automatic Refresh

For critical updates, auto-refresh without user confirmation:

```typescript
// In version-checker.tsx
if (isCriticalUpdate) {
  window.location.reload();
}
```

---

## 📊 Monitoring

### Track Update Adoption

Add analytics to version-checker:

```typescript
const handleRefresh = () => {
  // Log to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'app_update', {
      from_version: CURRENT_VERSION,
      to_version: newVersion,
    });
  }

  // Then refresh
  window.location.reload();
};
```

### Alert on Version Mismatch

Server-side logging:

```typescript
// In API middleware
if (clientVersion !== serverVersion) {
  logger.info('Client using outdated version', {
    client: clientVersion,
    server: serverVersion,
  });
}
```

---

## ❓ FAQ

### Q: Will users see the prompt on every page?

**A:** No. The component is in the root layout, so it appears once per session and persists across navigation.

### Q: What if users never refresh?

**A:** The prompt reappears if dismissed. For critical updates, you can make it non-dismissible or add a countdown.

### Q: Does this work offline?

**A:** No. The version check requires network connectivity. For offline support, implement a service worker.

### Q: Can I force an immediate refresh?

**A:** Yes. Set `CHECK_INTERVAL = 0` and remove the dismiss option to force immediate updates.

### Q: What about mobile users?

**A:** Works the same. The prompt is responsive and mobile-friendly.

---

## 🎯 Best Practices

1. **Increment version in package.json** for every production deployment
2. **Test locally** before deploying to production
3. **Monitor** update adoption rates via analytics
4. **Communicate** major updates through the prompt message
5. **Avoid** too frequent checks (causes unnecessary network traffic)
6. **Consider** WebSocket for mission-critical real-time updates

---

## 📝 Version Bump Workflow

```bash
# 1. Update version
npm version patch  # 2.6.0 → 2.6.1 (bug fixes)
npm version minor  # 2.6.0 → 2.7.0 (new features)
npm version major  # 2.6.0 → 3.0.0 (breaking changes)

# 2. Commit version change
git add package.json
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"

# 3. Build and deploy
pnpm build
# Deploy to production

# 4. Monitor
# Watch for update prompts appearing to users
```

---

## ✅ Checklist for New Deployments

- [ ] Version bumped in `package.json`
- [ ] `pnpm build` runs successfully
- [ ] `public/version.json` generated with new version
- [ ] Deploy completed without errors
- [ ] Test version.json accessible: `curl https://nextpik.com/version.json`
- [ ] Monitor user update adoption
- [ ] Check for errors in Sentry/logs

---

_Last Updated: February 11, 2026_
_NextPik v2.6.0 - Cache Management System_
