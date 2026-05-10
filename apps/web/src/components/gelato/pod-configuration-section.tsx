'use client';

import Link from 'next/link';
import { GelatoProductSelector } from './gelato-product-selector';
import { DesignUploader } from './design-uploader';
import { GelatoProduct } from '@/lib/api/gelato';

interface PodConfigurationSectionProps {
  fulfillmentType: string;
  gelatoProductUid: string;
  designFileUrl: string;
  gelatoMarkupPercent?: number;
  productImages?: string[];
  onChange: (field: string, value: any) => void;
  onGelatoProductSelect?: (productDetails: GelatoProduct) => void;
  disabled?: boolean;
  isGelatoAvailable?: boolean;
  storeSelected?: boolean;
  isGelatoConfigured?: boolean; // Whether the seller has set up Gelato credentials
  gelatoAccountName?: string | null; // Gelato account name if connected
}

export function PodConfigurationSection({
  fulfillmentType,
  gelatoProductUid,
  designFileUrl,
  gelatoMarkupPercent,
  productImages = [],
  onChange,
  onGelatoProductSelect,
  disabled,
  isGelatoAvailable = true,
  storeSelected = true,
  isGelatoConfigured,
  gelatoAccountName,
}: PodConfigurationSectionProps) {
  const isPod = fulfillmentType === 'GELATO_POD';
  const hasProductImages = productImages.length > 0;
  // If isGelatoConfigured is explicitly passed, use it; otherwise fall back to isGelatoAvailable
  const gelatoReady = isGelatoConfigured !== undefined ? isGelatoConfigured : isGelatoAvailable;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Print-on-Demand (POD)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure Gelato fulfillment for print-on-demand products
        </p>

        {/* Dynamic status banner */}
        {isGelatoConfigured === true ? (
          <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg
              className="w-4 h-4 text-green-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-green-700">
              <strong>Gelato connected</strong>
              {gelatoAccountName ? ` · ${gelatoAccountName}` : ''} — POD products will be printed &
              shipped by Gelato automatically.
            </p>
          </div>
        ) : isGelatoConfigured === false ? (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <svg
              className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-amber-800">
              <strong>Gelato not set up.</strong> Connect your Gelato account to enable
              Print-on-Demand.{' '}
              <Link
                href="/seller/gelato-settings"
                className="underline font-semibold hover:text-amber-900"
              >
                Set up now →
              </Link>
            </p>
          </div>
        ) : (
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
              <strong>Seller-managed fulfillment:</strong> POD products use your own Gelato account
              for order processing and global shipping.{' '}
              <Link href="/seller/gelato-settings" className="underline font-semibold">
                Configure in Seller Settings →
              </Link>
            </p>
          </div>
        )}
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
            onClick={() => gelatoReady && onChange('fulfillmentType', 'GELATO_POD')}
            disabled={disabled || !gelatoReady}
            className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              isPod
                ? 'border-[#CBB57B] bg-amber-50 text-gray-900'
                : !gelatoReady
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
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
              {isGelatoConfigured === true && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                  ● Connected
                </span>
              )}
              {isGelatoConfigured === false && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                  ⚠ Setup Required
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-normal">
              {isGelatoConfigured === false
                ? 'Not configured — set up first'
                : 'Printed & shipped by Gelato'}
            </p>
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
              onChange={(uid, name, productDetails) => {
                onChange('gelatoProductUid', uid);
                if (productDetails && onGelatoProductSelect) {
                  onGelatoProductSelect(productDetails);
                }
              }}
              disabled={disabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Select the base product from Gelato's catalog (e.g. unisex t-shirt, mug, poster)
            </p>
          </div>

          {/* Design File */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Design File <span className="text-gray-400 text-xs font-normal">(Optional)</span>
              </label>
              {hasProductImages && !designFileUrl && (
                <button
                  type="button"
                  onClick={() => onChange('designFileUrl', productImages[0])}
                  disabled={disabled}
                  className="text-xs text-[#CBB57B] hover:text-[#B89F63] font-medium flex items-center gap-1 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Use Product Image
                </button>
              )}
            </div>
            <DesignUploader
              value={designFileUrl}
              onChange={(url) => onChange('designFileUrl', url)}
              disabled={disabled}
            />
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-500">
                Upload a print-ready design file for Gelato production, or leave empty for plain
                products.
              </p>
              <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs">
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
                <div className="text-blue-700">
                  <strong>Tip:</strong> Product images are for display on your store. Design files
                  are sent to Gelato for printing.
                  {hasProductImages && (
                    <>
                      {' '}
                      Click "Use Product Image" above to use your uploaded product image as the
                      design file.
                    </>
                  )}
                </div>
              </div>
            </div>
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
