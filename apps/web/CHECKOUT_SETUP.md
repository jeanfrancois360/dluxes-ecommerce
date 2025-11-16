# Quick Setup Guide - Stripe Checkout

## Step 1: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Add your Stripe publishable key to `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

Get your test key from: https://dashboard.stripe.com/test/apikeys

## Step 2: Backend API Setup

The checkout flow requires these API endpoints. Make sure your backend implements:

### Payment Intent Endpoint
```typescript
POST /api/payments/create-intent
Body: { amount: number, currency: string }
Response: { clientSecret: string, paymentIntentId: string }
```

### Order Creation Endpoint
```typescript
POST /api/orders
Body: {
  paymentIntentId: string,
  shippingAddress: Address,
  shippingMethod: ShippingMethod,
  items: CartItem[],
  totals: CartTotals
}
Response: { id: string, orderNumber: string, ... }
```

### Order Retrieval Endpoint
```typescript
GET /api/orders/:id
Response: Order object with all details
```

## Step 3: Test the Flow

1. Start your development server:
```bash
npm run dev
```

2. Add items to your cart

3. Navigate to `/checkout`

4. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date
   - Any 3-digit CVC

## Common Issues

### "Stripe publishable key is not configured"
- Make sure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is in `.env.local`
- Restart your dev server after adding environment variables

### "Failed to initialize payment"
- Check that your backend payment intent endpoint is working
- Verify the API_URL in your environment variables
- Check browser console for detailed error messages

### Components not found
- All components are exported from `@luxury/ui`
- Run `npm install` in the root directory
- Build the UI package: `cd packages/ui && npm run build`

## Testing Checklist

- [ ] Can add items to cart
- [ ] Can access checkout page
- [ ] Shipping address form validates correctly
- [ ] Can select shipping method
- [ ] Payment form loads Stripe Elements
- [ ] Can enter test card details
- [ ] Payment processing shows loading state
- [ ] Successful payment redirects to success page
- [ ] Success page shows confetti animation
- [ ] Order details display correctly
- [ ] Can cancel checkout and return to cart
- [ ] Error messages display for invalid cards
- [ ] Mobile responsive design works

## Next Steps

1. Implement the backend API endpoints
2. Set up Stripe webhooks for payment confirmation
3. Configure email notifications
4. Add order tracking functionality
5. Implement invoice generation
6. Set up production Stripe keys

## Support

For questions or issues:
- Check the main CHECKOUT_IMPLEMENTATION.md for detailed documentation
- Review Stripe documentation: https://stripe.com/docs
- Check the browser console for error messages
- Verify all environment variables are set correctly
