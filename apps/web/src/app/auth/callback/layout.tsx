import { Metadata } from 'next';
import { callbackMetadata } from '@/lib/metadata';

export const metadata: Metadata = callbackMetadata;

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
