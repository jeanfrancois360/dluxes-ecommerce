'use client';

import React from 'react';
import {
  ProductTypeFieldsProps,
  RENTAL_PERIOD_TYPES,
  RENTAL_AGE_REQUIREMENTS,
  COMMON_RENTAL_INCLUDES,
  COMMON_RENTAL_EXCLUDES,
} from './types';

export function RentalFields({ formData, onChange, errors, disabled }: ProductTypeFieldsProps) {
  // Helper to add/remove items from array fields
  const handleArrayAdd = (field: string, value: string) => {
    const currentArray = formData[field] || [];
    if (!currentArray.includes(value)) {
      onChange(field, [...currentArray, value]);
    }
  };

  const handleArrayRemove = (field: string, value: string) => {
    const currentArray = formData[field] || [];
    onChange(field, currentArray.filter((item: string) => item !== value));
  };

  const handleCustomAdd = (field: string, inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input && input.value.trim()) {
      handleArrayAdd(field, input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rental Details</h2>
          <p className="text-sm text-gray-500">Configure rental periods, pricing, and terms</p>
        </div>
      </div>

      {/* Rental Period Configuration */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Rental Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
            <select
              value={formData.rentalPeriodType || ''}
              onChange={(e) => onChange('rentalPeriodType', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select period type</option>
              {RENTAL_PERIOD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Period</label>
            <input
              type="number"
              min="1"
              value={formData.rentalMinPeriod || ''}
              onChange={(e) => onChange('rentalMinPeriod', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="e.g., 1"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum rental duration</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Period</label>
            <input
              type="number"
              min="1"
              value={formData.rentalMaxPeriod || ''}
              onChange={(e) => onChange('rentalMaxPeriod', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="e.g., 30"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum rental duration</p>
          </div>
        </div>
      </div>

      {/* Rental Pricing */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Rental Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalPriceHourly || ''}
                onChange={(e) => onChange('rentalPriceHourly', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={disabled}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalPriceDaily || ''}
                onChange={(e) => onChange('rentalPriceDaily', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={disabled}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalPriceWeekly || ''}
                onChange={(e) => onChange('rentalPriceWeekly', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={disabled}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalPriceMonthly || ''}
                onChange={(e) => onChange('rentalPriceMonthly', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={disabled}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalSecurityDeposit || ''}
                onChange={(e) => onChange('rentalSecurityDeposit', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={disabled}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Refundable deposit amount</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Return Fee</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalLateReturnFee || ''}
                onChange={(e) => onChange('rentalLateReturnFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={disabled}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Fee per late period</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalDeliveryFee || ''}
                onChange={(e) => onChange('rentalDeliveryFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={disabled || !formData.rentalDeliveryAvailable}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pickup & Delivery */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Pickup & Delivery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
            <input
              type="text"
              value={formData.rentalPickupLocation || ''}
              onChange={(e) => onChange('rentalPickupLocation', e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Address or location description"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rentalDeliveryAvailable || false}
                onChange={(e) => onChange('rentalDeliveryAvailable', e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Delivery Available</span>
                <p className="text-xs text-gray-500">Offer delivery/drop-off service</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Rental Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Age</label>
            <select
              value={formData.rentalAgeRequirement || ''}
              onChange={(e) => onChange('rentalAgeRequirement', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">No minimum</option>
              {RENTAL_AGE_REQUIREMENTS.map((age) => (
                <option key={age.value} value={age.value}>{age.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rentalIdRequired ?? true}
                onChange={(e) => onChange('rentalIdRequired', e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">ID Required</span>
                <p className="text-xs text-gray-500">Valid ID needed to rent</p>
              </div>
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rentalInsuranceRequired || false}
                onChange={(e) => onChange('rentalInsuranceRequired', e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Insurance Required</span>
                <p className="text-xs text-gray-500">Renters must have insurance</p>
              </div>
            </label>
          </div>
        </div>

        {formData.rentalInsuranceRequired && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Options</label>
            <textarea
              value={formData.rentalInsuranceOptions || ''}
              onChange={(e) => onChange('rentalInsuranceOptions', e.target.value)}
              disabled={disabled}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Describe available insurance options..."
            />
          </div>
        )}
      </div>

      {/* What's Included */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">What's Included</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_RENTAL_INCLUDES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleArrayAdd('rentalIncludes', item)}
              disabled={disabled || (formData.rentalIncludes || []).includes(item)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                (formData.rentalIncludes || []).includes(item)
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
              } disabled:opacity-50`}
            >
              + {item}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input
            id="custom-rental-include"
            type="text"
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Add custom item..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomAdd('rentalIncludes', 'custom-rental-include'))}
          />
          <button
            type="button"
            onClick={() => handleCustomAdd('rentalIncludes', 'custom-rental-include')}
            disabled={disabled}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {(formData.rentalIncludes || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(formData.rentalIncludes || []).map((item: string) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
                <button
                  type="button"
                  onClick={() => handleArrayRemove('rentalIncludes', item)}
                  disabled={disabled}
                  className="ml-1 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* What's Not Included */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Not Included</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_RENTAL_EXCLUDES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleArrayAdd('rentalExcludes', item)}
              disabled={disabled || (formData.rentalExcludes || []).includes(item)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                (formData.rentalExcludes || []).includes(item)
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
              } disabled:opacity-50`}
            >
              + {item}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input
            id="custom-rental-exclude"
            type="text"
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Add custom item..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomAdd('rentalExcludes', 'custom-rental-exclude'))}
          />
          <button
            type="button"
            onClick={() => handleCustomAdd('rentalExcludes', 'custom-rental-exclude')}
            disabled={disabled}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {(formData.rentalExcludes || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(formData.rentalExcludes || []).map((item: string) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {item}
                <button
                  type="button"
                  onClick={() => handleArrayRemove('rentalExcludes', item)}
                  disabled={disabled}
                  className="ml-1 hover:text-red-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Availability & Conditions */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Availability & Conditions</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability Schedule</label>
            <textarea
              value={formData.rentalAvailability || ''}
              onChange={(e) => onChange('rentalAvailability', e.target.value)}
              disabled={disabled}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="e.g., Monday-Friday: 9am-6pm, Weekends: By appointment only"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              value={formData.rentalConditions || ''}
              onChange={(e) => onChange('rentalConditions', e.target.value)}
              disabled={disabled}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Enter rental terms and conditions..."
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Additional Notes</h3>
        <textarea
          value={formData.rentalNotes || ''}
          onChange={(e) => onChange('rentalNotes', e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="Any additional information for renters..."
        />
      </div>
    </div>
  );
}
