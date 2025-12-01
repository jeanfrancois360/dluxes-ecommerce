# Quick Start Guide - Product Management System

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies (Already Done ✅)
```bash
# Supabase is already installed in both apps
pnpm install
```

### 2. Configure Supabase (Optional but Recommended)

#### Get Your Supabase Credentials:
1. Go to https://supabase.com/dashboard
2. Create a new project (or use existing)
3. Go to Settings → API
4. Copy your Project URL and Keys

#### Update Environment Files:

**Backend** (`apps/api/.env`):
```env
SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_BUCKET_NAME="product-images"
```

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_BUCKET_NAME=product-images
```

### 3. Create Storage Bucket in Supabase

```sql
-- The service will auto-create, but you can also do it manually:
-- Go to Supabase Dashboard → Storage → New Bucket
-- Name: product-images
-- Public: Yes
```

---

## 📝 Using the Components

### Use UnifiedProductForm in Any Page

```tsx
// In your product creation/edit page
import UnifiedProductForm from '@/components/products/UnifiedProductForm';

export default function CreateProductPage() {
  const handleSubmit = async (data) => {
    const response = await api.post('/products', data);
    router.push(`/products/${response.data.slug}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Product</h1>
      <UnifiedProductForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
```

### Use ProductActionButton in Product Pages

```tsx
// In your product detail page
import ProductActionButton from '@/components/products/ProductActionButton';

export default function ProductDetail({ product }) {
  const handleAddToCart = async () => {
    await api.post('/cart/items', { productId: product.id, quantity: 1 });
    toast.success('Added to cart!');
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      
      <ProductActionButton
        product={product}
        sellerId={product.storeId}
        onAddToCart={handleAddToCart}
        showBadge={true}
        size="lg"
      />
    </div>
  );
}
```

---

## 🧪 Testing the System

### Test 1: Create a Physical Product
```bash
curl -X POST http://localhost:4000/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luxury Watch",
    "slug": "luxury-watch",
    "description": "Premium timepiece",
    "price": 15000,
    "inventory": 10,
    "productType": "PHYSICAL",
    "purchaseType": "INSTANT"
  }'
```
**Expected**: Product created, shows "Add to Cart" button

### Test 2: Create a Real Estate Listing
```bash
curl -X POST http://localhost:4000/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luxury Penthouse",
    "slug": "luxury-penthouse",
    "description": "3-bedroom penthouse",
    "price": 2500000,
    "productType": "REAL_ESTATE",
    "purchaseType": "INQUIRY",
    "contactRequired": true
  }'
```
**Expected**: Product created, shows "Contact Seller" button

### Test 3: Upload Image
```bash
curl -X POST http://localhost:4000/api/v1/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=products"
```
**Expected**: Returns URL (Supabase if configured, local otherwise)

### Test 4: Filter Products
```bash
# Get all real estate
curl http://localhost:4000/api/v1/products?productType=REAL_ESTATE

# Get all inquiry products
curl http://localhost:4000/api/v1/products?purchaseType=INQUIRY
```

---

## 🎨 Component Props Reference

### UnifiedProductForm
```tsx
<UnifiedProductForm
  initialData={{        // Optional: For editing
    name: "Product",
    productType: "PHYSICAL",
    // ...
  }}
  isEdit={false}        // Optional: true for edit mode
  onSubmit={async (data) => {}}  // Required
  onCancel={() => {}}   // Required
/>
```

### EnhancedImageUpload
```tsx
<EnhancedImageUpload
  onImagesChange={(urls) => {}}  // Required: Called when images change
  initialImages={[]}             // Optional: Existing image URLs
  maxImages={10}                 // Optional: Default 10
  folder="products"              // Optional: Storage folder
/>
```

### ProductInquiryForm
```tsx
<ProductInquiryForm
  isOpen={true}                  // Required
  onClose={() => {}}             // Required
  product={{                     // Required
    id: "123",
    name: "Product",
    price: 1000,
    heroImage: "url"
  }}
  sellerId="seller-id"           // Optional
/>
```

### ProductActionButton
```tsx
<ProductActionButton
  product={{                     // Required
    id: "123",
    name: "Product",
    productType: "PHYSICAL",
    purchaseType: "INSTANT",
    // ...
  }}
  sellerId="seller-id"           // Optional
  onAddToCart={() => {}}         // Optional: For instant products
  size="default"                 // Optional: sm | default | lg
  showBadge={false}              // Optional: Show product type badge
  className=""                   // Optional: Additional classes
/>
```

---

## 🔥 Common Use Cases

### 1. Seller Dashboard - Create Product
```tsx
// apps/web/src/app/seller/products/new/page.tsx
import UnifiedProductForm from '@/components/products/UnifiedProductForm';

export default function NewProductPage() {
  const handleSubmit = async (data) => {
    await api.post('/products', data);
    router.push('/seller/products');
  };

  return <UnifiedProductForm onSubmit={handleSubmit} onCancel={() => router.back()} />;
}
```

### 2. Admin Dashboard - Edit Product
```tsx
// apps/web/src/app/admin/products/[id]/edit/page.tsx
export default function EditProductPage({ params }) {
  const { data: product } = useProduct(params.id);

  const handleSubmit = async (data) => {
    await api.patch(`/products/${params.id}`, data);
    router.push('/admin/products');
  };

  return (
    <UnifiedProductForm
      initialData={product}
      isEdit={true}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
```

### 3. Product Card - Quick Action
```tsx
// In product listing/grid
function ProductCard({ product }) {
  return (
    <Card>
      <img src={product.heroImage} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      
      <ProductActionButton
        product={product}
        sellerId={product.storeId}
        onAddToCart={handleAddToCart}
        size="sm"
      />
    </Card>
  );
}
```

---

## 🐛 Troubleshooting

### Images Not Uploading to Supabase?
1. Check environment variables are set correctly
2. Verify bucket exists in Supabase dashboard
3. Check bucket is set to "Public"
4. Look for errors in browser console
5. Fallback to API upload should work automatically

### Form Validation Errors?
- Price is required for `purchaseType: INSTANT`
- Inventory required for `productType: PHYSICAL` + `purchaseType: INSTANT`
- All other validations are in the component

### Product Type Not Showing?
- Ensure `productType` field is in API response
- Default is `PHYSICAL` if not specified
- Check database migration ran successfully

---

## 📚 Further Reading

- `FRONTEND_IMPLEMENTATION_COMPLETE.md` - Full documentation
- `PRODUCT_HARMONIZATION_SUMMARY.md` - Backend details
- Component source code for detailed prop types

---

**Happy Coding! 🚀**
