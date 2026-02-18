import { Metadata } from 'next';
import { getSearchMetadata } from '@/lib/metadata';

type Props = {
  children: React.ReactNode;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return getSearchMetadata(q);
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
