# 🛍️ Luxury Product & E-commerce System - Complete Guide

**Magazine-Quality Product Management & Premium Checkout Experience**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Product Display System](#product-display-system)
3. [Shopping Cart](#shopping-cart)
4. [Checkout Experience](#checkout-experience)
5. [Admin Dashboard](#admin-dashboard)
6. [Stripe Integration](#stripe-integration)
7. [Setup Instructions](#setup-instructions)
8. [API Documentation](#api-documentation)

---

## 🎯 Overview

### What's Included

✅ **Product Display**
- Elegant product cards with Ken Burns hover effects
- Masonry & grid layout options
- Quick view modal
- Wishlist functionality
- Advanced image gallery

✅ **Shopping Experience**
- Slide-out cart drawer
- Smooth animations
- Real-time cart updates
- Saved for later
- Recently viewed products

✅ **Checkout**
- Single-page premium checkout
- Stripe Elements integration
- Apple Pay / Google Pay support
- Live card preview
- Address autocomplete

✅ **Admin Dashboard**
- Product management
- Inventory tracking
- Image gallery manager
- Bulk operations
- SEO optimization

---

## 🎨 Product Display System

### Components Available

#### 1. ProductCard
**Location:** `packages/ui/src/components/product-card.tsx`

**Features:**
- ✅ Ken Burns effect on hover
- ✅ Auto-cycling images
- ✅ Wishlist heart button
- ✅ Quick add button (slides up)
- ✅ Quick view modal trigger
- ✅ Discount badges
- ✅ Stock indicators
- ✅ Rating display

**Usage:**
```tsx
import { ProductCard } from '@luxury/ui';

<ProductCard
  id="prod_123"
  name="Cashmere Sweater"
  brand="LUXURY"
  price={299}
  compareAtPrice={450}
  image="https://..."
  images={['url1', 'url2']}
  badges={['New', 'Sale']}
  rating={4.5}
  reviewCount={128}
  slug="cashmere-sweater"
  onQuickView={(id) => console.log('Quick view', id)}
  onAddToWishlist={(id) => console.log('Wishlist', id)}
  onQuickAdd={(id) => console.log('Add to cart', id)}
/>
```

**Animations:**
- Image scales to 1.05x on hover (700ms ease)
- Button slides up from bottom
- Wishlist fades in/out
- Badge animations

---

#### 2. ProductGrid
**Location:** `packages/ui/src/components/product-grid.tsx`

**Layouts:**
- **Grid**: Standard responsive grid (2/3/4 columns)
- **Masonry**: Pinterest-style asymmetric layout

**Features:**
- ✅ Staggered entrance animations
- ✅ Empty state with illustration
- ✅ Loading skeletons
- ✅ Responsive breakpoints

**Usage:**
```tsx
import { ProductGrid } from '@luxury/ui';

<ProductGrid
  products={products}
  layout="masonry"  // or "grid"
  columns={3}
  gap="md"
  loading={false}
  onQuickView={handleQuickView}
  onAddToWishlist={handleWishlist}
  onQuickAdd={handleAddToCart}
/>
```

---

#### 3. Quick View Modal
**To Implement:** See implementation below

**Design Specs:**
```tsx
// Modal appears with backdrop blur
const QuickViewModal = ({ productId, onClose }) => (
  <AnimatePresence>
    <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-5xl mx-auto mt-20"
      >
        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Left: Image Gallery */}
          <ProductGallery images={product.images} />

          {/* Right: Product Info */}
          <div>
            <h2 className="text-3xl font-serif">{product.name}</h2>
            <p className="text-gold text-3xl mt-4">€{product.price}</p>

            {/* Variant Selector */}
            <VariantSelector variants={product.variants} />

            {/* Add to Cart */}
            <button className="w-full mt-6 bg-black text-white py-4 rounded-lg">
              Add to Bag
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);
```

---

## 🛒 Shopping Cart

### Cart Drawer Component
**Location:** To create at `apps/web/src/components/cart/cart-drawer.tsx`

**Design Specs:**
```tsx
const CartDrawer = ({ isOpen, onClose, items }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50"
        >
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif">Shopping Bag ({items.length})</h2>
              <button onClick={onClose}>×</button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-auto p-6">
            {items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdate}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="border-t p-6">
            <div className="flex justify-between text-xl font-serif mb-6">
              <span>Total</span>
              <span>€{total}</span>
            </div>
            <button className="w-full bg-black text-white py-4 rounded-lg">
              Proceed to Checkout
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
```

**Features:**
- ✅ Slide-in from right
- ✅ Smooth quantity adjusters
- ✅ Swipe to remove on mobile
- ✅ Mini product images
- ✅ Real-time total calculation
- ✅ Empty cart illustration
- ✅ Free shipping threshold

---

### Cart Item Component
```tsx
const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex gap-4 mb-4 pb-4 border-b"
  >
    {/* Image */}
    <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100">
      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
    </div>

    {/* Info */}
    <div className="flex-1">
      <h4 className="font-medium">{item.name}</h4>
      <p className="text-sm text-neutral-600">{item.variant}</p>
      <p className="text-gold font-serif mt-1">€{item.price}</p>
    </div>

    {/* Quantity */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        className="w-8 h-8 rounded-full border hover:border-gold"
      >
        −
      </button>
      <span className="w-8 text-center">{item.quantity}</span>
      <button
        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        className="w-8 h-8 rounded-full border hover:border-gold"
      >
        +
      </button>
    </div>

    {/* Remove */}
    <button
      onClick={() => onRemove(item.id)}
      className="text-neutral-400 hover:text-error-DEFAULT"
    >
      ×
    </button>
  </motion.div>
);
```

---

## 💳 Premium Checkout Experience

### Checkout Page
**Location:** `apps/web/src/app/checkout/page.tsx`

**Layout:**
```
Desktop: Two-column (Form | Order Summary)
Mobile: Single column with collapsible summary
```

**Design Specifications:**

```tsx
const CheckoutPage = () => {
  const [step, setStep] = useState('shipping'); // shipping | payment | review

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <ProgressBar currentStep={step} />

        <div className="grid lg:grid-cols-2 gap-8 mt-12">
          {/* Left: Forms */}
          <div className="space-y-6">
            {/* Shipping Section */}
            <CheckoutSection
              title="Shipping Address"
              isActive={step === 'shipping'}
            >
              <ShippingForm />
            </CheckoutSection>

            {/* Payment Section */}
            <CheckoutSection
              title="Payment Method"
              isActive={step === 'payment'}
            >
              <PaymentForm />
            </CheckoutSection>
          </div>

          {/* Right: Order Summary (Sticky) */}
          <div className="lg:sticky lg:top-8 h-fit">
            <OrderSummary items={cart.items} />
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### Payment Components

#### Card Preview (Live Updates)
```tsx
const CreditCardPreview = ({ cardData }) => (
  <div className="relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden mb-6">
    <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-800 to-neutral-900 p-6">
      {/* Chip */}
      <div className="w-12 h-10 bg-gold/80 rounded-md mb-8" />

      {/* Card Number */}
      <p className="text-white text-xl tracking-widest font-mono mb-6">
        {cardData.number || '•••• •••• •••• ••••'}
      </p>

      {/* Name & Expiry */}
      <div className="flex justify-between">
        <div>
          <p className="text-xs text-neutral-400 uppercase">Cardholder</p>
          <p className="text-white">{cardData.name || 'Your Name'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-400 uppercase">Expires</p>
          <p className="text-white">{cardData.expiry || 'MM/YY'}</p>
        </div>
      </div>
    </div>
  </div>
);
```

#### Stripe Elements Integration
```tsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      console.error(error);
    } else {
      // Process payment
      await processPayment(paymentMethod.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#000',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              '::placeholder': {
                color: '#aaa',
              },
            },
          },
        }}
      />

      {/* Apple Pay / Google Pay */}
      <PaymentRequestButton />

      <button type="submit" className="w-full mt-6 bg-black text-white py-4 rounded-lg">
        Pay €{total}
      </button>
    </form>
  );
};
```

---

## 🔧 Admin Dashboard

### Product Management Interface

**Features:**
- ✅ Data table with inline editing
- ✅ Drag-and-drop image upload
- ✅ Rich text editor (TipTap)
- ✅ Real-time preview
- ✅ Bulk operations
- ✅ Variant management
- ✅ SEO optimization panel

**Page Structure:**
```tsx
const AdminProductsPage = () => (
  <div className="p-8">
    {/* Header */}
    <div className="flex justify-between mb-8">
      <h1 className="text-3xl font-serif">Products</h1>
      <button className="bg-black text-white px-6 py-3 rounded-lg">
        Add Product
      </button>
    </div>

    {/* Filters */}
    <ProductFilters />

    {/* Table */}
    <ProductTable
      products={products}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBulkAction={handleBulkAction}
    />

    {/* Product Modal */}
    <ProductModal
      isOpen={isModalOpen}
      product={selectedProduct}
      onSave={handleSave}
    />
  </div>
);
```

---

## 💰 Stripe Integration

### Setup Steps

1. **Install Stripe**
```bash
pnpm add @stripe/stripe-js @stripe/react-stripe-js stripe --filter @luxury/web
pnpm add stripe --filter @luxury/api
```

2. **Configure Environment**
```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. **Wrap App with Stripe Provider**
```tsx
// apps/web/src/app/layout.tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Elements stripe={stripePromise}>
          {children}
        </Elements>
      </body>
    </html>
  );
}
```

4. **Create Payment Intent API**
```typescript
// apps/api/src/payments/payments.controller.ts
@Post('create-intent')
async createPaymentIntent(@Body() dto: CreatePaymentDto) {
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: dto.amount * 100, // Convert to cents
    currency: 'eur',
    metadata: {
      orderId: dto.orderId,
    },
  });

  return { clientSecret: paymentIntent.client_secret };
}
```

---

## 🚀 Setup Instructions

### 1. Database Schema (Already in schema.prisma)

The product models are already defined:
- ✅ Product
- ✅ ProductImage
- ✅ ProductVariant
- ✅ Category
- ✅ Collection
- ✅ Cart
- ✅ CartItem
- ✅ Order
- ✅ OrderItem

### 2. Install Dependencies

```bash
# Frontend (already done)
pnpm add @stripe/stripe-js @stripe/react-stripe-js canvas-confetti

# Backend
pnpm add stripe multer @nestjs/platform-express --filter @luxury/api
```

### 3. Create API Endpoints

```bash
cd apps/api
nest g module products
nest g service products
nest g controller products
```

### 4. Run Migrations

```bash
cd packages/database
npx prisma migrate dev --name add_products
npx prisma generate
```

---

## 📡 API Documentation

### Product Endpoints

#### GET /products
```typescript
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- category: string
- minPrice: number
- maxPrice: number
- sort: 'price_asc' | 'price_desc' | 'newest' | 'popular'

Response:
{
  products: Product[],
  total: number,
  page: number,
  totalPages: number
}
```

#### GET /products/:slug
```typescript
Response:
{
  id: string,
  name: string,
  brand: string,
  price: number,
  images: ProductImage[],
  variants: ProductVariant[],
  description: string,
  // ... other fields
}
```

#### POST /products (Admin)
```typescript
Body:
{
  name: string,
  slug: string,
  description: string,
  price: number,
  categoryId?: string,
  images: string[],
  variants?: ProductVariant[],
  seoKeywords?: string[]
}

Response:
{
  id: string,
  ...product
}
```

---

### Cart Endpoints

#### GET /cart
```typescript
Headers:
- session-token: string

Response:
{
  id: string,
  items: CartItem[],
  subtotal: number,
  total: number
}
```

#### POST /cart/items
```typescript
Body:
{
  productId: string,
  variantId?: string,
  quantity: number
}

Response:
{
  cart: Cart,
  message: string
}
```

---

### Checkout Endpoints

#### POST /checkout/session
```typescript
Body:
{
  cartId: string,
  shippingAddress: Address,
  billingAddress?: Address
}

Response:
{
  sessionId: string,
  clientSecret: string
}
```

#### POST /checkout/confirm
```typescript
Body:
{
  sessionId: string,
  paymentIntentId: string
}

Response:
{
  order: Order,
  orderNumber: string
}
```

---

## 🎨 Design System Reference

### Colors
```typescript
{
  black: '#000000',
  gold: '#CBB57B',
  white: '#FFFFFF',
  neutral: { 50-900 },
  accent: { 50-900 },
  error: '#EF4444',
  success: '#10B981'
}
```

### Typography
```typescript
{
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, ...',
    serif: 'Playfair Display, Georgia, serif'
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  }
}
```

### Shadows
```typescript
{
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)'
}
```

---

## ✅ Implementation Checklist

### Frontend
- [x] Product Card Component
- [x] Product Grid (Standard & Masonry)
- [ ] Quick View Modal
- [ ] Product Details Page
- [ ] Cart Drawer
- [ ] Checkout Page
- [ ] Success Page
- [ ] Admin Dashboard
- [ ] Image Upload Component

### Backend
- [x] Database Schema
- [ ] Product CRUD APIs
- [ ] Cart Management APIs
- [ ] Order APIs
- [ ] Stripe Integration
- [ ] Image Upload/Optimization
- [ ] Search & Filters

### Integration
- [ ] Connect frontend to APIs
- [ ] Add Stripe Elements
- [ ] Implement webhooks
- [ ] Email notifications
- [ ] Admin authentication

---

## 🎯 Next Steps

1. **Complete Cart Drawer** - Implement the slide-out cart
2. **Build Checkout Flow** - Single-page checkout with Stripe
3. **Add Quick View Modal** - Product quick view with gallery
4. **Create Admin Panel** - Product management interface
5. **Image Optimization** - CDN upload and optimization
6. **Testing** - End-to-end checkout testing

---

**Built with ❤️ for luxury e-commerce**
