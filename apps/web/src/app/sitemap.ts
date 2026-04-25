import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

// Re-generate sitemap every hour on the server
export const revalidate = 3600;

// Use server-side env var (not baked at build time) so sitemap always calls the live API
const API_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Fetch active products for sitemap
async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/products?status=ACTIVE&limit=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      console.error('Failed to fetch products for sitemap:', response.status);
      return [];
    }

    const data = await response.json();
    // API returns { success: true, data: { products: [...] } }
    return data.data?.products || data.products || [];
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    return [];
  }
}

// Fetch categories for sitemap
async function getCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      console.error('Failed to fetch categories for sitemap:', response.status);
      return [];
    }

    const data = await response.json();
    // API might return array directly or { data: [...] }
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
    return [];
  }
}

// Fetch stores for sitemap
async function getStores() {
  try {
    const response = await fetch(`${API_URL}/stores`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      console.error('Failed to fetch stores for sitemap:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || data.stores || [];
  } catch (error) {
    console.error('Error fetching stores for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const currentDate = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stores`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },

    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Fetch dynamic data
  const products = await getProducts();
  const categories = await getCategories();
  const stores = await getStores();

  // Dynamic product pages
  const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Dynamic category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
    url: `${baseUrl}/products?category=${category.slug}`,
    lastModified: category.updatedAt ? new Date(category.updatedAt) : currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic store pages
  const storePages: MetadataRoute.Sitemap = stores.map((store: any) => ({
    url: `${baseUrl}/store/${store.slug}`,
    lastModified: store.updatedAt ? new Date(store.updatedAt) : currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...storePages];
}
