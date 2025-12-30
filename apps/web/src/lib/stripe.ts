import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;
let publishableKeyCache: string | null = null;

/**
 * Fetch Stripe publishable key from database settings
 * Falls back to environment variable if API call fails
 */
async function fetchPublishableKey(): Promise<string> {
  // Return cached key if available
  if (publishableKeyCache) {
    return publishableKeyCache;
  }

  try {
    // Fetch from database settings API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const response = await fetch(`${apiUrl}/settings/stripe/publishable-key`);

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data?.publishableKey) {
        publishableKeyCache = result.data.publishableKey;
        console.log('✅ Loaded Stripe publishable key from database settings');
        return result.data.publishableKey;
      }
    }

    // Log API error for debugging
    console.warn('⚠️ Failed to fetch Stripe key from database, trying environment variable fallback');
  } catch (error) {
    console.warn('⚠️ Error fetching Stripe key from API:', error);
  }

  // Fallback to environment variable
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (envKey && envKey !== 'pk_test_your_stripe_publishable_key_here') {
    publishableKeyCache = envKey;
    console.log('✅ Using Stripe publishable key from environment variable');
    return envKey;
  }

  // No key found
  console.error('❌ Stripe publishable key not configured in database or environment variables');
  throw new Error(
    'Stripe publishable key is not configured. Please configure Stripe in Admin Settings > Payment Settings.'
  );
}

/**
 * Get Stripe instance (loads publishable key from database settings)
 */
export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = await fetchPublishableKey();
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

/**
 * Reset Stripe instance (useful after updating settings)
 */
export const resetStripe = () => {
  stripePromise = null;
  publishableKeyCache = null;
};

// Export for use in components
export { loadStripe };
