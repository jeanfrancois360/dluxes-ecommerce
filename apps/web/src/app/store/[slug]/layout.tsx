import { Metadata } from 'next';
import { getStoreMetadata } from '@/lib/metadata';
import { StructuredData, generateStoreSchema, siteConfig } from '@/lib/seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getStore(slug: string) {
  try {
    const res = await fetch(`${API_URL}/stores/${slug}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);

  if (!store) {
    return {
      title: 'Store Not Found',
      description: 'The store you are looking for could not be found.',
    };
  }

  return getStoreMetadata(store);
}

export default async function StoreLayout({ params, children }: Props) {
  const { slug } = await params;
  const store = await getStore(slug);

  return (
    <>
      {store && (
        <StructuredData
          data={generateStoreSchema({
            name: store.name,
            description: store.description,
            logo: store.logo,
            url: `${siteConfig.url}/store/${store.slug}`,
            slug: store.slug,
            rating: store.rating,
            reviewCount: store.reviewCount,
          })}
        />
      )}
      {children}
    </>
  );
}
