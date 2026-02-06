'use client';

/**
 * Admin Header Component
 *
 * Header with breadcrumb navigation, page title, and quick actions
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { useTranslations } from 'next-intl';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

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

const getPageTitle = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'dashboard';

  return lastSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const t = useTranslations('components.adminHeader');
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  // Mock notifications - replace with real data
  const notifications = [
    { id: 1, title: 'New Order #1234', message: 'A new order has been placed', time: '5 min ago', unread: true },
    { id: 2, title: 'Product Review', message: 'New review on Diamond Ring', time: '1 hour ago', unread: true },
    { id: 3, title: 'Low Stock Alert', message: 'Luxury Watch is running low', time: '2 hours ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Menu button + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MenuIcon className="w-6 h-6 text-gray-600" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {crumb.isLast ? (
                    <span className="font-medium text-gray-900">{crumb.name}</span>
                  ) : (
                    <Link
                      href={crumb.path}
                      className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Page Title (Mobile) */}
            <h1 className="md:hidden text-xl font-semibold text-gray-900">{pageTitle}</h1>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
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
              <ExternalLinkIcon className="w-4 h-4" />
              <span className="hidden lg:inline">{t('viewWebsite')}</span>
            </a>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{t('notifications')}</h3>
                    <span className="text-xs text-gray-500">{t('unread', { count: notifications.filter(n => n.unread).length })}</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                          notification.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      {t('viewAllNotifications')}
                    </button>
                  </div>
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
                    {(user as any)?.name?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <svg
                  className="hidden sm:block w-4 h-4 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{(user as any)?.name || user?.firstName || user?.email || 'Admin User'}</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.email || 'admin@luxury.com'}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {t('dashboard')}
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('settings')}
                    </Link>
                  </div>
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Title (Desktop) */}
        <h1 className="hidden md:block text-2xl font-bold text-gray-900 mt-4">{pageTitle}</h1>
      </div>

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
                <SearchIcon className="w-5 h-5 text-gray-400" />
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
    </header>
  );
}
