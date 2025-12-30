// User Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'BUYER' | 'SELLER' | 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

// Type aliases for compatibility
export type LoginRequest = LoginCredentials;
export type RegisterRequest = RegisterData;

export interface AuthResponse {
  user: User;
  token?: string;
  access_token?: string; // Support both naming conventions
  refreshToken?: string;
  expiresIn?: number; // Token expiry time in milliseconds
}

export interface MagicLinkRequest {
  email: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// Product Type Enums
export type ProductType = 'PHYSICAL' | 'REAL_ESTATE' | 'VEHICLE' | 'SERVICE' | 'RENTAL' | 'DIGITAL';
export type PurchaseType = 'INSTANT' | 'INQUIRY';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  brand?: string;
  sku: string;
  barcode?: string;
  trackInventory: boolean;
  stock: number;
  inventory: number; // Alias for stock
  lowStockThreshold: number;
  heroImage: string;
  images: ProductImage[];
  categoryId: string;
  category?: Category;
  tags: ProductTag[];
  variants: ProductVariant[];
  badges?: string[];
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  // Product type properties
  productType?: ProductType;
  purchaseType?: PurchaseType;
  status?: ProductStatus;
  contactRequired?: boolean;
  isPreOrder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  blurHash?: string;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price?: number;
  compareAtPrice?: number;
  stock: number;
  size?: string;
  color?: string;
  image?: string;
  attributes: Record<string, string>; // e.g., { size: 'M', color: 'Blue' }
  isAvailable: boolean;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  displayOrder: number;
  isActive: boolean;
}

// Collection Types
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  products?: Product[];
  isActive: boolean;
  displayOrder: number;
}

// Cart Types
export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  total: number;
}

export interface AddToCartData {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

// Delivery Types
export interface DeliveryProvider {
  id: string;
  name: string;
  slug: string;
  type: string;
  website?: string;
}

export interface Delivery {
  id: string;
  trackingNumber?: string;
  trackingUrl?: string;
  currentStatus: string;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  provider?: DeliveryProvider;
  deliveryFee: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  notes?: string;
  timeline: OrderTimeline[];
  delivery?: Delivery;
  trackingNumber?: string;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderTimeline {
  id: string;
  status: OrderStatus;
  title: string;
  description: string;
  icon?: string;
  createdAt: string;
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  billingAddress?: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  notes?: string;
  paymentMethodId: string;
}

// Address Types
export interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  province: string; // Alias for state (some regions use province)
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// Search Types
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  inStock?: boolean;
  onSale?: boolean;
  rating?: number;
  sortBy?: 'relevance' | 'price' | 'createdAt' | 'viewCount' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  products: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  clientSecret: string;
  status: string;
}

// Analytics Types
export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  topProducts: Array<{
    product: Product;
    revenue: number;
    quantity: number;
  }>;
  recentOrders: Order[];
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
