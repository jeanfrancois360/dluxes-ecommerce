import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductsMetadata } from '@/lib/metadata';

const API_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function categoryExists(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return true; // fail open — don't 404 if API is down
    const data = await res.json();
    const categories: { slug?: string; name?: string }[] = data?.data || data || [];
    return categories.some(
      (c) =>
        c.slug?.toLowerCase() === slug.toLowerCase() || c.name?.toLowerCase() === slug.toLowerCase()
    );
  } catch {
    return true; // fail open
  }
}

type Props = {
  children: React.ReactNode;
  searchParams?: Promise<{ category?: string }>;
};

export const metadata: Metadata = getProductsMetadata();

export default async function ProductsLayout({ children, searchParams }: Props) {
  const params = await searchParams;
  const category = params?.category;

  if (category) {
    const exists = await categoryExists(category);
    if (!exists) {
      notFound();
    }
  }

  return children;
}
