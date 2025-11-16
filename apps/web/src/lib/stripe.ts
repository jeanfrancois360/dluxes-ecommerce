import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Missing Stripe publishable key. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file');
      throw new Error('Stripe publishable key is not configured');
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

// Export for use in components
export { loadStripe };
