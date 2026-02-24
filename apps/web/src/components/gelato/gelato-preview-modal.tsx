'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import {
  ArrowRight,
  Package,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Check,
  Zap,
} from 'lucide-react';

interface GelatoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  currentValues: {
    name: string;
    slug: string;
    description: string;
    price: number;
    image?: string;
  };
  newValues: {
    name: string;
    slug: string;
    description: string;
    price: number;
    image?: string;
  };
  productTitle: string;
}

export function GelatoPreviewModal({
  isOpen,
  onClose,
  onApply,
  currentValues,
  newValues,
  productTitle,
}: GelatoPreviewModalProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimateIn(false);
      const timer = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const changes = [
    { field: 'name', label: 'Product Name', hasChange: currentValues.name !== newValues.name },
    { field: 'slug', label: 'Slug', hasChange: currentValues.slug !== newValues.slug },
    {
      field: 'description',
      label: 'Description',
      hasChange: currentValues.description !== newValues.description,
    },
    { field: 'price', label: 'Price', hasChange: currentValues.price !== newValues.price },
  ];

  const changeCount = changes.filter((c) => c.hasChange).length;
  const hasChanges = changeCount > 0;

  const ComparisonRow = ({
    icon: Icon,
    label,
    current,
    new: newVal,
    delay = 0,
  }: {
    icon: any;
    label: string;
    current: string;
    new: string;
    delay?: number;
  }) => {
    const hasChange = current !== newVal;

    return (
      <div
        className={`space-y-3 transform transition-all duration-500 ${
          animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <div
              className={`p-1.5 rounded-lg ${hasChange ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : 'bg-gray-100'}`}
            >
              <Icon className={`h-4 w-4 ${hasChange ? 'text-emerald-600' : 'text-gray-500'}`} />
            </div>
            {label}
          </div>
          {hasChange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse">
              <Sparkles className="h-3 w-3" />
              Updated
            </span>
          )}
        </div>

        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
          {/* Current Value */}
          <div className="group bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Current
              </div>
            </div>
            <div className="text-sm text-gray-700 break-words leading-relaxed">
              {current || <span className="text-gray-400 italic">Empty</span>}
            </div>
          </div>

          {/* Animated Arrow */}
          <div className="relative">
            <ArrowRight
              className={`h-6 w-6 flex-shrink-0 transition-all duration-500 ${
                hasChange ? 'text-emerald-500 scale-110 animate-pulse' : 'text-gray-300'
              }`}
            />
            {hasChange && (
              <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-20 animate-ping"></div>
            )}
          </div>

          {/* New Value */}
          <div
            className={`group relative rounded-xl p-4 shadow-sm transition-all duration-300 ${
              hasChange
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 hover:shadow-lg hover:scale-[1.02]'
                : 'bg-white border-2 border-gray-200 hover:shadow-md hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">New</div>
              {hasChange && <Check className="h-4 w-4 text-emerald-600" />}
            </div>
            <div
              className={`text-sm break-words leading-relaxed ${
                hasChange ? 'text-emerald-900 font-semibold' : 'text-gray-700'
              }`}
            >
              {newVal || <span className="text-gray-400 italic">Empty</span>}
            </div>
            {hasChange && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-full"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent relative">
              ✨ Preview Auto-Fill from Gelato
            </DialogTitle>
          </div>
          <div className="flex items-start gap-3 mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{productTitle}</span> will populate
                your product with professional data
              </p>
              {hasChanges && (
                <p className="text-xs text-blue-700 mt-1 font-medium">
                  {changeCount} field{changeCount !== 1 ? 's' : ''} will be updated
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Product Name */}
          <ComparisonRow
            icon={Package}
            label="Product Name"
            current={currentValues.name}
            new={newValues.name}
            delay={100}
          />

          {/* Product Slug */}
          <ComparisonRow
            icon={FileText}
            label="Product Slug (URL)"
            current={currentValues.slug}
            new={newValues.slug}
            delay={200}
          />

          {/* Price */}
          <ComparisonRow
            icon={DollarSign}
            label="Price (with markup)"
            current={currentValues.price ? `$${Number(currentValues.price).toFixed(2)}` : '$0.00'}
            new={newValues.price ? `$${Number(newValues.price).toFixed(2)}` : '$0.00'}
            delay={300}
          />

          {/* Description */}
          <div
            className={`space-y-3 transform transition-all duration-500 ${
              animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <div
                  className={`p-1.5 rounded-lg ${currentValues.description !== newValues.description ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : 'bg-gray-100'}`}
                >
                  <FileText
                    className={`h-4 w-4 ${currentValues.description !== newValues.description ? 'text-emerald-600' : 'text-gray-500'}`}
                  />
                </div>
                Description
              </div>
              {currentValues.description !== newValues.description && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  Updated
                </span>
              )}
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start">
              {/* Current Description */}
              <div className="group bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Current
                </div>
                <div className="text-sm text-gray-700 prose prose-sm max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                  {currentValues.description ? (
                    <div dangerouslySetInnerHTML={{ __html: currentValues.description }} />
                  ) : (
                    <span className="text-gray-400 italic">Empty</span>
                  )}
                </div>
              </div>

              {/* Animated Arrow */}
              <div className="relative mt-8">
                <ArrowRight
                  className={`h-6 w-6 flex-shrink-0 transition-all duration-500 ${
                    currentValues.description !== newValues.description
                      ? 'text-emerald-500 scale-110 animate-pulse'
                      : 'text-gray-300'
                  }`}
                />
                {currentValues.description !== newValues.description && (
                  <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-20 animate-ping"></div>
                )}
              </div>

              {/* New Description */}
              <div
                className={`group relative rounded-xl p-4 shadow-sm transition-all duration-300 ${
                  currentValues.description !== newValues.description
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 hover:shadow-lg'
                    : 'bg-white border-2 border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    New
                  </div>
                  {currentValues.description !== newValues.description && (
                    <Check className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div
                  className={`text-sm prose prose-sm max-h-48 overflow-y-auto custom-scrollbar leading-relaxed ${
                    currentValues.description !== newValues.description
                      ? 'text-emerald-900 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {newValues.description ? (
                    <div dangerouslySetInnerHTML={{ __html: newValues.description }} />
                  ) : (
                    <span className="text-gray-400 italic">Empty</span>
                  )}
                </div>
                {currentValues.description !== newValues.description && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-full"></div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Image */}
          {newValues.image && (
            <div
              className={`space-y-3 transform transition-all duration-500 ${
                animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '500ms' }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                  <ImageIcon className="h-4 w-4 text-purple-600" />
                </div>
                Product Image
              </div>
              <div className="flex gap-6 items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                {currentValues.image && (
                  <>
                    <div className="flex-shrink-0">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Current
                      </div>
                      <img
                        src={currentValues.image}
                        alt="Current product"
                        className="w-40 h-40 object-cover rounded-xl border-2 border-gray-300 shadow-lg"
                      />
                    </div>
                    <ArrowRight className="h-8 w-8 text-emerald-500 animate-pulse" />
                  </>
                )}
                <div className="flex-shrink-0">
                  <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-3">
                    New
                  </div>
                  <div className="relative group">
                    <img
                      src={newValues.image}
                      alt="New product"
                      className="w-40 h-40 object-cover rounded-xl border-2 border-emerald-400 shadow-2xl ring-4 ring-emerald-100 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {hasChanges && (
            <div
              className={`bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 shadow-sm transform transition-all duration-500 ${
                animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-sm text-emerald-900">
                  <span className="font-bold">Ready to apply!</span> {changeCount} field
                  {changeCount !== 1 ? 's' : ''} will be updated with Gelato's professional product
                  data. You can edit any field after applying.
                </p>
              </div>
            </div>
          )}

          {!hasChanges && (
            <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-5">
              <p className="text-sm text-gray-700 text-center">
                ℹ️ No changes detected. The Gelato product details match your current values.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            disabled={!hasChanges}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-6"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
    </Dialog>
  );
}
