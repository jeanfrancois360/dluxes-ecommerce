import { Metadata } from 'next';
import { trackOrderMetadata } from '@/lib/metadata';

export const metadata: Metadata = trackOrderMetadata;

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
