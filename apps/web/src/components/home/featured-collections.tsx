'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function FeaturedCollections() {
  const collections = [
    {
      id: 1,
      title: 'Living Room',
      description: 'Sophisticated seating and elegant accents',
      image: '/images/collections/living-room.jpg',
      href: '/collections/living-room',
      items: 145,
    },
    {
      id: 2,
      title: 'Bedroom',
      description: 'Luxurious beds and tranquil essentials',
      image: '/images/collections/bedroom.jpg',
      href: '/collections/bedroom',
      items: 98,
    },
    {
      id: 3,
      title: 'Dining Room',
      description: 'Exquisite tables and refined dining sets',
      image: '/images/collections/dining.jpg',
      href: '/collections/dining-room',
      items: 76,
    },
    {
      id: 4,
      title: 'Office',
      description: 'Productive workspace solutions',
      image: '/images/collections/office.jpg',
      href: '/collections/office',
      items: 62,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-black mb-4">
            Shop by Collection
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Explore our carefully curated collections designed to inspire and transform every room in your home.
          </p>
        </motion.div>

        {/* Collections Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {collections.map((collection) => (
            <motion.div key={collection.id} variants={itemVariants}>
              <Link href={collection.href} className="group block">
                <div className="relative h-96 rounded-2xl overflow-hidden bg-neutral-100">
                  {/* Placeholder for collection image */}
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                    <svg className="w-32 h-32 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 transition-all duration-500" />

                  {/* Hover Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gold/0 group-hover:bg-gold/10 transition-all duration-500"
                  />

                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <motion.div
                      initial={{ y: 0 }}
                      whileHover={{ y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-gold text-sm font-semibold mb-2">
                        {collection.items} Items
                      </p>
                      <h3 className="text-3xl font-serif font-bold text-white mb-2">
                        {collection.title}
                      </h3>
                      <p className="text-white/80 mb-4">{collection.description}</p>

                      <div className="flex items-center gap-2 text-gold group-hover:gap-4 transition-all">
                        <span className="font-semibold">Explore Collection</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link href="/collections">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-black text-white font-semibold text-lg rounded-lg hover:bg-neutral-800 transition-all"
            >
              View All Collections
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
