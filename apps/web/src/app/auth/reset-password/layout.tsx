import { Metadata } from 'next';
import { resetPasswordMetadata } from '@/lib/metadata';

export const metadata: Metadata = resetPasswordMetadata;

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
