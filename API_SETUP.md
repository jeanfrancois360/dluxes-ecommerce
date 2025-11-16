# API Configuration Guide

## Issue Fixed
Fixed CORS (Cross-Origin Resource Sharing) errors that were preventing the frontend from communicating with the backend API.

## Changes Made

### Backend (apps/api)
1. **main.ts** - Updated CORS configuration:
   - Added multiple allowed origins: `http://localhost:3000` and `http://localhost:3001`
   - Added allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   - Added allowed headers: Content-Type, Authorization, x-session-id
   - API runs at: `http://localhost:3001/api/v1`

### Frontend (apps/web)
Updated API_URL in all files to include the `/api/v1` prefix:

1. **src/lib/api/client.ts** - Main API client
2. **src/contexts/cart-context.tsx** - Cart API calls
3. **src/hooks/use-checkout.ts** - Checkout API calls
4. **src/hooks/use-reviews.ts** - Reviews API calls
5. **src/hooks/use-wishlist.ts** - Wishlist API calls
6. **src/app/checkout/success/page.tsx** - Order success page
7. **src/lib/utils/invoice.ts** - Invoice download utility

## API Endpoints
All API endpoints should be accessed with the prefix: `/api/v1`

Example:
- Cart: `http://localhost:3001/api/v1/cart`
- Products: `http://localhost:3001/api/v1/products`
- Orders: `http://localhost:3001/api/v1/orders`

## Running the Servers

### Start Backend
```bash
cd apps/api
pnpm dev
# API will run at http://localhost:3001/api/v1
```

### Start Frontend
```bash
cd apps/web
pnpm dev
# Frontend will run at http://localhost:3000
```

## Environment Variables
To customize the API URL, set:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Troubleshooting
If you still see CORS errors:
1. Make sure the backend API server is running
2. Check that both servers are using the correct ports
3. Clear browser cache and restart both servers
4. Verify CORS_ORIGIN environment variable in backend
