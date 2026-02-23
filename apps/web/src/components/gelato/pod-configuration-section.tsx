'use client';

import { GelatoProductSelector } from './gelato-product-selector';
import { DesignUploader } from './design-uploader';

interface PodConfigurationSectionProps {
  fulfillmentType: string;
  gelatoProductUid: string;
  designFileUrl: string;
  gelatoMarkupPercent?: number;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export function PodConfigurationSection({
  fulfillmentType,
  gelatoProductUid,
  designFileUrl,
  gelatoMarkupPercent,
  onChange,
  disabled,
}: PodConfigurationSectionProps) {
  const isPod = fulfillmentType === 'GELATO_POD';

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Print-on-Demand (POD)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure Gelato fulfillment for print-on-demand products
        </p>
        <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <svg
            className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-blue-700">
            <strong>Platform-managed fulfillment:</strong> POD products use the platform's Gelato
            account for seamless order processing and global shipping.
          </p>
        </div>
      </div>

      {/* Fulfillment Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fulfillment Type</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange('fulfillmentType', 'SELF_FULFILLED')}
            disabled={disabled}
            className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              !isPod
                ? 'border-[#CBB57B] bg-amber-50 text-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Self-Fulfilled
            </div>
            <p className="text-xs text-gray-400 mt-1 font-normal">Ship from your own inventory</p>
          </button>

          <button
            type="button"
            onClick={() => onChange('fulfillmentType', 'GELATO_POD')}
            disabled={disabled}
            className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              isPod
                ? 'border-[#CBB57B] bg-amber-50 text-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Gelato POD
            </div>
            <p className="text-xs text-gray-400 mt-1 font-normal">Printed & shipped by Gelato</p>
          </button>
        </div>
      </div>

      {/* POD Configuration Fields — only shown when POD is selected */}
      {isPod && (
        <div className="space-y-5 pt-2 border-t border-gray-100">
          {/* Gelato Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gelato Product <span className="text-red-500">*</span>
            </label>
            <GelatoProductSelector
              value={gelatoProductUid}
              onChange={(uid, name) => onChange('gelatoProductUid', uid)}
              disabled={disabled}
            />
            {gelatoProductUid && (
              <p className="text-xs text-gray-400 mt-1 font-mono">{gelatoProductUid}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Select the base product from Gelato's catalog (e.g. unisex t-shirt, mug, poster)
            </p>
          </div>

          {/* Design File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Design File</label>
            <DesignUploader
              value={designFileUrl}
              onChange={(url) => onChange('designFileUrl', url)}
              disabled={disabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload or link the print-ready design file that Gelato will use for production
            </p>
          </div>

          {/* Markup & Shipping row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Markup Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={gelatoMarkupPercent ?? ''}
                  onChange={(e) =>
                    onChange(
                      'gelatoMarkupPercent',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  disabled={disabled}
                  className="w-full pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                  placeholder="e.g. 30"
                />
                <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Override global markup. Leave blank to use system default.
              </p>
            </div>
          </div>

          {/* Shipping note */}
          <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <svg
              className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
              />
            </svg>
            <p className="text-sm text-amber-800">
              <span className="font-medium">Shipping note:</span> Gelato ships directly to customers
              from their global network. Include estimated Gelato shipping costs in your product
              price or markup. Platform shipping rates shown at checkout apply to non-POD items
              only.
            </p>
          </div>

          {/* Info banner */}
          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <svg
              className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-blue-700">
              When an order is placed and payment confirmed, Gelato will automatically receive the
              order and begin production if auto-submit is enabled in system settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
