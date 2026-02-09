'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, Zap, TrendingUp } from 'lucide-react';

export interface CreativeHeroSlide {
  id: string;
  layout: 'split' | 'overlay' | 'asymmetric' | 'centered' | 'diagonal';
  gradient: string;
  accentColor: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  icon?: React.ReactNode;
  images: Array<{
    src: string;
    alt: string;
    size?: 'small' | 'medium' | 'large';
    position?: { x: number; y: number };
  }>;
  shapes?: Array<{
    type: 'circle' | 'square' | 'blob';
    color: string;
    size: number;
    position: { x: number; y: number };
    blur?: boolean;
  }>;
}

interface CreativeHeroCarouselProps {
  slides: CreativeHeroSlide[];
  autoPlayInterval?: number;
}

export function CreativeHeroCarousel({
  slides,
  autoPlayInterval = 6000,
}: CreativeHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const dragConstraints = useRef(null);

  // Mouse tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const currentSlide = slides[currentIndex];

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

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

  const handleDragEnd = useCallback(
    (e: any, { offset, velocity }: PanInfo) => {
      const swipe = swipePower(offset.x, velocity.x);
      if (swipe < -swipeConfidenceThreshold) {
        nextSlide();
      } else if (swipe > swipeConfidenceThreshold) {
        prevSlide();
      }
    },
    [nextSlide, prevSlide]
  );

  const handleImageError = useCallback((src: string) => {
    setImageErrors((prev) => ({ ...prev, [src]: true }));
  }, []);

  // Auto-play
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
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  const renderLayout = () => {
    switch (currentSlide.layout) {
      case 'split':
        return (
          <SplitLayout
            slide={currentSlide}
            mouseX={mouseX}
            mouseY={mouseY}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        );
      case 'overlay':
        return (
          <OverlayLayout
            slide={currentSlide}
            mouseX={mouseX}
            mouseY={mouseY}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        );
      case 'asymmetric':
        return (
          <AsymmetricLayout
            slide={currentSlide}
            mouseX={mouseX}
            mouseY={mouseY}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        );
      case 'centered':
        return (
          <CenteredLayout
            slide={currentSlide}
            mouseX={mouseX}
            mouseY={mouseY}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        );
      case 'diagonal':
        return (
          <DiagonalLayout
            slide={currentSlide}
            mouseX={mouseX}
            mouseY={mouseY}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        );
      default:
        return (
          <SplitLayout
            slide={currentSlide}
            mouseX={mouseX}
            mouseY={mouseY}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        );
    }
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
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 },
            rotateY: { duration: 0.5 },
          }}
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onMouseMove={handleMouseMove}
          className="relative h-[400px] sm:h-[420px] md:h-[450px] lg:h-[450px] cursor-grab active:cursor-grabbing overflow-hidden"
          style={{
            background: currentSlide.gradient,
          }}
        >
          {/* Animated background shapes */}
          {currentSlide.shapes?.map((shape, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              className="absolute pointer-events-none"
              style={{
                left: `${shape.position.x}%`,
                top: `${shape.position.y}%`,
                width: shape.size,
                height: shape.size,
                backgroundColor: shape.color,
                borderRadius:
                  shape.type === 'circle'
                    ? '50%'
                    : shape.type === 'blob'
                      ? '30% 70% 70% 30% / 30% 30% 70% 70%'
                      : '0',
                filter: shape.blur ? 'blur(60px)' : 'none',
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 h-full">{renderLayout()}</div>
        </motion.div>
      </AnimatePresence>

      {/* Modern Navigation Dots */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 sm:gap-3 z-20 backdrop-blur-xl bg-white/20 px-2 sm:px-3 py-3 sm:py-4 rounded-full border border-white/30 shadow-lg"
      >
        {slides.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`relative w-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'h-8 bg-white' : 'h-2 bg-white/50'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to slide ${idx + 1}`}
          >
            {idx === currentIndex && (
              <motion.div
                layoutId="activeDot"
                className="absolute inset-0 bg-gradient-to-b from-white to-white/80 rounded-full"
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Glassmorphic Control Buttons */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2 z-20"
      >
        {[
          { icon: ChevronLeft, onClick: prevSlide, label: 'Previous' },
          { icon: ChevronRight, onClick: nextSlide, label: 'Next' },
          {
            icon: isPlaying ? Pause : Play,
            onClick: togglePlayPause,
            label: isPlaying ? 'Pause' : 'Play',
          },
        ].map((btn, idx) => (
          <motion.button
            key={idx}
            onClick={btn.onClick}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 shadow-xl"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label={btn.label}
          >
            <btn.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </motion.button>
        ))}
      </motion.div>

      {/* Slide counter - Hidden on mobile, visible on desktop */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="hidden md:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 backdrop-blur-xl bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30 shadow-lg"
      >
        <span className="text-white font-bold text-xs sm:text-sm">
          {currentIndex + 1} / {slides.length}
        </span>
      </motion.div>
    </div>
  );
}

// Layout Components
function SplitLayout({ slide, mouseX, mouseY, imageErrors, onImageError }: any) {
  const x = useTransform(mouseX, [-1, 1], [-15, 15]);
  const y = useTransform(mouseY, [-1, 1], [-15, 15]);

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 h-full flex items-center pt-12 sm:pt-16 md:pt-8 lg:pt-4">
      <div className="w-full grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3 sm:space-y-4 md:space-y-5"
        >
          {/* Icon badge - Hidden */}
          {/* {slide.icon && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm"
            >
              {slide.icon}
            </motion.div>
          )} */}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] text-white"
          >
            {slide.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base sm:text-lg lg:text-xl text-white/80 max-w-xl leading-relaxed"
          >
            {slide.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link href={slide.ctaHref}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base bg-white text-black shadow-xl border-2 border-white hover:bg-white/90 transition-all duration-200"
              >
                {slide.ctaText}
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Images with Parallax */}
        <motion.div
          style={{ x, y }}
          className="relative h-[180px] sm:h-[250px] md:h-[300px] lg:h-[350px] flex items-center justify-center mt-6 lg:mt-0"
        >
          {slide.images.map((img: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: idx * 6 - 6 }}
              transition={{ delay: 0.5 + idx * 0.1, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.08, rotate: idx * 8 - 8, z: 50 }}
              className="absolute"
              style={{
                left: `${idx * 22}%`,
                top: `${idx * 12}%`,
                zIndex: slide.images.length - idx,
              }}
            >
              <div className="relative w-32 h-40 sm:w-40 sm:h-52 md:w-48 md:h-64 lg:w-56 lg:h-72 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/5 border border-white/10">
                {!imageErrors[img.src] ? (
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, (max-width: 1024px) 192px, 224px"
                    className="object-cover"
                    onError={() => onImageError(img.src)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                    <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-white/50" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function OverlayLayout({ slide, mouseX, mouseY, imageErrors, onImageError }: any) {
  return (
    <div className="relative h-full flex items-center justify-center px-8">
      {/* Background Image */}
      {slide.images[0] && (
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.25 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <Image
            src={slide.images[0].src}
            alt={slide.images[0].alt}
            fill
            className="object-cover"
            onError={() => onImageError(slide.images[0].src)}
          />
        </motion.div>
      )}

      {/* Centered Content with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 text-center max-w-3xl mx-auto px-8 py-10 rounded-2xl backdrop-blur-2xl bg-black/40 border border-white/10 shadow-2xl"
      >
        {slide.icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="inline-flex p-6 rounded-full bg-white/20 backdrop-blur-sm mb-8"
          >
            {slide.icon}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.1]"
        >
          {slide.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg lg:text-xl text-white/80 mb-8 leading-relaxed"
        >
          {slide.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href={slide.ctaHref}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-base bg-white text-black shadow-2xl border-2 border-white hover:bg-white/90"
            >
              {slide.ctaText}
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

function AsymmetricLayout({ slide, mouseX, mouseY, imageErrors, onImageError }: any) {
  const x = useTransform(mouseX, [-1, 1], [-20, 20]);
  const y = useTransform(mouseY, [-1, 1], [-20, 20]);

  return (
    <div className="relative h-full px-8 flex items-center">
      {/* Diagonal split design */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden py-8">
        {/* Top right images */}
        <motion.div style={{ x, y }} className="absolute top-8 right-12 space-y-3">
          {slide.images.slice(0, 2).map((img: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 100, rotate: 10 }}
              animate={{ opacity: 1, x: 0, rotate: idx * 5 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ scale: 1.1, rotate: idx * 8 }}
              className="w-56 h-72 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                onError={() => onImageError(img.src)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom left content */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-8 left-8 max-w-lg space-y-4 p-6 rounded-2xl backdrop-blur-2xl bg-black/40 border border-white/10"
        >
          <motion.h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1]">
            {slide.title}
          </motion.h1>
          <motion.p className="text-base lg:text-lg text-white/80 leading-relaxed">
            {slide.subtitle}
          </motion.p>
          <Link href={slide.ctaHref}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-xl font-semibold text-base border-2"
              style={{
                backgroundColor: slide.accentColor,
                color: '#000000',
                borderColor: slide.accentColor,
              }}
            >
              {slide.ctaText}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function CenteredLayout({ slide, mouseX, mouseY, imageErrors, onImageError }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="flex gap-4 justify-center"
        >
          {slide.images.slice(0, 3).map((img: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              whileHover={{ y: -10, scale: 1.05 }}
              className="w-40 h-52 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/5 border border-white/10"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                onError={() => onImageError(img.src)}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1]">
            {slide.title}
          </h1>
          <p className="text-lg lg:text-xl text-white/80 leading-relaxed">{slide.subtitle}</p>
          <Link href={slide.ctaHref}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-base border-2 mt-2"
              style={{
                backgroundColor: slide.accentColor,
                color: '#000000',
                borderColor: slide.accentColor,
              }}
            >
              {slide.ctaText}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function DiagonalLayout({ slide, mouseX, mouseY, imageErrors, onImageError }: any) {
  return (
    <div className="relative h-full overflow-hidden">
      {/* Diagonal line separator */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="absolute inset-0 origin-left"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 50%)',
        }}
      />

      <div className="max-w-[1920px] mx-auto px-8 lg:px-16 h-full flex items-center">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl space-y-5 z-10"
        >
          <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1]">
            {slide.title}
          </motion.h1>
          <motion.p className="text-lg lg:text-xl text-white/80 leading-relaxed">
            {slide.subtitle}
          </motion.p>
          <Link href={slide.ctaHref}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-base border-2"
              style={{
                backgroundColor: slide.accentColor,
                color: '#000000',
                borderColor: slide.accentColor,
              }}
            >
              {slide.ctaText}
            </motion.button>
          </Link>
        </motion.div>

        {/* Images arranged diagonally */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
          {slide.images.map((img: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.4 + idx * 0.15, type: 'spring' }}
              whileHover={{ scale: 1.1, zIndex: 50 }}
              className="absolute w-56 h-72 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20"
              style={{
                top: `${10 + idx * 25}%`,
                right: `${10 + idx * 15}%`,
              }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                onError={() => onImageError(img.src)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
