'use client';

import React from 'react';
import {
  Car,
  Gauge,
  Calendar,
  Fuel,
  Settings,
  Palette,
  Check,
  FileText,
  Shield,
  Key,
  Info,
} from 'lucide-react';

interface VehicleDetailsProps {
  product: {
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    vehicleMileage?: number;
    vehicleVIN?: string;
    vehicleCondition?: string;
    vehicleTransmission?: string;
    vehicleFuelType?: string;
    vehicleBodyType?: string;
    vehicleExteriorColor?: string;
    vehicleInteriorColor?: string;
    vehicleDrivetrain?: string;
    vehicleEngine?: string;
    vehicleFeatures?: string[];
    vehicleHistory?: string;
    vehicleWarranty?: string;
    vehicleTestDriveAvailable?: boolean;
  };
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  used: 'Used',
  certified_preowned: 'Certified Pre-Owned',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  automatic: 'Automatic',
  manual: 'Manual',
  cvt: 'CVT',
};

const FUEL_TYPE_LABELS: Record<string, string> = {
  petrol: 'Petrol/Gasoline',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
  plugin_hybrid: 'Plug-in Hybrid',
};

const BODY_TYPE_LABELS: Record<string, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  truck: 'Truck',
  coupe: 'Coupe',
  hatchback: 'Hatchback',
  van: 'Van',
  wagon: 'Wagon',
  convertible: 'Convertible',
};

const DRIVETRAIN_LABELS: Record<string, string> = {
  fwd: 'Front-Wheel Drive',
  rwd: 'Rear-Wheel Drive',
  awd: 'All-Wheel Drive',
  '4wd': 'Four-Wheel Drive',
};

export function VehicleDetails({ product }: VehicleDetailsProps) {
  const {
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleMileage,
    vehicleVIN,
    vehicleCondition,
    vehicleTransmission,
    vehicleFuelType,
    vehicleBodyType,
    vehicleExteriorColor,
    vehicleInteriorColor,
    vehicleDrivetrain,
    vehicleEngine,
    vehicleFeatures,
    vehicleHistory,
    vehicleWarranty,
    vehicleTestDriveAvailable,
  } = product;

  // Format number with commas
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return null;
    return num.toLocaleString();
  };

  // Check if we have any data to display
  const hasBasicInfo = vehicleMake || vehicleModel || vehicleYear;
  const hasVehicleSpecs =
    vehicleCondition ||
    vehicleTransmission ||
    vehicleFuelType ||
    vehicleBodyType ||
    vehicleDrivetrain ||
    vehicleEngine;
  const hasColors = vehicleExteriorColor || vehicleInteriorColor;
  const hasFeatures = vehicleFeatures && vehicleFeatures.length > 0;

  if (
    !hasBasicInfo &&
    !hasVehicleSpecs &&
    !hasColors &&
    !vehicleVIN &&
    !hasFeatures &&
    !vehicleHistory &&
    !vehicleWarranty
  ) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      {(hasBasicInfo || vehicleMileage !== undefined) && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          {vehicleYear && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">{vehicleYear}</span>
            </div>
          )}
          {vehicleYear && vehicleMake && <div className="w-px h-6 bg-purple-300" />}
          {vehicleMake && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-900">{vehicleMake}</span>
            </div>
          )}
          {vehicleMake && vehicleModel && <div className="w-px h-6 bg-purple-300" />}
          {vehicleModel && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-900">{vehicleModel}</span>
            </div>
          )}
          {(vehicleYear || vehicleMake || vehicleModel) && vehicleMileage !== undefined && (
            <div className="w-px h-6 bg-purple-300" />
          )}
          {vehicleMileage !== undefined && (
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">
                {formatNumber(vehicleMileage)}
              </span>
              <span className="text-purple-700 text-sm">miles</span>
            </div>
          )}
        </div>
      )}

      {/* Vehicle Specifications Card */}
      {hasVehicleSpecs && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-600" />
              Vehicle Specifications
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vehicleCondition && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Condition</p>
                  <p className="font-medium text-gray-900">
                    {CONDITION_LABELS[vehicleCondition] || vehicleCondition}
                  </p>
                </div>
              )}
              {vehicleBodyType && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Body Type</p>
                  <p className="font-medium text-gray-900">
                    {BODY_TYPE_LABELS[vehicleBodyType] || vehicleBodyType}
                  </p>
                </div>
              )}
              {vehicleTransmission && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Settings className="w-4 h-4" />
                    Transmission
                  </p>
                  <p className="font-medium text-gray-900">
                    {TRANSMISSION_LABELS[vehicleTransmission] || vehicleTransmission}
                  </p>
                </div>
              )}
              {vehicleFuelType && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    Fuel Type
                  </p>
                  <p className="font-medium text-gray-900">
                    {FUEL_TYPE_LABELS[vehicleFuelType] || vehicleFuelType}
                  </p>
                </div>
              )}
              {vehicleDrivetrain && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Drivetrain</p>
                  <p className="font-medium text-gray-900">
                    {DRIVETRAIN_LABELS[vehicleDrivetrain] || vehicleDrivetrain}
                  </p>
                </div>
              )}
              {vehicleEngine && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Engine</p>
                  <p className="font-medium text-gray-900">{vehicleEngine}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Colors */}
      {hasColors && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-600" />
              Colors
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {vehicleExteriorColor && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Exterior</p>
                  <p className="font-medium text-gray-900">{vehicleExteriorColor}</p>
                </div>
              )}
              {vehicleInteriorColor && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Interior</p>
                  <p className="font-medium text-gray-900">{vehicleInteriorColor}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIN */}
      {vehicleVIN && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-600" />
              Vehicle Identification
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">VIN</p>
            <p className="font-mono font-medium text-gray-900 text-lg tracking-wider">
              {vehicleVIN}
            </p>
          </div>
        </div>
      )}

      {/* Features */}
      {hasFeatures && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Features & Options</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {vehicleFeatures?.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100"
                >
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-purple-900">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle History */}
      {vehicleHistory && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Vehicle History
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 whitespace-pre-wrap">{vehicleHistory}</p>
          </div>
        </div>
      )}

      {/* Warranty */}
      {vehicleWarranty && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              Warranty
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700">{vehicleWarranty}</p>
          </div>
        </div>
      )}

      {/* Test Drive Available */}
      {vehicleTestDriveAvailable && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <Car className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-900">Test Drive Available</p>
            <p className="text-sm text-green-700">
              Schedule a test drive to experience this vehicle in person
            </p>
          </div>
        </div>
      )}

      {/* Certified Pre-Owned Badge */}
      {vehicleCondition === 'certified_preowned' && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Certified Pre-Owned</p>
            <p className="text-sm text-blue-700">
              This vehicle has passed a rigorous inspection and comes with extended coverage
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
