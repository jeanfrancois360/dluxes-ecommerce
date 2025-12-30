'use client';

import React from 'react';
import {
  Download,
  FileText,
  HardDrive,
  Shield,
  Info,
  Mail,
  Eye,
  RefreshCw,
  Check,
  Zap,
} from 'lucide-react';

interface DigitalDetailsProps {
  product: {
    digitalFileUrl?: string;
    digitalFileSize?: number;
    digitalFileFormat?: string;
    digitalFileName?: string;
    digitalVersion?: string;
    digitalLicenseType?: string;
    digitalDownloadLimit?: number;
    digitalPreviewUrl?: string;
    digitalRequirements?: string;
    digitalInstructions?: string;
    digitalUpdatePolicy?: string;
    digitalSupportEmail?: string;
  };
}

const LICENSE_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  personal: { label: 'Personal Use', description: 'For individual, non-commercial projects' },
  commercial: { label: 'Commercial Use', description: 'For business and commercial projects' },
  extended: { label: 'Extended License', description: 'For products sold to end customers' },
  unlimited: { label: 'Unlimited', description: 'Use anywhere, any number of projects' },
};

const UPDATE_POLICY_LABELS: Record<string, string> = {
  free_lifetime: 'Free Lifetime Updates',
  free_1year: 'Free Updates for 1 Year',
  paid_updates: 'Paid Updates Only',
  no_updates: 'No Updates Included',
};

const FILE_FORMAT_ICONS: Record<string, string> = {
  pdf: 'PDF',
  zip: 'ZIP',
  mp3: 'MP3',
  mp4: 'MP4',
  mov: 'MOV',
  png: 'PNG',
  jpg: 'JPG',
  psd: 'PSD',
  ai: 'AI',
  svg: 'SVG',
  epub: 'EPUB',
  exe: 'EXE',
  dmg: 'DMG',
  apk: 'APK',
};

export function DigitalDetails({ product }: DigitalDetailsProps) {
  const {
    digitalFileSize,
    digitalFileFormat,
    digitalFileName,
    digitalVersion,
    digitalLicenseType,
    digitalDownloadLimit,
    digitalPreviewUrl,
    digitalRequirements,
    digitalInstructions,
    digitalUpdatePolicy,
    digitalSupportEmail,
  } = product;

  // Format file size for display
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Check if we have any data to display
  const hasFileInfo = digitalFileFormat || digitalFileSize || digitalVersion;
  const hasLicenseInfo = digitalLicenseType || digitalDownloadLimit !== undefined || digitalUpdatePolicy;
  const hasRequirements = digitalRequirements;
  const hasInstructions = digitalInstructions;

  if (!hasFileInfo && !hasLicenseInfo && !hasRequirements && !hasInstructions && !digitalPreviewUrl && !digitalSupportEmail) {
    return null;
  }

  const licenseInfo = digitalLicenseType ? LICENSE_TYPE_LABELS[digitalLicenseType] : null;

  return (
    <div className="space-y-6">
      {/* Instant Delivery Banner */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full">
          <Zap className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-indigo-900">Instant Digital Delivery</p>
          <p className="text-sm text-indigo-700">
            Get immediate access after purchase - download links sent to your email
          </p>
        </div>
      </div>

      {/* Quick File Info Bar */}
      {hasFileInfo && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          {digitalFileFormat && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg">
                {FILE_FORMAT_ICONS[digitalFileFormat] || digitalFileFormat.toUpperCase()}
              </div>
            </div>
          )}
          {digitalFileFormat && digitalFileSize && <div className="w-px h-6 bg-gray-300" />}
          {digitalFileSize && (
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">{formatFileSize(digitalFileSize)}</span>
            </div>
          )}
          {(digitalFileFormat || digitalFileSize) && digitalVersion && (
            <div className="w-px h-6 bg-gray-300" />
          )}
          {digitalVersion && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Version</span>
              <span className="font-semibold text-gray-900">{digitalVersion}</span>
            </div>
          )}
        </div>
      )}

      {/* License Information Card */}
      {hasLicenseInfo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              License & Usage
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {licenseInfo && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">License Type</p>
                  <p className="font-medium text-gray-900">{licenseInfo.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{licenseInfo.description}</p>
                </div>
              )}
              {digitalDownloadLimit !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Download Limit</p>
                  <p className="font-medium text-gray-900">
                    {digitalDownloadLimit ? `${digitalDownloadLimit} downloads` : 'Unlimited'}
                  </p>
                </div>
              )}
              {digitalUpdatePolicy && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    Updates
                  </p>
                  <p className="font-medium text-gray-900">
                    {UPDATE_POLICY_LABELS[digitalUpdatePolicy] || digitalUpdatePolicy}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Link */}
      {digitalPreviewUrl && (
        <a
          href={digitalPreviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full p-4 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-800 rounded-xl font-semibold transition-all border border-indigo-200"
        >
          <Eye className="w-5 h-5" />
          Preview Sample / Demo
        </a>
      )}

      {/* System Requirements */}
      {hasRequirements && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-600" />
              System Requirements
            </h3>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
                {digitalRequirements}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Installation Instructions */}
      {hasInstructions && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Installation / Usage Instructions
            </h3>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm bg-gray-50 p-4 rounded-lg">
                {digitalInstructions}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Support Contact */}
      {digitalSupportEmail && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-600" />
              Product Support
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-2">Need help? Contact support:</p>
            <a
              href={`mailto:${digitalSupportEmail}`}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Mail className="w-4 h-4" />
              {digitalSupportEmail}
            </a>
          </div>
        </div>
      )}

      {/* What's Included */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <Check className="w-5 h-5" />
          What's Included
        </h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-green-800">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            Instant download after purchase
          </li>
          {digitalFileName && (
            <li className="flex items-center gap-2 text-sm text-green-800">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              {digitalFileName}
            </li>
          )}
          {licenseInfo && (
            <li className="flex items-center gap-2 text-sm text-green-800">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              {licenseInfo.label} license
            </li>
          )}
          {digitalUpdatePolicy && UPDATE_POLICY_LABELS[digitalUpdatePolicy]?.includes('Free') && (
            <li className="flex items-center gap-2 text-sm text-green-800">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              {UPDATE_POLICY_LABELS[digitalUpdatePolicy]}
            </li>
          )}
          {digitalSupportEmail && (
            <li className="flex items-center gap-2 text-sm text-green-800">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              Email support included
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
