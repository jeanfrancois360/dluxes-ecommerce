'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Package,
  History,
  RotateCcw,
  User,
  MapPin,
  CreditCard,
  MessageSquare,
  Bell,
  Settings,
  Download,
  Star,
  Store,
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

interface BuyerSidebarProps {
  onNavigate?: () => void;
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [{ name: 'Overview', href: '/dashboard/buyer', icon: LayoutDashboard }],
  },
  {
    title: 'Shopping',
    items: [
      { name: 'Browse Products', href: '/products', icon: ShoppingBag },
      { name: 'Wishlist', href: '/wishlist', icon: Heart },
      { name: 'Cart', href: '/cart', icon: ShoppingCart },
    ],
  },
  {
    title: 'Orders',
    items: [
      { name: 'My Orders', href: '/account/orders', icon: Package },
      { name: 'Order History', href: '/account/orders?status=delivered', icon: History },
      { name: 'Returns', href: '/account/returns', icon: RotateCcw },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', href: '/account/profile', icon: User },
      { name: 'Addresses', href: '/account/addresses', icon: MapPin },
      { name: 'Payment Methods', href: '/account/payment-methods', icon: CreditCard },
    ],
  },
  {
    title: 'Activity',
    items: [
      { name: 'Reviews', href: '/account/reviews', icon: Star },
      { name: 'Following Stores', href: '/account/following', icon: Store },
      { name: 'Downloads', href: '/account/downloads', icon: Download },
    ],
  },
  {
    title: 'Communication',
    items: [
      { name: 'Messages', href: '/account/messages', icon: MessageSquare },
      { name: 'Notifications', href: '/account/notifications', icon: Bell },
    ],
  },
  {
    title: 'Settings',
    items: [{ name: 'Preferences', href: '/account/security', icon: Settings }],
  },
];

export default function BuyerSidebar({ onNavigate }: BuyerSidebarProps) {
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
        <Link
          href="/dashboard/buyer"
          className="flex items-center gap-3 group"
          onClick={handleNavigate}
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
            <span className="text-xs font-medium text-[#CBB57B] block">Buyer Portal</span>
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
                  (item.href !== '/dashboard/buyer' && pathname.startsWith(item.href));
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
                        layoutId="activeBuyerTab"
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
