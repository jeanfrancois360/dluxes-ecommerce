'use client';

/**
 * Admin Reviews Management Page
 *
 * Standardized to match Customer Management Module pattern
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import PageHeader from '@/components/admin/page-header';
import { useAdminReviews } from '@/hooks/use-admin';
import { useDebounce } from '@/hooks/use-debounce';
import { adminReviewsApi } from '@/lib/api/admin';
import { toast, standardToasts } from '@/lib/utils/toast';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils/number-format';
import { useTranslations } from 'next-intl';

interface ReviewStats {
  total: number;
  pending: number;
  averageRating: number;
  thisMonth: number;
}

function ReviewsContent() {
  const t = useTranslations('adminReviews');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    averageRating: 0,
    thisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Debounce search
  const search = useDebounce(searchInput, 500);

  const { reviews, total, pages, loading, refetch } = useAdminReviews({
    page,
    limit,
    status,
  });

  // Calculate stats
  useEffect(() => {
    const calculateStats = async () => {
      try {
        setStatsLoading(true);
        const allReviews = await adminReviewsApi.getAll({ limit: 1000 });
        const reviewList = allReviews.reviews;

        const pendingCount = reviewList.filter((r) => r.status === 'pending').length;
        const avgRating =
          reviewList.length > 0
            ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
            : 0;

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthCount = reviewList.filter(
          (r) => new Date(r.createdAt) >= thisMonthStart
        ).length;

        setStats({
          total: allReviews.total,
          pending: pendingCount,
          averageRating: avgRating,
          thisMonth: thisMonthCount,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    calculateStats();
  }, []);

  // Filter and sort reviews on frontend
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((r) => {
        const customerName = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim();
        return (
          r.product?.name?.toLowerCase().includes(searchLower) ||
          customerName.toLowerCase().includes(searchLower) ||
          r.comment.toLowerCase().includes(searchLower)
        );
      });
    }

    // Rating filter
    if (ratingFilter) {
      filtered = filtered.filter((r) => r.rating === parseInt(ratingFilter));
    }

    // Sort
    const [field, order] = sortBy.split('-');
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (field) {
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'rating':
          aVal = a.rating;
          bVal = b.rating;
          break;
        default:
          return 0;
      }

      if (order === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });

    return filtered;
  }, [reviews, search, ratingFilter, sortBy]);

  // Active filters
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    if (searchInput)
      filters.push({ key: 'search', label: t('filters.search'), value: `"${searchInput}"` });
    if (status) filters.push({ key: 'status', label: t('filters.status'), value: status });
    if (ratingFilter)
      filters.push({
        key: 'rating',
        label: t('filters.rating'),
        value: `${ratingFilter} ${t('filters.stars')}`,
      });
    if (sortBy !== 'createdAt-desc')
      filters.push({ key: 'sort', label: t('filters.sort'), value: sortBy.split('-')[0] });
    return filters;
  }, [searchInput, status, ratingFilter, sortBy, t]);

  const hasActiveFilters = activeFilters.length > 0;
  const activeFilterCount = activeFilters.length;

  const clearFilters = () => {
    setSearchInput('');
    setStatus('');
    setRatingFilter('');
    setSortBy('createdAt-desc');
    setPage(1);
  };

  const clearFilter = (key: string) => {
    switch (key) {
      case 'search':
        setSearchInput('');
        break;
      case 'status':
        setStatus('');
        break;
      case 'rating':
        setRatingFilter('');
        break;
      case 'sort':
        setSortBy('createdAt-desc');
        break;
    }
    setPage(1);
  };

  // Selection
  const allSelected = filteredReviews.length > 0 && selectedIds.length === filteredReviews.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReviews.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Actions
  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await adminReviewsApi.updateStatus(id, newStatus);
      toast.success(
        newStatus === 'approved' ? t('messages.reviewApproved') : t('messages.reviewRejected')
      );
      refetch();
    } catch (error) {
      toast.error(t('messages.failedToUpdate'));
    }
  };

  const handleBulkApprove = async () => {
    try {
      await adminReviewsApi.bulkUpdateStatus(selectedIds, 'approved');
      toast.success(t('messages.reviewsApproved', { count: selectedIds.length }));
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error(t('messages.failedToApprove'));
    }
  };

  const handleBulkReject = async () => {
    try {
      await adminReviewsApi.bulkUpdateStatus(selectedIds, 'rejected');
      toast.success(t('messages.reviewsRejected', { count: selectedIds.length }));
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error(t('messages.failedToReject'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.confirmDelete'))) return;
    try {
      await adminReviewsApi.delete(id);
      toast.success(t('messages.reviewDeleted'));
      refetch();
    } catch (error) {
      toast.error(t('messages.failedToDelete'));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(t('messages.confirmBulkDelete', { count: selectedIds.length }))) return;
    try {
      for (const id of selectedIds) {
        await adminReviewsApi.delete(id);
      }
      toast.success(t('messages.reviewsDeleted', { count: selectedIds.length }));
      setSelectedIds([]);
      refetch();
    } catch (error) {
      toast.error(t('messages.failedToDelete'));
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-[#CBB57B] fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('subtitle')} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">{t('stats.totalReviews')}</p>
                <p className="text-2xl font-bold text-black">
                  {statsLoading ? '...' : formatNumber(stats.total)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-xl shadow-sm border p-6 ${stats.pending > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">{t('stats.pendingModeration')}</p>
                <p
                  className={`text-2xl font-bold ${stats.pending > 0 ? 'text-amber-600' : 'text-black'}`}
                >
                  {statsLoading ? '...' : formatNumber(stats.pending)}
                </p>
                {!statsLoading && stats.pending > 0 && (
                  <p className="text-xs text-amber-600 mt-1">{t('stats.needsReview')}</p>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.pending > 0 ? 'bg-amber-100' : 'bg-neutral-100'}`}
              >
                <svg
                  className={`w-6 h-6 ${stats.pending > 0 ? 'text-amber-600' : 'text-neutral-600'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">{t('stats.averageRating')}</p>
                <p className="text-2xl font-bold text-black">
                  {statsLoading ? '...' : `${stats.averageRating.toFixed(1)} `}
                  <span className="text-amber-500">★</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 mb-1">{t('stats.thisMonth')}</p>
                <p className="text-2xl font-bold text-black">
                  {statsLoading ? '...' : formatNumber(stats.thisMonth)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px] relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder={t('filters.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white border border-neutral-300 text-black placeholder-neutral-400 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
            >
              <option value="">{t('filters.allStatus')}</option>
              <option value="pending">{t('filters.pending')}</option>
              <option value="approved">{t('filters.approved')}</option>
              <option value="rejected">{t('filters.rejected')}</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
            >
              <option value="">{t('filters.allRatings')}</option>
              <option value="5">{t('filters.fiveStars')}</option>
              <option value="4">{t('filters.fourStars')}</option>
              <option value="3">{t('filters.threeStars')}</option>
              <option value="2">{t('filters.twoStars')}</option>
              <option value="1">{t('filters.oneStar')}</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
            >
              <option value="createdAt-desc">{t('filters.newestFirst')}</option>
              <option value="createdAt-asc">{t('filters.oldestFirst')}</option>
              <option value="rating-desc">{t('filters.highestRating')}</option>
              <option value="rating-asc">{t('filters.lowestRating')}</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {t('filters.clear')} ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-200">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm"
                >
                  {filter.label}: {filter.value}
                  <button
                    onClick={() => clearFilter(filter.key)}
                    className="hover:text-neutral-900"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Table */}
        <div className="relative bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto relative">
            {loading ? (
              <div className="p-16 text-center">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-neutral-600 font-medium">{t('messages.loadingReviews')}</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-16 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-neutral-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-neutral-600 font-medium">{t('messages.noReviewsFound')}</p>
                <p className="text-neutral-500 text-sm mt-1">{t('messages.tryAdjustingFilters')}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-4 w-[40px]">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      {t('table.product')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      {t('table.customer')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      {t('table.rating')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      {t('table.review')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      {t('table.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      {t('table.date')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredReviews.map((review) => (
                    <tr
                      key={review.id}
                      className="group transition-all duration-200 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(review.id)}
                          onChange={() => toggleSelect(review.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-black group-hover:text-[#CBB57B] transition-colors">
                          {review.product?.name || t('table.unknownProduct')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 min-w-[32px] min-h-[32px] bg-gradient-to-br from-[#CBB57B] to-[#a89158] rounded-full overflow-hidden flex items-center justify-center ring-2 ring-[#CBB57B]/30">
                            <span className="text-white font-semibold text-xs">
                              {(review.user?.firstName?.charAt(0) || 'A').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-black">
                            {review.user?.firstName || t('table.anonymous')}{' '}
                            {review.user?.lastName || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{renderStars(review.rating)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-700 max-w-xs truncate">
                          {review.comment}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                            review.status === 'approved'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : review.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              review.status === 'approved'
                                ? 'bg-green-600'
                                : review.status === 'pending'
                                  ? 'bg-amber-600'
                                  : 'bg-red-600'
                            }`}
                          ></div>
                          {review.status
                            ? review.status.charAt(0).toUpperCase() + review.status.slice(1)
                            : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">
                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {review.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(review.id, 'approved')}
                              className="flex items-center gap-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition-colors"
                            >
                              {t('actions.approve')}
                            </button>
                          )}
                          {review.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusUpdate(review.id, 'rejected')}
                              className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
                            >
                              {t('actions.reject')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-medium transition-colors"
                          >
                            {t('actions.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredReviews.length > 0 && (
            <div className="px-6 py-4 border-t border-neutral-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-700">
                    {t('pagination.showing', {
                      start: (page - 1) * limit + 1,
                      end: Math.min(page * limit, total),
                      total,
                    })}
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="ml-4 px-3 py-1.5 border border-neutral-300 bg-white text-black rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent transition-all"
                  >
                    <option value="10">{t('pagination.perPage10')}</option>
                    <option value="25">{t('pagination.perPage25')}</option>
                    <option value="50">{t('pagination.perPage50')}</option>
                    <option value="100">{t('pagination.perPage100')}</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-neutral-300 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                  >
                    {t('pagination.previous')}
                  </button>
                  <span className="text-sm text-neutral-700 font-medium px-3">
                    {t('pagination.page', { current: page, total: pages })}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="px-4 py-2 border border-neutral-300 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-[#CBB57B] transition-all"
                  >
                    {t('pagination.next')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar (Fixed at Bottom) */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 text-white rounded-lg px-6 py-3 flex items-center gap-4 shadow-xl">
              <span className="font-medium text-sm">
                {selectedIds.length > 1
                  ? t('bulk.selectedPlural', { count: selectedIds.length })
                  : t('bulk.selected', { count: selectedIds.length })}
              </span>

              <div className="h-4 w-px bg-slate-600" />

              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t('actions.bulkApprove')}
              </button>

              <button
                onClick={handleBulkReject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t('actions.bulkReject')}
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t('actions.bulkDelete')}
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-all"
                title="Clear selection"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ReviewsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <ReviewsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
