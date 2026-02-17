'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api/client';

interface DesignUploaderProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function DesignUploader({ value, onChange, disabled }: DesignUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file) return;
    if (
      !file.type.match(/image\/(png|jpeg|jpg|pdf|tiff|webp)/) &&
      file.type !== 'application/pdf'
    ) {
      setError('Accepted formats: PNG, JPG, TIFF, PDF');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File must be under 50MB');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/image?folder=gelato-designs', formData);
      const url = response?.data?.data?.url || response?.data?.url;
      if (url) {
        onChange(url);
        setUrlInput(url);
      } else {
        setError('Upload failed — no URL returned');
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleUrlSave() {
    const trimmed = urlInput.trim();
    if (trimmed) {
      onChange(trimmed);
    }
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${
            mode === 'upload'
              ? 'bg-[#CBB57B] text-black border-[#CBB57B]'
              : 'bg-white text-gray-600 border-gray-300 hover:border-[#CBB57B]'
          }`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${
            mode === 'url'
              ? 'bg-[#CBB57B] text-black border-[#CBB57B]'
              : 'bg-white text-gray-600 border-gray-300 hover:border-[#CBB57B]'
          }`}
        >
          Enter URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-[#CBB57B] bg-amber-50'
              : disabled
                ? 'border-gray-200 bg-gray-50'
                : 'border-gray-300 hover:border-[#CBB57B] cursor-pointer'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.tiff,.tif,.pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />

          {uploading ? (
            <div className="space-y-2">
              <div className="w-8 h-8 border-2 border-[#CBB57B] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="w-10 h-10 text-gray-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-[#CBB57B]">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, TIFF, PDF — max 50MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://your-cdn.com/design-file.png"
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleUrlSave}
            disabled={disabled || !urlInput.trim()}
            className="px-4 py-2 text-sm bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Current file preview */}
      {value && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg
            className="w-5 h-5 text-green-600 shrink-0"
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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">Design file set</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline truncate block"
            >
              {value}
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setUrlInput('');
            }}
            disabled={disabled}
            className="text-green-600 hover:text-red-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
