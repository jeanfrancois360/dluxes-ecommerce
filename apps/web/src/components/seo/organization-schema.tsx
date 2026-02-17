'use client';

import { StructuredData, generateOrganizationSchema } from '@/lib/seo';

export function OrganizationSchema() {
  const schema = generateOrganizationSchema();
  return <StructuredData data={schema} />;
}
