# Stripe Webhook Setup for Local Development

## Problem
Stripe webhooks don't fire to `localhost` automatically. When you complete a purchase in Stripe Checkout, the webhook event (`checkout.session.completed`) needs to reach your local API to process the credit purchase.

## Solution: Use Stripe CLI

### 1. Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe CLI
```bash
stripe login
```

### 3. Forward Webhooks to Local API
```bash
# This command forwards Stripe webhooks to your local API
stripe listen --forward-to localhost:4000/api/v1/payment/webhook

# You'll see output like:
# > Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

### 4. Update Environment Variable
Copy the webhook signing secret and add it to your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### 5. Restart API Server
```bash
pnpm dev:api
```

### 6. Test Purchase Again
1. Go to http://localhost:3000/seller/credits
2. Purchase a credit package
3. Complete Stripe Checkout (use test card: `4242 4242 4242 4242`)
4. Watch the terminal running `stripe listen` - you should see the webhook event
5. Credits should now be added correctly!

## Alternative: Manual Credit Addition (Testing Only)

If you need to add credits manually for testing, use this script:

```bash
# Add credits manually (for testing)
pnpm ts-node apps/api/add-credits-manual.ts <userId> <credits>
```

## Production Setup

In production, Stripe webhooks will fire to your public URL:
- Configure webhook endpoint in Stripe Dashboard: `https://yourdomain.com/api/v1/payment/webhook`
- Add the webhook signing secret to production environment variables
- No Stripe CLI needed in production
