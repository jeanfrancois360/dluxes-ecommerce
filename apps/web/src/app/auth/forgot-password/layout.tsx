import { Metadata } from 'next';
import { forgotPasswordMetadata } from '@/lib/metadata';

export const metadata: Metadata = forgotPasswordMetadata;

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
