# Stripe Database Configuration Fix

## Problem

You configured Stripe API keys in the Admin Settings panel (stored in the database), but the frontend was still trying to read the publishable key from the `.env.local` file, causing an "Invalid API Key" error.

## Root Cause

**Mismatch between backend and frontend configuration sources:**
- **Backend** (`payment.service.ts`): Reads Stripe secret key from **database settings** with fallback to `.env`
- **Frontend** (`stripe.ts`): Was reading publishable key **only from `.env.local`**

## Solution

Updated the frontend to fetch the Stripe publishable key from the database via the API endpoint.

## Changes Made

### 1. Updated `/apps/web/src/lib/stripe.ts`

**Before:**
```typescript
export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return loadStripe(publishableKey);
};
```

**After:**
```typescript
// Now fetches publishable key from database API
async function fetchPublishableKey(): Promise<string> {
  try {
    const response = await fetch(`${apiUrl}/settings/stripe/publishable-key`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data?.publishableKey) {
        return result.data.publishableKey;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch from database, using fallback');
  }

  // Fallback to environment variable if API fails
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (envKey && envKey !== 'pk_test_your_stripe_publishable_key_here') {
    return envKey;
  }

  throw new Error('Stripe publishable key not configured');
}

export const getStripe = async (): Promise<Stripe | null> => {
  const publishableKey = await fetchPublishableKey();
  return loadStripe(publishableKey);
};
```

### 2. Updated `/apps/web/src/app/checkout/page.tsx`

Added `StripeElementsWrapper` component to handle async Stripe loading:

```typescript
function StripeElementsWrapper({
  clientSecret,
  amount,
  onSuccess,
  onError,
  onBack,
}) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    getStripe().then((stripe) => {
      setStripePromise(Promise.resolve(stripe));
    });
  }, []);

  if (!stripePromise) {
    return <LoadingSpinner />;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm ... />
    </Elements>
  );
}
```

## How It Works Now

1. **Admin configures Stripe** in Admin Settings panel (`/admin/settings`)
   - Publishable Key → Saved to database
   - Secret Key → Saved to database
   - Webhook Secret → Saved to database

2. **Backend uses database settings**:
   - `PaymentService.initializeStripe()` reads secret key from database
   - Falls back to `.env` if database is empty

3. **Frontend now fetches from database**:
   - `stripe.ts` calls `GET /api/v1/settings/stripe/publishable-key`
   - Returns publishable key from database
   - Falls back to `.env.local` if API fails

## Benefits

- **Single Source of Truth**: Stripe configuration lives in the database
- **Dynamic Updates**: Change keys via admin panel without restarting servers
- **Fallback Support**: Still works with environment variables if database is not configured
- **No Code Changes Needed**: Update keys through the UI, not code

## Testing

1. Open Admin Settings: `http://localhost:3000/admin/settings`
2. Enter your Stripe keys in the Stripe Payment Gateway section
3. Click "Reload Config" button
4. Navigate to checkout and test payment

## Console Messages

You'll see these helpful messages in the browser console:

- ✅ `Loaded Stripe publishable key from database settings` - Success
- ⚠️ `Failed to fetch Stripe key from database, trying environment variable fallback` - Using fallback
- ❌ `Stripe publishable key not configured` - Neither source has valid key

## API Endpoint

**Public endpoint** (no authentication required):
```
GET /api/v1/settings/stripe/publishable-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publishableKey": "pk_test_51..."
  }
}
```

## Notes

- The publishable key is **safe to expose** to the frontend (per Stripe documentation)
- The secret key is **never sent to the frontend**
- Environment variables still work as fallback for local development
- The "RELOAD CONFIG" button in admin settings refreshes the backend Stripe client

## Verification

To verify Stripe is properly configured, you can:

1. Check the Payment Dashboard in admin panel
2. Look for green checkmarks showing:
   - ✅ Connected
   - ✅ All keys configured
   - ✅ Webhooks Active

3. Test a payment on the checkout page with test card: `4242 4242 4242 4242`
