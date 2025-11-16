# 🚀 Quick Start Guide

## One-Command Setup

Run these commands in order:

###  1. Clean & Setup Database
```bash
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/luxury-ecommerce/packages/database && pnpm prisma generate && pnpm prisma db push
```

### 2. Start API Server (Terminal 1)
```bash
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/luxury-ecommerce/apps/api && rm -rf dist && pnpm dev
```

### 3. Start Web App (Terminal 2)
```bash
cd /Users/jeanfrancoismunyaneza/all-orbitunix-projects/luxury-ecommerce/apps/web && pnpm dev
```

---

## 👤 Test Accounts

**All accounts use password:** `Test@123`

### 1. Buyer Account
```
Email: buyer@test.com
Role: BUYER
Dashboard: http://localhost:3000/dashboard/buyer
```

### 2. Customer Account (Legacy)
```
Email: customer@test.com
Role: CUSTOMER
Dashboard: http://localhost:3000/dashboard/buyer
```

### 3. Seller Account (with Active Store)
```
Email: seller@test.com
Role: SELLER
Dashboard: http://localhost:3000/dashboard/seller
Products: http://localhost:3000/seller/products
```

### 4. Admin Account
```
Email: admin@test.com
Role: ADMIN
Dashboard: http://localhost:3000/admin/dashboard
```

### 5. Super Admin Account
```
Email: superadmin@test.com
Role: SUPER_ADMIN
Dashboard: http://localhost:3000/admin/dashboard
```

📄 **For detailed credentials and capabilities, see:** [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md)

---

## ✅ Quick Test Flow

1. **Login as Seller**
   - Navigate to: http://localhost:3000/auth/login
   - Use: seller@test.com / Test@123

2. **View Products**
   - Navigate to: http://localhost:3000/seller/products
   - Should see empty list or seeded products

3. **Add New Product**
   - Click "Add New Product" button
   - Fill out form:
     - Name: "Test Product"
     - Price: 99.99
     - Inventory: 10
   - Upload an image (drag & drop)
   - Click "Save Product"
   - Should redirect to product list

4. **Edit Product**
   - Click "Edit" on any product
   - Update name or price
   - Click "Update Product"
   - Verify changes

5. **Delete Product**
   - Click "Delete" on a product
   - Confirm deletion
   - Product removed from list

---

## 🐛 Troubleshooting

### TypeScript Errors
```bash
cd packages/database && pnpm prisma generate
cd ../../apps/api && rm -rf dist && pnpm dev
```

### Port Already in Use
```bash
lsof -ti:3001 | xargs kill -9  # Kill API server
lsof -ti:3000 | xargs kill -9  # Kill Web server
```

### Database Connection Error
```bash
# Check DATABASE_URL in packages/database/.env
# Should be: postgresql://postgres:User@123!@localhost:5433/luxury_ecommerce?schema=public
```

---

## 📚 Documentation

- **Full Testing Guide**: `TEST_ACCOUNTS_AND_GUIDE.md`
- **Product CRUD Documentation**: `PRODUCT_CRUD_COMPLETE.md`
- **Implementation Summary**: `PRODUCT_MANAGEMENT_IMPLEMENTATION.md`

---

## ✨ Features to Test

- ✅ Product listing with search/filter/sort
- ✅ Add new product with image upload
- ✅ Edit existing product
- ✅ Delete product
- ✅ Bulk operations (select multiple, update status, delete)
- ✅ Drag & drop image upload
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Success feedback

---

## 🎯 What's Complete

You now have a **production-ready Product Management System** with:

1. **Full CRUD Operations** ✅
   - Create products
   - Read products (list & single)
   - Update products
   - Delete products
   - Bulk operations

2. **Professional Image Upload** ✅
   - Drag & drop interface
   - Click to browse
   - Image preview
   - Remove/change image
   - Alternative: Paste URL
   - File validation (type, size)
   - Upload to server

3. **Advanced Product Listing** ✅
   - Search by name/slug/description
   - Filter by status
   - Sort by 8 different options
   - Pagination (20 per page)
   - Bulk select
   - Bulk status update
   - Bulk delete

4. **Beautiful UI/UX** ✅
   - Framer Motion animations
   - Loading states
   - Error states
   - Empty states
   - Success feedback
   - Confirmation dialogs
   - Responsive design

5. **Enterprise Features** ✅
   - Form validation
   - Error handling
   - Role-based access control
   - Product ownership verification
   - File upload security
   - SEO metadata
   - Character counters

---

**🎊 Ready to Test! Everything is built and documented.**

If you encounter any issues, refer to `TEST_ACCOUNTS_AND_GUIDE.md` for detailed troubleshooting.
