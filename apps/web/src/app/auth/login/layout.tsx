import { Metadata } from 'next';
import { loginMetadata } from '@/lib/metadata';

export const metadata: Metadata = loginMetadata;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
