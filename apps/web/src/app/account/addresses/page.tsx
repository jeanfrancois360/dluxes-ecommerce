'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/buyer/page-header';
import Link from 'next/link';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/hooks/use-addresses';
import type { Address, CreateAddressData } from '@/lib/api/addresses';
import {
  validateAddressForm,
  type AddressFormData,
  type AddressValidationErrors,
} from '@/lib/validation/address-validation';
import { toast, standardToasts } from '@/lib/utils/toast';
import { CountrySelector } from '@/components/forms/country-selector';

export default function AddressesPage() {
  const { addresses, isLoading: loadingAddresses, refetch } = useAddresses();
  const { createAddress, isLoading: creating } = useCreateAddress();
  const { updateAddress, isLoading: updating } = useUpdateAddress();
  const { deleteAddress, isLoading: deleting } = useDeleteAddress();
  const { setDefaultAddress: setDefault, isLoading: settingDefault } = useSetDefaultAddress();
  const t = useTranslations('account.addresses');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    country: 'United States',
    postalCode: '',
    phone: '',
    isDefault: false,
  });
  const [validationErrors, setValidationErrors] = useState<AddressValidationErrors>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (showAddModal && !editingAddress) {
      // New address
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        address1: '',
        address2: '',
        city: '',
        province: '',
        country: 'United States',
        postalCode: '',
        phone: '',
        isDefault: false,
      });
      setValidationErrors({});
    }
  }, [showAddModal, editingAddress]);

  // Populate form when editing
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        firstName: editingAddress.firstName,
        lastName: editingAddress.lastName,
        company: editingAddress.company || '',
        address1: editingAddress.address1,
        address2: editingAddress.address2 || '',
        city: editingAddress.city,
        province: editingAddress.province || '',
        country: editingAddress.country,
        postalCode: editingAddress.postalCode || '',
        phone: editingAddress.phone || '',
        isDefault: editingAddress.isDefault,
      });
      setValidationErrors({});
    }
  }, [editingAddress]);

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (validationErrors[field as keyof AddressValidationErrors]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof AddressValidationErrors];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateAddressForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      standardToasts.generic.validationError('Please fix the errors before submitting');
      return;
    }

    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress(editingAddress.id, formData);
        toast.success(t('addressUpdated'));
        setEditingAddress(null);
      } else {
        // Create new address
        await createAddress(formData);
        toast.success(t('addressAdded'));
        setShowAddModal(false);
      }

      // Refresh addresses list
      await refetch();
    } catch (error: any) {
      toast.error(error.message || t('failedSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteAddress(id);
      toast.success(t('addressDeleted'));
      await refetch();
    } catch (error: any) {
      toast.error(error.message || t('failedDelete'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefault(id);
      toast.success(t('defaultUpdated'));
      await refetch();
    } catch (error: any) {
      toast.error(error.message || t('failedSetDefault'));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingAddress(null);
    setValidationErrors({});
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: '/dashboard/buyer' },
          { label: t('breadcrumbs.addresses') },
        ]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('addAddress')}
          </button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {loadingAddresses && (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-full" />
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                    <div className="h-4 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Addresses Grid */}
          {!loadingAddresses && (
            <div className="grid md:grid-cols-2 gap-6">
              <AnimatePresence>
                {addresses.map((address, index) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all relative ${
                      address.isDefault ? 'border-2 border-gold' : 'border border-neutral-200'
                    }`}
                  >
                    {/* Default Badge */}
                    {address.isDefault && (
                      <span className="absolute top-4 right-4 px-3 py-1 bg-gold text-black text-xs font-semibold rounded-full">
                        {t('default')}
                      </span>
                    )}

                    {/* Address Icon */}
                    <div className="flex items-center gap-2 mb-4">
                      <svg
                        className="w-6 h-6 text-gold"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                      <span className="text-xl font-serif font-bold text-black">
                        {address.company || `${address.firstName}'s Address`}
                      </span>
                    </div>

                    {/* Address Details */}
                    <div className="space-y-1 text-neutral-700 mb-6">
                      <p className="font-semibold text-black">
                        {address.firstName} {address.lastName}
                      </p>
                      <p>{address.address1}</p>
                      {address.address2 && <p>{address.address2}</p>}
                      <p>
                        {address.city}, {address.province} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      {address.phone && <p className="pt-2">{address.phone}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditingAddress(address)}
                        className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-all"
                      >
                        {t('edit')}
                      </motion.button>
                      {!address.isDefault && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSetDefault(address.id)}
                          disabled={settingDefaultId === address.id}
                          className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {settingDefaultId === address.id ? t('setting') : t('setDefault')}
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(address.id)}
                        disabled={deletingId === address.id}
                        className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === address.id ? t('deleting') : t('delete')}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add New Card */}
              {!loadingAddresses && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(true)}
                  className="min-h-[320px] bg-white border-2 border-dashed border-neutral-300 rounded-xl hover:border-gold transition-all flex flex-col items-center justify-center gap-4 text-neutral-500 hover:text-gold"
                >
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-lg font-semibold">{t('addNewAddress')}</span>
                </motion.button>
              )}
            </div>
          )}

          {/* Add/Edit Modal */}
          <AnimatePresence>
            {(showAddModal || editingAddress) && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeModal}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto pointer-events-auto"
                  >
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-black">
                          {editingAddress ? t('editAddress') : t('addNewAddress')}
                        </h2>
                        <button
                          onClick={closeModal}
                          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Company (Optional) */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('companyOptional')}
                          </label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            placeholder={t('companyPlaceholder')}
                          />
                        </div>

                        {/* First Name & Last Name */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('firstName')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                                validationErrors.firstName
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-neutral-200 focus:border-gold'
                              }`}
                              placeholder="John"
                            />
                            {validationErrors.firstName && (
                              <p className="mt-1 text-sm text-red-500">
                                {validationErrors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('lastName')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                                validationErrors.lastName
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-neutral-200 focus:border-gold'
                              }`}
                              placeholder="Doe"
                            />
                            {validationErrors.lastName && (
                              <p className="mt-1 text-sm text-red-500">
                                {validationErrors.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Address Line 1 */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('streetAddress')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.address1}
                            onChange={(e) => handleInputChange('address1', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                              validationErrors.address1
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-neutral-200 focus:border-gold'
                            }`}
                            placeholder="123 Main St"
                          />
                          {validationErrors.address1 && (
                            <p className="mt-1 text-sm text-red-500">{validationErrors.address1}</p>
                          )}
                        </div>

                        {/* Address Line 2 */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('aptSuiteOptional')}
                          </label>
                          <input
                            type="text"
                            value={formData.address2}
                            onChange={(e) => handleInputChange('address2', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            placeholder="Apt 4B"
                          />
                        </div>

                        {/* City, Province, Postal Code */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('city')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                                validationErrors.city
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-neutral-200 focus:border-gold'
                              }`}
                              placeholder="New York"
                            />
                            {validationErrors.city && (
                              <p className="mt-1 text-sm text-red-500">{validationErrors.city}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('stateProvince')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.province}
                              onChange={(e) => handleInputChange('province', e.target.value)}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                                validationErrors.province
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-neutral-200 focus:border-gold'
                              }`}
                              placeholder="NY"
                            />
                            {validationErrors.province && (
                              <p className="mt-1 text-sm text-red-500">
                                {validationErrors.province}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('postalCode')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.postalCode}
                              onChange={(e) => handleInputChange('postalCode', e.target.value)}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                                validationErrors.postalCode
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-neutral-200 focus:border-gold'
                              }`}
                              placeholder="10001"
                            />
                            {validationErrors.postalCode && (
                              <p className="mt-1 text-sm text-red-500">
                                {validationErrors.postalCode}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Country */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('country')} <span className="text-red-500">*</span>
                          </label>
                          <CountrySelector
                            value={formData.country}
                            onChange={(countryName) => handleInputChange('country', countryName)}
                            error={validationErrors.country}
                            placeholder={t('selectCountry')}
                          />
                          {validationErrors.country && (
                            <p className="mt-1 text-sm text-red-500">{validationErrors.country}</p>
                          )}
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('phoneNumber')}
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                              validationErrors.phone
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-neutral-200 focus:border-gold'
                            }`}
                            placeholder="+1 (555) 123-4567"
                          />
                          {validationErrors.phone && (
                            <p className="mt-1 text-sm text-red-500">{validationErrors.phone}</p>
                          )}
                        </div>

                        {/* Set as Default */}
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isDefault}
                            onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                            className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                          />
                          <span className="text-sm text-neutral-700">{t('setAsDefault')}</span>
                        </label>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-6">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={creating || updating}
                            className="flex-1 px-6 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {creating || updating
                              ? t('saving')
                              : editingAddress
                                ? t('updateAddress')
                                : t('addAddress')}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={closeModal}
                            className="flex-1 px-6 py-4 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-all"
                          >
                            {t('cancel')}
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
