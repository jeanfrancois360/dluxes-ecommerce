'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

const navigation: NavItem[] = [
  { nameKey: 'dashboard', href: '/admin/dashboard', icon: Home },
  { nameKey: 'products', href: '/admin/products', icon: Package },
  { nameKey: 'orders', href: '/admin/orders', icon: ShoppingBag },
  { nameKey: 'customers', href: '/admin/customers', icon: Users },
  { nameKey: 'sellerManagement', href: '/admin/sellers', icon: Store },
  { nameKey: 'categories', href: '/admin/categories', icon: FolderOpen },
  { nameKey: 'currencies', href: '/admin/currencies', icon: DollarSign },
  { nameKey: 'subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { nameKey: 'subscriptionPlans', href: '/admin/subscriptions/plans', icon: CreditCard },
  { nameKey: 'adSubscriptions', href: '/admin/subscriptions/advertisement', icon: CreditCard },
  { nameKey: 'sellerSubscriptions', href: '/admin/subscriptions/sellers', icon: CreditCard },
  { nameKey: 'escrow', href: '/admin/escrow', icon: ShieldCheck },
  { nameKey: 'commissions', href: '/admin/commissions', icon: Percent },
  { nameKey: 'shipping', href: '/admin/shipping', icon: Truck },
  { nameKey: 'payouts', href: '/admin/payouts', icon: Banknote },
  { nameKey: 'deliveryProviders', href: '/admin/delivery-providers', icon: Truck },
  { nameKey: 'deliveries', href: '/admin/deliveries', icon: PackageCheck },
  { nameKey: 'deliveryPayouts', href: '/admin/delivery-payouts', icon: Banknote },
  { nameKey: 'advertisements', href: '/admin/advertisements', icon: Megaphone },
  { nameKey: 'reviews', href: '/admin/reviews', icon: Star },
  { nameKey: 'analytics', href: '/admin/analytics', icon: BarChart3 },
  { nameKey: 'settings', href: '/admin/settings', icon: Settings },
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
    <aside className="fixed top-0 left-0 z-40 h-full w-64 bg-black text-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 flex-shrink-0">
        <Link href="/admin/dashboard" className="flex items-center group" onClick={handleClick}>
          <div className="relative h-10 w-auto flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="NextPik"
              width={120}
              height={40}
              className="object-contain group-hover:opacity-80 transition-opacity"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {navigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.nameKey}
              href={item.href}
              onClick={handleClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#CBB57B] text-black shadow-sm'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{t(item.nameKey)}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Brand */}
      <div className="border-t border-gray-800 p-4 flex-shrink-0">
        <p className="text-xs text-gray-500 text-center">NextPik Admin v2.6.0</p>
      </div>
    </aside>
  );
}
