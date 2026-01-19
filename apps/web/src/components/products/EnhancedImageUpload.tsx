'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@nextpik/ui';
import { Button } from '@nextpik/ui';
import { createClient } from '@supabase/supabase-js';
import { api } from '@/lib/api/client';

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  initialImages?: string[];
  maxImages?: number;
  folder?: string;
}

interface UploadedImage {
  url: string;
  id: string;
  uploading: boolean;
  error?: string;
}

export default function EnhancedImageUpload({
  onImagesChange,
  initialImages = [],
  maxImages = 10,
  folder = 'products',
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    initialImages.map((url, index) => ({
      url,
      id: `initial-${index}`,
      uploading: false,
    }))
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    : null;

  const updateParent = useCallback(
    (updatedImages: UploadedImage[]) => {
      const urls = updatedImages.filter((img) => !img.uploading && !img.error).map((img) => img.url);
      onImagesChange(urls);
    },
    [onImagesChange]
  );

  const uploadToSupabase = async (file: File): Promise<string> => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicData } = supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'product-images')
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  };

  const uploadViaAPI = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    return `${apiUrl}${response.data.url}`;
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Try Supabase first, fallback to API
    if (isSupabaseConfigured) {
      try {
        return await uploadToSupabase(file);
      } catch (error) {
        console.warn('Supabase upload failed, falling back to API', error);
      }
    }

    // Fallback to API upload
    return await uploadViaAPI(file);
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed.`);
        return false;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Check max images limit
    if (images.length + validFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Create temporary image entries
    const tempImages: UploadedImage[] = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      id: `temp-${Date.now()}-${Math.random()}`,
      uploading: true,
    }));

    setImages((prev) => [...prev, ...tempImages]);

    // Upload files
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tempImage = tempImages[i];

      try {
        const url = await uploadFile(file);

        setImages((prev) =>
          prev.map((img) =>
            img.id === tempImage.id
              ? { ...img, url, uploading: false }
              : img
          )
        );

        // Clean up object URL
        URL.revokeObjectURL(tempImage.url);
      } catch (error) {
        console.error('Upload failed:', error);
        setImages((prev) =>
          prev.map((img) =>
            img.id === tempImage.id
              ? { ...img, uploading: false, error: 'Upload failed' }
              : img
          )
        );
      }
    }
  }, [images, maxImages, uploadFile]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Update parent when images change
  useEffect(() => {
    updateParent(images);
  }, [images, updateParent]);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <AnimatePresence>
        {canAddMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card
              className={`border-2 border-dashed transition-all ${
                isDragging
                  ? 'border-[#6B5840] bg-[#CBB57B]/10'
                  : 'border-black/20 hover:border-[#6B5840]/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isDragging ? 'bg-[#6B5840] text-white' : 'bg-black/5 text-black'
                    }`}
                  >
                    <Upload className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="font-bold text-black mb-1">
                      Drag & drop images here, or click to browse
                    </p>
                    <p className="text-sm text-black/60">
                      Supported: JPEG, PNG, WebP, GIF (max 5MB each)
                    </p>
                    <p className="text-xs text-black/60 mt-2">
                      {images.length}/{maxImages} images uploaded
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-[#6B5840] text-[#6B5840] hover:bg-[#6B5840] hover:text-white font-bold"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square"
              >
                <Card className="h-full overflow-hidden border border-black/10">
                  <CardContent className="p-0 h-full relative">
                    {/* Image */}
                    <img
                      src={image.url}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                      {image.uploading && (
                        <div className="text-white flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <p className="text-xs font-bold">Uploading...</p>
                        </div>
                      )}

                      {image.error && (
                        <div className="text-white flex flex-col items-center gap-2 p-4 text-center">
                          <AlertCircle className="h-8 w-8" />
                          <p className="text-xs font-bold">{image.error}</p>
                        </div>
                      )}

                      {!image.uploading && !image.error && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(image.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Success Indicator */}
                    {!image.uploading && !image.error && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !canAddMore && (
        <Card className="border border-black/10">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4 text-black/60">
              <ImageIcon className="h-12 w-12" />
              <p className="text-sm">No images uploaded yet</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      {isSupabaseConfigured ? (
        <div className="flex items-center gap-2 p-3 bg-[#CBB57B]/10 border border-[#6B5840]/20 rounded-lg">
          <CheckCircle className="h-4 w-4 text-[#6B5840] flex-shrink-0" />
          <p className="text-xs text-black/70">
            Using Supabase Cloud Storage for fast, secure uploads
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-black/5 border border-black/10 rounded-lg">
          <AlertCircle className="h-4 w-4 text-black/60 flex-shrink-0" />
          <p className="text-xs text-black/60">
            Using local storage. Configure Supabase for cloud storage.
          </p>
        </div>
      )}
    </div>
  );
}
