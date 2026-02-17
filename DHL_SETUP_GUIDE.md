# DHL Express API Setup Guide

## Problem

Your DHL credentials are showing as "Invalid" because they appear to be test/placeholder values:

- `DHL_EXPRESS_API_KEY`: 14 characters (too short)
- `DHL_EXPRESS_API_SECRET`: 18 characters (too short)

Real DHL Express API credentials are typically 32+ characters long.

## Solution: Get Real DHL API Credentials

### Option 1: DHL Express MyDHL API (Production)

1. **Sign up for DHL Express Developer Account:**
   - Go to: https://developer.dhl.com/
   - Click "Register" and create an account
   - Verify your email

2. **Create a MyDHL API Application:**
   - Log in to DHL Developer Portal
   - Go to "My Apps" → "Create New App"
   - Select "MyDHL API" (for shipping rates)
   - Fill in application details

3. **Get Your Credentials:**
   - After creating the app, you'll receive:
     - **API Key** (Consumer Key) - usually 32+ characters
     - **API Secret** (Consumer Secret) - usually 32+ characters
   - Copy these credentials

4. **Update Your .env File:**

   ```bash
   # Find your .env file (usually in apps/api/ or root)
   DHL_EXPRESS_API_KEY=your_actual_32_character_api_key_here
   DHL_EXPRESS_API_SECRET=your_actual_32_character_api_secret_here
   DHL_API_ENVIRONMENT=production
   DHL_ACCOUNT_NUMBER=your_dhl_account_number
   ```

5. **Restart Your API:**
   ```bash
   pnpm dev:api
   ```

### Option 2: DHL Sandbox/Test Environment (For Testing)

If you just want to test the integration:

1. Use DHL's sandbox credentials from their documentation
2. Set environment to `test`:
   ```bash
   DHL_API_ENVIRONMENT=test
   ```

### Option 3: Disable DHL Integration (Temporary Workaround)

If you don't need DHL integration right now:

1. **Set Shipping Mode to "Manual" or "Hybrid":**
   - In Settings → Shipping → Shipping Mode
   - Select "Manual Configuration"
   - This uses your configured rates instead of DHL

2. **Or leave environment variables empty:**
   ```bash
   # Comment out or remove DHL credentials
   # DHL_EXPRESS_API_KEY=
   # DHL_EXPRESS_API_SECRET=
   DHL_API_ENVIRONMENT=test
   ```

## Verification

After updating credentials:

1. **Go to Settings → Shipping**
2. **Scroll to "DHL Express Configuration"**
3. **Click "REFRESH" button**
4. **You should see:**
   - API Key: Configured ✓
   - Credentials: Valid ✓
   - Mode: Production (or Test)

5. **Click "TEST RATES"** to verify it works

## Troubleshooting

### "Credentials Invalid" persists:

- Check that API keys are correct (no extra spaces)
- Verify DHL account is active and has API access enabled
- Check if you're using sandbox credentials with `DHL_API_ENVIRONMENT=production`
- Contact DHL support to verify your API access

### "No shipping options available":

- Make sure shipping mode is set to "Hybrid" (recommended)
- Hybrid mode will fall back to manual rates if DHL fails
- Check that origin address is configured in Settings

### Network/Connection errors:

- Check your internet connection
- Verify DHL API endpoints are accessible
- Check firewall/proxy settings

## Current Setup Summary

Your current environment variables:

- ✅ `DHL_API_ENVIRONMENT`: 10 characters (likely "production")
- ❌ `DHL_EXPRESS_API_KEY`: 14 characters (TOO SHORT - needs real credentials)
- ❌ `DHL_EXPRESS_API_SECRET`: 18 characters (TOO SHORT - needs real credentials)
- ✅ `DHL_ACCOUNT_NUMBER`: 9 characters (looks valid)

**Action Required**: Replace the API Key and Secret with real credentials from DHL Developer Portal.
