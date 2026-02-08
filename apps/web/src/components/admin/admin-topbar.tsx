'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/use-user';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import {
  Menu,
  Bell,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Home,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';

interface AdminTopbarProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  for (let i = 0; i < segments.length; i++) {
    const path = `/${segments.slice(0, i + 1).join('/')}`;
    const name = segments[i]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({ name, path, isLast: i === segments.length - 1 });
  }

  return breadcrumbs;
};

export default function AdminTopbar({ onMobileMenuToggle, isMobileMenuOpen }: AdminTopbarProps) {
  const t = useTranslations('components.adminHeader');
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const breadcrumbs = getBreadcrumbs(pathname);

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
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white border-b border-gray-200">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Mobile Menu + Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center space-x-2 text-sm min-w-0">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2 min-w-0">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  {crumb.isLast ? (
                    <span className="font-medium text-gray-900 truncate">{crumb.name}</span>
                  ) : (
                    <Link
                      href={crumb.path}
                      className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer truncate"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">{t('search')}</span>
              <span className="hidden lg:inline text-xs text-gray-400 ml-2">⌘K</span>
            </button>

            {/* View Website */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
              title={t('viewWebsite')}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden lg:inline">{t('viewWebsite')}</span>
            </a>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{t('notifications')}</h3>
                    <span className="text-xs text-gray-500">
                      {unreadCount} {t('unread', { count: unreadCount })}
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
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
                    <div className="px-4 py-3 bg-gray-50 text-center border-t border-gray-200">
                      {unreadCount > 0 && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await markAllAsRead();
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium mr-4"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          router.push('/admin/notifications');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {t('viewAllNotifications')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(user as any)?.name?.charAt(0).toUpperCase() ||
                      user?.firstName?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      'A'}
                  </span>
                </div>
                <ChevronDown className="hidden sm:block w-4 h-4 text-gray-600" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {(user as any)?.name || user?.firstName || user?.email || 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {user?.email || 'admin@luxury.com'}
                    </p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Home className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <SettingsIcon className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                  </div>
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-24 px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowSearch(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-gray-500 bg-gray-100 rounded">
                  ESC
                </kbd>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                {searchQuery ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm">{t('searchFor', { query: searchQuery })}</p>
                    <p className="text-xs mt-2">{t('pressEnterToSearch')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {t('quickActions')}
                      </h3>
                      <div className="space-y-1">
                        <Link
                          href="/admin/products"
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          onClick={() => setShowSearch(false)}
                        >
                          <span>📦</span>
                          <span>{t('products')}</span>
                        </Link>
                        <Link
                          href="/admin/orders"
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          onClick={() => setShowSearch(false)}
                        >
                          <span>🛒</span>
                          <span>{t('orders')}</span>
                        </Link>
                        <Link
                          href="/admin/customers"
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          onClick={() => setShowSearch(false)}
                        >
                          <span>👥</span>
                          <span>{t('customers')}</span>
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
