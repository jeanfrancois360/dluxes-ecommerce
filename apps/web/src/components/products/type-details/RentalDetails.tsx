'use client';

import React from 'react';
import {
  Clock,
  MapPin,
  Truck,
  Shield,
  CreditCard,
  Calendar,
  AlertCircle,
  Check,
  X,
  FileText,
  User,
  Info,
} from 'lucide-react';

interface RentalDetailsProps {
  product: {
    rentalPeriodType?: string;
    rentalMinPeriod?: number;
    rentalMaxPeriod?: number;
    rentalPriceHourly?: number;
    rentalPriceDaily?: number;
    rentalPriceWeekly?: number;
    rentalPriceMonthly?: number;
    rentalSecurityDeposit?: number;
    rentalPickupLocation?: string;
    rentalDeliveryAvailable?: boolean;
    rentalDeliveryFee?: number;
    rentalLateReturnFee?: number;
    rentalConditions?: string;
    rentalAvailability?: string;
    rentalInsuranceRequired?: boolean;
    rentalInsuranceOptions?: string;
    rentalAgeRequirement?: number;
    rentalIdRequired?: boolean;
    rentalIncludes?: string[];
    rentalExcludes?: string[];
    rentalNotes?: string;
  };
}

const PERIOD_TYPE_LABELS: Record<string, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function RentalDetails({ product }: RentalDetailsProps) {
  const {
    rentalPeriodType,
    rentalMinPeriod,
    rentalMaxPeriod,
    rentalPriceHourly,
    rentalPriceDaily,
    rentalPriceWeekly,
    rentalPriceMonthly,
    rentalSecurityDeposit,
    rentalPickupLocation,
    rentalDeliveryAvailable,
    rentalDeliveryFee,
    rentalLateReturnFee,
    rentalConditions,
    rentalAvailability,
    rentalInsuranceRequired,
    rentalInsuranceOptions,
    rentalAgeRequirement,
    rentalIdRequired,
    rentalIncludes,
    rentalExcludes,
    rentalNotes,
  } = product;

  // Format currency
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Check if we have any data to display
  const hasPricing = rentalPriceHourly || rentalPriceDaily || rentalPriceWeekly || rentalPriceMonthly;
  const hasPeriodInfo = rentalPeriodType || rentalMinPeriod || rentalMaxPeriod;
  const hasPickupDelivery = rentalPickupLocation || rentalDeliveryAvailable;
  const hasRequirements = rentalAgeRequirement || rentalIdRequired || rentalInsuranceRequired;
  const hasIncludesExcludes = rentalIncludes?.length || rentalExcludes?.length;

  if (!hasPricing && !hasPeriodInfo && !hasPickupDelivery && !hasRequirements && !hasIncludesExcludes && !rentalConditions && !rentalNotes) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Rental Period Banner */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="font-semibold text-orange-900">Rental Item</p>
          <p className="text-sm text-orange-700">
            {rentalPeriodType ? `${PERIOD_TYPE_LABELS[rentalPeriodType] || rentalPeriodType} rental` : 'Flexible rental periods available'}
            {rentalMinPeriod && rentalMaxPeriod && ` • ${rentalMinPeriod}-${rentalMaxPeriod} ${rentalPeriodType || 'periods'}`}
            {rentalMinPeriod && !rentalMaxPeriod && ` • Minimum ${rentalMinPeriod} ${rentalPeriodType || 'periods'}`}
          </p>
        </div>
      </div>

      {/* Pricing Grid */}
      {hasPricing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              Rental Rates
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rentalPriceHourly && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Hourly</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(rentalPriceHourly)}</p>
                  <p className="text-xs text-gray-500">per hour</p>
                </div>
              )}
              {rentalPriceDaily && (
                <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <p className="text-sm text-orange-600 mb-1 font-medium">Daily</p>
                  <p className="text-2xl font-bold text-orange-700">{formatPrice(rentalPriceDaily)}</p>
                  <p className="text-xs text-orange-600">per day</p>
                </div>
              )}
              {rentalPriceWeekly && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Weekly</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(rentalPriceWeekly)}</p>
                  <p className="text-xs text-gray-500">per week</p>
                </div>
              )}
              {rentalPriceMonthly && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Monthly</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(rentalPriceMonthly)}</p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              )}
            </div>

            {/* Deposit & Fees */}
            {(rentalSecurityDeposit || rentalLateReturnFee) && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4">
                {rentalSecurityDeposit && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-semibold text-gray-900">{formatPrice(rentalSecurityDeposit)}</span>
                    <span className="text-gray-500">(refundable)</span>
                  </div>
                )}
                {rentalLateReturnFee && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-gray-600">Late Return Fee:</span>
                    <span className="font-semibold text-red-600">{formatPrice(rentalLateReturnFee)}</span>
                    <span className="text-gray-500">per period</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pickup & Delivery */}
      {hasPickupDelivery && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              Pickup & Delivery
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rentalPickupLocation && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
                  <p className="font-medium text-gray-900 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    {rentalPickupLocation}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivery</p>
                {rentalDeliveryAvailable ? (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">Delivery Available</span>
                    {rentalDeliveryFee !== undefined && (
                      <span className="text-gray-600">
                        ({rentalDeliveryFee === 0 ? 'Free' : formatPrice(rentalDeliveryFee)})
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="font-medium text-gray-600">Pickup Only</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirements */}
      {hasRequirements && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Renter Requirements
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rentalAgeRequirement && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-amber-700">{rentalAgeRequirement}+</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Minimum Age</p>
                    <p className="text-sm text-gray-500">{rentalAgeRequirement} years old</p>
                  </div>
                </div>
              )}
              {rentalIdRequired && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Valid ID</p>
                    <p className="text-sm text-gray-500">Required at pickup</p>
                  </div>
                </div>
              )}
              {rentalInsuranceRequired && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Insurance</p>
                    <p className="text-sm text-gray-500">Required</p>
                  </div>
                </div>
              )}
            </div>
            {rentalInsuranceRequired && rentalInsuranceOptions && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-800 mb-2">Insurance Options:</p>
                <pre className="whitespace-pre-wrap text-purple-700 font-sans text-sm">
                  {rentalInsuranceOptions}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability */}
      {rentalAvailability && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              Availability
            </h3>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
              {rentalAvailability}
            </pre>
          </div>
        </div>
      )}

      {/* What's Included / Excluded */}
      {hasIncludesExcludes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rentalIncludes && rentalIncludes.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Included in Rental
              </h4>
              <ul className="space-y-2">
                {rentalIncludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rentalExcludes && rentalExcludes.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <X className="w-5 h-5" />
                Not Included
              </h4>
              <ul className="space-y-2">
                {rentalExcludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                    <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Terms & Conditions */}
      {rentalConditions && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Rental Terms & Conditions
            </h3>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
              {rentalConditions}
            </pre>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {rentalNotes && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Additional Information
            </h3>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
              {rentalNotes}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
