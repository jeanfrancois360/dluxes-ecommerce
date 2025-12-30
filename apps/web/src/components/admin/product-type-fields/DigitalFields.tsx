'use client';

import React, { useState } from 'react';
import { Download, FileText, HardDrive, Shield, Info, Mail, Eye, RefreshCw } from 'lucide-react';
import {
  ProductTypeFieldsProps,
  DIGITAL_LICENSE_TYPES,
  DIGITAL_FILE_FORMATS,
  DIGITAL_UPDATE_POLICIES,
} from './types';

export function DigitalFields({
  formData,
  onChange,
  errors = {},
  disabled = false,
}: ProductTypeFieldsProps) {
  const [uploadingFile, setUploadingFile] = useState(false);

  // Format file size for display
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/file?entityType=digital`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.url) {
          onChange('digitalFileUrl', result.data.url);
          onChange('digitalFileSize', file.size);
          onChange('digitalFileName', file.name);

          // Auto-detect format from file extension
          const extension = file.name.split('.').pop()?.toLowerCase() || '';
          onChange('digitalFileFormat', extension);
        }
      } else {
        alert('Failed to upload file. Please try again.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-indigo-50 rounded-lg shadow p-6 border border-indigo-200">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
        <Download className="h-5 w-5" />
        Digital Product Details
      </h2>

      {/* File Upload Section */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline h-4 w-4 mr-1" />
          Digital File *
        </label>

        {formData.digitalFileUrl ? (
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formData.digitalFileName || 'Digital File'}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(formData.digitalFileSize)}
                  {formData.digitalFileFormat && ` • ${formData.digitalFileFormat.toUpperCase()}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange('digitalFileUrl', '');
                onChange('digitalFileSize', undefined);
                onChange('digitalFileName', '');
                onChange('digitalFileFormat', '');
              }}
              disabled={disabled}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="relative">
            <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploadingFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
            }`}>
              {uploadingFile ? (
                <>
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                </>
              ) : (
                <>
                  <Download className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Click to upload file</span>
                  <span className="text-xs text-gray-500 mt-1">Max file size: 500MB</span>
                </>
              )}
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={disabled || uploadingFile}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Manual URL input */}
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">Or enter file URL directly:</label>
          <input
            type="url"
            value={formData.digitalFileUrl || ''}
            onChange={(e) => onChange('digitalFileUrl', e.target.value)}
            disabled={disabled}
            placeholder="https://example.com/files/product.zip"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
        </div>
        {errors.digitalFileUrl && (
          <p className="text-sm text-red-500 mt-1">{errors.digitalFileUrl}</p>
        )}
      </div>

      {/* Row 1: File Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Format
          </label>
          <select
            value={formData.digitalFileFormat || ''}
            onChange={(e) => onChange('digitalFileFormat', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select format...</option>
            {DIGITAL_FILE_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <HardDrive className="inline h-4 w-4 mr-1" />
            File Size
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={formData.digitalFileSize ?? ''}
              onChange={(e) =>
                onChange(
                  'digitalFileSize',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              disabled={disabled}
              placeholder="e.g., 52428800"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
            />
            <span className="absolute right-3 top-2 text-gray-500 text-sm">
              bytes
            </span>
          </div>
          {formData.digitalFileSize && (
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(formData.digitalFileSize)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Version
          </label>
          <input
            type="text"
            value={formData.digitalVersion || ''}
            onChange={(e) => onChange('digitalVersion', e.target.value)}
            disabled={disabled}
            placeholder="e.g., 1.0.0 or 2024.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Row 2: License & Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Shield className="inline h-4 w-4 mr-1" />
            License Type
          </label>
          <select
            value={formData.digitalLicenseType || ''}
            onChange={(e) => onChange('digitalLicenseType', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select license...</option>
            {DIGITAL_LICENSE_TYPES.map((license) => (
              <option key={license.value} value={license.value}>
                {license.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Download Limit
          </label>
          <input
            type="number"
            min="1"
            value={formData.digitalDownloadLimit ?? ''}
            onChange={(e) =>
              onChange(
                'digitalDownloadLimit',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            disabled={disabled}
            placeholder="Leave empty for unlimited"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max downloads per purchase (empty = unlimited)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <RefreshCw className="inline h-4 w-4 mr-1" />
            Update Policy
          </label>
          <select
            value={formData.digitalUpdatePolicy || ''}
            onChange={(e) => onChange('digitalUpdatePolicy', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select policy...</option>
            {DIGITAL_UPDATE_POLICIES.map((policy) => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Preview URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Eye className="inline h-4 w-4 mr-1" />
          Preview/Sample URL
        </label>
        <input
          type="url"
          value={formData.digitalPreviewUrl || ''}
          onChange={(e) => onChange('digitalPreviewUrl', e.target.value)}
          disabled={disabled}
          placeholder="https://example.com/preview/sample.pdf"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional: Provide a free preview or sample for customers
        </p>
      </div>

      {/* Row 4: Requirements */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Info className="inline h-4 w-4 mr-1" />
          System Requirements / Compatibility
        </label>
        <textarea
          value={formData.digitalRequirements || ''}
          onChange={(e) => onChange('digitalRequirements', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="e.g., Windows 10 or later, 4GB RAM, 500MB disk space&#10;macOS 10.15 or later&#10;Adobe Reader for PDF files"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 resize-none"
        />
      </div>

      {/* Row 5: Instructions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Installation / Usage Instructions
        </label>
        <textarea
          value={formData.digitalInstructions || ''}
          onChange={(e) => onChange('digitalInstructions', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Enter installation or usage instructions for customers..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 resize-none"
        />
      </div>

      {/* Row 6: Support Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Mail className="inline h-4 w-4 mr-1" />
          Support Email
        </label>
        <input
          type="email"
          value={formData.digitalSupportEmail || ''}
          onChange={(e) => onChange('digitalSupportEmail', e.target.value)}
          disabled={disabled}
          placeholder="support@yourcompany.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Contact email for product support inquiries
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-indigo-100 rounded-lg border border-indigo-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-800">
            <p className="font-semibold mb-1">Digital Product Delivery</p>
            <ul className="space-y-1 text-xs">
              <li>• Customers receive instant download access after purchase</li>
              <li>• File URL is secured and only accessible to paying customers</li>
              <li>• Download links expire based on the download limit you set</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
