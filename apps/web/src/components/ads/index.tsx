'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  videoUrl?: string;
  linkUrl?: string;
  linkText?: string;
  placement: string;
}

// Hook to fetch active ads
export function useAds(placement?: string) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const params = placement ? `?placement=${placement}` : '';
        const response = await axios.get(`${API_URL}/advertisements/active${params}`);
        setAds(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [placement]);

  return { ads, loading };
}

// Record ad event
async function recordEvent(adId: string, eventType: 'IMPRESSION' | 'CLICK') {
  try {
    await axios.post(`${API_URL}/advertisements/${adId}/event`, { eventType });
  } catch (error) {
    // Silent fail for analytics
  }
}

// Banner Ad Component (full width)
export function BannerAd({ className = '' }: { className?: string }) {
  const { ads, loading } = useAds('HOMEPAGE_HERO');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [ads.length]);

  useEffect(() => {
    if (ads[currentIndex]) {
      recordEvent(ads[currentIndex].id, 'IMPRESSION');
    }
  }, [currentIndex, ads]);

  if (loading) return null;

  // Show placeholder if no ads
  if (ads.length === 0) {
    return (
      <div className={`relative w-full h-[400px] overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📢</div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">Advertisement Space</h2>
            <p className="text-gray-400">Banner Ad Placeholder</p>
          </div>
        </div>
      </div>
    );
  }

  const ad = ads[currentIndex];

  const content = (
    <div className={`relative w-full h-[400px] overflow-hidden ${className}`}>
      <img
        src={ad.imageUrl}
        alt={ad.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
        <div className="px-8 md:px-16 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{ad.title}</h2>
          {ad.description && (
            <p className="text-white/90 mb-6">{ad.description}</p>
          )}
          {ad.linkText && (
            <span className="inline-block bg-white text-black px-6 py-3 font-medium hover:bg-gray-100 transition-colors">
              {ad.linkText}
            </span>
          )}
        </div>
      </div>
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (ad.linkUrl) {
    return (
      <Link href={ad.linkUrl} onClick={() => recordEvent(ad.id, 'CLICK')}>
        {content}
      </Link>
    );
  }

  return content;
}

// Sidebar Ad Component
export function SidebarAd({ className = '' }: { className?: string }) {
  const { ads, loading } = useAds('PRODUCTS_SIDEBAR');

  useEffect(() => {
    ads.forEach((ad) => recordEvent(ad.id, 'IMPRESSION'));
  }, [ads]);

  if (loading) return null;

  // Show placeholder if no ads
  if (ads.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300 p-6">
          <div className="text-center">
            <div className="text-4xl mb-3">📢</div>
            <h3 className="font-medium text-gray-400">Sidebar Ad</h3>
            <p className="text-sm text-gray-400 mt-1">Placeholder</p>
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300 p-6">
          <div className="text-center">
            <div className="text-4xl mb-3">📢</div>
            <h3 className="font-medium text-gray-400">Sidebar Ad</h3>
            <p className="text-sm text-gray-400 mt-1">Placeholder</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ads.slice(0, 3).map((ad) => (
        <div key={ad.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
          {ad.linkUrl ? (
            <Link href={ad.linkUrl} onClick={() => recordEvent(ad.id, 'CLICK')}>
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{ad.title}</h3>
                {ad.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
                )}
              </div>
            </Link>
          ) : (
            <>
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{ad.title}</h3>
                {ad.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// Inline Ad Component (between product rows)
export function InlineAd({ placement = 'PRODUCTS_INLINE', className = '' }: { placement?: string; className?: string }) {
  const { ads, loading } = useAds(placement);

  useEffect(() => {
    if (ads[0]) {
      recordEvent(ads[0].id, 'IMPRESSION');
    }
  }, [ads]);

  if (loading) return null;

  // Show placeholder if no ads
  if (ads.length === 0) {
    return (
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8f6f3] via-[#f5f0e8] to-[#ebe4d6]" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23CBB57B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
          <div className="w-full md:w-2/5 aspect-[4/3] bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center border border-[#CBB57B]/20 shadow-sm">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#CBB57B] to-[#A89968] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-[#8B7355] font-medium">Your Ad Here</p>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#CBB57B] bg-[#CBB57B]/10 rounded-full mb-4">
              Sponsored
            </span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#2C2C2C] mb-3">
              Premium Ad Space
            </h3>
            <p className="text-[#6B6B6B] mb-6 leading-relaxed">
              Showcase your luxury brand to our discerning audience. Premium placement with high visibility.
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CBB57B] to-[#A89968] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300">
              Advertise With Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ad = ads[0];

  const content = (
    <div className={`relative bg-gray-50 rounded-lg overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-6 p-6">
        <img src={ad.imageUrl} alt={ad.title} className="w-full md:w-1/3 h-48 object-cover rounded-lg" />
        <div className="flex-1 text-center md:text-left">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Sponsored</span>
          <h3 className="text-xl font-bold text-gray-900 mt-2">{ad.title}</h3>
          {ad.description && (
            <p className="text-gray-600 mt-2">{ad.description}</p>
          )}
          {ad.linkText && (
            <span className="inline-block mt-4 bg-[#CBB57B] text-black px-6 py-2 font-medium rounded-lg">
              {ad.linkText}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (ad.linkUrl) {
    return (
      <Link href={ad.linkUrl} onClick={() => recordEvent(ad.id, 'CLICK')}>
        {content}
      </Link>
    );
  }

  return content;
}

// Category Banner Ad
export function CategoryBannerAd({ categorySlug, className = '' }: { categorySlug: string; className?: string }) {
  const { ads, loading } = useAds('CATEGORY_BANNER');

  // Filter ads for this category
  const categoryAds = ads.filter(ad => {
    // This would need category info from the ad
    return true; // Show all category banner ads for now
  });

  useEffect(() => {
    if (categoryAds[0]) {
      recordEvent(categoryAds[0].id, 'IMPRESSION');
    }
  }, [categoryAds]);

  if (loading || categoryAds.length === 0) return null;

  const ad = categoryAds[0];

  const content = (
    <div className={`relative w-full h-[200px] overflow-hidden rounded-lg ${className}`}>
      <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white">{ad.title}</h3>
          {ad.linkText && (
            <span className="inline-block mt-3 bg-white text-black px-4 py-2 text-sm font-medium">
              {ad.linkText}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (ad.linkUrl) {
    return (
      <Link href={ad.linkUrl} onClick={() => recordEvent(ad.id, 'CLICK')}>
        {content}
      </Link>
    );
  }

  return content;
}
