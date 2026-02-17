'use client';

import { StructuredData, generateBreadcrumbSchema } from '@/lib/seo';

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = generateBreadcrumbSchema(items);
  return <StructuredData data={schema} />;
}
