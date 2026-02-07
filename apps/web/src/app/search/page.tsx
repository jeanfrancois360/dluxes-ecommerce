import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SearchResults } from '@/components/search/search-results';

export const metadata: Metadata = {
  title: 'Search - Luxury E-Commerce',
  description: 'Search for luxury products, brands, and collections',
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || '';
  const category = searchParams.category;

  const t = await getTranslations('search');
  const tc = await getTranslations('common');

  if (!query) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <svg
            className="mx-auto w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('startYourSearch')}</h1>
          <p className="text-gray-600 mb-6">{t('enterSearchQuery')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-[#CBB57B] transition-colors">
              {tc('nav.home')}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <span className="text-gray-900 font-medium">Search</span>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <span className="text-gray-500 truncate max-w-[200px] inline-block">"{query}"</span>
          </li>
        </ol>
      </nav>

      {/* Search Results */}
      <Suspense
        fallback={
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="grid grid-cols-4 gap-6 mt-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-gray-200 rounded-lg" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <SearchResults initialQuery={query} initialCategory={category} />
      </Suspense>
    </>
  );
}
