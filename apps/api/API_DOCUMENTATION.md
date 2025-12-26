# Luxury E-Commerce API Documentation

This document provides a comprehensive overview of all API endpoints for the luxury e-commerce platform.

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Module Overview

### 1. Products Module (`/products`)

#### Public Endpoints
- **GET /products** - List products with filters
  - Query params: `category`, `minPrice`, `maxPrice`, `brands`, `tags`, `search`, `page`, `pageSize`, `sortBy`, `sortOrder`, `status`, `featured`, `colors`, `sizes`, `materials`

- **GET /products/featured** - Get featured products
  - Query params: `limit` (default: 12)

- **GET /products/new-arrivals** - Get new arrival products
  - Query params: `limit` (default: 12)

- **GET /products/trending** - Get trending products
  - Query params: `limit` (default: 12)

- **GET /products/sale** - Get products on sale
  - Query params: `limit` (default: 12)

- **GET /products/:slug** - Get single product by slug

- **GET /products/:id/related** - Get related products
  - Query params: `limit` (default: 8)

#### Admin Endpoints (Requires Admin/Super Admin Role)
- **POST /products** - Create new product
- **PATCH /products/:id** - Update product
- **DELETE /products/:id** - Delete product
- **POST /products/upload-image** - Upload product image

---

### 2. Categories Module (`/categories`)

#### Public Endpoints
- **GET /categories** - Get all categories (hierarchical structure)
- **GET /categories/:slug** - Get category by slug

#### Admin Endpoints
- **POST /categories** - Create new category
- **PATCH /categories/:id** - Update category
- **DELETE /categories/:id** - Delete category

---

### 3. Collections Module (`/collections`)

#### Public Endpoints
- **GET /collections** - Get all collections
- **GET /collections/:slug** - Get collection by slug

#### Admin Endpoints
- **POST /collections** - Create new collection
- **PATCH /collections/:id** - Update collection
- **DELETE /collections/:id** - Delete collection

---

### 4. Orders Module (`/orders`)

All endpoints require authentication.

- **GET /orders** - Get user's orders
- **GET /orders/:id** - Get order details
- **POST /orders** - Create new order from cart
  ```json
  {
    "shippingAddressId": "string",
    "billingAddressId": "string",
    "items": [
      {
        "productId": "string",
        "variantId": "string",
        "quantity": 1,
        "price": 99.99
      }
    ],
    "paymentMethod": "CREDIT_CARD",
    "notes": "string"
  }
  ```
- **POST /orders/:id/cancel** - Cancel order
- **GET /orders/:id/track** - Track order (public endpoint)

#### Admin Endpoints
- **PATCH /orders/:id/status** - Update order status
  ```json
  {
    "status": "CONFIRMED"
  }
  ```

---

### 5. Reviews Module (`/reviews`)

#### Public Endpoints
- **GET /reviews** - Get reviews for a product
  - Query params: `productId`, `rating`, `page`, `pageSize`

#### Authenticated Endpoints
- **POST /reviews** - Create review
  ```json
  {
    "productId": "string",
    "rating": 5,
    "title": "string",
    "comment": "string",
    "images": ["url1", "url2"],
    "videos": ["url1"]
  }
  ```
- **PATCH /reviews/:id** - Update own review
- **DELETE /reviews/:id** - Delete own review
- **POST /reviews/:id/helpful** - Mark review as helpful

#### Admin Endpoints
- **PATCH /reviews/:id/status** - Approve/reject review
  ```json
  {
    "isApproved": true,
    "isPinned": false
  }
  ```

---

### 6. Wishlist Module (`/wishlist`)

All endpoints require authentication.

- **GET /wishlist** - Get user's wishlist
- **POST /wishlist** - Add item to wishlist
  ```json
  {
    "productId": "string",
    "notes": "string",
    "priority": 0
  }
  ```
- **DELETE /wishlist/:productId** - Remove item from wishlist
- **DELETE /wishlist** - Clear wishlist

---

### 7. Admin Module (`/admin`)

All endpoints require Admin/Super Admin role.

#### Dashboard & Analytics
- **GET /admin/stats** - Get dashboard statistics
  - Returns: revenue, orders, customers, products, pendingOrders, recentOrders

- **GET /admin/analytics** - Get analytics data
  - Query params: `days` (default: 30)
  - Returns: revenueData, ordersByStatus, topProducts

#### Management Endpoints
- **GET /admin/orders** - Get all orders with filters
  - Query params: `status`, `page`, `pageSize`

- **GET /admin/users** - Get all users with filters
  - Query params: `role`, `page`, `pageSize`

- **PATCH /admin/users/:id/role** - Update user role
  ```json
  {
    "role": "ADMIN"
  }
  ```

- **DELETE /admin/users/:id** - Delete user

- **GET /admin/products** - Get all products for management
  - Query params: `status`, `category`, `page`, `pageSize`

- **GET /admin/reviews** - Get all reviews for moderation
  - Query params: `isApproved`, `page`, `pageSize`

---

### 8. Upload Module (`/upload`)

All endpoints require Admin/Super Admin role.

- **POST /upload/image** - Upload single image
  - Form data: `image` (file)
  - Query params: `folder` (optional, default: "images")

- **POST /upload/images** - Upload multiple images (max 10)
  - Form data: `images` (files)
  - Query params: `folder` (optional, default: "images")

- **DELETE /upload/:folder/:fileName** - Delete uploaded file

---

### 9. Search Module (`/search`)

#### Public Endpoints
- **GET /search** - Search products
  - Query params: `q`, `categoryId`, `status`, `featured`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `limit`, `offset`

#### Admin Endpoints
- **POST /search/index** - Index all products
- **POST /search/index/:productId** - Index single product
- **GET /search/stats** - Get search statistics

---

## Response Format

All endpoints return a consistent response format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## Data Transfer Objects (DTOs)

### Product DTOs
- **CreateProductDto**: name, slug, description, shortDescription, categoryId, price, compareAtPrice, status, featured, inventory, weight, heroImage, badges, displayOrder, metaTitle, metaDescription, seoKeywords, colors, sizes, materials
- **UpdateProductDto**: Partial of CreateProductDto

### Order DTOs
- **CreateOrderDto**: shippingAddressId, billingAddressId, items[], paymentMethod, notes
- **UpdateOrderStatusDto**: status

### Review DTOs
- **CreateReviewDto**: productId, rating (1-5), title, comment, images[], videos[]
- **UpdateReviewDto**: Partial of CreateReviewDto

### Category DTOs
- **CreateCategoryDto**: name, slug, description, parentId, image, icon, displayOrder, isActive
- **UpdateCategoryDto**: Partial of CreateCategoryDto

### Collection DTOs
- **CreateCollectionDto**: name, slug, description, image, heroImage, displayOrder, isActive, isFeatured, startDate, endDate
- **UpdateCollectionDto**: Partial of CreateCollectionDto

---

## Enums

### ProductStatus
- `DRAFT`
- `ACTIVE`
- `ARCHIVED`
- `OUT_OF_STOCK`

### OrderStatus
- `PENDING`
- `CONFIRMED`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`
- `REFUNDED`

### PaymentStatus
- `PENDING`
- `AUTHORIZED`
- `PAID`
- `PARTIALLY_REFUNDED`
- `REFUNDED`
- `FAILED`

### PaymentMethod
- `CREDIT_CARD`
- `PAYPAL`
- `STRIPE`
- `BANK_TRANSFER`

### UserRole
- `CUSTOMER`
- `ADMIN`
- `SUPER_ADMIN`

---

## Error Codes

- **400** - Bad Request (validation errors)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (duplicate resource)
- **500** - Internal Server Error

---

## Rate Limiting

The API is rate-limited to 100 requests per 60 seconds per IP address.

---

## Environment Variables

Required environment variables for the API:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nextpik_ecommerce
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-api-key
```

---

## Notes

- All timestamps are in ISO 8601 format
- Prices are in decimal format (e.g., 99.99)
- File uploads support JPEG, PNG, WebP, and GIF formats (max 5MB)
- Search is powered by Meilisearch for fast and relevant results
- Orders automatically update product inventory
- Reviews automatically update product ratings
- Wishlist items automatically update product like counts
