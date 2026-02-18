import { Metadata } from 'next';
import { homeMetadata } from '@/lib/metadata';
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';
import HomeClient from './home-client';

export const metadata: Metadata = homeMetadata;

export default function Home() {
  return (
    <>
      {/* Structured data rendered server-side so Google sees it in initial HTML */}
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebSiteSchema()} />
      <HomeClient />
    </>
  );
}
