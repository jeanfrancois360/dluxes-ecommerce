'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/admin/admin-layout';
import { currencyAdminApi, CurrencyRate } from '@/lib/api/currency';
import useSWR from 'swr';
import { toast } from '@/lib/toast';

export default function AdminCurrenciesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyRate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all currencies (including inactive)
  const { data: currencies, error, isLoading, mutate } = useSWR(
    '/currency/admin/all',
    currencyAdminApi.getAllCurrencies,
    {
      revalidateOnFocus: true,
    }
  );

  const handleToggleActive = async (currency: CurrencyRate) => {
    try {
      await currencyAdminApi.toggleActive(currency.currencyCode);
      toast.success(
        currency.isActive ? 'Currency Deactivated' : 'Currency Activated',
        `${currency.currencyName} has been ${currency.isActive ? 'deactivated' : 'activated'}`
      );
      mutate();
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to toggle currency status');
    }
  };

  const handleDelete = async (currency: CurrencyRate) => {
    if (currency.currencyCode === 'USD') {
      toast.error('Cannot Delete', 'USD is the base currency and cannot be deleted');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete ${currency.currencyName}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(currency.id);
      await currencyAdminApi.deleteRate(currency.currencyCode);
      toast.success('Currency Deleted', `${currency.currencyName} has been deleted`);
      mutate();
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to delete currency');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
  };

  const handleEditSuccess = () => {
    setEditingCurrency(null);
    mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Currency Management</h1>
            <p className="text-gray-600 mt-2">
              Manage exchange rates and currency settings for the platform
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Currency
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Currencies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currencies?.filter(c => c.isActive).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Currencies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currencies?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#CBB57B]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Base Currency</p>
                <p className="text-2xl font-bold text-gray-900">USD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Currencies Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Exchange Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-12 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-red-600">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">Failed to load currencies</p>
                        <p className="text-sm text-gray-600 mt-1">{error.message}</p>
                      </div>
                    </td>
                  </tr>
                ) : currencies && currencies.length > 0 ? (
                  currencies.map((currency) => (
                    <tr key={currency.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                            {currency.symbol}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{currency.currencyName}</p>
                            {currency.currencyCode === 'USD' && (
                              <span className="text-xs text-[#CBB57B] font-medium">Base Currency</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-gray-900">{currency.currencyCode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{currency.symbol}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {currency.rate.toFixed(6)}
                          </span>
                          <span className="text-xs text-gray-500">
                            1 USD = {currency.rate.toFixed(currency.decimalDigits)} {currency.currencyCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {currency.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-1.5"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {new Date(currency.lastUpdated).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(currency.lastUpdated).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingCurrency(currency)}
                            className="p-2 text-gray-600 hover:text-[#CBB57B] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleActive(currency)}
                            className={`p-2 rounded-lg transition-colors ${
                              currency.isActive
                                ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={currency.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {currency.isActive ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          {currency.currencyCode !== 'USD' && (
                            <button
                              onClick={() => handleDelete(currency)}
                              disabled={deletingId === currency.id}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === currency.id ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">No currencies found</p>
                        <p className="text-sm mt-1">Add your first currency to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Currency Modal */}
      <CurrencyFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        mode="add"
      />

      {/* Edit Currency Modal */}
      <CurrencyFormModal
        isOpen={!!editingCurrency}
        onClose={() => setEditingCurrency(null)}
        onSuccess={handleEditSuccess}
        mode="edit"
        currency={editingCurrency}
      />
    </AdminLayout>
  );
}

// Currency Form Modal Component
interface CurrencyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'add' | 'edit';
  currency?: CurrencyRate | null;
}

function CurrencyFormModal({ isOpen, onClose, onSuccess, mode, currency }: CurrencyFormModalProps) {
  const [formData, setFormData] = useState({
    currencyCode: '',
    currencyName: '',
    symbol: '',
    rate: 1,
    decimalDigits: 2,
    position: 'before' as 'before' | 'after',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when currency changes or modal opens
  useEffect(() => {
    if (currency && mode === 'edit') {
      setFormData({
        currencyCode: currency.currencyCode,
        currencyName: currency.currencyName,
        symbol: currency.symbol,
        rate: Number(currency.rate),
        decimalDigits: currency.decimalDigits,
        position: currency.position,
        isActive: currency.isActive,
      });
    } else if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        currencyCode: '',
        currencyName: '',
        symbol: '',
        rate: 1,
        decimalDigits: 2,
        position: 'before',
        isActive: true,
      });
    }
  }, [currency, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'add') {
        await currencyAdminApi.createRate(formData);
        toast.success('Currency Added', `${formData.currencyName} has been added successfully`);
      } else if (currency) {
        await currencyAdminApi.updateRate(currency.currencyCode, formData);
        toast.success('Currency Updated', `${formData.currencyName} has been updated successfully`);
      }
      onSuccess();
    } catch (error: any) {
      toast.error('Error', error.message || `Failed to ${mode} currency`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'add' ? 'Add New Currency' : 'Edit Currency'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Currency Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.currencyCode}
                  onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent uppercase"
                  placeholder="USD"
                  maxLength={3}
                  required
                  disabled={mode === 'edit'}
                />
                <p className="text-xs text-gray-500 mt-1">ISO 4217 code (3 letters)</p>
              </div>

              {/* Currency Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.currencyName}
                  onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  placeholder="US Dollar"
                  required
                />
              </div>

              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  placeholder="$"
                  required
                />
              </div>

              {/* Exchange Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exchange Rate (to USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  placeholder="1.0"
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">1 USD = {formData.rate} {formData.currencyCode || '...'}</p>
              </div>

              {/* Decimal Digits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decimal Places
                </label>
                <select
                  value={formData.decimalDigits}
                  onChange={(e) => setFormData({ ...formData, decimalDigits: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                >
                  <option value={0}>0 (e.g., ¥100)</option>
                  <option value={2}>2 (e.g., $100.00)</option>
                  <option value={3}>3 (e.g., $100.000)</option>
                </select>
              </div>

              {/* Symbol Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol Position
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as 'before' | 'after' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                >
                  <option value="before">Before ({formData.symbol}100)</option>
                  <option value="after">After (100{formData.symbol})</option>
                </select>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-[#CBB57B] border-gray-300 rounded focus:ring-2 focus:ring-[#CBB57B]"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Activate this currency immediately
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {mode === 'add' ? 'Adding...' : 'Updating...'}
                  </>
                ) : (
                  <>{mode === 'add' ? 'Add Currency' : 'Update Currency'}</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
