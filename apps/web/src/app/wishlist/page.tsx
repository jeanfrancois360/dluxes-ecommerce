'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import { WishlistItemComponent } from '@/components/wishlist/wishlist-item';
import { QuickViewModal, type QuickViewProduct } from '@luxury/ui';
import { useWishlist, useRemoveFromWishlist, useClearWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const router = useRouter();
  const { items, total, isLoading, updateFilters, refetch } = useWishlist();
  const { removeFromWishlist } = useRemoveFromWishlist();
  const { clearWishlist } = useClearWishlist();
  const { addItem: addToCart } = useCart();
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'priceAsc' | 'priceDesc'>('recent');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      refetch();
      toast.success('Removed', 'Item removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error('Error', 'Failed to remove from wishlist');
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        await clearWishlist();
        refetch();
        toast.success('Cleared', 'Wishlist cleared successfully');
      } catch (error) {
        console.error('Failed to clear wishlist:', error);
        toast.error('Error', 'Failed to clear wishlist');
      }
    }
  };

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      // Add to cart
      await addToCart(productId, 1);

      // Optionally remove from wishlist after adding to cart
      // await removeFromWishlist(productId);
      // refetch();

      toast.success('Added to Cart', 'Item has been added to your cart');
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toast.error('Error', error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleMoveAllToCart = async () => {
    // Handle both isAvailable and inventory fields
    const inStockItems = (items || []).filter(item =>
      item.product.isAvailable !== false &&
      (item.product.inventory === undefined || item.product.inventory > 0)
    );

    if (inStockItems.length === 0) {
      toast.error('No Items', 'No items available to add to cart');
      return;
    }

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const item of inStockItems) {
        try {
          await addToCart(item.productId, 1);
          successCount++;
        } catch (error) {
          failedCount++;
          console.error(`Failed to add ${item.product.name} to cart:`, error);
        }
      }

      if (successCount > 0) {
        toast.success('Success', `${successCount} item${successCount > 1 ? 's' : ''} added to cart`);
      }

      if (failedCount > 0) {
        toast.error('Partial Failure', `Failed to add ${failedCount} item${failedCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Failed to move items to cart:', error);
      toast.error('Error', 'Failed to add items to cart');
    }
  };

  const handleQuickView = (productId: string) => {
    const item = (items || []).find((i) => i.productId === productId);
    if (item) {
      setQuickViewProduct({
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        compareAtPrice: item.product.compareAtPrice,
        description: '',
        image: item.product.heroImage,
        images: [item.product.heroImage],
        inStock: item.product.isAvailable,
        rating: item.product.rating,
        reviewCount: item.product.reviewCount,
      });
    }
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    updateFilters({ sortBy: newSortBy });
  };

  const handleFilterChange = (availability: typeof filterAvailability) => {
    setFilterAvailability(availability);
    updateFilters({ availability });
  };

  const totalValue = (items || []).reduce((sum, item) => sum + (Number(item.product?.price) || 0), 0);

  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen py-12">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
              <Link href="/" className="hover:text-gold transition-colors">Home</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-black font-medium">Wishlist</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-black mb-2">
                  My Wishlist
                </h1>
                <p className="text-neutral-600">
                  {total ?? 0} item{(total ?? 0) !== 1 ? 's' : ''} • Total value: ${Number(totalValue || 0).toFixed(2)}
                </p>
              </div>
              {((total ?? 0) > 0 || (items || []).length > 0) && (
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMoveAllToCart}
                    disabled={(items || []).filter(i => i.product.isAvailable !== false && (i.product.inventory === undefined || i.product.inventory > 0)).length === 0}
                    className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add All to Cart
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearAll}
                    className="px-6 py-3 border-2 border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:border-red-500 hover:text-red-500 transition-all"
                  >
                    Clear All
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Filters & Sort */}
          {((total ?? 0) > 0 || (items || []).length > 0) && (
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-[#CBB57B] transition-colors"
              >
                <option value="recent">Recently Added</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
              <select
                value={filterAvailability}
                onChange={(e) => handleFilterChange(e.target.value as typeof filterAvailability)}
                className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-[#CBB57B] transition-colors"
              >
                <option value="all">All Items</option>
                <option value="inStock">In Stock</option>
                <option value="outOfStock">Out of Stock</option>
              </select>
            </div>
          )}

          {isLoading ? (
            /* Loading State */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="aspect-square bg-neutral-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4" />
                    <div className="h-6 bg-neutral-200 rounded animate-pulse w-1/2" />
                    <div className="h-10 bg-neutral-200 rounded animate-pulse w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (total ?? 0) === 0 && (items || []).length === 0 ? (
            /* Empty Wishlist */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-12 text-center"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-100 rounded-full mb-6">
                <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-black mb-2">Your wishlist is empty</h2>
              <p className="text-neutral-600 mb-8">Start adding items you love</p>
              <Link href="/products">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-neutral-800 transition-all"
                >
                  Browse Products
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            /* Wishlist Grid */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {(items || []).map((item, index) => (
                  <WishlistItemComponent
                    key={item.id}
                    item={item as any}
                    onRemove={handleRemove}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleQuickView}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Share Wishlist Section */}
          {((total ?? 0) > 0 || (items || []).length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 bg-gradient-to-br from-neutral-900 to-black rounded-2xl shadow-lg p-8 text-white text-center"
            >
              <h2 className="text-2xl font-serif font-bold mb-2">Share Your Wishlist</h2>
              <p className="text-white/80 mb-6">Let friends and family know what you love</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share via Email
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/10 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copy Link
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        product={quickViewProduct}
        onAddToCart={handleAddToCart}
        onViewDetails={(slug) => router.push(`/products/${slug}`)}
      />
    </PageLayout>
  );
}
