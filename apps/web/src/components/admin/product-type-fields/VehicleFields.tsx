'use client';

import React, { useState } from 'react';
import { Car, Gauge, Calendar, Fuel, Settings, Palette } from 'lucide-react';
import {
  ProductTypeFieldsProps,
  VEHICLE_TRANSMISSIONS,
  VEHICLE_FUEL_TYPES,
  VEHICLE_BODY_TYPES,
  VEHICLE_CONDITIONS,
  VEHICLE_FEATURES,
} from './types';

const DRIVETRAIN_OPTIONS = [
  { value: 'fwd', label: 'Front-Wheel Drive (FWD)' },
  { value: 'rwd', label: 'Rear-Wheel Drive (RWD)' },
  { value: 'awd', label: 'All-Wheel Drive (AWD)' },
  { value: '4wd', label: 'Four-Wheel Drive (4WD)' },
];

export function VehicleFields({
  formData,
  onChange,
  errors = {},
  disabled = false,
}: ProductTypeFieldsProps) {
  // Local state for features selection
  const [features, setFeatures] = useState<string[]>(
    formData.vehicleFeatures || []
  );

  const handleFeatureToggle = (feature: string) => {
    const updated = features.includes(feature)
      ? features.filter((f) => f !== feature)
      : [...features, feature];
    setFeatures(updated);
    onChange('vehicleFeatures', updated);
  };

  return (
    <div className="bg-purple-50 rounded-lg shadow p-6 border border-purple-200">
      <h2 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
        <Car className="h-5 w-5" />
        Vehicle Details
      </h2>

      {/* Row 1: Make, Model, Year */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make *
          </label>
          <input
            type="text"
            value={formData.vehicleMake || ''}
            onChange={(e) => onChange('vehicleMake', e.target.value)}
            disabled={disabled}
            placeholder="e.g., Toyota, BMW, Ford"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
          {errors.vehicleMake && (
            <p className="text-sm text-red-500 mt-1">{errors.vehicleMake}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model *
          </label>
          <input
            type="text"
            value={formData.vehicleModel || ''}
            onChange={(e) => onChange('vehicleModel', e.target.value)}
            disabled={disabled}
            placeholder="e.g., Camry, X5, F-150"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
          {errors.vehicleModel && (
            <p className="text-sm text-red-500 mt-1">{errors.vehicleModel}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Year *
          </label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear() + 2}
            value={formData.vehicleYear ?? ''}
            onChange={(e) =>
              onChange(
                'vehicleYear',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="e.g., 2023"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Row 2: Condition, Body Type, Transmission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition
          </label>
          <select
            value={formData.vehicleCondition || ''}
            onChange={(e) => onChange('vehicleCondition', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select condition...</option>
            {VEHICLE_CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>
                {cond.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Body Type
          </label>
          <select
            value={formData.vehicleBodyType || ''}
            onChange={(e) => onChange('vehicleBodyType', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select body type...</option>
            {VEHICLE_BODY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Settings className="inline h-4 w-4 mr-1" />
            Transmission
          </label>
          <select
            value={formData.vehicleTransmission || ''}
            onChange={(e) => onChange('vehicleTransmission', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select transmission...</option>
            {VEHICLE_TRANSMISSIONS.map((trans) => (
              <option key={trans.value} value={trans.value}>
                {trans.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Mileage, Fuel Type, Drivetrain */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Gauge className="inline h-4 w-4 mr-1" />
            Mileage
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={formData.vehicleMileage ?? ''}
              onChange={(e) =>
                onChange(
                  'vehicleMileage',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              disabled={disabled}
              placeholder="e.g., 25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            />
            <span className="absolute right-3 top-2 text-gray-500 text-sm">
              miles
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Fuel className="inline h-4 w-4 mr-1" />
            Fuel Type
          </label>
          <select
            value={formData.vehicleFuelType || ''}
            onChange={(e) => onChange('vehicleFuelType', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select fuel type...</option>
            {VEHICLE_FUEL_TYPES.map((fuel) => (
              <option key={fuel.value} value={fuel.value}>
                {fuel.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Drivetrain
          </label>
          <select
            value={formData.vehicleDrivetrain || ''}
            onChange={(e) => onChange('vehicleDrivetrain', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select drivetrain...</option>
            {DRIVETRAIN_OPTIONS.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: Colors and Engine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Palette className="inline h-4 w-4 mr-1" />
            Exterior Color
          </label>
          <input
            type="text"
            value={formData.vehicleExteriorColor || ''}
            onChange={(e) => onChange('vehicleExteriorColor', e.target.value)}
            disabled={disabled}
            placeholder="e.g., Pearl White"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interior Color
          </label>
          <input
            type="text"
            value={formData.vehicleInteriorColor || ''}
            onChange={(e) => onChange('vehicleInteriorColor', e.target.value)}
            disabled={disabled}
            placeholder="e.g., Black Leather"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Engine
          </label>
          <input
            type="text"
            value={formData.vehicleEngine || ''}
            onChange={(e) => onChange('vehicleEngine', e.target.value)}
            disabled={disabled}
            placeholder="e.g., 2.5L 4-Cylinder"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Row 5: VIN */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          VIN (Vehicle Identification Number)
        </label>
        <input
          type="text"
          value={formData.vehicleVIN || ''}
          onChange={(e) => onChange('vehicleVIN', e.target.value.toUpperCase())}
          disabled={disabled}
          placeholder="e.g., 1HGBH41JXMN109186"
          maxLength={17}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 uppercase"
        />
        <p className="text-xs text-gray-500 mt-1">
          17-character unique vehicle identifier
        </p>
      </div>

      {/* Row 6: Vehicle History */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vehicle History
        </label>
        <textarea
          value={formData.vehicleHistory || ''}
          onChange={(e) => onChange('vehicleHistory', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Enter vehicle history details (accidents, service records, previous owners, etc.)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 resize-none"
        />
      </div>

      {/* Row 7: Warranty */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Warranty Information
        </label>
        <input
          type="text"
          value={formData.vehicleWarranty || ''}
          onChange={(e) => onChange('vehicleWarranty', e.target.value)}
          disabled={disabled}
          placeholder="e.g., Remaining factory warranty until 2025"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* Row 8: Test Drive Available */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.vehicleTestDriveAvailable ?? true}
            onChange={(e) =>
              onChange('vehicleTestDriveAvailable', e.target.checked)
            }
            disabled={disabled}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Test Drive Available
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Allow customers to schedule a test drive
        </p>
      </div>

      {/* Row 9: Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Features & Options
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {VEHICLE_FEATURES.map((feature) => (
            <label
              key={feature}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                features.includes(feature)
                  ? 'bg-purple-100 border-purple-500 border-2'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={features.includes(feature)}
                onChange={() => !disabled && handleFeatureToggle(feature)}
                disabled={disabled}
                className="sr-only"
              />
              <span className="text-sm">{feature}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Selected: {features.length} features
        </p>
      </div>
    </div>
  );
}
