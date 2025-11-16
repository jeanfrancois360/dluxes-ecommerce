import { Metadata } from 'next';
import { getSearchMetadata } from '@/lib/metadata';

// Note: This is a static metadata. For dynamic search queries,
// you would need to use generateMetadata in the page component
export const metadata: Metadata = getSearchMetadata();

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
