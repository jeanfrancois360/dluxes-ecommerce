'use client';

import React from 'react';
import {
  Home,
  Bed,
  Bath,
  Ruler,
  Calendar,
  Car,
  MapPin,
  Play,
  Check,
} from 'lucide-react';

interface RealEstateDetailsProps {
  product: {
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    lotSize?: number;
    yearBuilt?: number;
    parkingSpaces?: number;
    amenities?: string[];
    propertyAddress?: string;
    propertyCity?: string;
    propertyState?: string;
    propertyCountry?: string;
    propertyZipCode?: string;
    virtualTourUrl?: string;
  };
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'House',
  apartment: 'Apartment',
  condo: 'Condo',
  townhouse: 'Townhouse',
  land: 'Land',
  commercial: 'Commercial',
};

export function RealEstateDetails({ product }: RealEstateDetailsProps) {
  const {
    propertyType,
    bedrooms,
    bathrooms,
    squareFeet,
    lotSize,
    yearBuilt,
    parkingSpaces,
    amenities,
    propertyAddress,
    propertyCity,
    propertyState,
    propertyCountry,
    propertyZipCode,
    virtualTourUrl,
  } = product;

  // Format number with commas
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return null;
    return num.toLocaleString();
  };

  // Build location string
  const buildLocationString = () => {
    const parts = [];
    if (propertyCity) parts.push(propertyCity);
    if (propertyState) parts.push(propertyState);
    if (propertyCountry) parts.push(propertyCountry);
    return parts.join(', ');
  };

  const locationString = buildLocationString();
  const hasLocation = propertyAddress || locationString || propertyZipCode;

  // Check if we have any data to display
  const hasPropertyDetails =
    propertyType ||
    bedrooms !== undefined ||
    bathrooms !== undefined ||
    squareFeet ||
    lotSize ||
    yearBuilt ||
    parkingSpaces !== undefined;

  const hasAmenities = amenities && amenities.length > 0;

  if (!hasPropertyDetails && !hasAmenities && !hasLocation && !virtualTourUrl) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      {(bedrooms !== undefined || bathrooms !== undefined || squareFeet) && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          {bedrooms !== undefined && (
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{bedrooms}</span>
              <span className="text-blue-700 text-sm">
                {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
              </span>
            </div>
          )}
          {bedrooms !== undefined && bathrooms !== undefined && (
            <div className="w-px h-6 bg-blue-300" />
          )}
          {bathrooms !== undefined && (
            <div className="flex items-center gap-2">
              <Bath className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{bathrooms}</span>
              <span className="text-blue-700 text-sm">
                {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
              </span>
            </div>
          )}
          {(bedrooms !== undefined || bathrooms !== undefined) && squareFeet && (
            <div className="w-px h-6 bg-blue-300" />
          )}
          {squareFeet && (
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {formatNumber(squareFeet)}
              </span>
              <span className="text-blue-700 text-sm">sqft</span>
            </div>
          )}
        </div>
      )}

      {/* Property Overview Card */}
      {hasPropertyDetails && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-gray-600" />
              Property Overview
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {propertyType && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Property Type</p>
                  <p className="font-medium text-gray-900">
                    {PROPERTY_TYPE_LABELS[propertyType] || propertyType}
                  </p>
                </div>
              )}
              {yearBuilt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Year Built
                  </p>
                  <p className="font-medium text-gray-900">{yearBuilt}</p>
                </div>
              )}
              {lotSize && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Lot Size</p>
                  <p className="font-medium text-gray-900">
                    {formatNumber(lotSize)} sqft
                  </p>
                </div>
              )}
              {parkingSpaces !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    Parking
                  </p>
                  <p className="font-medium text-gray-900">
                    {parkingSpaces} {parkingSpaces === 1 ? 'Space' : 'Spaces'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Amenities */}
      {hasAmenities && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenities?.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100"
                >
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-900">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location */}
      {hasLocation && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              Location
            </h3>
          </div>
          <div className="p-6">
            {propertyAddress && (
              <p className="text-gray-900 font-medium mb-1">{propertyAddress}</p>
            )}
            {(locationString || propertyZipCode) && (
              <p className="text-gray-600">
                {locationString}
                {locationString && propertyZipCode && ' '}
                {propertyZipCode}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Virtual Tour */}
      {virtualTourUrl && (
        <a
          href={virtualTourUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          <Play className="w-5 h-5" />
          Take a Virtual Tour
        </a>
      )}
    </div>
  );
}
