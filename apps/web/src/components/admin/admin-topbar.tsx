'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/use-user';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import Breadcrumbs from '@/components/shared/breadcrumbs';
import {
  Menu,
  Bell,
  Search,
  ExternalLink,
  ChevronDown,
  Home,
  Settings as SettingsIcon,
  LogOut,
  Package,
  ShoppingBag,
  Users,
  User,
  MessageSquare,
} from 'lucide-react';

interface AdminTopbarProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function AdminTopbar({ onMobileMenuToggle, isMobileMenuOpen }: AdminTopbarProps) {
  const t = useTranslations('components.adminHeader');
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Real notifications from API
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({
    pollInterval: 30000,
  });

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setShowNotifications(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/auth/login');
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white border-b border-neutral-200">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: Mobile Menu + Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-neutral-600" />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden md:block">
              <Breadcrumbs homeHref="/admin/dashboard" />
            </div>
          </div>

          {/* Center: View Website Link */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-700 hover:text-[#CBB57B] transition-colors"
              title={t('viewWebsite')}
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">{t('viewWebsite')}</span>
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#CBB57B] rounded-full border-2 border-white" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                    <h3 className="font-semibold text-black">{t('notifications')}</h3>
                    <span className="text-xs text-neutral-500">
                      {unreadCount} {t('unread', { count: unreadCount })}
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 ${
                            !notification.read ? 'bg-[#CBB57B]/10' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notification.read && (
                              <span className="w-2 h-2 bg-[#CBB57B] rounded-full mt-1.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black">{notification.title}</p>
                              <p className="text-sm text-neutral-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-neutral-50 text-center border-t border-neutral-200">
                      {unreadCount > 0 && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await markAllAsRead();
                          }}
                          className="text-sm text-[#CBB57B] hover:text-[#a89158] font-medium mr-4"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          router.push('/admin/notifications');
                        }}
                        className="text-sm text-[#CBB57B] hover:text-[#a89158] font-medium"
                      >
                        {t('viewAllNotifications')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <button
              onClick={() => router.push('/admin/notifications')}
              className="p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Profile Menu */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {(user as any)?.name?.charAt(0).toUpperCase() ||
                      user?.firstName?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      'A'}
                  </span>
                </div>
                <span className="hidden lg:block text-sm font-medium text-black">
                  {(user as any)?.name ||
                    user?.firstName ||
                    user?.email?.split('@')[0] ||
                    'Admin User'}
                </span>
                <ChevronDown
                  className={`hidden lg:block w-4 h-4 text-neutral-600 transition-transform duration-200 ${
                    showProfileMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {(user as any)?.name?.charAt(0).toUpperCase() ||
                            user?.firstName?.charAt(0).toUpperCase() ||
                            user?.email?.charAt(0).toUpperCase() ||
                            'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black truncate">
                          {(user as any)?.name || user?.firstName || user?.email || 'Admin User'}
                        </p>
                        <p className="text-xs text-neutral-600 truncate">
                          {user?.email || 'admin@luxury.com'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Home className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#CBB57B] transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <SettingsIcon className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                  </div>
                  <div className="border-t border-neutral-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50">
          <div className="flex items-start justify-center min-h-screen pt-20 px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSearch(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-200">
                <Search className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search admin panel..."
                  className="flex-1 outline-none text-black placeholder-neutral-400 text-base"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1 bg-neutral-100 rounded"
                >
                  ESC
                </button>
              </div>

              <div className="p-3 max-h-[400px] overflow-y-auto">
                {searchQuery ? (
                  <div className="text-center py-16 text-neutral-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p className="text-sm">Searching for "{searchQuery}"...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="px-2">
                      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        Quick Actions
                      </h3>
                      <div className="space-y-1">
                        <Link
                          href="/admin/products"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors group"
                          onClick={() => setShowSearch(false)}
                        >
                          <Package className="w-4 h-4 text-neutral-400 group-hover:text-[#CBB57B]" />
                          <span className="group-hover:text-black">Products</span>
                        </Link>
                        <Link
                          href="/admin/orders"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors group"
                          onClick={() => setShowSearch(false)}
                        >
                          <ShoppingBag className="w-4 h-4 text-neutral-400 group-hover:text-[#CBB57B]" />
                          <span className="group-hover:text-black">Orders</span>
                        </Link>
                        <Link
                          href="/admin/customers"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors group"
                          onClick={() => setShowSearch(false)}
                        >
                          <Users className="w-4 h-4 text-neutral-400 group-hover:text-[#CBB57B]" />
                          <span className="group-hover:text-black">Customers</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
