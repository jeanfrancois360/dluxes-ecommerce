import { Metadata } from 'next';
import { generateSeoMetadata } from '@/lib/seo';
import { safeJson } from '@/lib/safe-fetch';

/**
 * Blog post SEO metadata (Phase C.8 — server-side)
 * Pattern mirrors products/[slug]/layout.tsx and store/[slug]/layout.tsx.
 * The page.tsx is a client component — metadata must live in this server layout.
 * Double-fetch tradeoff: this fetch is for metadata only; page.tsx fetches again
 * client-side for interactive render. Standard Next App Router pattern.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getBlogPostForMeta(slug: string, locale: string) {
  try {
    const res = await fetch(
      `${API_URL}/blog/posts/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await safeJson(res);
    // API returns { success: true, data: BlogPost }
    return json.data ?? null;
  } catch {
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ locale?: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = sp?.locale ?? 'en';

  const post = await getBlogPostForMeta(slug, locale);

  if (!post) {
    return {
      title: { absolute: 'Blog Post Not Found' },
      description: 'The blog post you are looking for could not be found.',
    };
  }

  // Mirror the translation-resolution logic from page.tsx
  const translation =
    post.translations?.find((t: { locale: string }) => t.locale === locale) ??
    post.translations?.find((t: { isOriginal: boolean }) => t.isOriginal) ??
    post.translations?.[0];

  const title = translation?.seoTitle ?? translation?.title ?? slug;
  const description = translation?.seoDescription ?? translation?.excerpt ?? undefined;
  const authorName = post.author
    ? `${post.author.firstName ?? ''} ${post.author.lastName ?? ''}`.trim() || undefined
    : undefined;

  const meta = generateSeoMetadata({
    title,
    description: description ?? null,
    image: post.coverImageUrl || undefined,
    url: `/blog/${slug}`,
    type: 'article',
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt ?? undefined,
    authors: authorName ? [authorName] : undefined,
    keywords: Array.isArray(post.tags) ? post.tags : [],
  });

  // Use title.absolute to bypass the root layout's "%s - NextPik" template.
  // Without this, the title would be "Post Title - NextPik - NextPik" because
  // generateSeoMetadata already appends " - NextPik" and the root template adds
  // another. The products/[slug] route avoids this because products/layout.tsx
  // (an intermediate layout) implicitly resets the template chain for its children.
  // Blog has no intermediate layout, so we must use absolute here.
  return { ...meta, title: { absolute: meta.title as string } };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
