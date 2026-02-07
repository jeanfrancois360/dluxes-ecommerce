import { Metadata } from 'next';

// Store pages are dynamic, so metadata will be set in individual pages
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
