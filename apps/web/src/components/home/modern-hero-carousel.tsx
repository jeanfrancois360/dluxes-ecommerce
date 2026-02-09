'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export interface HeroSlide {
  id: string;
  theme: 'dark' | 'light' | 'red' | 'yellow' | 'custom';
  customBgColor?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  ctaVariant?: 'primary' | 'secondary';
  disclaimer?: string;
  images: Array<{
    src: string;
    alt: string;
    rotate?: number;
    label?: string;
    href?: string;
  }>;
  badge?: {
    icon?: React.ReactNode;
    text: string;
  };
}

interface ModernHeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
}

const themeStyles = {
  dark: {
    bg: 'bg-neutral-900',
    text: 'text-white',
    subtitle: 'text-neutral-300',
    button: 'bg-white text-black hover:bg-neutral-100',
    dots: 'bg-white/40',
    dotsActive: 'bg-white',
    controls: 'bg-white text-neutral-900 hover:bg-neutral-100',
  },
  light: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-900',
    subtitle: 'text-neutral-600',
    button: 'bg-black text-white hover:bg-neutral-800',
    dots: 'bg-black/40',
    dotsActive: 'bg-black',
    controls: 'bg-white text-neutral-900 hover:bg-neutral-50 border border-neutral-200',
  },
  red: {
    bg: 'bg-[#E84D3D]',
    text: 'text-black',
    subtitle: 'text-black/80',
    button: 'bg-black/80 text-white hover:bg-black',
    dots: 'bg-white/40',
    dotsActive: 'bg-white',
    controls: 'bg-white text-neutral-900 hover:bg-neutral-100',
  },
  yellow: {
    bg: 'bg-[#F5A623]',
    text: 'text-black',
    subtitle: 'text-black/80',
    button: 'bg-black/80 text-white hover:bg-black',
    dots: 'bg-black/40',
    dotsActive: 'bg-black',
    controls: 'bg-white text-neutral-900 hover:bg-neutral-100',
  },
  custom: {
    bg: '',
    text: 'text-white',
    subtitle: 'text-white/80',
    button: 'bg-white text-black hover:bg-neutral-100',
    dots: 'bg-white/40',
    dotsActive: 'bg-white',
    controls: 'bg-white text-neutral-900 hover:bg-neutral-100',
  },
};

export function ModernHeroCarousel({ slides, autoPlayInterval = 5000 }: ModernHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const dragConstraints = useRef(null);

  const currentSlide = slides[currentIndex];
  const theme = themeStyles[currentSlide.theme];

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = useCallback(
    (e: any, { offset, velocity }: PanInfo) => {
      const swipe = swipePower(offset.x, velocity.x);

      if (swipe < -swipeConfidenceThreshold) {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else if (swipe > swipeConfidenceThreshold) {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    },
    [slides.length]
  );

  const handleImageError = useCallback((src: string) => {
    setImageErrors((prev) => ({ ...prev, [src]: true }));
  }, []);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide, autoPlayInterval, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, togglePlayPause]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1200 : -1200,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1200 : -1200,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
    }),
  };

  const contentVariants = {
    enter: {
      opacity: 0,
      y: 40,
      scale: 0.9,
    },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: -40,
      scale: 0.9,
    },
  };

  const imageVariants = {
    enter: (index: number) => ({
      opacity: 0,
      y: 60,
      rotate: 0,
      scale: 0.8,
    }),
    center: (index: number) => ({
      opacity: 1,
      y: 0,
      rotate: 0,
      scale: 1,
    }),
    exit: (index: number) => ({
      opacity: 0,
      y: -60,
      scale: 0.8,
    }),
  };

  return (
    <div className="relative w-full overflow-hidden -mt-[168px] pt-[168px]" ref={dragConstraints}>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSlide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: {
              type: 'spring',
              stiffness: 260,
              damping: 30,
              mass: 0.8,
            },
            opacity: {
              duration: 0.5,
              ease: [0.43, 0.13, 0.23, 0.96], // Custom cubic-bezier for smooth fade
            },
            scale: {
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1], // Subtle bounce for scale
            },
            filter: {
              duration: 0.4,
              ease: 'easeOut',
            },
          }}
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className={`relative h-[500px] ${currentSlide.theme === 'custom' && currentSlide.customBgColor ? '' : theme.bg} cursor-grab active:cursor-grabbing overflow-hidden`}
          style={
            currentSlide.theme === 'custom' && currentSlide.customBgColor
              ? { backgroundColor: currentSlide.customBgColor }
              : undefined
          }
        >
          {/* Animated Background Gradient Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 pointer-events-none"
          >
            <motion.div
              animate={{
                background: [
                  'radial-gradient(circle at 20% 50%, rgba(203, 181, 123, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(203, 181, 123, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(203, 181, 123, 0.15) 0%, transparent 50%)',
                ],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0"
            />
          </motion.div>

          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 h-full items-center">
              {/* Left Content */}
              <motion.div
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.6,
                  delay: 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94], // Smooth easeOutQuad
                }}
                className="flex flex-col justify-center space-y-6 py-12 lg:py-0"
              >
                <div className="space-y-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight ${theme.text}`}
                  >
                    {currentSlide.title}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.3,
                      duration: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={`text-lg sm:text-xl lg:text-2xl ${theme.subtitle}`}
                  >
                    {currentSlide.subtitle}
                  </motion.p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <Link href={currentSlide.ctaHref}>
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.4,
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{
                        scale: 0.95,
                        transition: { duration: 0.1 },
                      }}
                      className={`px-8 py-3.5 rounded-full font-semibold text-base sm:text-lg transition-all duration-200 ${theme.button}`}
                    >
                      {currentSlide.ctaText}
                    </motion.button>
                  </Link>

                  {currentSlide.disclaimer && (
                    <span className={`text-sm ${theme.subtitle} underline`}>
                      {currentSlide.disclaimer}
                    </span>
                  )}
                </div>

                {currentSlide.badge && (
                  <div className="flex items-center gap-2 pt-4">
                    {currentSlide.badge.icon}
                    <span className={`text-base font-medium ${theme.text}`}>
                      {currentSlide.badge.text}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Right Images Grid */}
              <div className="relative h-full hidden lg:flex items-center justify-center">
                <div className="relative w-full h-[400px] flex items-center justify-center gap-4">
                  {currentSlide.images.map((image, idx) => (
                    <motion.div
                      key={idx}
                      custom={idx}
                      variants={imageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        duration: 0.6,
                        delay: 0.25 + idx * 0.12, // Staggered animation
                        ease: [0.25, 0.46, 0.45, 0.94],
                        scale: {
                          type: 'spring',
                          stiffness: 260,
                          damping: 20,
                        },
                      }}
                      whileHover={{
                        scale: 1.05,
                        rotate: (image.rotate || 0) * 1.2,
                        y: -10,
                        transition: {
                          duration: 0.3,
                          ease: [0.34, 1.56, 0.64, 1],
                        },
                      }}
                      className="relative group"
                      style={{
                        rotate: image.rotate || 0,
                      }}
                    >
                      <Link
                        href={image.href || '#'}
                        className="block relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                      >
                        <div className="relative w-[240px] h-[280px] bg-neutral-100">
                          {!imageErrors[image.src] ? (
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              className="object-cover"
                              sizes="240px"
                              onError={() => handleImageError(image.src)}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center p-4">
                                <div className="w-16 h-16 mx-auto mb-2 bg-neutral-200 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-8 h-8 text-neutral-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-sm text-neutral-500">{image.alt}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {image.label && (
                          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm py-3 px-4">
                            <p className="text-neutral-900 font-semibold text-center flex items-center justify-center gap-2">
                              {image.label}
                              <ChevronRight className="h-4 w-4" />
                            </p>
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20"
      >
        {slides.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
              idx === currentIndex ? `w-8 ${theme.dotsActive}` : `w-2.5 ${theme.dots}`
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </motion.div>

      {/* Control Buttons */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-6 right-6 flex items-center gap-2 z-20"
      >
        <motion.button
          onClick={prevSlide}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${theme.controls}`}
          whileHover={{ scale: 1.1, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.95 }}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <motion.button
          onClick={nextSlide}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${theme.controls}`}
          whileHover={{ scale: 1.1, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.95 }}
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
        <motion.button
          onClick={togglePlayPause}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${theme.controls}`}
          whileHover={{ scale: 1.1, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </div>
  );
}
