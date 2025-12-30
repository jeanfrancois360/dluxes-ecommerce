'use client';

import React from 'react';
import {
  Clock,
  MapPin,
  User,
  Calendar,
  Users,
  Award,
  Check,
  X,
  AlertCircle,
  Globe,
  Video,
  FileText,
} from 'lucide-react';

interface ServiceDetailsProps {
  product: {
    serviceType?: string;
    serviceDuration?: number;
    serviceDurationUnit?: string;
    serviceLocation?: string;
    serviceArea?: string;
    serviceAvailability?: string;
    serviceBookingRequired?: boolean;
    serviceBookingLeadTime?: number;
    serviceProviderName?: string;
    serviceProviderBio?: string;
    serviceProviderImage?: string;
    serviceProviderCredentials?: string[];
    serviceMaxClients?: number;
    serviceCancellationPolicy?: string;
    serviceIncludes?: string[];
    serviceExcludes?: string[];
    serviceRequirements?: string;
  };
}

const SERVICE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  in_person: { label: 'In-Person Service', icon: <MapPin className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700' },
  online: { label: 'Online/Remote Service', icon: <Video className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700' },
  hybrid: { label: 'Hybrid (In-Person & Online)', icon: <Globe className="w-5 h-5" />, color: 'bg-teal-100 text-teal-700' },
};

const DURATION_UNIT_LABELS: Record<string, string> = {
  minutes: 'min',
  hours: 'hr',
  days: 'day',
  sessions: 'session',
};

const LEAD_TIME_LABELS: Record<number, string> = {
  0: 'No advance booking required',
  1: '1 hour in advance',
  2: '2 hours in advance',
  4: '4 hours in advance',
  24: '1 day in advance',
  48: '2 days in advance',
  72: '3 days in advance',
  168: '1 week in advance',
};

export function ServiceDetails({ product }: ServiceDetailsProps) {
  const {
    serviceType,
    serviceDuration,
    serviceDurationUnit,
    serviceLocation,
    serviceArea,
    serviceAvailability,
    serviceBookingRequired,
    serviceBookingLeadTime,
    serviceProviderName,
    serviceProviderBio,
    serviceProviderImage,
    serviceProviderCredentials,
    serviceMaxClients,
    serviceCancellationPolicy,
    serviceIncludes,
    serviceExcludes,
    serviceRequirements,
  } = product;

  // Check if we have any data to display
  const hasServiceInfo = serviceType || serviceDuration || serviceLocation || serviceArea;
  const hasBookingInfo = serviceBookingRequired !== undefined || serviceBookingLeadTime !== undefined || serviceMaxClients;
  const hasProviderInfo = serviceProviderName || serviceProviderBio || serviceProviderCredentials?.length;
  const hasIncludesExcludes = serviceIncludes?.length || serviceExcludes?.length;

  if (!hasServiceInfo && !hasBookingInfo && !hasProviderInfo && !hasIncludesExcludes && !serviceCancellationPolicy && !serviceRequirements) {
    return null;
  }

  const typeInfo = serviceType ? SERVICE_TYPE_LABELS[serviceType] : null;

  // Format duration for display
  const formatDuration = () => {
    if (!serviceDuration || !serviceDurationUnit) return null;
    const unit = DURATION_UNIT_LABELS[serviceDurationUnit] || serviceDurationUnit;
    const plural = serviceDuration > 1 && !unit.endsWith('s') ? 's' : '';
    return `${serviceDuration} ${unit}${plural}`;
  };

  return (
    <div className="space-y-6">
      {/* Service Type Banner */}
      {typeInfo && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${typeInfo.color.includes('blue') ? 'bg-blue-50 border-blue-200' : typeInfo.color.includes('purple') ? 'bg-purple-50 border-purple-200' : 'bg-teal-50 border-teal-200'}`}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${typeInfo.color}`}>
            {typeInfo.icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{typeInfo.label}</p>
            {serviceArea && (
              <p className="text-sm text-gray-600">Service Area: {serviceArea}</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Service Info Bar */}
      {hasServiceInfo && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          {formatDuration() && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span className="font-semibold text-gray-900">{formatDuration()}</span>
            </div>
          )}
          {serviceDuration && serviceLocation && <div className="w-px h-6 bg-gray-300" />}
          {serviceLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{serviceLocation}</span>
            </div>
          )}
          {(serviceDuration || serviceLocation) && serviceMaxClients && <div className="w-px h-6 bg-gray-300" />}
          {serviceMaxClients && serviceMaxClients > 1 && (
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">Up to</span>
              <span className="font-semibold text-gray-900">{serviceMaxClients} clients</span>
            </div>
          )}
        </div>
      )}

      {/* Service Provider Card */}
      {hasProviderInfo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              Service Provider
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              {serviceProviderImage && (
                <img
                  src={serviceProviderImage}
                  alt={serviceProviderName || 'Service Provider'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <div className="flex-1">
                {serviceProviderName && (
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{serviceProviderName}</h4>
                )}
                {serviceProviderBio && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{serviceProviderBio}</p>
                )}
                {serviceProviderCredentials && serviceProviderCredentials.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {serviceProviderCredentials.map((credential, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 text-sm rounded-full"
                      >
                        <Award className="w-3 h-3" />
                        {credential}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Information Card */}
      {hasBookingInfo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              Booking Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {serviceBookingRequired !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Booking Required</p>
                  <p className="font-medium text-gray-900">
                    {serviceBookingRequired ? 'Yes - Advance booking required' : 'No - Walk-ins welcome'}
                  </p>
                </div>
              )}
              {serviceBookingLeadTime !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Lead Time</p>
                  <p className="font-medium text-gray-900">
                    {LEAD_TIME_LABELS[serviceBookingLeadTime] || `${serviceBookingLeadTime} hours in advance`}
                  </p>
                </div>
              )}
              {serviceMaxClients && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Max Clients per Session</p>
                  <p className="font-medium text-gray-900">
                    {serviceMaxClients === 1 ? 'Individual session' : `Up to ${serviceMaxClients} clients`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Availability */}
      {serviceAvailability && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Availability
            </h3>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
              {serviceAvailability}
            </pre>
          </div>
        </div>
      )}

      {/* What's Included / Excluded */}
      {hasIncludesExcludes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviceIncludes && serviceIncludes.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Check className="w-5 h-5" />
                What's Included
              </h4>
              <ul className="space-y-2">
                {serviceIncludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {serviceExcludes && serviceExcludes.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <X className="w-5 h-5" />
                Not Included
              </h4>
              <ul className="space-y-2">
                {serviceExcludes.map((item, index) => (
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

      {/* Client Requirements */}
      {serviceRequirements && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Client Requirements
            </h3>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
              {serviceRequirements}
            </pre>
          </div>
        </div>
      )}

      {/* Cancellation Policy */}
      {serviceCancellationPolicy && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Cancellation Policy
            </h3>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
              {serviceCancellationPolicy}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
