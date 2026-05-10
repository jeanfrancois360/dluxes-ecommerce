'use client';

import React, { useState, useRef } from 'react';
import {
  Download,
  FileText,
  Shield,
  Info,
  Mail,
  Eye,
  RefreshCw,
  Upload,
  X,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  ProductTypeFieldsProps,
  DIGITAL_LICENSE_TYPES,
  DIGITAL_FILE_FORMATS,
  DIGITAL_UPDATE_POLICIES,
} from './types';

const GOLD = '#CBB57B';
const GOLD_DARK = '#A08840';

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600 border-red-200',
  zip: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  rar: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  mp3: 'bg-purple-50 text-purple-600 border-purple-200',
  mp4: 'bg-blue-50 text-blue-600 border-blue-200',
  png: 'bg-green-50 text-green-600 border-green-200',
  jpg: 'bg-green-50 text-green-600 border-green-200',
  svg: 'bg-green-50 text-green-600 border-green-200',
  psd: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  ai: 'bg-orange-50 text-orange-600 border-orange-200',
  epub: 'bg-teal-50 text-teal-600 border-teal-200',
};

function FileTypeBadge({ format }: { format: string }) {
  const ext = format.toLowerCase();
  const color = FILE_TYPE_COLORS[ext] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase border ${color}`}
    >
      {format}
    </span>
  );
}

export function DigitalFields({
  formData,
  onChange,
  errors = {},
  disabled = false,
}: ProductTypeFieldsProps) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFile = !!formData.digitalFileUrl;
  const detectedFormat = formData.digitalFileFormat || '';

  async function uploadFile(file: File) {
    setUploadError('');
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/file?entityType=digital`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
      );
      const result = await response.json();
      if (result.success && result.data?.url) {
        onChange('digitalFileUrl', result.data.url);
        onChange('digitalFileSize', file.size);
        onChange('digitalFileName', file.name);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        onChange('digitalFileFormat', ext);
      } else {
        setUploadError(result.message || 'Upload failed. Please try again.');
      }
    } catch {
      setUploadError('Upload failed. Check your connection and try again.');
    } finally {
      setUploadingFile(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleUrlSave() {
    const url = urlInput.trim();
    if (!url) return;
    onChange('digitalFileUrl', url);
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
    if (ext && !formData.digitalFileFormat) onChange('digitalFileFormat', ext);
    setUrlMode(false);
    setUrlInput('');
  }

  function clearFile() {
    onChange('digitalFileUrl', '');
    onChange('digitalFileSize', undefined);
    onChange('digitalFileName', '');
    onChange('digitalFileFormat', '');
    setUploadError('');
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${GOLD}20` }}
        >
          <Download size={16} style={{ color: GOLD_DARK }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Digital Product Details</p>
          <p className="text-xs text-gray-500">File delivered instantly to buyers after payment</p>
        </div>
      </div>

      {/* File Upload */}
      <section className="bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-900">
            Digital File <span className="text-red-500">*</span>
          </label>
          {!hasFile && !uploadingFile && (
            <button
              type="button"
              onClick={() => setUrlMode((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: GOLD_DARK }}
            >
              <LinkIcon size={12} />
              {urlMode ? 'Upload instead' : 'Use URL instead'}
            </button>
          )}
        </div>

        {hasFile ? (
          /* File set — show confirmation card */
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-900 truncate">
                {formData.digitalFileName || 'File uploaded'}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {detectedFormat && <FileTypeBadge format={detectedFormat} />}
                {formData.digitalFileSize != null && (
                  <span className="text-xs text-green-700">
                    {formatFileSize(formData.digitalFileSize)}
                  </span>
                )}
                <a
                  href={formData.digitalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline truncate max-w-[200px]"
                >
                  View file ↗
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              disabled={disabled}
              className="flex-shrink-0 p-1.5 rounded-md text-green-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : urlMode ? (
          /* URL entry mode */
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSave()}
                placeholder="https://your-cdn.com/product.zip"
                disabled={disabled}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B]"
              />
              <button
                type="button"
                onClick={handleUrlSave}
                disabled={disabled || !urlInput.trim()}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: GOLD }}
              >
                Set
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Paste a permanent direct download link to your file.
            </p>
          </div>
        ) : (
          /* Drag & drop upload zone */
          <div
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              isDragging
                ? 'border-[#CBB57B] bg-[#CBB57B]/5'
                : disabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-[#CBB57B] hover:bg-[#CBB57B]/5 cursor-pointer'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !disabled && !uploadingFile && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              disabled={disabled || uploadingFile}
              className="hidden"
            />
            <div className="flex flex-col items-center py-8 px-4 text-center">
              {uploadingFile ? (
                <>
                  <div
                    className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-3"
                    style={{ borderColor: `${GOLD} transparent transparent transparent` }}
                  />
                  <p className="text-sm font-medium text-gray-700">Uploading…</p>
                  <p className="text-xs text-gray-400 mt-1">Please wait, do not close this page</p>
                </>
              ) : (
                <>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${GOLD}18` }}
                  >
                    <Upload size={22} style={{ color: GOLD_DARK }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    <span style={{ color: GOLD_DARK }}>Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ZIP, PDF, MP3, MP4, PSD, and more · Max 500 MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {uploadError && (
          <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{uploadError}</p>
          </div>
        )}
        {errors.digitalFileUrl && (
          <p className="text-xs text-red-500 mt-1">{errors.digitalFileUrl}</p>
        )}
      </section>

      {/* File Metadata */}
      <section className="bg-white p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          File Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File Format</label>
            <select
              value={formData.digitalFileFormat || ''}
              onChange={(e) => onChange('digitalFileFormat', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
            >
              <option value="">Select format…</option>
              {DIGITAL_FILE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Size — shown as human-readable, internal bytes stored */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File Size</label>
            {formData.digitalFileSize != null ? (
              <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700">
                {formatFileSize(formData.digitalFileSize)}
                <span className="ml-1 text-xs text-gray-400">
                  ({formData.digitalFileSize.toLocaleString()} bytes)
                </span>
              </div>
            ) : (
              <input
                type="number"
                min="0"
                value={formData.digitalFileSize ?? ''}
                onChange={(e) =>
                  onChange('digitalFileSize', e.target.value ? parseInt(e.target.value) : undefined)
                }
                disabled={disabled}
                placeholder="Auto-filled on upload"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
              />
            )}
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Version</label>
            <input
              type="text"
              value={formData.digitalVersion || ''}
              onChange={(e) => onChange('digitalVersion', e.target.value)}
              disabled={disabled}
              placeholder="e.g. 1.0.0 or 2024.1"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* License & Download Settings */}
      <section className="bg-white p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          License & Access
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Shield size={13} className="text-gray-400" />
              License Type
            </label>
            <select
              value={formData.digitalLicenseType || ''}
              onChange={(e) => onChange('digitalLicenseType', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
            >
              <option value="">Select license…</option>
              {DIGITAL_LICENSE_TYPES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Download Limit</label>
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
              placeholder="Unlimited"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-400 mt-1">Per purchase (empty = unlimited)</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <RefreshCw size={13} className="text-gray-400" />
              Update Policy
            </label>
            <select
              value={formData.digitalUpdatePolicy || ''}
              onChange={(e) => onChange('digitalUpdatePolicy', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
            >
              <option value="">Select policy…</option>
              {DIGITAL_UPDATE_POLICIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Preview & Customer-facing info */}
      <section className="bg-white p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Customer Info
        </p>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Eye size={13} className="text-gray-400" />
              Preview / Sample URL
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.digitalPreviewUrl || ''}
              onChange={(e) => onChange('digitalPreviewUrl', e.target.value)}
              disabled={disabled}
              placeholder="https://example.com/preview/sample.pdf"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Info size={13} className="text-gray-400" />
                System Requirements
              </label>
              <textarea
                value={formData.digitalRequirements || ''}
                onChange={(e) => onChange('digitalRequirements', e.target.value)}
                disabled={disabled}
                rows={3}
                placeholder="e.g. Windows 10+, 4 GB RAM&#10;macOS 10.15+&#10;Adobe Reader for PDF"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Installation / Usage Instructions
              </label>
              <textarea
                value={formData.digitalInstructions || ''}
                onChange={(e) => onChange('digitalInstructions', e.target.value)}
                disabled={disabled}
                rows={3}
                placeholder="Step-by-step instructions for customers after download…"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Mail size={13} className="text-gray-400" />
              Support Email
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              value={formData.digitalSupportEmail || ''}
              onChange={(e) => onChange('digitalSupportEmail', e.target.value)}
              disabled={disabled}
              placeholder="support@yourbrand.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CBB57B]/40 focus:border-[#CBB57B] disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* Info footer */}
      <div className="bg-gray-50 px-5 py-3.5 flex items-start gap-2.5">
        <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Buyers receive instant download access after payment. The file URL is only accessible to
          paying customers via their account downloads page.
        </p>
      </div>
    </div>
  );
}
