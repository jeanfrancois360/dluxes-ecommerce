# Luxury E-Commerce Admin Dashboard

## Overview

A complete, production-ready admin dashboard for managing the luxury e-commerce platform. The dashboard features a professional design with a dark sidebar, comprehensive data tables, interactive charts, and full CRUD operations for all resources.

## Features Implemented

### 1. Admin Layout & Navigation

**Files Created:**
- `/apps/web/src/components/admin/admin-layout.tsx` - Main layout with sidebar
- `/apps/web/src/components/admin/admin-header.tsx` - Header with breadcrumbs

**Features:**
- Fixed sidebar navigation (dark theme with gold accents)
- Mobile responsive with drawer menu
- Active state highlighting
- User profile section with avatar
- Logout functionality
- Breadcrumb navigation
- Quick actions in header (notifications, profile menu)

**Navigation Menu:**
- Dashboard (Home)
- Products
- Orders
- Customers
- Categories
- Reviews
- Analytics
- Settings

### 2. Dashboard Overview

**File:** `/apps/web/src/app/admin/dashboard/page.tsx`

**Features:**
- 4 Stat Cards with trend indicators:
  - Total Revenue
  - Total Orders
  - Total Customers
  - Total Products
- Interactive Charts (using Recharts):
  - Revenue line chart (last 30 days)
  - Orders by status pie chart
  - Top products bar chart
  - Customer growth area chart
- Recent orders table with pagination
- Quick action cards (Add Product, Process Orders, View Analytics)

### 3. Products Management

**Files Created:**
- `/apps/web/src/app/admin/products/page.tsx` - Products list
- `/apps/web/src/app/admin/products/[id]/page.tsx` - Product edit/create
- `/apps/web/src/components/admin/product-form.tsx` - Reusable product form

**Features:**
- Products table with:
  - Thumbnail preview
  - Name, SKU, Category
  - Price, Stock, Status
  - Edit and Delete actions
- Advanced filtering:
  - Search by name or SKU
  - Filter by category and status
  - Sort by multiple fields (name, price, stock, date)
- Bulk operations:
  - Select all/individual products
  - Bulk activate/deactivate
  - Bulk delete
- Pagination (10, 25, 50, 100 per page)
- Export to CSV
- Product form with:
  - Basic information (name, slug, SKU, description)
  - Pricing & inventory (price, compare at price, stock)
  - Organization (category, status, tags)
  - Image management (multiple images)
  - Validation and error handling

### 4. Orders Management

**Files Created:**
- `/apps/web/src/app/admin/orders/page.tsx` - Orders list
- `/apps/web/src/app/admin/orders/[id]/page.tsx` - Order details

**Features:**
- Orders table with:
  - Order number and customer info
  - Items count and total amount
  - Order and payment status badges
  - Date and actions
- Advanced filtering:
  - Search by order number or customer
  - Filter by order status and payment status
  - Date range filter
- Order details page:
  - Full order information
  - Item list with images and pricing
  - Customer information
  - Shipping address
  - Payment details
  - Order status timeline
  - Status update dropdown
  - Refund functionality
- Export orders to CSV
- Pagination

### 5. Customers Management

**Files Created:**
- `/apps/web/src/app/admin/customers/page.tsx` - Customers list

**Features:**
- Customers table with:
  - Avatar with initials
  - Name and email
  - Total orders and amount spent
  - Account status
  - Join date
- Search by name or email
- Filter by status (active/inactive)
- Customer deletion with confirmation
- Export to CSV
- Pagination
- View customer details (link to profile page)

### 6. Analytics

**File:** `/apps/web/src/app/admin/analytics/page.tsx`

**Features:**
- Date range selector (7, 30, 90, 365 days, custom)
- Key metrics cards:
  - Total Revenue
  - Total Orders
  - New Customers
  - Conversion Rate
  - Average Order Value
- Sales by category pie chart
- Orders by category bar chart
- Top selling products table
- Export reports functionality

### 7. Categories Management

**File:** `/apps/web/src/app/admin/categories/page.tsx`

**Features:**
- Categories table with product counts
- Hierarchical structure (parent/child categories)
- Create/edit category form:
  - Name and slug
  - Description
  - Parent category selection
  - Featured category toggle
- Delete with product count warning
- Inline editing
- Featured category badges

### 8. Reviews Moderation

**File:** `/apps/web/src/app/admin/reviews/page.tsx`

**Features:**
- Reviews table with:
  - Product and customer name
  - Star rating display
  - Comment preview
  - Status badges (pending, approved, rejected)
  - Date
- Filter by status
- Bulk operations:
  - Select multiple reviews
  - Bulk approve
  - Bulk reject
- Individual actions:
  - Approve review
  - Reject review
  - Delete review
- Pagination

### 9. API Integration

**Files Created:**
- `/apps/web/src/lib/api/admin.ts` - Admin API client
- `/apps/web/src/hooks/use-admin.ts` - Custom React hooks

**API Endpoints:**
- Dashboard APIs (stats, revenue, orders by status, top products, customer growth, recent orders)
- Products APIs (CRUD, bulk operations, filtering, sorting)
- Orders APIs (list, details, status update, refund)
- Customers APIs (list, details, update, delete)
- Categories APIs (CRUD)
- Reviews APIs (list, status update, bulk operations, delete)
- Analytics APIs (metrics, sales by category/product)

**Custom Hooks:**
- `useDashboardStats()` - Dashboard statistics
- `useRevenueData()` - Revenue chart data
- `useOrdersByStatus()` - Orders by status
- `useTopProducts()` - Top selling products
- `useCustomerGrowth()` - Customer growth data
- `useRecentOrders()` - Recent orders
- `useAdminProducts()` - Products list with filtering
- `useAdminProduct()` - Single product details
- `useAdminOrders()` - Orders list with filtering
- `useAdminOrder()` - Single order details
- `useAdminCustomers()` - Customers list
- `useCategories()` - Categories list
- `useAdminReviews()` - Reviews list with filtering

## Technologies Used

- **Next.js 15** - App Router with React Server Components
- **React 19** - Latest React with hooks
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful, responsive charts
- **date-fns** - Date formatting and manipulation
- **Axios** - HTTP client for API calls

## Design Specifications

### Color Scheme
- Primary Gold: `#CBB57B` (luxury accent color)
- Dark Background: `#1a1a1a` (sidebar)
- White: `#ffffff` (main content area)
- Gray Scale: Various shades for text and borders

### Layout
- Sidebar: 256px width (fixed on desktop, drawer on mobile)
- Main Content: Full width minus sidebar
- Responsive breakpoints: mobile (< 640px), tablet (< 1024px), desktop (>= 1024px)

### Typography
- Font Family: System font stack
- Heading: Bold, 24px-32px
- Body: Regular, 14px-16px
- Small Text: 12px-14px

## Routes Structure

```
/admin
  /dashboard          - Main dashboard with stats and charts
  /products           - Products list
    /new              - Create new product
    /[id]             - Edit product
  /orders             - Orders list
    /[id]             - Order details
  /customers          - Customers list
    /[id]             - Customer profile (to be implemented)
  /categories         - Categories management
  /reviews            - Reviews moderation
  /analytics          - Detailed analytics
  /settings           - Settings (to be implemented)
```

## Authentication & Authorization

All admin routes are protected with:
- `AdminRoute` component wrapper
- Checks if user is authenticated
- Checks if user has admin role
- Redirects to login if not authenticated
- Redirects to home if not admin

## Data Flow

1. **Component** calls custom hook (e.g., `useAdminProducts()`)
2. **Hook** uses API client to fetch data (e.g., `adminProductsApi.getAll()`)
3. **API Client** sends request to backend with auth token
4. **Backend** processes request and returns data
5. **Hook** updates state and provides data to component
6. **Component** renders with data

## State Management

- Local component state using `useState`
- Custom hooks for data fetching
- Loading states for async operations
- Error handling with toast notifications
- Optimistic updates where appropriate

## Accessibility Features

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management
- Screen reader friendly
- Semantic HTML elements
- Proper heading hierarchy

## Performance Optimizations

- Pagination on all lists (10, 25, 50, 100 per page)
- Loading skeletons during data fetch
- Debounced search inputs (implement if needed)
- Memoized chart components
- Lazy loading for images

## Error Handling

- Try-catch blocks around all API calls
- Toast notifications for success/error messages
- User-friendly error messages
- Validation on forms
- Confirmation dialogs for destructive actions

## Future Enhancements

1. **Customer Profile Page** - View customer details, order history, addresses
2. **Settings Page** - Site configuration, user preferences, API keys
3. **Image Upload** - Direct image upload instead of URL input
4. **Rich Text Editor** - For product descriptions
5. **Real-time Updates** - WebSocket integration for live order updates
6. **Advanced Analytics** - More detailed reports and insights
7. **Export Options** - PDF, Excel formats in addition to CSV
8. **Drag & Drop** - Reorder categories, product images
9. **Search Improvements** - Fuzzy search, advanced filters
10. **Audit Logs** - Track admin actions

## Installation

The admin dashboard is already integrated into the project. To use it:

1. **Ensure recharts is installed** (already done):
   ```bash
   pnpm add recharts --filter @luxury/web
   ```

2. **Start the development server**:
   ```bash
   pnpm dev
   ```

3. **Access the admin dashboard**:
   - Navigate to `http://localhost:3000/admin/dashboard`
   - Login with an admin account
   - You'll be redirected to the dashboard

## Usage Examples

### Creating a Product

1. Navigate to Products page
2. Click "Add Product" button
3. Fill in the form:
   - Basic information (name, slug, SKU)
   - Description
   - Pricing (price, compare at price, stock)
   - Category and status
   - Tags
   - Images (add URLs)
4. Click "Create Product"

### Managing Orders

1. Navigate to Orders page
2. Use filters to find specific orders
3. Click "View" to see order details
4. Update order status from dropdown
5. Use "Refund" button if needed

### Moderating Reviews

1. Navigate to Reviews page
2. Filter by status (pending, approved, rejected)
3. Select reviews using checkboxes
4. Use bulk actions (Approve/Reject)
5. Or handle individually

### Viewing Analytics

1. Navigate to Analytics page
2. Select date range
3. View key metrics
4. Analyze charts (sales by category, top products)
5. Export reports if needed

## API Response Examples

### Dashboard Stats
```typescript
{
  totalRevenue: 125000,
  totalOrders: 450,
  totalCustomers: 280,
  totalProducts: 150,
  revenueChange: 12.5,    // percentage
  ordersChange: 8.3,
  customersChange: 15.2,
  productsChange: 5.0
}
```

### Product List
```typescript
{
  products: [
    {
      id: "prod_123",
      name: "Luxury Gold Watch",
      slug: "luxury-gold-watch",
      sku: "LGW-001",
      description: "...",
      price: 5999.99,
      compareAtPrice: 7999.99,
      category: "watches",
      images: ["url1", "url2"],
      stock: 25,
      status: "active",
      tags: ["luxury", "gold", "new"],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-10T00:00:00Z"
    }
  ],
  total: 150,
  pages: 6
}
```

## Troubleshooting

### Issue: Charts not displaying
**Solution:** Ensure recharts is properly installed and imported

### Issue: API calls failing
**Solution:** Check if backend is running and API endpoints are correct

### Issue: Images not loading
**Solution:** Verify image URLs are valid and accessible

### Issue: Unauthorized access
**Solution:** Ensure user is logged in with admin role

## Contributing

When adding new features to the admin dashboard:

1. Follow existing code structure
2. Use TypeScript for type safety
3. Add proper error handling
4. Include loading states
5. Make it responsive
6. Add accessibility features
7. Update this documentation

## Support

For issues or questions:
- Check the code comments in each file
- Review the API documentation
- Test with the provided hooks
- Ensure all dependencies are installed

## License

This admin dashboard is part of the Luxury E-Commerce platform.
