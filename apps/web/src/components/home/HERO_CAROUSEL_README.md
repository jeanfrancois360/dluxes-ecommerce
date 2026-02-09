# Modern Hero Carousel

## Overview

The Modern Hero Carousel is an eBay-inspired, production-ready carousel component for NextPik's homepage. It features:

- **Multiple themed slides** with different color schemes
- **Tilted product cards** with smooth animations
- **Touch/swipe gestures** for mobile devices
- **Auto-play functionality** with play/pause controls
- **Keyboard navigation** (arrow keys + spacebar)
- **Graceful image error handling** with fallbacks
- **Full accessibility** support
- **Responsive design** for all screen sizes

## Features

### Slide Themes

The carousel supports 5 built-in themes:

1. **Dark** - Black background with white text (great for automotive/tech products)
2. **Light** - White/gray background with dark text (clean, modern look)
3. **Red** - Bold red background (perfect for promotions/sales)
4. **Yellow** - Vibrant yellow background (ideal for collectibles/fun products)
5. **Custom** - Use any custom color via `customBgColor` prop

### Interactive Controls

- **Navigation dots** - Click to jump to any slide
- **Prev/Next buttons** - Navigate between slides
- **Play/Pause button** - Control auto-play
- **Keyboard shortcuts**:
  - Left/Right arrows: Navigate slides
  - Spacebar: Toggle play/pause
- **Touch gestures**: Swipe left/right on mobile/tablet

## Usage

### Basic Example

```tsx
import { ModernHeroCarousel } from '@/components/home/modern-hero-carousel';

const slides = [
  {
    id: 'slide1',
    theme: 'dark',
    title: 'Endless accessories. Epic prices.',
    subtitle: 'Browse millions of upgrades for your ride.',
    ctaText: 'Shop now',
    ctaHref: '/products',
    images: [
      { src: '/images/product1.jpg', alt: 'Product 1', rotate: -8 },
      { src: '/images/product2.jpg', alt: 'Product 2', rotate: 0 },
      { src: '/images/product3.jpg', alt: 'Product 3', rotate: 8 },
    ],
  },
];

<ModernHeroCarousel slides={slides} autoPlayInterval={5000} />;
```

### Slide Configuration

#### HeroSlide Interface

```typescript
interface HeroSlide {
  id: string; // Unique identifier
  theme: 'dark' | 'light' | 'red' | 'yellow' | 'custom';
  customBgColor?: string; // Only for 'custom' theme
  title: string; // Main headline
  subtitle: string; // Supporting text
  ctaText: string; // Button text
  ctaHref: string; // Button link
  ctaVariant?: 'primary' | 'secondary';
  disclaimer?: string; // Optional small print
  images: Array<{
    src: string; // Image URL
    alt: string; // Alt text
    rotate?: number; // Rotation angle in degrees (-15 to 15)
    label?: string; // Category label (optional)
    href?: string; // Click destination (optional)
  }>;
  badge?: {
    icon?: React.ReactNode; // Optional icon
    text: string; // Badge text
  };
}
```

## Examples

### 1. Dark Theme with Tilted Cards

```typescript
{
  id: 'automotive',
  theme: 'dark',
  title: 'Endless accessories. Epic prices.',
  subtitle: 'Browse millions of upgrades for your ride.',
  ctaText: 'Shop now',
  ctaHref: '/products?category=automotive',
  images: [
    { src: '/images/seat.jpg', alt: 'Racing Seat', rotate: -8 },
    { src: '/images/mat.jpg', alt: 'Floor Mat', rotate: 0 },
    { src: '/images/pedals.jpg', alt: 'Pedals', rotate: 8 },
  ],
}
```

### 2. Light Theme with Category Labels

```typescript
{
  id: 'electronics',
  theme: 'light',
  title: 'Top tech for your ride',
  subtitle: 'Explore in-car entertainment, GPS, security devices, and more.',
  ctaText: 'Shop now',
  ctaHref: '/products?category=electronics',
  images: [
    {
      src: '/images/entertainment.jpg',
      alt: 'Entertainment System',
      label: 'Entertainment',
      href: '/products?subcategory=entertainment',
    },
    {
      src: '/images/gps.jpg',
      alt: 'GPS Device',
      label: 'GPS',
      href: '/products?subcategory=gps',
    },
    {
      src: '/images/camera.jpg',
      alt: 'Security Camera',
      label: 'Security devices',
      href: '/products?subcategory=security',
    },
  ],
}
```

### 3. Red Theme with Disclaimer (Promotions)

```typescript
{
  id: 'valentines',
  theme: 'red',
  title: 'Wrong person? Right gift',
  subtitle: "You can't go wrong with up to $150* off this Valentine's Day.",
  ctaText: 'Shop now',
  ctaHref: '/products?sale=valentines',
  disclaimer: '*See terms and conditions.',
  badge: {
    icon: <Heart className="h-5 w-5" />,
    text: "Valentine's Day",
  },
  images: [
    { src: '/images/watch.jpg', alt: 'Watch', rotate: -6 },
    { src: '/images/discount.jpg', alt: '$150 Off', rotate: 0 },
    { src: '/images/cameras.jpg', alt: 'Cameras', rotate: 6 },
  ],
}
```

### 4. Yellow Theme (Collectibles)

```typescript
{
  id: 'collectibles',
  theme: 'yellow',
  title: 'Build an elite collection',
  subtitle: 'Choose your next adventure from thousands of finds.',
  ctaText: 'Start your journey',
  ctaHref: '/products?category=collectibles',
  images: [
    { src: '/images/cards.jpg', alt: 'Trading Cards', label: 'Trading cards' },
    { src: '/images/toys.jpg', alt: 'Collectible Toys', label: 'Toys' },
    { src: '/images/sports.jpg', alt: 'Sports Cards', label: 'Sports cards' },
  ],
}
```

### 5. Custom Theme

```typescript
{
  id: 'luxury',
  theme: 'custom',
  customBgColor: '#2c1810', // Dark brown
  title: 'Discover luxury living',
  subtitle: 'Premium furniture and decor that transforms your space.',
  ctaText: 'Explore collection',
  ctaHref: '/products?category=furniture',
  images: [
    { src: '/images/sofa.jpg', alt: 'Luxury Sofa', rotate: -6 },
    { src: '/images/chair.jpg', alt: 'Designer Chair', rotate: 0 },
    { src: '/images/decor.jpg', alt: 'Home Decor', rotate: 6 },
  ],
}
```

## Image Guidelines

### Recommended Specifications

- **Format**: JPG, PNG, or WebP
- **Dimensions**: 400x500px (portrait orientation)
- **File Size**: < 200KB per image
- **Quality**: 80-90%

### Image Structure

```
public/
  images/
    hero/
      slide1/
        image1.jpg
        image2.jpg
        image3.jpg
      slide2/
        image1.jpg
        image2.jpg
        image3.jpg
```

### Using Unsplash (Placeholder Images)

The current implementation uses Unsplash for demo images:

```typescript
src: 'https://images.unsplash.com/photo-[ID]?w=400&h=500&fit=crop';
```

**Replace these with your actual product images before production!**

## Translations

Add hero slides to `/apps/web/messages/en.json`:

```json
{
  "common": {
    "home": {
      "hero": {
        "slide1": {
          "title": "Your headline here",
          "subtitle": "Your subtitle here",
          "cta": "Call to action"
        }
      }
    }
  }
}
```

Usage in component:

```typescript
const tHero = useTranslations('common.home.hero');

const slides = [
  {
    title: tHero('slide1.title'),
    subtitle: tHero('slide1.subtitle'),
    ctaText: tHero('slide1.cta'),
    // ...
  },
];
```

## Customization

### Adjusting Auto-Play Speed

```tsx
<ModernHeroCarousel slides={slides} autoPlayInterval={8000} /> // 8 seconds
```

### Modifying Theme Colors

Edit the `themeStyles` object in `modern-hero-carousel.tsx`:

```typescript
const themeStyles = {
  dark: {
    bg: 'bg-neutral-900',
    text: 'text-white',
    button: 'bg-white text-black hover:bg-neutral-100',
    // ...
  },
  // Add your custom theme
};
```

### Changing Carousel Height

Modify the height class on the motion.div:

```tsx
className = 'relative h-[500px] ...'; // Default
className = 'relative h-[600px] ...'; // Taller
className = 'relative h-[400px] ...'; // Shorter
```

### Disabling Auto-Play by Default

```typescript
const [isPlaying, setIsPlaying] = useState(false); // Change from true
```

## Accessibility

The carousel includes:

- ✅ Proper ARIA labels on all controls
- ✅ Keyboard navigation support
- ✅ Semantic HTML structure
- ✅ Alt text on all images
- ✅ Focus indicators
- ✅ Screen reader friendly

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## Performance

The carousel is optimized for performance:

- **Lazy loading**: Component is lazy-loaded on home page
- **Image optimization**: Next.js Image component with automatic WebP
- **Animation**: GPU-accelerated with Framer Motion
- **Bundle size**: ~15KB gzipped (including animations)

## Troubleshooting

### Images Not Loading

1. Check image paths are correct
2. Verify images exist in `/public/images/`
3. Check browser console for 404 errors
4. Fallback placeholders will display automatically

### Carousel Not Auto-Playing

1. Check `isPlaying` state is `true`
2. Verify `autoPlayInterval` prop is set
3. Ensure there are 2+ slides

### Swipe Gestures Not Working

1. Verify Framer Motion is installed
2. Check mobile device supports touch events
3. Try adjusting `swipeConfidenceThreshold`

## Credits

Inspired by eBay's modern hero carousel design (2024).

Built with:

- Next.js 15
- Framer Motion
- TypeScript
- Tailwind CSS
