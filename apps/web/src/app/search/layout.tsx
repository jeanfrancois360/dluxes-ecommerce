import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search products, stores, and more on NextPik',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
