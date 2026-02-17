'use client';

import { generateWebSiteSchema, StructuredData } from '@/lib/seo';

export function WebSiteSchema() {
  const schema = generateWebSiteSchema();
  return <StructuredData data={schema} />;
}
