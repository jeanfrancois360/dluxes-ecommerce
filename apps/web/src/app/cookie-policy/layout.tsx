import { Metadata } from 'next';
import { cookiePolicyMetadata } from '@/lib/metadata';

export const metadata: Metadata = cookiePolicyMetadata;

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
