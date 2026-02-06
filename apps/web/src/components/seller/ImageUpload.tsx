'use client';

import { useState, useRef, DragEvent } from 'react';
import { api } from '@/lib/api/client';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'products',
  label = 'Product Image',
  required = false,
  error,
}: ImageUploadProps) {
  const t = useTranslations('components.imageUpload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t('invalidFileType'));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError(t('fileSizeExceeds'));
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Don't set Content-Type - let browser set it automatically with boundary
      const response = await api.post(`/upload/image?folder=${folder}`, formData);

      // API client unwraps { success, data } to just return data
      if (response?.url) {
        // Construct full URL if it's a relative path
        const imageUrl = response.url.startsWith('http')
          ? response.url
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${response.url}`;
        onChange(imageUrl);
        setUploadError(null);
      } else {
        setUploadError(t('noUrlReturned'));
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.response?.data?.message || t('uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label} {required && <span className="text-error-DEFAULT">*</span>}
      </label>

      {/* Upload Area */}
      {!value ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-gold bg-gold/5' : 'border-neutral-300 hover:border-neutral-400'}
              ${error ? 'border-error-DEFAULT bg-error-DEFAULT/5' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-black mb-3"></div>
                <p className="text-neutral-600">{t('uploading')}</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <p className="text-neutral-700 font-medium mb-1">
                  {t('dropImageHere')}{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gold hover:text-gold-dark underline"
                  >
                    {t('browse')}
                  </button>
                </p>
                <p className="text-sm text-neutral-500 mb-4">
                  {t('fileRequirements')}
                </p>

                <div className="flex items-center justify-center gap-4">
                  <div className="h-px bg-neutral-300 flex-1"></div>
                  <span className="text-xs text-neutral-500">{t('or')}</span>
                  <div className="h-px bg-neutral-300 flex-1"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="mt-4 text-sm text-neutral-600 hover:text-black underline"
                >
                  {showUrlInput ? t('hideUrlInput') : t('useImageUrl')}
                </button>

                {showUrlInput && (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={t('urlPlaceholder')}
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim()}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {t('add')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {(uploadError || error) && (
            <p className="mt-2 text-sm text-error-DEFAULT">
              {uploadError || error}
            </p>
          )}
        </div>
      ) : (
        /* Image Preview */
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="w-48 h-48 object-cover rounded-lg border-2 border-neutral-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f5f5f5" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid Image%3C/text%3E%3C/svg%3E';
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 w-8 h-8 bg-error-DEFAULT text-white rounded-full hover:bg-error-dark transition-colors flex items-center justify-center shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-neutral-600 hover:text-black underline"
            >
              {t('changeImage')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        {t('recommended')}
      </p>
    </div>
  );
}
