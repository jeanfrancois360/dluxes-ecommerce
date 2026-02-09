'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const formatSegmentName = (segment: string): string => {
  const specialCases: Record<string, string> = {
    dashboard: 'Dashboard',
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
  };

  if (specialCases[segment]) {
    return specialCases[segment];
  }

  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getAutoBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; href?: string }> = [
    { label: 'Dashboard', href: '/admin/dashboard' },
  ];

  // Skip 'admin' segment
  const startIndex = segments[0] === 'admin' ? 1 : 0;

  for (let i = startIndex; i < segments.length; i++) {
    const path = `/${segments.slice(0, i + 1).join('/')}`;
    const label = formatSegmentName(segments[i]);

    // Don't make the last segment a link
    if (i === segments.length - 1) {
      breadcrumbs.push({ label });
    } else {
      breadcrumbs.push({ label, href: path });
    }
  }

  return breadcrumbs;
};

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: PageHeaderProps) {
  const pathname = usePathname();
  const finalBreadcrumbs = breadcrumbs || getAutoBreadcrumbs(pathname);

  return (
    <div className="bg-black text-white mb-6">
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm mb-4" aria-label="Breadcrumb">
          {finalBreadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-neutral-300">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Title, Description, and Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            {description && <p className="text-lg text-neutral-300">{description}</p>}
            {children}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
