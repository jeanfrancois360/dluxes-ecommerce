'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Home,
  Package,
  ShoppingBag,
  Users,
  FolderOpen,
  Star,
  BarChart3,
  Settings,
  Megaphone,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Percent,
  Truck,
  Banknote,
  PackageCheck,
  Store,
} from 'lucide-react';

interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    titleKey: 'overview',
    items: [
      { nameKey: 'dashboard', href: '/admin/dashboard', icon: Home },
      { nameKey: 'analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'commerce',
    items: [
      { nameKey: 'products', href: '/admin/products', icon: Package },
      { nameKey: 'orders', href: '/admin/orders', icon: ShoppingBag },
      { nameKey: 'categories', href: '/admin/categories', icon: FolderOpen },
      { nameKey: 'reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    titleKey: 'users',
    items: [
      { nameKey: 'userManagement', href: '/admin/users', icon: Users },
      { nameKey: 'sellerManagement', href: '/admin/sellers', icon: Store },
    ],
  },
  {
    titleKey: 'subscriptions',
    items: [
      { nameKey: 'subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { nameKey: 'subscriptionPlans', href: '/admin/subscriptions/plans', icon: CreditCard },
      { nameKey: 'adSubscriptions', href: '/admin/subscriptions/advertisement', icon: CreditCard },
      { nameKey: 'sellerSubscriptions', href: '/admin/subscriptions/sellers', icon: CreditCard },
    ],
  },
  {
    titleKey: 'financials',
    items: [
      { nameKey: 'escrow', href: '/admin/escrow', icon: ShieldCheck },
      { nameKey: 'commissions', href: '/admin/commissions', icon: Percent },
      { nameKey: 'payouts', href: '/admin/payouts', icon: Banknote },
      { nameKey: 'currencies', href: '/admin/currencies', icon: DollarSign },
    ],
  },
  {
    titleKey: 'delivery',
    items: [
      { nameKey: 'shipping', href: '/admin/shipping', icon: Truck },
      { nameKey: 'deliveries', href: '/admin/deliveries', icon: PackageCheck },
      { nameKey: 'deliveryProviders', href: '/admin/delivery-providers', icon: Truck },
      { nameKey: 'deliveryPayouts', href: '/admin/delivery-payouts', icon: Banknote },
    ],
  },
  {
    titleKey: 'marketing',
    items: [{ nameKey: 'advertisements', href: '/admin/advertisements', icon: Megaphone }],
  },
  {
    titleKey: 'system',
    items: [{ nameKey: 'settings', href: '/admin/settings', icon: Settings }],
  },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('adminNav');

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleClick = () => {
    onNavigate?.();
  };

  return (
    <aside className="fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-neutral-200 overflow-y-auto">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-neutral-200">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 group"
          onClick={handleClick}
        >
          <div className="relative w-12 h-12">
            <Image
              src="/logo-icon.svg"
              alt="NextPik"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-bold text-black group-hover:text-[#CBB57B] transition-colors block leading-tight">
              NextPik
            </span>
            <span className="text-xs font-medium text-[#CBB57B] block">{t('adminPortal')}</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.titleKey}>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {t(`groups.${group.titleKey}`)}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    onClick={handleClick}
                    className="relative block"
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-black rounded-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div
                      className={`
                        relative flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-colors duration-200
                        ${
                          active
                            ? 'text-[#CBB57B] font-medium'
                            : 'text-neutral-700 hover:text-black hover:bg-neutral-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{t(`items.${item.nameKey}`)}</span>
                      {item.badge && (
                        <span className="ml-auto bg-[#CBB57B] text-black text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Spacer */}
      <div className="h-4"></div>
    </aside>
  );
}
