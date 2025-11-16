import { Metadata } from 'next';
import { homeMetadata } from '@/lib/metadata';
import { generateOrganizationSchema, generateWebPageSchema } from '@/lib/seo';
import { MultipleStructuredData } from '@/components/structured-data';

export const metadata: Metadata = homeMetadata;

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateOrganizationSchema();
  const webPageSchema = generateWebPageSchema({
    title: 'Luxury Marketplace - Premium Products & Curated Collections',
    description: 'Discover extraordinary lifestyle products curated for distinguished living.',
    url: '/',
  });

  return (
    <>
      {children}
      <MultipleStructuredData data={[organizationSchema, webPageSchema]} />
    </>
  );
}
