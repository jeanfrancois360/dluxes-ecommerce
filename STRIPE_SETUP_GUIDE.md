# Stripe Payment Setup Guide

## Quick Start

Follow these steps to enable Stripe payments in your application:

### 1. Create a Stripe Account

1. Go to https://stripe.com
2. Click "Start now" or "Sign in"
3. Create an account or log in

### 2. Get Your API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Safe to expose in frontend
   - **Secret key** (starts with `sk_test_...`) - Keep this private!

### 3. Configure Frontend

Edit: `apps/web/.env.local`

```env
# Replace with your actual Stripe PUBLISHABLE key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...your_key_here
```

### 4. Configure Backend

Edit: `apps/api/.env`

```env
# Replace with your actual Stripe SECRET key
STRIPE_SECRET_KEY=sk_test_51ABC...your_secret_key_here
```

### 5. Restart Development Servers

```bash
# Stop the current dev server (Ctrl+C)
# Then restart
pnpm dev
```

## Test Cards

Use these test cards for testing payments:

### Successful Payment
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Declined Payment
```
Card: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Requires Authentication (3D Secure)
```
Card: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

## Verification

After setup, verify by:

1. Navigate to `/checkout`
2. Add items to cart
3. Complete shipping information
4. Try a test payment with `4242 4242 4242 4242`
5. Payment should process successfully

## Troubleshooting

### "Invalid API Key" Error
- **Issue**: Keys not properly configured
- **Fix**: Double-check both `.env` files have the correct keys
- **Verify**: Make sure you copied the ENTIRE key (including the prefix)

### "Stripe not loading"
- **Issue**: Frontend key not set
- **Fix**: Check `apps/web/.env.local` has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Restart**: Must restart dev server after changing .env files

### "Payment failed" Error
- **Issue**: Backend can't process payment
- **Fix**: Ensure `apps/api/.env` has `STRIPE_SECRET_KEY` configured
- **Check**: Verify the secret key starts with `sk_test_`

## Security Notes

⚠️ **Important**:
- Never commit real API keys to git
- Use test keys (pk_test_/sk_test_) in development
- Use live keys (pk_live_/sk_live_) only in production
- The frontend key (pk_) is safe to expose
- The backend key (sk_) must stay private

## Production Deployment

When ready for production:

1. Switch to **Live** mode in Stripe Dashboard
2. Get your **live** API keys (pk_live_, sk_live_)
3. Add them to production environment variables
4. Complete Stripe account verification
5. Set up webhooks for production events

## Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [API Keys Guide](https://stripe.com/docs/keys)
- [Test Cards Reference](https://stripe.com/docs/testing)
