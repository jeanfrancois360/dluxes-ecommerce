'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SellerSidebarProps {
  onNavigate?: () => void;
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Overview', href: '/seller', icon: LayoutDashboard },
      { name: 'Onboarding', href: '/seller/onboarding', icon: CheckCircle },
    ],
  },
  {
    title: 'Products & Inventory',
    items: [
      { name: 'Products', href: '/seller/products', icon: Package },
      { name: 'Add Product', href: '/seller/products/new', icon: PlusCircle },
      { name: 'Reviews', href: '/seller/reviews', icon: Star },
    ],
  },
  {
    title: 'Orders & Customers',
    items: [
      { name: 'Orders', href: '/seller/orders', icon: ShoppingCart },
      { name: 'Inquiries', href: '/seller/inquiries', icon: MessageSquare },
    ],
  },
  {
    title: 'Marketing & Growth',
    items: [
      { name: 'Advertisements', href: '/seller/advertisements', icon: Megaphone },
      { name: 'Ad Plans', href: '/seller/advertisement-plans', icon: Receipt },
    ],
  },
  {
    title: 'Earnings & Payments',
    items: [
      { name: 'Earnings', href: '/seller/earnings', icon: DollarSign },
      { name: 'Payout Settings', href: '/seller/payout-settings', icon: CreditCard },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { name: 'Plan', href: '/seller/subscription', icon: CreditCard },
      { name: 'Selling Credits', href: '/seller/selling-credits', icon: DollarSign },
    ],
  },
  {
    title: 'Account & Settings',
    items: [
      { name: 'My Profile', href: '/seller/profile', icon: User },
      { name: 'Security', href: '/seller/security', icon: Shield },
      { name: 'Store Settings', href: '/seller/store/settings', icon: Settings },
      { name: 'Vacation Mode', href: '/seller/vacation-mode', icon: Plane },
    ],
  },
];

export default function SellerSidebar({ onNavigate }: SellerSidebarProps) {
  const pathname = usePathname();

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
            <span className="text-xs font-medium text-[#CBB57B] block">Seller Portal</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/seller' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
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
                      <span className="text-sm">{item.name}</span>
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
    </div>
  );
}
