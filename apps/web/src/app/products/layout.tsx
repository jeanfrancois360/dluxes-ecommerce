import { Metadata } from 'next';
import { getProductsMetadata } from '@/lib/metadata';

// This will be overridden by generateMetadata if present in page.tsx
export const metadata: Metadata = getProductsMetadata();

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
