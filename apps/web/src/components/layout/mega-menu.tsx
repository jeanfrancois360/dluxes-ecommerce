'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export interface MegaMenuSection {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface MegaMenuFeatured {
  title: string;
  image: string;
  href: string;
}

export interface MegaMenuProps {
  isOpen: boolean;
  sections: MegaMenuSection[];
  featured?: MegaMenuFeatured[];
  onClose: () => void;
}

export function MegaMenu({ isOpen, sections, featured, onClose }: MegaMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Mega Menu Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 bg-white border-t-2 border-[#CBB57B] shadow-2xl z-50"
          >
            <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-12">
              <div className="grid grid-cols-12 gap-8">
                {/* Category Sections */}
                <div className={`${featured ? 'col-span-9' : 'col-span-12'} grid grid-cols-${Math.min(sections.length, 4)} gap-8`}>
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <h3 className="font-serif text-lg font-bold text-black mb-4 pb-2 border-b-2 border-gray-100">
                        {section.title}
                      </h3>
                      <ul className="space-y-2.5">
                        {section.links.map((link) => (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              onClick={onClose}
                              className="text-sm text-gray-600 hover:text-[#CBB57B] hover:translate-x-1 transition-all duration-200 inline-block"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                {/* Featured Items */}
                {featured && featured.length > 0 && (
                  <div className="col-span-3">
                    <h3 className="font-serif text-lg font-bold text-black mb-4 pb-2 border-b-2 border-gray-100">
                      Featured
                    </h3>
                    <div className="space-y-4">
                      {featured.map((item, index) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                        >
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="group block relative aspect-[4/3] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                          >
                            <div className="relative w-full h-full bg-gray-100">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h4 className="text-white font-serif font-bold text-base group-hover:text-[#CBB57B] transition-colors">
                                {item.title}
                              </h4>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View All Link */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                  href="/products"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#CBB57B] hover:text-black transition-colors group"
                >
                  <span>View All Products</span>
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Predefined mega menu data
export const shopMegaMenuData: MegaMenuSection[] = [
  {
    title: 'Fashion',
    links: [
      { label: "Women's Clothing", href: '/products?category=womens-clothing' },
      { label: "Men's Clothing", href: '/products?category=mens-clothing' },
      { label: 'Shoes & Accessories', href: '/products?category=shoes' },
      { label: 'Bags & Wallets', href: '/products?category=bags' },
      { label: 'Watches & Jewelry', href: '/products?category=jewelry' },
    ],
  },
  {
    title: 'Electronics',
    links: [
      { label: 'Smartphones & Tablets', href: '/products?category=phones' },
      { label: 'Computers & Laptops', href: '/products?category=computers' },
      { label: 'Cameras & Photography', href: '/products?category=cameras' },
      { label: 'Audio & Headphones', href: '/products?category=audio' },
      { label: 'Smart Home', href: '/products?category=smart-home' },
    ],
  },
  {
    title: 'Home & Décor',
    links: [
      { label: 'Furniture', href: '/products?category=furniture' },
      { label: 'Lighting', href: '/products?category=lighting' },
      { label: 'Bedding & Bath', href: '/products?category=bedding' },
      { label: 'Kitchen & Dining', href: '/products?category=kitchen' },
      { label: 'Home Accessories', href: '/products?category=home-accessories' },
    ],
  },
  {
    title: 'More Categories',
    links: [
      { label: 'Beauty & Skincare', href: '/products?category=beauty' },
      { label: 'Sports & Outdoors', href: '/products?category=sports' },
      { label: 'Books & Media', href: '/products?category=books' },
      { label: 'Toys & Games', href: '/products?category=toys' },
      { label: 'Automotive', href: '/products?category=automotive' },
    ],
  },
];

export const shopMegaMenuFeatured: MegaMenuFeatured[] = [
  {
    title: 'New Spring Collection',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
    href: '/collections/spring-2024',
  },
  {
    title: 'Luxury Home Essentials',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600',
    href: '/collections/home-essentials',
  },
];

export const collectionsMegaMenuData: MegaMenuSection[] = [
  {
    title: 'Seasonal',
    links: [
      { label: 'Spring Collection', href: '/collections/spring' },
      { label: 'Summer Collection', href: '/collections/summer' },
      { label: 'Fall Collection', href: '/collections/fall' },
      { label: 'Winter Collection', href: '/collections/winter' },
    ],
  },
  {
    title: 'By Style',
    links: [
      { label: 'Modern Minimalist', href: '/collections/modern' },
      { label: 'Classic Elegance', href: '/collections/classic' },
      { label: 'Contemporary', href: '/collections/contemporary' },
      { label: 'Bohemian', href: '/collections/bohemian' },
    ],
  },
  {
    title: 'Special',
    links: [
      { label: 'Limited Edition', href: '/collections/limited' },
      { label: 'Designer Collaborations', href: '/collections/designer' },
      { label: 'Best Sellers', href: '/collections/bestsellers' },
      { label: 'New Arrivals', href: '/collections/new' },
    ],
  },
];
