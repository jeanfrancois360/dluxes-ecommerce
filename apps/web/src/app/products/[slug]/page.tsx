'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductCarousel } from '@/components/product-carousel';
import { QuickViewModal, type QuickViewProduct } from '@nextpik/ui';
import { ReviewSummaryComponent } from '@/components/reviews/review-summary';
import { ReviewsList } from '@/components/reviews/reviews-list';
import { ReviewForm } from '@/components/reviews/review-form';
import { WishlistButton } from '@/components/wishlist/wishlist-button';
import { ProductInquiryForm } from '@/components/product-inquiry-form';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { useReviews, useCreateReview, useMarkHelpful, useReportReview } from '@/hooks/use-reviews';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { toast, standardToasts } from '@/lib/utils/toast';
import Link from 'next/link';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useProduct, useRelatedProducts } from '@/hooks/use-product';
import { transformToQuickViewProducts } from '@/lib/utils/product-transform';
import { getColorHex } from '@/lib/utils/color-mapping';
import { Price } from '@/components/price';
import { isLightColor, calculateDiscountPercentage } from '@nextpik/ui/lib/utils/color-utils';
import { framerMotion } from '@nextpik/design-system/animations';
import {
  RealEstateDetails,
  VehicleDetails,
  DigitalDetails,
  ServiceDetails,
  RentalDetails,
} from '@/components/products/type-details';
import { RealEstateInquiryForm } from '@/components/products/RealEstateInquiryForm';
import { VehicleInquiryForm } from '@/components/products/VehicleInquiryForm';
import { ProductDetailAd } from '@/components/ads';

// Reviews Section Component
function ReviewsSection({ productId }: { productId: string }) {
  const t = useTranslations('products');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { reviews, total, page, pageSize, summary, isLoading, updateFilters, refetch } =
    useReviews(productId);
  const { createReview } = useCreateReview();
  const { markHelpful } = useMarkHelpful();
  const { reportReview } = useReportReview();

  const handleCreateReview = async (data: any) => {
    await createReview(data);
    refetch();
  };

  const handleMarkHelpful = async (reviewId: string) => {
    await markHelpful(reviewId);
    refetch();
  };

  const handleReport = async (reviewId: string) => {
    if (confirm(t('confirmReportReview'))) {
      await reportReview(reviewId);
    }
  };

  return (
    <div className="space-y-8">
      <ReviewSummaryComponent summary={summary} onWriteReview={() => setShowReviewForm(true)} />
      <ReviewsList
        reviews={reviews}
        total={total}
        currentPage={page}
        pageSize={pageSize}
        isLoading={isLoading}
        onFiltersChange={updateFilters}
        onMarkHelpful={handleMarkHelpful}
        onReport={handleReport}
      />
      <ReviewForm
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        productId={productId}
        productName={t('productCount')}
        onSubmit={handleCreateReview}
      />
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const tModal = useTranslations('quickViewModal');

  // Fetch product data
  const { product, isLoading, error } = useProduct(slug, true);
  const { products: relatedData, isLoading: relatedLoading } = useRelatedProducts(
    product?.id || '',
    4
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<{
    color?: string;
    size?: string;
  }>({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>(
    'description'
  );
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [showInquiryForm, setShowInquiryForm] = useState(false);

  // Wishlist
  const { isInWishlist: checkIsInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isInWishlist = product?.id ? checkIsInWishlist(product.id) : false;

  // Cart
  const { addItem: addToCart } = useCart();

  // Transform related products and add wishlist status
  const relatedProducts = useMemo(
    () =>
      transformToQuickViewProducts(relatedData).map((product) => ({
        ...product,
        inWishlist: checkIsInWishlist(product.id),
      })),
    [relatedData, checkIsInWishlist]
  );

  // Get available colors and sizes from variants
  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    const colors = product.variants
      .filter((v) => v.attributes.color)
      .map((v) => ({
        name: v.attributes.color,
        value: v.attributes.color.toLowerCase(),
        hex: v.attributes.colorHex || getColorHex(v.attributes.color),
      }));
    return Array.from(new Map(colors.map((c) => [c.value, c])).values());
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    const sizes = product.variants
      .filter((v) => v.attributes.size)
      .map((v) => ({
        name: v.attributes.size,
        value: v.attributes.size.toLowerCase(),
        inStock: v.isAvailable && v.inventory > 0,
      }));
    return Array.from(new Map(sizes.map((s) => [s.value, s])).values());
  }, [product]);

  // Calculate stock status
  const stockStatus = useMemo(() => {
    if (!product) return { inStock: false, quantity: 0, showQuantity: false };

    // If variants exist and one is selected, check variant stock
    const selectedVar = product.variants?.find(
      (v) =>
        (!selectedVariant.color || v.attributes.color?.toLowerCase() === selectedVariant.color) &&
        (!selectedVariant.size || v.attributes.size?.toLowerCase() === selectedVariant.size)
    );

    if (selectedVar) {
      return {
        inStock: selectedVar.isAvailable && selectedVar.inventory > 0,
        quantity: selectedVar.inventory,
        showQuantity: true,
      };
    }

    // Use inventory field from database
    const inventoryCount = product.inventory ?? 0;
    return {
      inStock: inventoryCount > 0,
      quantity: inventoryCount,
      showQuantity: inventoryCount > 0,
    };
  }, [product, selectedVariant]);

  // Get product images - use variant-specific image if available
  const productImages = useMemo(() => {
    if (!product) return [];

    // Check if a variant is selected and has a specific image
    const selectedVar = product.variants?.find(
      (v) =>
        (!selectedVariant.color || v.attributes.color?.toLowerCase() === selectedVariant.color) &&
        (!selectedVariant.size || v.attributes.size?.toLowerCase() === selectedVariant.size)
    );

    // If variant has specific image, show it first
    if (selectedVar?.image) {
      const variantImage = selectedVar.image;
      const baseImages =
        product.images?.length > 0 ? product.images.map((img) => img.url) : [product.heroImage];
      // Remove variant image from base images if it exists, then prepend it
      const filteredImages = baseImages.filter((img) => img !== variantImage);
      return [variantImage, ...filteredImages];
    }

    return product.images?.length > 0 ? product.images.map((img) => img.url) : [product.heroImage];
  }, [product, selectedVariant]);

  // Auto-switch to first image when variant changes (shows variant-specific image)
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  // Get current price - use variant-specific price if available
  const currentPrice = useMemo(() => {
    if (!product) return null;

    // Check if a variant is selected and has a specific price
    const selectedVar = product.variants?.find(
      (v) =>
        (!selectedVariant.color || v.attributes.color?.toLowerCase() === selectedVariant.color) &&
        (!selectedVariant.size || v.attributes.size?.toLowerCase() === selectedVariant.size)
    );

    if (selectedVar && selectedVar.price !== undefined && selectedVar.price !== null) {
      return {
        price:
          typeof selectedVar.price === 'number' ? selectedVar.price : parseFloat(selectedVar.price),
        compareAtPrice: selectedVar.compareAtPrice
          ? typeof selectedVar.compareAtPrice === 'number'
            ? selectedVar.compareAtPrice
            : parseFloat(selectedVar.compareAtPrice)
          : null,
      };
    }

    return {
      price: product.price,
      compareAtPrice: product.compareAtPrice,
    };
  }, [product, selectedVariant]);

  // Check if this is an inquiry product
  // Inquiry products require contacting the seller instead of adding to cart
  const isInquiryProduct = useMemo(() => {
    if (!product) return false;

    // Check if purchaseType is INQUIRY
    if (product.purchaseType === 'INQUIRY') return true;

    // Real estate, vehicles, services, and rentals always require inquiry
    if (product.productType === 'REAL_ESTATE') return true;
    if (product.productType === 'VEHICLE') return true;
    if (product.productType === 'SERVICE') return true;
    if (product.productType === 'RENTAL') return true;

    // Fallback: also check for zero/null price (legacy behavior)
    const price = currentPrice?.price || product.price;
    if (price === null || price === undefined || price === 0) return true;

    return false;
  }, [product, currentPrice]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < Math.floor(rating) ? 'text-gold' : 'text-neutral-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      // Find the selected variant ID if variants exist
      let variantId: string | undefined;
      if (product.variants?.length) {
        const selectedVar = product.variants.find(
          (v) =>
            (!selectedVariant.color ||
              v.attributes.color?.toLowerCase() === selectedVariant.color) &&
            (!selectedVariant.size || v.attributes.size?.toLowerCase() === selectedVariant.size)
        );
        variantId = selectedVar?.id;
      }

      await addToCart(product.id, quantity, variantId);
      toast.success(t('addedToCart', { name: product.name }));
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toast.error(error.message || t('failedAddToCart'));
    }
  };

  const handleToggleWishlist = async (productId: string, isAdding: boolean) => {
    try {
      // isAdding is the NEW state (true = adding to wishlist, false = removing from wishlist)
      if (isAdding) {
        await addToWishlist(productId);
        toast.success(t('addedToWishlist'));
      } else {
        await removeFromWishlist(productId);
        toast.success(t('removedFromWishlist'));
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      toast.error(t('failedUpdateWishlist'));
    }
  };

  // Fetch fresh product data for Quick View
  const { product: quickViewFullProduct, isLoading: quickViewLoading } = useProduct(
    quickViewSlug || '',
    true
  );

  // Transform fresh product data for Quick View when it's loaded
  useEffect(() => {
    if (quickViewSlug && quickViewFullProduct && !quickViewLoading) {
      const transformed = transformToQuickViewProducts([quickViewFullProduct])[0];
      setQuickViewProduct(transformed || null);
    }
  }, [quickViewFullProduct, quickViewLoading, quickViewSlug]);

  const handleQuickView = (productId: string) => {
    const prod = relatedProducts.find((p) => p.id === productId);
    if (prod) {
      // Trigger fresh data fetch by setting the slug
      setQuickViewSlug(prod.slug);
    }
  };

  const handleNavigate = (slug: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigation:start'));
    }
    router.push(`/products/${slug}`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-neutral-200 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-neutral-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-neutral-200 rounded animate-pulse w-3/4" />
              <div className="h-12 bg-neutral-200 rounded animate-pulse w-1/2" />
              <div className="h-6 bg-neutral-200 rounded animate-pulse w-full" />
              <div className="h-6 bg-neutral-200 rounded animate-pulse w-full" />
              <div className="h-6 bg-neutral-200 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show error or 404
  if (error || !product) {
    notFound();
  }

  // Calculate discount percentage - use current price (may be variant-specific)
  const discountPercent =
    currentPrice?.compareAtPrice && currentPrice?.price
      ? calculateDiscountPercentage(currentPrice.compareAtPrice, currentPrice.price)
      : 0;

  return (
    <PageLayout>
      <div className="bg-white">
        {/* Breadcrumb */}
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-neutral-600 overflow-x-auto">
              <Link href="/" className="hover:text-gold transition-colors">
                {tc('nav.home')}
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <Link href="/products" className="hover:text-gold transition-colors">
                {tc('nav.products')}
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {product.category && (
                <>
                  <Link
                    href={`/products?category=${product.category.slug}`}
                    className="hover:text-gold transition-colors"
                  >
                    {product.category.name}
                  </Link>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
              <span className="text-black font-medium">{product.name}</span>
            </div>
          </div>
        </div>

        {/* Product Section */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr,300px] xl:grid-cols-[1fr,1fr,350px] gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12 lg:mb-16">
            {/* Image Gallery */}
            <div>
              {/* Main Image */}
              <motion.div
                className="relative aspect-square bg-neutral-100 rounded-2xl overflow-hidden mb-4"
                layoutId="main-image"
              >
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Badges */}
                {product.badges && product.badges.length > 0 && (
                  <div className="absolute top-4 left-4 flex gap-2">
                    {product.badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-3 py-1 bg-gold text-black text-sm font-semibold rounded-full"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* Wishlist */}
                <div className="absolute top-4 right-4">
                  <WishlistButton
                    productId={product.id}
                    isInWishlist={isInWishlist}
                    onToggle={handleToggleWishlist}
                    size="lg"
                  />
                </div>
              </motion.div>

              {/* Thumbnails */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {productImages.map((img, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    whileHover={framerMotion.interactions.sizeHover}
                    whileTap={framerMotion.interactions.sizeTap}
                    className={`aspect-square bg-neutral-100 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-gold' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                {product.brand && (
                  <span className="text-xs sm:text-sm text-neutral-600 uppercase tracking-wide">
                    {product.brand}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-black mt-2 mb-3 sm:mb-4">
                  {product.name}
                </h1>

                {/* Rating - TODO: Calculate from actual reviews */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex">{renderStars(4.5)}</div>
                  <span className="text-sm text-neutral-600">4.5 (0 reviews)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {isInquiryProduct ? (
                    <div className="flex flex-col">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gold">
                        {t('contactForPrice')}
                      </span>
                      <span className="text-xs sm:text-sm text-neutral-600 mt-1 sm:mt-2">
                        {t('submitInquiry')}
                      </span>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${currentPrice?.price}-${currentPrice?.compareAtPrice}`}
                        {...framerMotion.priceChange}
                        className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4"
                      >
                        <Price
                          amount={currentPrice?.price || 0}
                          className="text-2xl sm:text-3xl md:text-4xl font-bold text-black"
                        />
                        {currentPrice?.compareAtPrice && (
                          <>
                            <Price
                              amount={currentPrice.compareAtPrice || 0}
                              className="text-lg sm:text-xl md:text-2xl text-neutral-400 line-through"
                            />
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-red-100 text-red-600 text-xs sm:text-sm font-semibold rounded-full">
                              {t('save', { percent: discountPercent })}
                            </span>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* SKU */}
                <p className="text-xs sm:text-sm text-neutral-600 mb-4 sm:mb-6">
                  {t('sku', { sku: product.sku })}
                </p>
              </div>

              {/* Store Info */}
              {product.store && (
                <Link
                  href={`/store/${product.store.slug}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-neutral-50 rounded-xl mb-6 sm:mb-8 hover:bg-neutral-100 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-xl bg-white border border-neutral-200 overflow-hidden flex-shrink-0">
                    {product.store.logo ? (
                      <img
                        src={product.store.logo}
                        alt={product.store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {product.store.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-black group-hover:text-gold transition-colors">
                        {product.store.name}
                      </h4>
                      {product.store.verified && (
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                      {product.store.rating && product.store.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-gold"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {Number(product.store.rating).toFixed(1)}
                        </span>
                      )}
                      <span>
                        {product.store.totalProducts} {t('productsCount')}
                      </span>
                      {(product.store.city || product.store.country) && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {[product.store.city, product.store.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-gold group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium mr-1">{t('visitStore')}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Description */}
              <p className="text-sm sm:text-base text-neutral-700 mb-6 sm:mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Inquiry Form or Product Options */}
              {isInquiryProduct ? (
                <div className="mb-6 sm:mb-8">
                  {!showInquiryForm ? (
                    <button
                      onClick={() => setShowInquiryForm(true)}
                      className={`w-full py-3 sm:py-4 px-6 sm:px-8 font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 ${
                        product.productType === 'REAL_ESTATE'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                          : product.productType === 'VEHICLE'
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                            : 'bg-gradient-to-r from-gold to-accent-700 text-black hover:from-black hover:to-neutral-800 hover:text-white'
                      }`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {product.productType === 'REAL_ESTATE'
                        ? t('scheduleViewing')
                        : product.productType === 'VEHICLE'
                          ? t('scheduleTestDrive')
                          : product.productType === 'SERVICE'
                            ? t('requestServiceQuote')
                            : product.productType === 'RENTAL'
                              ? t('requestRentalInfo')
                              : t('contactAboutProduct')}
                    </button>
                  ) : product.productType === 'REAL_ESTATE' ? (
                    <RealEstateInquiryForm
                      productId={product.id}
                      productName={product.name}
                      productType={product.propertyType || 'property'}
                      onSuccess={() => {
                        toast.success(t('agentWillContact'));
                        setShowInquiryForm(false);
                      }}
                      onCancel={() => setShowInquiryForm(false)}
                    />
                  ) : product.productType === 'VEHICLE' ? (
                    <VehicleInquiryForm
                      productId={product.id}
                      productName={product.name}
                      vehicleInfo={
                        product.vehicleYear && product.vehicleMake && product.vehicleModel
                          ? `${product.vehicleYear} ${product.vehicleMake} ${product.vehicleModel}`
                          : undefined
                      }
                      onSuccess={() => {
                        toast.success(t('salesTeamWillContact'));
                        setShowInquiryForm(false);
                      }}
                      onCancel={() => setShowInquiryForm(false)}
                    />
                  ) : product.productType === 'SERVICE' || product.productType === 'RENTAL' ? (
                    <div>
                      <InquiryForm
                        productId={product.id}
                        productName={product.name}
                        sellerName={product.store?.name}
                      />
                      <button
                        onClick={() => setShowInquiryForm(false)}
                        className="mt-4 text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        {tc('buttons.cancel')}
                      </button>
                    </div>
                  ) : (
                    <ProductInquiryForm
                      productId={product.id}
                      productName={product.name}
                      onSuccess={() => {
                        toast.success(t('weWillContact'));
                        setShowInquiryForm(false);
                      }}
                      onCancel={() => setShowInquiryForm(false)}
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Color Selection */}
                  {availableColors.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <label className="block text-xs sm:text-sm font-semibold text-black mb-2 sm:mb-3">
                        {t('color')}
                        {selectedVariant.color && (
                          <span className="text-neutral-600 font-normal ml-2 capitalize">
                            ({selectedVariant.color})
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2 sm:gap-3 flex-wrap">
                        {availableColors.map((color) => {
                          const isLight = isLightColor(color.hex);

                          return (
                            <motion.button
                              key={`detail-color-${color.value}`}
                              onClick={() =>
                                setSelectedVariant({ ...selectedVariant, color: color.value })
                              }
                              whileHover={framerMotion.interactions.swatchHover}
                              whileTap={framerMotion.interactions.swatchTap}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200 ${
                                selectedVariant.color === color.value
                                  ? 'border-gold ring-2 ring-gold/20 scale-110'
                                  : isLight
                                    ? 'border-neutral-400 hover:border-neutral-500'
                                    : 'border-neutral-300 hover:border-gold/50'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Size Selection */}
                  {availableSizes.length > 0 && (
                    <div className="mb-6 sm:mb-8">
                      <label className="block text-xs sm:text-sm font-semibold text-black mb-2 sm:mb-3">
                        {t('size')}
                        {selectedVariant.size && (
                          <span className="text-neutral-600 font-normal ml-2 uppercase">
                            ({selectedVariant.size})
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2 sm:gap-3 flex-wrap">
                        {availableSizes.map((size) => (
                          <motion.button
                            key={`detail-size-${size.value}`}
                            onClick={() =>
                              size.inStock &&
                              setSelectedVariant({ ...selectedVariant, size: size.value })
                            }
                            disabled={!size.inStock}
                            whileHover={size.inStock ? framerMotion.interactions.sizeHover : {}}
                            whileTap={size.inStock ? framerMotion.interactions.sizeTap : {}}
                            className={`px-4 sm:px-6 py-2 sm:py-3 border-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                              selectedVariant.size === size.value
                                ? 'border-gold bg-gold text-black'
                                : size.inStock
                                  ? 'border-neutral-300 hover:border-gold'
                                  : 'border-neutral-200 text-neutral-400 cursor-not-allowed line-through'
                            }`}
                          >
                            {size.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-6 sm:mb-8">
                    <label className="block text-xs sm:text-sm font-semibold text-black mb-2 sm:mb-3">
                      {t('quantity')}
                    </label>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center border-2 border-neutral-200 rounded-lg">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 sm:px-4 py-2 hover:bg-neutral-100 transition-colors"
                        >
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <span className="px-4 sm:px-6 py-2 font-semibold text-sm sm:text-base">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          disabled={quantity >= stockStatus.quantity}
                          className="px-3 sm:px-4 py-2 hover:bg-neutral-100 transition-colors disabled:opacity-50"
                        >
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Stock Status */}
                      <div className="flex items-center gap-2">
                        {stockStatus.inStock ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-sm text-green-600 font-medium">
                              {stockStatus.showQuantity
                                ? t('inStockQuantity', { quantity: stockStatus.quantity })
                                : t('inStock')}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-sm text-red-600 font-medium">
                              {t('outOfStock')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={!stockStatus.inStock}
                      whileHover={framerMotion.interactions.buttonHover}
                      whileTap={framerMotion.interactions.buttonTap}
                      className="flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-xl font-bold text-base sm:text-lg hover:bg-neutral-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('addToCart')}
                    </motion.button>
                    <WishlistButton
                      productId={product.id}
                      isInWishlist={isInWishlist}
                      onToggle={handleToggleWishlist}
                      size="lg"
                      variant="default"
                    />
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="border-t border-neutral-200 pt-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-neutral-600">{t('tags')}</span>
                        {product.tags.map((tag) => (
                          <Link
                            key={tag.id}
                            href={`/products?tag=${tag.slug}`}
                            className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full hover:bg-gold/20 hover:text-gold transition-colors"
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Product Detail Ad Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
              <ProductDetailAd categoryId={product.categoryId} className="sticky top-24" />
            </div>
          </div>

          {/* Real Estate Details - Only shown for REAL_ESTATE products */}
          {product.productType === 'REAL_ESTATE' && (
            <div className="mb-12">
              <RealEstateDetails product={product} />
            </div>
          )}

          {/* Vehicle Details - Only shown for VEHICLE products */}
          {product.productType === 'VEHICLE' && (
            <div className="mb-12">
              <VehicleDetails product={product} />
            </div>
          )}

          {/* Digital Details - Only shown for DIGITAL products */}
          {product.productType === 'DIGITAL' && (
            <div className="mb-12">
              <DigitalDetails product={product} />
            </div>
          )}

          {/* Service Details - Only shown for SERVICE products */}
          {product.productType === 'SERVICE' && (
            <div className="mb-12">
              <ServiceDetails product={product} />
            </div>
          )}

          {/* Rental Details - Only shown for RENTAL products */}
          {product.productType === 'RENTAL' && (
            <div className="mb-12">
              <RentalDetails product={product} />
            </div>
          )}

          {/* Tabs Section */}
          <div className="border-t border-neutral-200 pt-8 sm:pt-10 lg:pt-12 mb-8 sm:mb-12 lg:mb-16">
            {/* Tab Headers */}
            <div className="flex gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 border-b border-neutral-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 sm:pb-4 px-1 sm:px-2 text-sm sm:text-base md:text-lg font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'description'
                    ? 'text-black'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {t('description')}
                {activeTab === 'description' && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-3 sm:pb-4 px-1 sm:px-2 text-sm sm:text-base md:text-lg font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'specifications'
                    ? 'text-black'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {t('specifications')}
                {activeTab === 'specifications' && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 sm:pb-4 px-1 sm:px-2 text-sm sm:text-base md:text-lg font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'reviews' ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {t('reviews')}
                {activeTab === 'reviews' && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'description' && (
                  <div className="prose prose-lg max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: product.richDescription || product.description,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('productDetails')}</h3>
                      <dl className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-neutral-200">
                          <dt className="text-neutral-600">SKU</dt>
                          <dd className="font-medium">{product.sku}</dd>
                        </div>
                        {product.brand && (
                          <div className="flex justify-between py-2 border-b border-neutral-200">
                            <dt className="text-neutral-600">{t('brand')}</dt>
                            <dd className="font-medium">{product.brand}</dd>
                          </div>
                        )}
                        {product.category && (
                          <div className="flex justify-between py-2 border-b border-neutral-200">
                            <dt className="text-neutral-600">{t('category')}</dt>
                            <dd className="font-medium">{product.category.name}</dd>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-neutral-200">
                          <dt className="text-neutral-600">{t('availability')}</dt>
                          <dd className="font-medium">
                            {stockStatus.inStock
                              ? stockStatus.showQuantity
                                ? t('inStockQuantity', { quantity: stockStatus.quantity })
                                : t('inStock')
                              : t('outOfStock')}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && <ReviewsSection productId={product.id} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="border-t border-neutral-200 pt-12">
              <ProductCarousel
                title={t('relatedProducts')}
                products={relatedProducts}
                onQuickView={handleQuickView}
                onAddToWishlist={async (id) => {
                  const inWishlist = checkIsInWishlist(id);
                  await handleToggleWishlist(id, !inWishlist);
                }}
                onQuickAdd={(id) => console.log('Add to cart:', id)}
                onNavigate={handleNavigate}
                isLoading={relatedLoading}
              />
            </section>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={!!quickViewSlug}
        onClose={() => {
          setQuickViewSlug(null);
          setQuickViewProduct(null);
        }}
        product={quickViewProduct}
        onAddToCart={(id) => console.log('Add to cart:', id)}
        onViewDetails={handleNavigate}
        translations={{
          color: tModal('color'),
          size: tModal('size'),
          quantity: tModal('quantity'),
          inStock: tModal('inStock'),
          available: tModal('available'),
          outOfStock: tModal('outOfStock'),
          onlyLeftInStock: tModal('onlyLeftInStock', { count: 0 }),
          addToCart: tModal('addToCart'),
          viewFullDetails: tModal('viewFullDetails'),
          reviews: tModal('reviews'),
          review: tModal('review'),
          save: tModal('save', { percent: 0 }),
        }}
      />
    </PageLayout>
  );
}
