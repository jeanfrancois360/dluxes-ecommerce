import { Metadata } from 'next';
import { trackOrderMetadata } from '@/lib/metadata';

export const metadata: Metadata = trackOrderMetadata;

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
