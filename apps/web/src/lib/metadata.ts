import { Metadata } from 'next';
import { generateSeoMetadata } from './seo';

// Home Page Metadata
export const homeMetadata: Metadata = generateSeoMetadata({
  title: 'NextPik - Multi-Vendor Luxury Marketplace | Fashion, Electronics, Vehicles & Real Estate',
  description:
    "Shop NextPik's curated luxury marketplace featuring fashion, electronics, vehicles, real estate, and designer products from verified sellers. Discover premium brands, secure payments, and worldwide shipping.",
  keywords: [
    'nextpik shopping',
    'luxury multi-vendor marketplace',
    'premium fashion online',
    'designer electronics',
    'luxury vehicles for sale',
    'real estate listings',
    'high-end products',
    'curated luxury collections',
    'verified luxury sellers',
    'secure luxury shopping',
  ],
  url: '/',
  type: 'website',
});

// Products Listing Metadata
export function getProductsMetadata(params?: {
  category?: string;
  query?: string;
  page?: number;
}): Metadata {
  let title = 'Shop Premium Products';
  let description =
    "Browse our curated collection of luxury products from the world's finest brands.";

  if (params?.category) {
    title = `${params.category} - Luxury Products`;
    description = `Explore premium ${params.category.toLowerCase()} products curated for discerning customers.`;
  }

  if (params?.query) {
    title = `Search Results for "${params.query}"`;
    description = `Find luxury products matching "${params.query}" from our exclusive collection.`;
  }

  if (params?.page && params.page > 1) {
    title = `${title} - Page ${params.page}`;
  }

  return generateSeoMetadata({
    title,
    description,
    keywords: ['luxury products', 'premium brands', 'designer items'],
    url: '/products',
    type: 'website',
  });
}

// Product Detail Metadata
export function getProductMetadata(product: {
  name?: string | null;
  description?: string | null;
  price?: number;
  heroImage?: string | null;
  sku?: string | null;
  brand?: string | null;
  category?: { name?: string | null } | null;
  slug?: string | null;
}): Metadata {
  const productName = product.name || 'Product';
  const title = productName;
  const description = product.description
    ? product.description.substring(0, 160)
    : `Shop ${productName} on NextPik - Premium quality products at great prices.`;
  const keywords = [
    productName,
    product.brand || '',
    product.category?.name || '',
    'luxury',
    'premium',
  ].filter(Boolean);

  return generateSeoMetadata({
    title,
    description,
    keywords,
    image: product.heroImage || undefined,
    url: product.slug ? `/products/${product.slug}` : '/products',
    type: 'product',
  });
}

// Store Metadata
export function getStoreMetadata(store: {
  name?: string | null;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
  slug?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}): Metadata {
  const storeName = store.name || 'Store';
  const title = `${storeName} - Verified Store`;
  const description = store.description
    ? store.description.substring(0, 160)
    : `Shop ${storeName} on NextPik - verified seller offering premium products with secure checkout and worldwide shipping.`;
  const image = store.banner || store.logo;

  return generateSeoMetadata({
    title,
    description,
    image: image || undefined,
    url: store.slug ? `/store/${store.slug}` : '/stores',
    keywords: [storeName, 'verified seller', 'premium store', 'nextpik seller'],
    type: 'website',
  });
}

// Category Metadata
export function getCategoryMetadata(category: {
  name?: string | null;
  description?: string | null;
  image?: string | null;
  slug?: string | null;
}): Metadata {
  const categoryName = category.name || 'Category';
  const title = `${categoryName} - Shop ${categoryName} Online`;
  const description = category.description
    ? category.description.substring(0, 160)
    : `Browse premium ${categoryName.toLowerCase()} from verified sellers on NextPik. Discover curated collections with secure payments and worldwide shipping.`;

  return generateSeoMetadata({
    title,
    description,
    image: category.image || undefined,
    url: category.slug ? `/categories/${category.slug}` : '/categories',
    keywords: [
      categoryName,
      `${categoryName.toLowerCase()} online`,
      `buy ${categoryName.toLowerCase()}`,
      `premium ${categoryName.toLowerCase()}`,
      'nextpik',
    ],
    type: 'website',
  });
}

// Auth Pages Metadata
export const loginMetadata: Metadata = generateSeoMetadata({
  title: 'Sign In',
  description:
    'Sign in to your NextPik account to access exclusive features and manage your orders.',
  url: '/auth/login',
  noIndex: true,
  noFollow: true,
});

export const registerMetadata: Metadata = generateSeoMetadata({
  title: 'Create Account',
  description:
    'Join NextPik to discover exclusive products, track orders, and enjoy personalized shopping.',
  url: '/auth/register',
  noIndex: true,
  noFollow: true,
});

export const forgotPasswordMetadata: Metadata = generateSeoMetadata({
  title: 'Reset Password',
  description: 'Reset your NextPik account password.',
  url: '/auth/forgot-password',
  noIndex: true,
  noFollow: true,
});

// Account Pages Metadata
export const accountMetadata: Metadata = generateSeoMetadata({
  title: 'My Account',
  description: 'Manage your NextPik account, orders, and preferences.',
  url: '/account',
  noIndex: true,
});

export const ordersMetadata: Metadata = generateSeoMetadata({
  title: 'My Orders',
  description: 'View and track your orders from NextPik.',
  url: '/account/orders',
  noIndex: true,
});

export const wishlistMetadata: Metadata = generateSeoMetadata({
  title: 'My Wishlist',
  description: 'View and manage your saved products.',
  url: '/wishlist',
  noIndex: true,
});

export const profileMetadata: Metadata = generateSeoMetadata({
  title: 'Profile Settings',
  description: 'Update your profile information and preferences.',
  url: '/account/profile',
  noIndex: true,
});

export const addressesMetadata: Metadata = generateSeoMetadata({
  title: 'Saved Addresses',
  description: 'Manage your shipping and billing addresses.',
  url: '/account/addresses',
  noIndex: true,
});

// Checkout Pages Metadata
export const cartMetadata: Metadata = generateSeoMetadata({
  title: 'Shopping Cart',
  description: 'Review items in your cart before checkout.',
  url: '/cart',
  noIndex: true,
});

export const checkoutMetadata: Metadata = generateSeoMetadata({
  title: 'Checkout',
  description: 'Complete your purchase securely.',
  url: '/checkout',
  noIndex: true,
});

export const checkoutSuccessMetadata: Metadata = generateSeoMetadata({
  title: 'Order Confirmed',
  description: 'Your order has been successfully placed.',
  url: '/checkout/success',
  noIndex: true,
});

// Search Page Metadata
export function getSearchMetadata(query?: string): Metadata {
  const title = query ? `Search Results for "${query}"` : 'Search Products';
  const description = query
    ? `Find luxury products matching "${query}" from our exclusive collection.`
    : "Search for premium products from the world's finest brands.";

  return generateSeoMetadata({
    title,
    description,
    keywords: ['search', 'find products', 'luxury search'],
    url: query ? `/search?q=${encodeURIComponent(query)}` : '/search',
  });
}

// Admin Pages Metadata
export const adminDashboardMetadata: Metadata = generateSeoMetadata({
  title: 'Admin Dashboard',
  description: 'Manage your e-commerce platform.',
  url: '/admin/dashboard',
  noIndex: true,
  noFollow: true,
});

// Seller Pages Metadata
export const sellerDashboardMetadata: Metadata = generateSeoMetadata({
  title: 'Seller Dashboard',
  description: 'Manage your products, orders, and store settings.',
  url: '/seller',
  noIndex: true,
  noFollow: true,
});

// Static Pages Metadata
export const aboutMetadata: Metadata = generateSeoMetadata({
  title: 'About Us',
  description:
    'Learn about NextPik, our mission, and commitment to providing the finest curated products from verified sellers worldwide.',
  keywords: ['about nextpik', 'company', 'multi-vendor marketplace', 'luxury shopping platform'],
  url: '/about',
});

export const contactMetadata: Metadata = generateSeoMetadata({
  title: 'Contact Us',
  description:
    "Get in touch with our customer service team. We're here to help with any questions or concerns.",
  keywords: ['contact', 'support', 'customer service'],
  url: '/contact',
});

export const helpMetadata: Metadata = generateSeoMetadata({
  title: 'Help Center',
  description:
    'Find answers to frequently asked questions about orders, shipping, returns, and more.',
  keywords: ['help', 'faq', 'support', 'customer service'],
  url: '/help',
});

export const termsMetadata: Metadata = generateSeoMetadata({
  title: 'Terms of Service',
  description: 'Read our terms of service and conditions for using NextPik.',
  url: '/terms',
  noIndex: true,
});

export const privacyMetadata: Metadata = generateSeoMetadata({
  title: 'Privacy Policy',
  description: 'Learn how we collect, use, and protect your personal information.',
  url: '/privacy',
  noIndex: true,
});

// Additional Pages Metadata
export const authMetadata: Metadata = generateSeoMetadata({
  title: 'Authentication',
  description: 'Sign in or create an account.',
  url: '/auth',
  noIndex: true,
  noFollow: true,
});

export const becomeSellerMetadata: Metadata = generateSeoMetadata({
  title: 'Become a Seller',
  description: 'Join our marketplace and start selling your products.',
  url: '/become-seller',
  noIndex: true,
});

export const dashboardMetadata: Metadata = generateSeoMetadata({
  title: 'Dashboard',
  description: 'Your personal dashboard.',
  url: '/dashboard',
  noIndex: true,
});

export const deliveryPartnerMetadata: Metadata = generateSeoMetadata({
  title: 'Delivery Partner',
  description: 'Delivery partner portal.',
  url: '/delivery-partner',
  noIndex: true,
  noFollow: true,
});

export const deliveryCompanyMetadata: Metadata = generateSeoMetadata({
  title: 'Delivery Company',
  description: 'Delivery company portal.',
  url: '/delivery-company',
  noIndex: true,
  noFollow: true,
});

export const hotDealsMetadata: Metadata = generateSeoMetadata({
  title: 'Hot Deals',
  description: 'Browse emergency service requests and hot deals.',
  url: '/hot-deals',
});

export const sellerAgreementMetadata: Metadata = generateSeoMetadata({
  title: 'Seller Agreement',
  description: 'Review and accept the seller terms and conditions.',
  url: '/seller-agreement',
  noIndex: true,
});

export const storesMetadata: Metadata = generateSeoMetadata({
  title: 'Browse Stores',
  description:
    'Discover verified sellers and premium stores on NextPik. Shop from trusted vendors offering luxury fashion, electronics, vehicles, real estate, and designer products.',
  keywords: [
    'nextpik stores',
    'verified sellers',
    'luxury vendors',
    'premium stores',
    'multi-vendor',
  ],
  url: '/stores',
});

export const trackOrderMetadata: Metadata = generateSeoMetadata({
  title: 'Track Order',
  description: 'Track your order status and delivery.',
  url: '/track-order',
  noIndex: true,
});
