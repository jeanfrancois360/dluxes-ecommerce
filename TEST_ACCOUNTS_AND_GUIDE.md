# Testing Guide & Test Accounts

## 🔧 Setup Instructions

### 1. Clean Build & Database Setup

```bash
# Terminal 1 - Clean and setup database
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/luxury-ecommerce

# Clean API build
cd apps/api
rm -rf dist
cd ../..

# Generate Prisma Client and sync database
cd packages/database
pnpm prisma generate
pnpm prisma db push

# Start API server
cd ../../apps/api
pnpm dev
```

```bash
# Terminal 2 - Start Web App
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/luxury-ecommerce/apps/web
pnpm dev
```

### 2. Create Test Database Seed

Before creating test accounts, let's create a seed script:

**File:** `/packages/database/prisma/seed.ts`

```typescript
import { PrismaClient, UserRole, StoreStatus, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for all test accounts
  const hashedPassword = await bcrypt.hash('Test@123', 10);

  // ============================================================================
  // 1. CREATE TEST BUYER ACCOUNT
  // ============================================================================
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: {},
    create: {
      email: 'buyer@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Buyer',
      role: UserRole.BUYER,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created buyer account:', buyer.email);

  // ============================================================================
  // 2. CREATE TEST SELLER ACCOUNT WITH ACTIVE STORE
  // ============================================================================
  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: {},
    create: {
      email: 'seller@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Seller',
      role: UserRole.SELLER,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created seller account:', seller.email);

  // Create seller's store (ACTIVE and approved)
  const store = await prisma.store.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      name: 'Luxury Test Store',
      slug: 'luxury-test-store',
      description: 'Premium products for testing',
      email: 'seller@test.com',
      phone: '+1234567890',
      status: StoreStatus.ACTIVE, // Pre-approved
      isActive: true,
      verified: true,
      verifiedAt: new Date(),
      currency: 'USD',
      timezone: 'UTC',
    },
  });
  console.log('✅ Created store:', store.name);

  // ============================================================================
  // 3. CREATE TEST CATEGORIES
  // ============================================================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Premium clothing and apparel',
        isActive: true,
        displayOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Luxury accessories',
        isActive: true,
        displayOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'High-end electronics',
        isActive: true,
        displayOrder: 3,
      },
    }),
  ]);
  console.log('✅ Created', categories.length, 'categories');

  // ============================================================================
  // 4. CREATE SAMPLE PRODUCTS FOR SELLER
  // ============================================================================
  const sampleProducts = [
    {
      name: 'Premium Leather Jacket',
      slug: 'premium-leather-jacket',
      description: 'Handcrafted Italian leather jacket with premium finishing',
      shortDescription: 'Luxury leather jacket - Italian craftsmanship',
      price: 899.99,
      compareAtPrice: 1299.99,
      inventory: 25,
      status: ProductStatus.ACTIVE,
      categoryId: categories[0].id,
      heroImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
      colors: ['Black', 'Brown', 'Tan'],
      sizes: ['S', 'M', 'L', 'XL'],
      materials: ['Italian Leather', 'Cotton Lining'],
      metaTitle: 'Premium Leather Jacket - Luxury Fashion',
      metaDescription: 'Experience luxury with our handcrafted Italian leather jacket',
      seoKeywords: ['leather jacket', 'luxury fashion', 'Italian leather'],
    },
    {
      name: 'Silk Designer Scarf',
      slug: 'silk-designer-scarf',
      description: 'Elegant silk scarf with exclusive designer patterns',
      shortDescription: '100% pure silk scarf - Limited edition',
      price: 199.99,
      compareAtPrice: 299.99,
      inventory: 50,
      status: ProductStatus.ACTIVE,
      categoryId: categories[1].id,
      heroImage: 'https://images.unsplash.com/photo-1601924638867-2a5edda8a7b6',
      colors: ['Red', 'Blue', 'Gold'],
      sizes: ['One Size'],
      materials: ['100% Silk'],
      metaTitle: 'Silk Designer Scarf - Limited Edition',
      metaDescription: 'Exclusive designer silk scarf with premium quality',
      seoKeywords: ['silk scarf', 'designer accessory', 'luxury scarf'],
    },
    {
      name: 'Wireless Premium Headphones',
      slug: 'wireless-premium-headphones',
      description: 'High-fidelity wireless headphones with noise cancellation',
      shortDescription: 'Premium audio experience - 30hr battery life',
      price: 349.99,
      inventory: 15,
      status: ProductStatus.ACTIVE,
      categoryId: categories[2].id,
      heroImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      colors: ['Black', 'Silver', 'Rose Gold'],
      materials: ['Aluminum', 'Leather Cushions'],
      metaTitle: 'Premium Wireless Headphones - Hi-Fi Audio',
      metaDescription: 'Experience superior sound quality with premium wireless headphones',
      seoKeywords: ['wireless headphones', 'premium audio', 'noise cancellation'],
    },
    {
      name: 'Classic Sunglasses',
      slug: 'classic-sunglasses',
      description: 'Timeless sunglasses with UV protection',
      shortDescription: 'UV400 protection - Designer frames',
      price: 149.99,
      compareAtPrice: 199.99,
      inventory: 8, // Low stock
      status: ProductStatus.ACTIVE,
      categoryId: categories[1].id,
      heroImage: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f',
      colors: ['Black', 'Tortoise', 'Clear'],
      materials: ['Acetate Frame', 'Polarized Lens'],
      metaTitle: 'Classic Designer Sunglasses - UV Protection',
      metaDescription: 'Timeless style with premium UV protection',
      seoKeywords: ['sunglasses', 'designer eyewear', 'UV protection'],
    },
    {
      name: 'Draft Product - Coming Soon',
      slug: 'draft-product-coming-soon',
      description: 'This product is being prepared for launch',
      shortDescription: 'Coming soon to our store',
      price: 99.99,
      inventory: 0,
      status: ProductStatus.DRAFT, // Draft status
      categoryId: categories[0].id,
      colors: ['TBD'],
      materials: ['TBD'],
    },
  ];

  for (const productData of sampleProducts) {
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        storeId: store.id,
      },
    });
  }
  console.log('✅ Created', sampleProducts.length, 'sample products');

  // ============================================================================
  // 5. CREATE ADMIN ACCOUNT
  // ============================================================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created admin account:', admin.email);

  console.log('\n🎉 Database seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 3. Run the Seed Script

```bash
cd packages/database

# Add seed script to package.json
# "scripts": {
#   "prisma:seed": "ts-node prisma/seed.ts"
# }

# Run seed
pnpm prisma:seed
```

---

## 👥 Test Accounts

### 1. **Buyer Account**
```
Email: buyer@test.com
Password: Test@123
Role: BUYER
Status: ✅ Email Verified
```

**What to test:**
- ✅ Login and access buyer dashboard (`/dashboard/buyer`)
- ✅ Browse products
- ✅ View product details
- ✅ Add to cart
- ✅ Add to wishlist
- ✅ Place orders
- ✅ View order history
- ✅ "Become a Seller" button (should appear in buyer dashboard)
- ❌ Should NOT access seller routes (`/seller/*`)
- ❌ Should NOT access admin routes (`/admin/*`)

---

### 2. **Seller Account** (Pre-approved Store)
```
Email: seller@test.com
Password: Test@123
Role: SELLER
Status: ✅ Email Verified
Store: Luxury Test Store
Store Status: ✅ ACTIVE (Pre-approved)
```

**What to test:**

#### Product Management
- ✅ View product listing (`/seller/products`)
  - Should see 5 products (4 active, 1 draft)
- ✅ Search products
- ✅ Filter by status (Active, Draft, Archived, Out of Stock)
- ✅ Sort products (by name, price, inventory, date)
- ✅ Bulk select products
- ✅ Bulk status update
- ✅ Bulk delete

#### Add New Product
- ✅ Navigate to `/seller/products/new`
- ✅ Fill out product form
- ✅ Upload product image via drag & drop
- ✅ Upload product image via browse button
- ✅ Paste image URL alternative
- ✅ Auto-generate slug from name
- ✅ Validate required fields
- ✅ See character counters
- ✅ Save as DRAFT
- ✅ Save as ACTIVE
- ✅ Cancel with confirmation

#### Edit Product
- ✅ Click "Edit" on existing product
- ✅ Form pre-populated with data
- ✅ Update product name
- ✅ Change product image
- ✅ Update pricing
- ✅ Update inventory
- ✅ Save changes
- ✅ Verify changes reflected in listing

#### Delete Product
- ✅ Click "Delete" on product
- ✅ Confirmation dialog appears
- ✅ Product removed from list

#### Seller Dashboard
- ✅ Access seller dashboard (`/dashboard/seller`)
- ✅ View store stats
- ✅ View revenue metrics
- ✅ View product overview
- ✅ Quick actions (Add Product, View Products, Orders)

#### Image Upload
- ✅ Drag & drop image file
- ✅ Click to browse and select file
- ✅ Image preview displays
- ✅ Remove image button works
- ✅ Change image works
- ✅ Paste external URL works
- ✅ File type validation (try .pdf - should fail)
- ✅ File size validation (try >5MB - should fail)
- ✅ Upload success (image URL returned)

---

### 3. **Admin Account**
```
Email: admin@test.com
Password: Test@123
Role: ADMIN
Status: ✅ Email Verified
```

**What to test:**
- ✅ Login and access admin dashboard
- ✅ View all stores (pending approval queue)
- ✅ Approve seller stores
- ✅ Reject seller stores
- ✅ Manage all products
- ✅ Manage all users
- ❌ Should NOT be restricted from any routes

---

## 🧪 Comprehensive Testing Checklist

### Authentication Flow
- [ ] Register new buyer account
- [ ] Email verification required
- [ ] Login with unverified email (should be blocked)
- [ ] Verify email via link
- [ ] Login after verification (should work)
- [ ] Logout
- [ ] Login again (session management)
- [ ] Password reset flow
- [ ] Login with wrong password (should fail)

### Buyer Experience
- [ ] View homepage with products
- [ ] Browse product categories
- [ ] View product details
- [ ] Add product to cart
- [ ] Add product to wishlist
- [ ] View cart
- [ ] Checkout process
- [ ] View order history
- [ ] Click "Become a Seller" (should navigate to store application)

### Seller Experience

#### Initial Setup
- [ ] Register as buyer first
- [ ] Become a seller (create store)
- [ ] Store status: PENDING (awaiting approval)
- [ ] Cannot add products while PENDING
- [ ] Admin approves store
- [ ] Store status: ACTIVE
- [ ] Can now add products

#### Product Listing Page
- [ ] Navigate to `/seller/products`
- [ ] See table with products
- [ ] See product images (thumbnails)
- [ ] See status badges (color-coded)
- [ ] See inventory with warnings (red for 0, yellow for 1-10)
- [ ] See price with strikethrough for discounts
- [ ] See view count

#### Search & Filter
- [ ] Search by product name
- [ ] Search by slug
- [ ] Search by description
- [ ] Filter by status: All
- [ ] Filter by status: Active
- [ ] Filter by status: Draft
- [ ] Filter by status: Out of Stock
- [ ] Filter by status: Archived

#### Sorting
- [ ] Sort by: Newest First
- [ ] Sort by: Oldest First
- [ ] Sort by: Name (A-Z)
- [ ] Sort by: Name (Z-A)
- [ ] Sort by: Price (Low to High)
- [ ] Sort by: Price (High to Low)
- [ ] Sort by: Stock (Low to High)
- [ ] Sort by: Stock (High to Low)

#### Bulk Actions
- [ ] Select individual product (checkbox)
- [ ] Select all products (header checkbox)
- [ ] See selection counter ("X selected")
- [ ] Bulk action: Set as Active
- [ ] Bulk action: Set as Draft
- [ ] Bulk action: Archive
- [ ] Bulk action: Delete Selected (with confirmation)
- [ ] Clear selection

#### Pagination
- [ ] Navigate to next page
- [ ] Navigate to previous page
- [ ] See page numbers (e.g., "1 to 20 of 100 products")
- [ ] Items per page: 20

#### Add Product Form (`/seller/products/new`)
- [ ] Form loads with empty fields
- [ ] Product name field (required)
- [ ] Slug auto-generates from name
- [ ] Description field (required)
- [ ] Short description (160 char limit with counter)
- [ ] Price field (required, must be > 0)
- [ ] Compare at price (optional)
- [ ] Inventory field (required, must be >= 0)
- [ ] Weight field (optional)
- [ ] Category dropdown (loads from API)
- [ ] Status dropdown (DRAFT, ACTIVE, ARCHIVED, OUT_OF_STOCK)
- [ ] Image upload section
  - [ ] Drag & drop zone
  - [ ] Click to browse
  - [ ] Image preview
  - [ ] Remove image button
  - [ ] Change image option
  - [ ] Paste URL option
  - [ ] File validation (type, size)
  - [ ] Upload progress indicator
- [ ] Colors field (comma-separated)
- [ ] Sizes field (comma-separated)
- [ ] Materials field (comma-separated)
- [ ] Meta title (60 char limit with counter)
- [ ] Meta description (160 char limit with counter)
- [ ] SEO keywords (comma-separated)
- [ ] Save button
- [ ] Cancel button (with confirmation)

#### Form Validation
- [ ] Try saving without name (should show error)
- [ ] Try saving without price (should show error)
- [ ] Try price = 0 (should show error)
- [ ] Try price < 0 (should show error)
- [ ] Try inventory < 0 (should show error)
- [ ] See red border on error fields
- [ ] See error messages under fields
- [ ] Character counter turns red when limit exceeded

#### Edit Product Form (`/seller/products/[id]/edit`)
- [ ] Navigate from "Edit" button
- [ ] Form pre-populates with existing data
- [ ] Existing image displays
- [ ] Can update any field
- [ ] Can replace image
- [ ] Save updates
- [ ] Cancel updates (with confirmation)
- [ ] Verify updates reflected in listing

#### Loading States
- [ ] Product listing shows spinner while loading
- [ ] Form shows spinner during submission
- [ ] Image upload shows spinner during upload
- [ ] Product edit shows spinner while fetching

#### Error States
- [ ] Product not found (404)
  - Should show error message
  - Should redirect to listing after 3s
- [ ] Unauthorized access (403)
  - Should show error message
  - Should redirect to listing after 3s
- [ ] Form submission error
  - Should display error message
  - Should not redirect
  - Should allow retry

#### Success States
- [ ] Product created successfully
  - Shows success alert
  - Redirects to listing
  - New product appears in list
- [ ] Product updated successfully
  - Shows success message
  - Redirects to listing
  - Changes reflected
- [ ] Product deleted successfully
  - Product removed from list
  - Success feedback

---

## 🔍 Edge Cases to Test

### Product Management
- [ ] Create product with very long name (100+ chars)
- [ ] Create product with special characters in name
- [ ] Create product with same slug (should fail)
- [ ] Upload image > 5MB (should fail)
- [ ] Upload non-image file (should fail)
- [ ] Upload invalid image URL (should handle gracefully)
- [ ] Set inventory to exactly 10 (should show yellow warning)
- [ ] Set inventory to 0 (should show red warning)
- [ ] Delete product with existing orders (should check constraints)
- [ ] Bulk delete all products
- [ ] Search with no results
- [ ] Filter with no matching products
- [ ] Last page with fewer than 20 items

### Authentication
- [ ] Try accessing seller routes as buyer (should redirect)
- [ ] Try accessing buyer-specific features as seller
- [ ] Session expiry handling
- [ ] Multiple concurrent sessions
- [ ] Logout from one device (other sessions?)

### Store Management
- [ ] Try adding product before store approval (should block)
- [ ] Try accessing seller dashboard without store
- [ ] Admin approves store (seller can now add products)
- [ ] Admin rejects store (seller cannot add products)
- [ ] Admin suspends active store (products become unavailable)

---

## 📊 Performance Testing

### Load Testing
- [ ] Create 100 products (bulk operation)
- [ ] View listing with 100 products
- [ ] Pagination performance
- [ ] Search performance with many products
- [ ] Filter performance
- [ ] Concurrent uploads (multiple images)

### UX Testing
- [ ] Animation smoothness (Framer Motion)
- [ ] Form responsiveness
- [ ] Image upload feedback
- [ ] Loading states visibility
- [ ] Error message clarity
- [ ] Success feedback timing

---

## 🐛 Known Issues & Workarounds

### TypeScript Compilation Errors
If you see "Property 'SELLER' does not exist" or "Property 'store' does not exist":

**Solution:**
```bash
# 1. Clean dist folder
cd apps/api
rm -rf dist

# 2. Regenerate Prisma Client
cd ../../packages/database
pnpm prisma generate

# 3. Restart API server
cd ../../apps/api
pnpm dev
```

### Database Connection Issues
If you see "Can't reach database server":

**Solution:**
```bash
# Check if PostgreSQL is running
lsof -i :5433

# Start Docker container (if using Docker)
docker start luxury-ecommerce-db

# Or check DATABASE_URL in packages/database/.env
```

### Port Already in Use
If you see "Port 3001 is already in use":

**Solution:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Then restart server
cd apps/api
pnpm dev
```

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Seller product listing (with products)
- [ ] Add new product form
- [ ] Image upload (drag & drop zone)
- [ ] Edit product form (pre-populated)
- [ ] Product created success message
- [ ] Bulk actions dropdown
- [ ] Search results
- [ ] Filter by status results
- [ ] Empty state (no products)
- [ ] Error states (validation, 404, etc.)

---

## ✅ Sign-Off Checklist

Before marking this complete:
- [ ] All test accounts created and work
- [ ] Database seeded with sample data
- [ ] All CRUD operations tested
- [ ] Image upload tested (all methods)
- [ ] Form validation tested
- [ ] Search, filter, sort all working
- [ ] Bulk actions working
- [ ] Error handling working
- [ ] Loading states visible
- [ ] Success feedback clear
- [ ] Mobile responsive (tested)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] API responses correct format
- [ ] Authentication working
- [ ] Authorization working (role-based access)

---

## 🎯 Next Steps After Testing

Once all tests pass:
1. Document any bugs found
2. Create issues for improvements
3. Plan next features (e.g., product variants, advanced search)
4. Consider adding automated tests (Jest, Cypress)
5. Performance optimization if needed
6. Production deployment checklist

---

**🎊 Happy Testing! If you find any issues, please document them with:**
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/device information
