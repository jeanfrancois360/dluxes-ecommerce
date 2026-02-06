'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface WishlistButtonProps {
  productId: string;
  isInWishlist?: boolean;
  onToggle?: (productId: string, isAdding: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
  showTooltip?: boolean;
}

export function WishlistButton({
  productId,
  isInWishlist = false,
  onToggle,
  size = 'md',
  variant = 'default',
  showTooltip = true,
}: WishlistButtonProps) {
  const t = useTranslations('components.wishlistButton');
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    onToggle?.(productId, !isInWishlist);
  };

  const tooltipText = isInWishlist ? t('removeFromWishlist') : t('addToWishlist');

  return (
    <div className="relative group">
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${sizeClasses[size]}
          ${variant === 'default' ? 'bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white' : 'bg-transparent'}
          rounded-full transition-all relative overflow-hidden
        `}
        aria-label={tooltipText}
      >
        {/* Heart Icon */}
        <motion.svg
          className={`${iconSizes[size]} transition-colors ${
            isInWishlist
              ? 'text-red-500'
              : isHovered
              ? 'text-red-400'
              : variant === 'default'
              ? 'text-neutral-600'
              : 'text-white'
          }`}
          fill={isInWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          initial={false}
          animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </motion.svg>

        {/* Heart Beat Animation */}
        {isAnimating && isInWishlist && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
          </>
        )}
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 5 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none z-10"
        >
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black" />
        </motion.div>
      )}
    </div>
  );
}
