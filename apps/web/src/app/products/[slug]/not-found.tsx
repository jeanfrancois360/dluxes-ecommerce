import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';

export default function ProductNotFound() {
  return (
    <PageLayout>
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-24">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 text-neutral-400 mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-black mb-4">
            Product Not Found
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            We couldn't find the product you're looking for. It may have been removed or is temporarily unavailable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-neutral-800 transition-colors inline-block"
            >
              Browse All Products
            </Link>
            <Link
              href="/"
              className="px-8 py-4 border-2 border-neutral-200 text-black rounded-xl font-bold text-lg hover:border-gold transition-colors inline-block"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
