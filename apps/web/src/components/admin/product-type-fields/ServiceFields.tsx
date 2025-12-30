'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  MapPin,
  User,
  Calendar,
  Users,
  Shield,
  Check,
  X,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  ProductTypeFieldsProps,
  SERVICE_TYPES,
  SERVICE_DURATION_UNITS,
  SERVICE_BOOKING_LEAD_TIMES,
  COMMON_CREDENTIALS,
} from './types';

export function ServiceFields({
  formData,
  onChange,
  errors = {},
  disabled = false,
}: ProductTypeFieldsProps) {
  const [newInclude, setNewInclude] = useState('');
  const [newExclude, setNewExclude] = useState('');
  const [newCredential, setNewCredential] = useState('');

  // Handle adding includes
  const handleAddInclude = () => {
    if (newInclude.trim() && !formData.serviceIncludes?.includes(newInclude.trim())) {
      onChange('serviceIncludes', [...(formData.serviceIncludes || []), newInclude.trim()]);
      setNewInclude('');
    }
  };

  const handleRemoveInclude = (item: string) => {
    onChange(
      'serviceIncludes',
      formData.serviceIncludes?.filter((i: string) => i !== item) || []
    );
  };

  // Handle adding excludes
  const handleAddExclude = () => {
    if (newExclude.trim() && !formData.serviceExcludes?.includes(newExclude.trim())) {
      onChange('serviceExcludes', [...(formData.serviceExcludes || []), newExclude.trim()]);
      setNewExclude('');
    }
  };

  const handleRemoveExclude = (item: string) => {
    onChange(
      'serviceExcludes',
      formData.serviceExcludes?.filter((i: string) => i !== item) || []
    );
  };

  // Handle credentials
  const handleAddCredential = () => {
    if (newCredential.trim() && !formData.serviceProviderCredentials?.includes(newCredential.trim())) {
      onChange('serviceProviderCredentials', [
        ...(formData.serviceProviderCredentials || []),
        newCredential.trim(),
      ]);
      setNewCredential('');
    }
  };

  const handleRemoveCredential = (credential: string) => {
    onChange(
      'serviceProviderCredentials',
      formData.serviceProviderCredentials?.filter((c: string) => c !== credential) || []
    );
  };

  const handleQuickAddCredential = (credential: string) => {
    if (!formData.serviceProviderCredentials?.includes(credential)) {
      onChange('serviceProviderCredentials', [
        ...(formData.serviceProviderCredentials || []),
        credential,
      ]);
    }
  };

  return (
    <div className="bg-teal-50 rounded-lg shadow p-6 border border-teal-200">
      <h2 className="text-lg font-semibold text-teal-800 mb-4 flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        Service Details
      </h2>

      {/* Row 1: Service Type & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Type *
          </label>
          <select
            value={formData.serviceType || ''}
            onChange={(e) => onChange('serviceType', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select type...</option>
            {SERVICE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.serviceType && (
            <p className="text-sm text-red-500 mt-1">{errors.serviceType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Clock className="inline h-4 w-4 mr-1" />
            Duration
          </label>
          <input
            type="number"
            min="1"
            value={formData.serviceDuration ?? ''}
            onChange={(e) =>
              onChange('serviceDuration', e.target.value ? parseInt(e.target.value) : undefined)
            }
            disabled={disabled}
            placeholder="e.g., 60"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration Unit
          </label>
          <select
            value={formData.serviceDurationUnit || ''}
            onChange={(e) => onChange('serviceDurationUnit', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select unit...</option>
            {SERVICE_DURATION_UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Location (for in-person/hybrid) */}
      {(formData.serviceType === 'in_person' || formData.serviceType === 'hybrid') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              Service Location
            </label>
            <input
              type="text"
              value={formData.serviceLocation || ''}
              onChange={(e) => onChange('serviceLocation', e.target.value)}
              disabled={disabled}
              placeholder="e.g., 123 Main St, Suite 100, New York, NY"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Area
            </label>
            <input
              type="text"
              value={formData.serviceArea || ''}
              onChange={(e) => onChange('serviceArea', e.target.value)}
              disabled={disabled}
              placeholder="e.g., Greater New York Area, Within 50 miles"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>
      )}

      {/* Row 3: Booking Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.serviceBookingRequired ?? true}
              onChange={(e) => onChange('serviceBookingRequired', e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-gray-700">
              <Calendar className="inline h-4 w-4 mr-1" />
              Booking Required
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Customers must book in advance
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking Lead Time
          </label>
          <select
            value={formData.serviceBookingLeadTime ?? ''}
            onChange={(e) =>
              onChange(
                'serviceBookingLeadTime',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select lead time...</option>
            {SERVICE_BOOKING_LEAD_TIMES.map((time) => (
              <option key={time.value} value={time.value}>
                {time.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users className="inline h-4 w-4 mr-1" />
            Max Clients
          </label>
          <input
            type="number"
            min="1"
            value={formData.serviceMaxClients ?? ''}
            onChange={(e) =>
              onChange('serviceMaxClients', e.target.value ? parseInt(e.target.value) : undefined)
            }
            disabled={disabled}
            placeholder="e.g., 1 (for 1-on-1)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            For group services, leave empty for unlimited
          </p>
        </div>
      </div>

      {/* Row 4: Availability */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Availability Schedule
        </label>
        <textarea
          value={formData.serviceAvailability || ''}
          onChange={(e) => onChange('serviceAvailability', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="e.g., Monday - Friday: 9am - 5pm&#10;Saturday: 10am - 2pm&#10;Sunday: Closed"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 resize-none"
        />
      </div>

      {/* Provider Information Section */}
      <div className="mt-6 pt-6 border-t border-teal-200">
        <h3 className="text-md font-semibold text-teal-800 mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Service Provider
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Name
            </label>
            <input
              type="text"
              value={formData.serviceProviderName || ''}
              onChange={(e) => onChange('serviceProviderName', e.target.value)}
              disabled={disabled}
              placeholder="e.g., John Smith"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Photo URL
            </label>
            <input
              type="url"
              value={formData.serviceProviderImage || ''}
              onChange={(e) => onChange('serviceProviderImage', e.target.value)}
              disabled={disabled}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider Bio
          </label>
          <textarea
            value={formData.serviceProviderBio || ''}
            onChange={(e) => onChange('serviceProviderBio', e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="Brief description of the service provider's background and expertise..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 resize-none"
          />
        </div>

        {/* Credentials */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Shield className="inline h-4 w-4 mr-1" />
            Credentials & Certifications
          </label>

          {/* Quick add buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_CREDENTIALS.map((cred) => (
              <button
                key={cred}
                type="button"
                onClick={() => handleQuickAddCredential(cred)}
                disabled={disabled || formData.serviceProviderCredentials?.includes(cred)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  formData.serviceProviderCredentials?.includes(cred)
                    ? 'bg-teal-100 border-teal-500 text-teal-700 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-teal-500 hover:text-teal-600'
                }`}
              >
                + {cred}
              </button>
            ))}
          </div>

          {/* Custom credential input */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newCredential}
              onChange={(e) => setNewCredential(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCredential())}
              disabled={disabled}
              placeholder="Add custom credential..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={handleAddCredential}
              disabled={disabled || !newCredential.trim()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Credentials list */}
          {formData.serviceProviderCredentials?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.serviceProviderCredentials.map((cred: string) => (
                <span
                  key={cred}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                >
                  <Shield className="h-3 w-3" />
                  {cred}
                  <button
                    type="button"
                    onClick={() => handleRemoveCredential(cred)}
                    disabled={disabled}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* What's Included/Excluded Section */}
      <div className="mt-6 pt-6 border-t border-teal-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Includes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Check className="inline h-4 w-4 mr-1 text-green-600" />
              What's Included
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newInclude}
                onChange={(e) => setNewInclude(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInclude())}
                disabled={disabled}
                placeholder="Add included item..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={handleAddInclude}
                disabled={disabled || !newInclude.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {formData.serviceIncludes?.length > 0 && (
              <div className="space-y-1">
                {formData.serviceIncludes.map((item: string) => (
                  <div
                    key={item}
                    className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg border border-green-200"
                  >
                    <span className="flex items-center gap-2 text-sm text-green-800">
                      <Check className="h-4 w-4 text-green-600" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclude(item)}
                      disabled={disabled}
                      className="text-green-600 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Excludes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <X className="inline h-4 w-4 mr-1 text-red-600" />
              What's NOT Included
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newExclude}
                onChange={(e) => setNewExclude(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExclude())}
                disabled={disabled}
                placeholder="Add excluded item..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={handleAddExclude}
                disabled={disabled || !newExclude.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {formData.serviceExcludes?.length > 0 && (
              <div className="space-y-1">
                {formData.serviceExcludes.map((item: string) => (
                  <div
                    key={item}
                    className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg border border-red-200"
                  >
                    <span className="flex items-center gap-2 text-sm text-red-800">
                      <X className="h-4 w-4 text-red-600" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExclude(item)}
                      disabled={disabled}
                      className="text-red-600 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Requirements */}
      <div className="mt-6 pt-6 border-t border-teal-200">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <AlertCircle className="inline h-4 w-4 mr-1" />
          Client Requirements
        </label>
        <textarea
          value={formData.serviceRequirements || ''}
          onChange={(e) => onChange('serviceRequirements', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="What clients need to prepare or bring for this service..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 resize-none"
        />
      </div>

      {/* Cancellation Policy */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cancellation Policy
        </label>
        <textarea
          value={formData.serviceCancellationPolicy || ''}
          onChange={(e) => onChange('serviceCancellationPolicy', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="e.g., Free cancellation up to 24 hours before scheduled time. 50% fee for cancellations within 24 hours."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 resize-none"
        />
      </div>
    </div>
  );
}
