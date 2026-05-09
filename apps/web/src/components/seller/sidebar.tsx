'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Settings,
  MessageSquare,
  Megaphone,
  CreditCard,
  PlusCircle,
  CheckCircle,
  Plane,
  Receipt,
  User,
  Shield,
  Zap,
  Lock,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
    },
  })
    .then((r) => r.json())
    .then((d) => d.data || d);

interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresActiveStore?: boolean;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

interface SellerSidebarProps {
  onNavigate?: () => void;
}

const navigationGroups: NavGroup[] = [
  {
    titleKey: 'dashboard',
    items: [
      { nameKey: 'overview', href: '/seller', icon: LayoutDashboard },
      { nameKey: 'onboarding', href: '/seller/onboarding', icon: CheckCircle },
    ],
  },
  {
    titleKey: 'productsInventory',
    items: [
      { nameKey: 'products', href: '/seller/products', icon: Package, requiresActiveStore: true },
      {
        nameKey: 'addProduct',
        href: '/seller/products/new',
        icon: PlusCircle,
        requiresActiveStore: true,
      },
      { nameKey: 'reviews', href: '/seller/reviews', icon: Star, requiresActiveStore: true },
    ],
  },
  {
    titleKey: 'ordersCustomers',
    items: [
      { nameKey: 'orders', href: '/seller/orders', icon: ShoppingCart, requiresActiveStore: true },
      {
        nameKey: 'inquiries',
        href: '/seller/inquiries',
        icon: MessageSquare,
        requiresActiveStore: true,
      },
    ],
  },
  {
    titleKey: 'marketingGrowth',
    items: [
      {
        nameKey: 'advertisements',
        href: '/seller/advertisements',
        icon: Megaphone,
        requiresActiveStore: true,
      },
      {
        nameKey: 'adPlans',
        href: '/seller/advertisement-plans',
        icon: Receipt,
        requiresActiveStore: true,
      },
    ],
  },
  {
    titleKey: 'earningsPayments',
    items: [
      {
        nameKey: 'earnings',
        href: '/seller/earnings',
        icon: DollarSign,
        requiresActiveStore: true,
      },
      {
        nameKey: 'payoutSettings',
        href: '/seller/payout-settings',
        icon: CreditCard,
        requiresActiveStore: true,
      },
    ],
  },
  {
    titleKey: 'subscription',
    items: [
      { nameKey: 'plan', href: '/seller/subscription', icon: CreditCard },
      { nameKey: 'sellingCredits', href: '/seller/selling-credits', icon: DollarSign },
    ],
  },
  {
    titleKey: 'accountSettings',
    items: [
      { nameKey: 'myProfile', href: '/seller/profile', icon: User },
      { nameKey: 'security', href: '/seller/security', icon: Shield },
      {
        nameKey: 'storeSettings',
        href: '/seller/store/settings',
        icon: Settings,
        requiresActiveStore: true,
      },
      {
        nameKey: 'gelatoIntegration',
        href: '/seller/gelato-settings',
        icon: Zap,
        requiresActiveStore: true,
      },
      {
        nameKey: 'vacationMode',
        href: '/seller/vacation-mode',
        icon: Plane,
        requiresActiveStore: true,
      },
    ],
  },
];

export default function SellerSidebar({ onNavigate }: SellerSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('sellerNav');

  const { data: appStatus } = useSWR(`${API_URL}/seller/application-status`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const isStoreActive = appStatus?.store?.status === 'ACTIVE';

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className="fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-neutral-200 overflow-y-auto">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-neutral-200">
        <Link href="/seller" className="flex items-center gap-3 group" onClick={handleNavigate}>
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
            <span className="text-xs font-medium text-[#CBB57B] block">{t('sellerPortal')}</span>
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
                const isLocked = item.requiresActiveStore && !isStoreActive;
                const isActive =
                  !isLocked &&
                  (pathname === item.href ||
                    (item.href !== '/seller' && pathname.startsWith(item.href)));
                const Icon = item.icon;

                if (isLocked) {
                  return (
                    <div
                      key={item.nameKey}
                      title="Available after your store is approved"
                      className="relative block cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-40 select-none">
                        <Icon className="w-5 h-5 flex-shrink-0 text-neutral-500" />
                        <span className="text-sm text-neutral-500 flex-1">
                          {t(`items.${item.nameKey}`)}
                        </span>
                        <Lock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    onClick={handleNavigate}
                    className="relative block"
                  >
                    {isActive && (
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
                          isActive
                            ? 'text-[#CBB57B] font-medium'
                            : 'text-neutral-700 hover:text-black hover:bg-neutral-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{t(`items.${item.nameKey}`)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pending store notice */}
      {appStatus && !isStoreActive && (
        <div className="mx-3 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-800 mb-0.5">Store Pending Approval</p>
          <p className="text-xs text-amber-700 leading-snug">
            Most features unlock once your store is approved by our team.
          </p>
        </div>
      )}

      {/* Bottom Spacer */}
      <div className="h-4"></div>
    </div>
  );
}
