import { Metadata } from 'next';
import { getProductMetadata } from '@/lib/metadata';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProduct(slug: string) {
  try {
    const response = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for could not be found.',
    };
  }

  return getProductMetadata(product);
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
