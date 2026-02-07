import { Metadata } from 'next';
import { wishlistMetadata } from '@/lib/metadata';

export const metadata: Metadata = wishlistMetadata;

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
