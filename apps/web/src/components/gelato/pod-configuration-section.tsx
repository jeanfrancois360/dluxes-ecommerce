'use client';

import Link from 'next/link';
import {
  Package,
  Printer,
  Check,
  AlertTriangle,
  ArrowRight,
  Info,
  Image as ImageIcon,
  Percent,
} from 'lucide-react';
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
  /** Explicitly passed — true/false when resolved, undefined while loading */
  isGelatoConfigured?: boolean;
  gelatoAccountName?: string | null;
  // Legacy props kept for backward compat (admin form)
  isGelatoAvailable?: boolean;
  storeSelected?: boolean;
}

const GOLD = '#CBB57B';
const GOLD_DARK = '#A08840';

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
      style={{ backgroundColor: GOLD }}
    >
      {n}
    </span>
  );
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
  isGelatoConfigured,
  gelatoAccountName,
  isGelatoAvailable = true,
}: PodConfigurationSectionProps) {
  const isPod = fulfillmentType === 'GELATO_POD';
  const hasProductImages = productImages.length > 0;
  const gelatoReady = isGelatoConfigured !== undefined ? isGelatoConfigured : isGelatoAvailable;
  const isLoading = isGelatoConfigured === undefined;

  return (
    <div className="space-y-4">
      {/* ── Fulfillment type selector ── */}
      <div role="radiogroup" aria-label="Fulfillment type" className="grid grid-cols-2 gap-3">
        {/* Self-Fulfilled */}
        <button
          type="button"
          role="radio"
          aria-checked={!isPod}
          onClick={() => onChange('fulfillmentType', 'SELF_FULFILLED')}
          disabled={disabled}
          className={`relative text-left rounded-xl border-2 p-5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group ${
            !isPod
              ? 'border-[#CBB57B] bg-[#CBB57B]/5 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ ['--tw-ring-color' as any]: GOLD }}
        >
          {!isPod ? null : null}
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
              !isPod ? 'bg-[#CBB57B]/20' : 'bg-gray-100 group-hover:bg-gray-200'
            }`}
          >
            <Package
              className={`w-4.5 h-4.5 ${!isPod ? 'text-[#A08840]' : 'text-gray-500'}`}
              size={18}
            />
          </div>

          <p
            className={`text-sm font-semibold leading-tight ${!isPod ? 'text-gray-900' : 'text-gray-700'}`}
          >
            Self-Fulfilled
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            You package and ship from your own inventory.
          </p>

          {/* Selected indicator */}
          {!isPod && (
            <span
              aria-hidden="true"
              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: GOLD }}
            >
              <Check size={11} strokeWidth={3} className="text-white" />
            </span>
          )}
        </button>

        {/* Gelato POD */}
        {gelatoReady ? (
          <button
            type="button"
            role="radio"
            aria-checked={isPod}
            onClick={() => onChange('fulfillmentType', 'GELATO_POD')}
            disabled={disabled}
            className={`relative text-left rounded-xl border-2 p-5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group ${
              isPod
                ? 'border-[#CBB57B] bg-[#CBB57B]/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ ['--tw-ring-color' as any]: GOLD }}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                isPod ? 'bg-[#CBB57B]/20' : 'bg-gray-100 group-hover:bg-gray-200'
              }`}
            >
              <Printer className={`${isPod ? 'text-[#A08840]' : 'text-gray-500'}`} size={18} />
            </div>

            <p
              className={`text-sm font-semibold leading-tight ${isPod ? 'text-gray-900' : 'text-gray-700'}`}
            >
              Gelato POD
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {gelatoAccountName
                ? `${gelatoAccountName} · Gelato prints & ships globally.`
                : 'Gelato prints & ships directly to your customers worldwide.'}
            </p>

            {/* Selected indicator */}
            {isPod && (
              <span
                aria-hidden="true"
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: GOLD }}
              >
                <Check size={11} strokeWidth={3} className="text-white" />
              </span>
            )}

            {/* Connected badge */}
            {!isPod && !isLoading && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Connected
              </span>
            )}

            {/* Loading skeleton for badge */}
            {!isPod && isLoading && (
              <span className="absolute top-3 right-3 w-16 h-4 rounded-full bg-gray-200 animate-pulse" />
            )}
          </button>
        ) : (
          /* Not configured — link card instead of button */
          <Link
            href="/seller/gelato-settings"
            className="relative text-left rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-5 transition-all duration-150 hover:bg-amber-50 hover:border-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 group block"
          >
            {/* Loading skeleton */}
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-200 mb-3" />
                <div className="h-3.5 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-200 rounded mt-1" />
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                  <Printer className="text-amber-600" size={18} />
                </div>

                <p className="text-sm font-semibold text-gray-700 leading-tight">Gelato POD</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Connect your Gelato account to unlock print-on-demand.
                </p>

                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:text-amber-800 transition-colors">
                  Set up Gelato
                  <ArrowRight size={12} />
                </span>

                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  <AlertTriangle size={9} />
                  Setup Required
                </span>
              </>
            )}
          </Link>
        )}
      </div>

      {/* ── POD configuration steps ── */}
      {isPod && (
        <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {/* Step 1 — Base product */}
          <section className="bg-white p-5" aria-labelledby="pod-step-1-label">
            <div className="flex items-start gap-3 mb-4">
              <StepNumber n={1} />
              <div>
                <p
                  id="pod-step-1-label"
                  className="text-sm font-semibold text-gray-900 leading-tight"
                >
                  Choose base product <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select from Gelato's catalog — t-shirts, mugs, posters, and more.
                </p>
              </div>
            </div>
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
          </section>

          {/* Step 2 — Design file */}
          <section className="bg-white p-5" aria-labelledby="pod-step-2-label">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <StepNumber n={2} />
                <div>
                  <p
                    id="pod-step-2-label"
                    className="text-sm font-semibold text-gray-900 leading-tight"
                  >
                    Upload design file{' '}
                    <span className="text-xs font-normal text-gray-400">(optional)</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Print-ready artwork sent to Gelato for production (PNG, PDF, TIFF — max 50 MB).
                  </p>
                </div>
              </div>
              {hasProductImages && !designFileUrl && (
                <button
                  type="button"
                  onClick={() => onChange('designFileUrl', productImages[0])}
                  disabled={disabled}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 rounded"
                  style={{ color: GOLD }}
                >
                  <ImageIcon size={13} />
                  Use product image
                </button>
              )}
            </div>
            <DesignUploader
              value={designFileUrl}
              onChange={(url) => onChange('designFileUrl', url)}
              disabled={disabled}
            />
          </section>

          {/* Step 3 — Markup */}
          <section className="bg-white p-5" aria-labelledby="pod-step-3-label">
            <div className="flex items-start gap-3 mb-4">
              <StepNumber n={3} />
              <div>
                <p
                  id="pod-step-3-label"
                  className="text-sm font-semibold text-gray-900 leading-tight"
                >
                  Set your markup
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your margin on top of Gelato's production cost. Gelato ships directly to customers
                  — factor shipping into your price.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-40">
                <input
                  id="gelato-markup"
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
                  aria-label="Markup percentage"
                  placeholder="e.g. 30"
                  className="w-full pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:opacity-60"
                />
                <Percent
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              {gelatoMarkupPercent != null && gelatoMarkupPercent > 0 && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg">
                  +{gelatoMarkupPercent}% margin
                </span>
              )}
              {(!gelatoMarkupPercent || gelatoMarkupPercent === 0) && (
                <span className="text-xs text-gray-400">Platform default applies</span>
              )}
            </div>
          </section>

          {/* Info footer */}
          <div className="bg-gray-50 px-5 py-3.5 flex items-start gap-2.5">
            <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Orders go to Gelato automatically after payment. No inventory or shipping required on
              your end.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
