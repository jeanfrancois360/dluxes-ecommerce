# Gelato Webhook - Quick Start Checklist

## ✅ Completed Steps

- [x] Webhook infrastructure implemented
- [x] Webhook secret generated
- [x] Environment variables updated
- [x] Test script created

## 📋 Next Steps (Do These Now)

### 1. Get Your Gelato Store ID (2 minutes)

1. Go to https://dashboard.gelato.com
2. Navigate to **Stores**
3. Copy your **Store ID**
4. Update `.env` file:
   ```bash
   GELATO_STORE_ID=your_store_id_here
   ```

### 2. Set Up Ngrok for Local Testing (5 minutes)

For local development, webhooks need a public URL. Install ngrok:

```bash
# Install ngrok (if not installed)
brew install ngrok

# Run ngrok
ngrok http 4000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 3. Configure Webhook in Gelato (3 minutes)

1. Go to **Developer** → **Webhooks** in Gelato Dashboard
2. Click **Create Webhook**
3. Fill in:

   **URL:**

   ```
   https://your-ngrok-url.ngrok.io/api/v1/webhooks/gelato
   ```

   **Custom Header:**
   - Name: `x-webhook-secret`
   - Value: `8a2e38e3b936cad3e0e97497e95352c7751056e8898d2b65b30fd573e9c87529`

   **Events (check these):**
   - ✅ order_status_updated
   - ✅ order_item_status_updated
   - ✅ order_item_tracking_code_updated
   - ✅ order_delivery_estimate_updated

4. Click **Create**

### 4. Test the Webhook (2 minutes)

Run the test script:

```bash
./test-gelato-webhook.sh
```

Or test via Gelato dashboard's "Test Webhook" button.

### 5. Verify It's Working

1. Check backend logs for:

   ```
   Received Gelato webhook: order_status_updated
   ```

2. Check database:
   ```bash
   pnpm prisma:studio
   # Open GelatoWebhookEvent table
   ```

---

## 🚀 Production Deployment

For production, update webhook URL to:

```
https://your-production-domain.com/api/v1/webhooks/gelato
```

---

## 📚 Full Documentation

- **Detailed Setup:** `GELATO_WEBHOOK_SETUP.md`
- **Test Script:** `test-gelato-webhook.sh`
- **Code:** `apps/api/src/gelato/gelato-webhook.controller.ts`

---

## 🔑 Important Values

**Webhook Secret (already configured):**

```
8a2e38e3b936cad3e0e97497e95352c7751056e8898d2b65b30fd573e9c87529
```

**Webhook Endpoint:**

```
/api/v1/webhooks/gelato
```

**Custom Header:**

```
x-webhook-secret: 8a2e38e3b936cad3e0e97497e95352c7751056e8898d2b65b30fd573e9c87529
```

---

## ⏱️ Estimated Time

- **Total setup time:** ~12 minutes
- **Technical difficulty:** Easy

---

**Need Help?** Check `GELATO_WEBHOOK_SETUP.md` for troubleshooting.
