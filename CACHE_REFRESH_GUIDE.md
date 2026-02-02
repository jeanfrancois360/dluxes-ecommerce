# Frontend Cache Refresh Guide

## Problem
After database changes, the frontend may show old data due to SWR caching.

## Quick Fix

### Method 1: Hard Refresh (Recommended)
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

This clears the browser cache and forces a fresh reload.

### Method 2: Incognito/Private Window
1. Open incognito window
2. Navigate to `http://localhost:3000`
3. Log in
4. Fresh data should load

### Method 3: Clear Browser Cache
**Chrome:**
1. Settings → Privacy and security → Clear browsing data
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page

**Firefox:**
1. Settings → Privacy & Security → Cookies and Site Data
2. Click "Clear Data"
3. Select "Cached Web Content"
4. Click "Clear"

### Method 4: Clear SWR Cache Programmatically
Add this button to any page for testing:

```tsx
import { useSWRConfig } from 'swr';

function ClearCacheButton() {
  const { cache } = useSWRConfig();
  
  return (
    <button onClick={() => {
      cache.clear();
      window.location.reload();
    }}>
      Clear Cache & Reload
    </button>
  );
}
```

### Method 5: Force Refresh in Code
If you want to force a refresh after an action:

```tsx
import { useSWRConfig } from 'swr';

function Component() {
  const { mutate } = useSWRConfig();
  
  const handleAction = async () => {
    // Perform action
    await api.doSomething();
    
    // Force refresh specific endpoint
    await mutate('/credits/balance');
    
    // Or refresh all SWR cache
    await mutate(() => true);
  };
}
```

## Why This Happens

SWR (Stale-While-Revalidate) caches API responses to improve performance. This means:
- First load: Data fetched from API
- Subsequent loads: Cached data shown immediately
- Background: Fresh data fetched and updates cache

When you make direct database changes (like adding credits manually), the cache doesn't know about it until:
1. You manually refresh
2. The cache expires (configured in `dedupingInterval`)
3. You focus the tab (triggers revalidation)

## Production Notes

In production, this is usually not an issue because:
- Webhooks process immediately after Stripe payment
- User refreshes after seeing "success" page
- Cache expiration handles the rest

In development with manual database changes, you need to manually refresh.
