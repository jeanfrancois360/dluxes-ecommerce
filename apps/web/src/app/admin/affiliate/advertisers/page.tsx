'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ModernTable } from '@/components/admin/modern-table';
import { useAffiliateAdvertisers } from '@/hooks/use-affiliate';
import { affiliateApi } from '@/lib/api/affiliate';
import { formatDate } from '@/lib/utils/date-format';
import { Building2, Filter, X } from 'lucide-react';
import type { AffiliateAdvertiser, AffiliateAdvertiserStatus } from '@/lib/api/affiliate';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: AffiliateAdvertiserStatus }) {
  const styles: Record<AffiliateAdvertiserStatus, string> = {
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    PAUSED: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${styles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

type AdvertiserFormData = {
  name: string;
  awinMerchantId: string;
  websiteUrl: string;
  logoUrl: string;
  approvalStatus: AffiliateAdvertiserStatus;
  defaultCommissionRate: string;
  notes: string;
  isActive: boolean;
};

const emptyForm: AdvertiserFormData = {
  name: '',
  awinMerchantId: '',
  websiteUrl: '',
  logoUrl: '',
  approvalStatus: 'PENDING',
  defaultCommissionRate: '',
  notes: '',
  isActive: true,
};

function validateAdvertiserForm(data: AdvertiserFormData, isEdit: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = 'Name is required.';
  if (!isEdit && !data.awinMerchantId.trim())
    errors.awinMerchantId = 'Awin Merchant ID is required.';
  if (data.websiteUrl && !/^https?:\/\//.test(data.websiteUrl))
    errors.websiteUrl = 'Must start with http:// or https://';
  if (data.logoUrl && !/^https?:\/\//.test(data.logoUrl))
    errors.logoUrl = 'Must start with http:// or https://';
  if (data.defaultCommissionRate !== '') {
    const rate = parseFloat(data.defaultCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100)
      errors.defaultCommissionRate = 'Must be a number between 0 and 100.';
  }
  return errors;
}

// ---------------------------------------------------------------------------
// buildColumns — defined inside component to close over handlers
// ---------------------------------------------------------------------------

function buildColumns(
  onEdit: (a: AffiliateAdvertiser) => void,
  onStatusChange: (a: AffiliateAdvertiser, status: AffiliateAdvertiserStatus) => void,
  onDelete: (a: AffiliateAdvertiser) => void
) {
  return [
    {
      key: 'name',
      label: 'Advertiser',
      render: (item: AffiliateAdvertiser) => (
        <div>
          <div className="font-semibold text-gray-900">{item.name}</div>
          {item.websiteUrl && (
            <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.websiteUrl}</div>
          )}
        </div>
      ),
    },
    {
      key: 'awinMerchantId',
      label: 'Awin Merchant ID',
      render: (item: AffiliateAdvertiser) => (
        <span className="font-mono text-sm text-gray-700">{item.awinMerchantId}</span>
      ),
    },
    {
      key: 'approvalStatus',
      label: 'Status',
      render: (item: AffiliateAdvertiser) => <StatusBadge status={item.approvalStatus} />,
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (item: AffiliateAdvertiser) => (
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
            item.isActive
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {item.isActive ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'defaultCommissionRate',
      label: 'Commission %',
      align: 'right' as const,
      render: (item: AffiliateAdvertiser) =>
        item.defaultCommissionRate != null ? (
          <span className="text-gray-700">{item.defaultCommissionRate.toFixed(2)}%</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: AffiliateAdvertiser) => (
        <span className="text-gray-500 text-sm">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: AffiliateAdvertiser) => (
        <div className="flex items-center gap-2 flex-wrap">
          {item.approvalStatus === 'PENDING' && (
            <>
              <button
                onClick={() => onStatusChange(item, 'APPROVED')}
                className="text-xs font-medium text-green-700 hover:text-green-900"
              >
                Approve
              </button>
              <button
                onClick={() => onStatusChange(item, 'REJECTED')}
                className="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Reject
              </button>
            </>
          )}
          {item.approvalStatus === 'APPROVED' && (
            <button
              onClick={() => onStatusChange(item, 'PAUSED')}
              className="text-xs font-medium text-amber-600 hover:text-amber-800"
            >
              Pause
            </button>
          )}
          {item.approvalStatus === 'PAUSED' && (
            <button
              onClick={() => onStatusChange(item, 'APPROVED')}
              className="text-xs font-medium text-green-700 hover:text-green-900"
            >
              Reactivate
            </button>
          )}
          <span className="text-gray-200">|</span>
          <button
            onClick={() => onEdit(item)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-xs font-medium text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared form UI
// ---------------------------------------------------------------------------

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function AdvertiserForm({
  data,
  errors,
  apiError,
  submitting,
  isEdit,
  onChange,
  onSubmit,
  onCancel,
}: {
  data: AdvertiserFormData;
  errors: Record<string, string>;
  apiError: string | null;
  submitting: boolean;
  isEdit: boolean;
  onChange: (patch: Partial<AdvertiserFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Name */}
      <div>
        <label className={labelCls}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={inputCls}
          placeholder="e.g. Amazon UK"
        />
        <FieldError msg={errors.name} />
      </div>

      {/* Awin Merchant ID */}
      <div>
        <label className={labelCls}>
          Awin Merchant ID {!isEdit && <span className="text-red-500">*</span>}
        </label>
        {isEdit ? (
          <input
            type="text"
            value={data.awinMerchantId}
            readOnly
            className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}
          />
        ) : (
          <input
            type="text"
            value={data.awinMerchantId}
            onChange={(e) => onChange({ awinMerchantId: e.target.value })}
            className={inputCls}
            placeholder="e.g. 12345"
          />
        )}
        <FieldError msg={errors.awinMerchantId} />
      </div>

      {/* Website URL */}
      <div>
        <label className={labelCls}>Website URL</label>
        <input
          type="text"
          value={data.websiteUrl}
          onChange={(e) => onChange({ websiteUrl: e.target.value })}
          className={inputCls}
          placeholder="https://example.com"
        />
        <FieldError msg={errors.websiteUrl} />
      </div>

      {/* Logo URL */}
      <div>
        <label className={labelCls}>Logo URL</label>
        <input
          type="text"
          value={data.logoUrl}
          onChange={(e) => onChange({ logoUrl: e.target.value })}
          className={inputCls}
          placeholder="https://example.com/logo.png"
        />
        <FieldError msg={errors.logoUrl} />
      </div>

      {/* Approval Status + Commission Rate — two columns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Approval Status</label>
          <select
            value={data.approvalStatus}
            onChange={(e) =>
              onChange({ approvalStatus: e.target.value as AffiliateAdvertiserStatus })
            }
            className={inputCls}
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Default Commission Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={data.defaultCommissionRate}
            onChange={(e) => onChange({ defaultCommissionRate: e.target.value })}
            className={inputCls}
            placeholder="e.g. 5.5"
          />
          <FieldError msg={errors.defaultCommissionRate} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          className={inputCls}
          placeholder="Internal notes…"
        />
      </div>

      {/* Active */}
      <div className="flex items-center gap-2">
        <input
          id="advertiser-active"
          type="checkbox"
          checked={data.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="advertiser-active" className="text-sm text-gray-700">
          Active
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Advertiser'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function AdvertisersContent() {
  // List state
  const [page, setPage] = useState(1);
  const [approvalStatus, setApprovalStatus] = useState<AffiliateAdvertiserStatus | ''>('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const limit = 20;

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      approvalStatus: approvalStatus || undefined,
      isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
    }),
    [page, approvalStatus, isActiveFilter]
  );

  const { advertisers, pagination, loading, error, refetch } = useAffiliateAdvertisers(queryParams);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<AffiliateAdvertiser | null>(null);
  const [formData, setFormData] = useState<AdvertiserFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const patchForm = (patch: Partial<AdvertiserFormData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setFormApiError(null);
    setShowCreateModal(true);
  };

  const openEdit = useCallback((advertiser: AffiliateAdvertiser) => {
    setFormData({
      name: advertiser.name,
      awinMerchantId: advertiser.awinMerchantId,
      websiteUrl: advertiser.websiteUrl ?? '',
      logoUrl: advertiser.logoUrl ?? '',
      approvalStatus: advertiser.approvalStatus,
      defaultCommissionRate: advertiser.defaultCommissionRate?.toString() ?? '',
      notes: advertiser.notes ?? '',
      isActive: advertiser.isActive,
    });
    setFormErrors({});
    setFormApiError(null);
    setEditingAdvertiser(advertiser);
  }, []); // only stable state setters in closure

  const handleStatusChange = useCallback(
    async (advertiser: AffiliateAdvertiser, newStatus: AffiliateAdvertiserStatus) => {
      const message =
        newStatus === 'APPROVED' && advertiser.approvalStatus === 'PAUSED'
          ? `Reactivate ${advertiser.name}? Their products will become visible again.`
          : newStatus === 'APPROVED'
            ? `Approve ${advertiser.name}? They will become visible on the platform.`
            : newStatus === 'PAUSED'
              ? `Pause ${advertiser.name}? Their products will be hidden until reactivated.`
              : `Reject ${advertiser.name}? This cannot be undone.`;
      if (!window.confirm(message)) return;
      try {
        await affiliateApi.updateAdvertiser(advertiser.id, { approvalStatus: newStatus });
        refetch();
      } catch (err) {
        console.error('Status change failed:', err);
      }
    },
    [refetch]
  );

  const handleDelete = useCallback(
    async (advertiser: AffiliateAdvertiser) => {
      if (
        !window.confirm(
          `Delete ${advertiser.name}? This will soft-delete the advertiser. Their products will be hidden but historical commission data is preserved.`
        )
      )
        return;
      try {
        await affiliateApi.deleteAdvertiser(advertiser.id);
        refetch();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    },
    [refetch]
  );

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingAdvertiser(null);
  };

  const handleCreate = async () => {
    const errs = validateAdvertiserForm(formData, false);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    try {
      setFormSubmitting(true);
      setFormApiError(null);
      await affiliateApi.createAdvertiser({
        name: formData.name.trim(),
        awinMerchantId: formData.awinMerchantId.trim(),
        websiteUrl: formData.websiteUrl || undefined,
        logoUrl: formData.logoUrl || undefined,
        approvalStatus: formData.approvalStatus,
        defaultCommissionRate:
          formData.defaultCommissionRate !== ''
            ? parseFloat(formData.defaultCommissionRate)
            : undefined,
        notes: formData.notes || undefined,
        isActive: formData.isActive,
      });
      closeModal();
      refetch();
    } catch (err) {
      setFormApiError(err instanceof Error ? err.message : 'Failed to create advertiser.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAdvertiser) return;
    const errs = validateAdvertiserForm(formData, true);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    try {
      setFormSubmitting(true);
      setFormApiError(null);
      await affiliateApi.updateAdvertiser(editingAdvertiser.id, {
        name: formData.name.trim(),
        websiteUrl: formData.websiteUrl || undefined,
        logoUrl: formData.logoUrl || undefined,
        approvalStatus: formData.approvalStatus,
        defaultCommissionRate:
          formData.defaultCommissionRate !== ''
            ? parseFloat(formData.defaultCommissionRate)
            : undefined,
        notes: formData.notes || undefined,
        isActive: formData.isActive,
      });
      closeModal();
      refetch();
    } catch (err) {
      setFormApiError(err instanceof Error ? err.message : 'Failed to update advertiser.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = useMemo(
    () => buildColumns(openEdit, handleStatusChange, handleDelete),
    [openEdit, handleStatusChange, handleDelete]
  );

  const hasActiveFilters = approvalStatus || isActiveFilter !== 'all';

  const clearFilters = () => {
    setApprovalStatus('');
    setIsActiveFilter('all');
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advertisers</h1>
          <p className="text-gray-500 mt-1">
            Manage Awin advertiser accounts ({pagination.total} total)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Create Advertiser
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {/* Approval status */}
          <select
            value={approvalStatus}
            onChange={(e) => {
              setApprovalStatus(e.target.value as AffiliateAdvertiserStatus | '');
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAUSED">Paused</option>
          </select>

          {/* Active toggle */}
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value as 'all' | 'active' | 'inactive');
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Active &amp; inactive</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <ModernTable
        columns={columns}
        data={advertisers}
        loading={loading}
        emptyMessage={
          hasActiveFilters
            ? 'No advertisers match your filters.'
            : 'No advertisers yet. Add your first Awin advertiser.'
        }
        getRowId={(item) => item.id}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> –{' '}
              <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> advertisers
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        p === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === pagination.totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Empty state when no advertisers and no filters */}
      {!loading && !error && advertisers.length === 0 && !hasActiveFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No advertisers yet</h2>
          <p className="text-sm text-gray-500">
            Add your first Awin advertiser to start tracking affiliate commissions.
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeModal();
          }}
          tabIndex={0}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create Advertiser</h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
              <AdvertiserForm
                data={formData}
                errors={formErrors}
                apiError={formApiError}
                submitting={formSubmitting}
                isEdit={false}
                onChange={patchForm}
                onSubmit={handleCreate}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAdvertiser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeModal();
          }}
          tabIndex={0}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Advertiser —{' '}
                <span className="text-gray-500 font-normal">{editingAdvertiser.name}</span>
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
              <AdvertiserForm
                data={formData}
                errors={formErrors}
                apiError={formApiError}
                submitting={formSubmitting}
                isEdit
                onChange={patchForm}
                onSubmit={handleUpdate}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdminAffiliateAdvertisersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdvertisersContent />
      </AdminLayout>
    </AdminRoute>
  );
}
