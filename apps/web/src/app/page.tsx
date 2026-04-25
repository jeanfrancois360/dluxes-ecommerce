import { Metadata } from 'next';
import { homeMetadata } from '@/lib/metadata';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';
import { StructuredData } from '@/components/seo/structured-data';
import HomeClient from './home-client';

export const metadata: Metadata = homeMetadata;

export default function Home() {
  return (
    <>
      {/* Structured data rendered server-side so Google sees it in initial HTML */}
      <StructuredData schema={generateOrganizationSchema()} />
      <StructuredData schema={generateWebSiteSchema()} />
      <HomeClient />
    </>
  );
}
