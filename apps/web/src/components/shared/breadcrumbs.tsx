'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  name: string;
  path: string;
  isLast: boolean;
}

interface BreadcrumbsProps {
  homeHref?: string;
  className?: string;
}

const formatSegmentName = (segment: string): string => {
  // Handle special cases
  const specialCases: Record<string, string> = {
    admin: 'Admin',
    seller: 'Seller',
    dashboard: 'Dashboard',
    buyer: 'Buyer',
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    settings: 'Settings',
    subscriptions: 'Subscriptions',
    advertisements: 'Advertisements',
    categories: 'Categories',
    reviews: 'Reviews',
    analytics: 'Analytics',
    'delivery-providers': 'Delivery Providers',
    'delivery-payouts': 'Delivery Payouts',
    sellers: 'Sellers',
    escrow: 'Escrow',
    commissions: 'Commissions',
    payouts: 'Payouts',
    currencies: 'Currencies',
    shipping: 'Shipping',
    deliveries: 'Deliveries',
    earnings: 'Earnings',
    inquiries: 'Inquiries',
    'advertisement-plans': 'Ad Plans',
    'payout-settings': 'Payout Settings',
    'selling-credits': 'Selling Credits',
    'vacation-mode': 'Vacation Mode',
    onboarding: 'Onboarding',
    profile: 'Profile',
    security: 'Security',
    store: 'Store',
  };

  if (specialCases[segment]) {
    return specialCases[segment];
  }

  // Default: capitalize each word
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getBreadcrumbs = (pathname: string, homeHref?: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Skip the first segment if it's a portal name (admin/seller/buyer)
  const startIndex = ['admin', 'seller', 'dashboard'].includes(segments[0]) ? 1 : 0;

  for (let i = startIndex; i < segments.length; i++) {
    const path = `/${segments.slice(0, i + 1).join('/')}`;
    const name = formatSegmentName(segments[i]);

    breadcrumbs.push({
      name,
      path,
      isLast: i === segments.length - 1,
    });
  }

  return breadcrumbs;
};

export default function Breadcrumbs({
  homeHref = '/admin/dashboard',
  className = '',
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname, homeHref);

  // Don't show breadcrumbs on home/dashboard pages
  if (
    breadcrumbs.length === 0 ||
    (breadcrumbs.length === 1 && breadcrumbs[0].name === 'Dashboard')
  ) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-2 text-sm min-w-0 ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home Icon */}
      <Link
        href={homeHref}
        className="text-neutral-500 hover:text-neutral-700 transition-colors flex-shrink-0"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Breadcrumb Items */}
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2 min-w-0">
          <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          {crumb.isLast ? (
            <span className="font-medium text-black truncate">{crumb.name}</span>
          ) : (
            <Link
              href={crumb.path}
              className="text-neutral-600 hover:text-black transition-colors cursor-pointer truncate"
            >
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
