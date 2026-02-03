'use client';

import React, { useState } from 'react';
import { Home, MapPin, Car, Ruler, Calendar } from 'lucide-react';
import {
  ProductTypeFieldsProps,
  PROPERTY_TYPES,
  REAL_ESTATE_AMENITIES,
} from './types';

export function RealEstateFields({
  formData,
  onChange,
  errors = {},
  disabled = false,
}: ProductTypeFieldsProps) {
  // Local state for amenities selection
  const [amenities, setAmenities] = useState<string[]>(
    formData.amenities || []
  );

  const handleAmenityToggle = (amenity: string) => {
    const updated = amenities.includes(amenity)
      ? amenities.filter((a) => a !== amenity)
      : [...amenities, amenity];
    setAmenities(updated);
    onChange('amenities', updated);
  };

  return (
    <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
      <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
        <Home className="h-5 w-5" />
        Property Details
      </h2>

      {/* Row 1: Property Type, Bedrooms, Bathrooms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type
          </label>
          <select
            value={formData.propertyType || ''}
            onChange={(e) => onChange('propertyType', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select type...</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.propertyType && (
            <p className="text-sm text-red-500 mt-1">{errors.propertyType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bedrooms
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.bedrooms ?? ''}
            onChange={(e) =>
              onChange(
                'bedrooms',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="e.g., 3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bathrooms
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.5"
            value={formData.bathrooms ?? ''}
            onChange={(e) =>
              onChange(
                'bathrooms',
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="e.g., 2.5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Row 2: Square Feet, Lot Size, Year Built, Parking */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Ruler className="inline h-4 w-4 mr-1" />
            Square Feet
          </label>
          <input
            type="number"
            min="0"
            value={formData.squareFeet ?? ''}
            onChange={(e) =>
              onChange(
                'squareFeet',
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="e.g., 1500"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lot Size (sqft)
          </label>
          <input
            type="number"
            min="0"
            value={formData.lotSize ?? ''}
            onChange={(e) =>
              onChange(
                'lotSize',
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="e.g., 5000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Year Built
          </label>
          <input
            type="number"
            min="1800"
            max={new Date().getFullYear() + 5}
            value={formData.yearBuilt ?? ''}
            onChange={(e) =>
              onChange(
                'yearBuilt',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="e.g., 2020"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Car className="inline h-4 w-4 mr-1" />
            Parking Spaces
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.parkingSpaces ?? ''}
            onChange={(e) =>
              onChange(
                'parkingSpaces',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="e.g., 2"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Row 3: Property Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline h-4 w-4 mr-1" />
          Property Location
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            value={formData.propertyAddress ?? ''}
            onChange={(e) => onChange('propertyAddress', e.target.value)}
            disabled={disabled}
            placeholder="Street Address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <input
            type="text"
            value={formData.propertyCity ?? ''}
            onChange={(e) => onChange('propertyCity', e.target.value)}
            disabled={disabled}
            placeholder="City"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <input
            type="text"
            value={formData.propertyState ?? ''}
            onChange={(e) => onChange('propertyState', e.target.value)}
            disabled={disabled}
            placeholder="State/Province"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <input
            type="text"
            value={formData.propertyZipCode ?? ''}
            onChange={(e) => onChange('propertyZipCode', e.target.value)}
            disabled={disabled}
            placeholder="ZIP/Postal Code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Row 4: Country and Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          value={formData.propertyCountry ?? ''}
          onChange={(e) => onChange('propertyCountry', e.target.value)}
          disabled={disabled}
          placeholder="Country"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <input
          type="number"
          step="0.0000001"
          value={formData.propertyLatitude ?? ''}
          onChange={(e) =>
            onChange(
              'propertyLatitude',
              e.target.value ? parseFloat(e.target.value) : undefined
            )
          }
          disabled={disabled}
          placeholder="Latitude (optional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <input
          type="number"
          step="0.0000001"
          value={formData.propertyLongitude ?? ''}
          onChange={(e) =>
            onChange(
              'propertyLongitude',
              e.target.value ? parseFloat(e.target.value) : undefined
            )
          }
          disabled={disabled}
          placeholder="Longitude (optional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* Row 5: Virtual Tour URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Virtual Tour URL
        </label>
        <input
          type="url"
          value={formData.virtualTourUrl ?? ''}
          onChange={(e) => onChange('virtualTourUrl', e.target.value)}
          disabled={disabled}
          placeholder="https://..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Link to a virtual tour, 3D walkthrough, or video tour
        </p>
      </div>

      {/* Row 6: Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amenities
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {REAL_ESTATE_AMENITIES.map((amenity) => (
            <label
              key={amenity}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                amenities.includes(amenity)
                  ? 'bg-blue-100 border-blue-500 border-2'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() => !disabled && handleAmenityToggle(amenity)}
                disabled={disabled}
                className="sr-only"
              />
              <span className="text-sm">{amenity}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Selected: {amenities.length} amenities
        </p>
      </div>
    </div>
  );
}
