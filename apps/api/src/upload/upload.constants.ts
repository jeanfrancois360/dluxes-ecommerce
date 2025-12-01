/**
 * Upload Constants
 * Placeholder images and configuration
 */

export const PLACEHOLDER_IMAGES = {
  product: 'https://placehold.co/800x800/f5f5f5/666666?text=Product+Image',
  productSquare: 'https://placehold.co/600x600/f5f5f5/666666?text=Product',
  productWide: 'https://placehold.co/1200x600/f5f5f5/666666?text=Product+Banner',
  category: 'https://placehold.co/800x400/f5f5f5/666666?text=Category',
  avatar: 'https://placehold.co/400x400/f5f5f5/666666?text=User',
  seller: 'https://placehold.co/800x800/f5f5f5/666666?text=Seller',
  collection: 'https://placehold.co/1200x600/f5f5f5/666666?text=Collection',
  thumbnail: 'https://placehold.co/300x300/f5f5f5/666666?text=Thumb',
};

export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  optimizationDefaults: {
    quality: 85,
    format: 'webp' as const,
    width: 1920,
  },
  thumbnailSize: 300,
  mediumSize: 800,
};

export const FOLDER_PATHS = {
  products: 'products',
  productThumbnails: 'products/thumbnails',
  categories: 'categories',
  sellers: 'sellers',
  avatars: 'avatars',
  collections: 'collections',
  temp: 'temp',
};
