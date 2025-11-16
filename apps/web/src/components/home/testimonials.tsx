'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Interior Designer',
      location: 'New York, NY',
      image: '/images/testimonials/sarah.jpg',
      rating: 5,
      text: "The quality and craftsmanship of their furniture is unmatched. Every piece I've ordered has exceeded my expectations. My clients are always impressed!",
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Architect',
      location: 'San Francisco, CA',
      image: '/images/testimonials/michael.jpg',
      rating: 5,
      text: 'As an architect, I appreciate attention to detail. Luxury delivers on every front - from design to delivery. Their collection perfectly complements modern aesthetics.',
    },
    {
      id: 3,
      name: 'Emma Williams',
      role: 'Homeowner',
      location: 'Chicago, IL',
      image: '/images/testimonials/emma.jpg',
      rating: 5,
      text: 'Transformed my entire home with their collections. The customer service was exceptional, and the pieces are truly investment-worthy. Highly recommend!',
    },
  ];

  return (
    <section className="py-24 bg-neutral-50">
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
            What Our Clients Say
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have transformed their spaces with our luxury furniture.
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0,
                  x: activeIndex === index ? 0 : 100,
                  display: activeIndex === index ? 'block' : 'none',
                }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-12 shadow-2xl"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-6 h-6 text-gold"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-2xl md:text-3xl font-serif text-neutral-800 mb-8 leading-relaxed">
                  "{testimonial.text}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-black">{testimonial.name}</p>
                    <p className="text-neutral-600">{testimonial.role}</p>
                    <p className="text-sm text-neutral-500">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Navigation Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? 'bg-gold w-12'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-20 border-t border-neutral-200"
        >
          <div className="text-center">
            <motion.p
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="text-5xl font-bold text-gold mb-2"
            >
              15K+
            </motion.p>
            <p className="text-neutral-600">Happy Customers</p>
          </div>
          <div className="text-center">
            <motion.p
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring', delay: 0.1 }}
              className="text-5xl font-bold text-gold mb-2"
            >
              500+
            </motion.p>
            <p className="text-neutral-600">Premium Products</p>
          </div>
          <div className="text-center">
            <motion.p
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring', delay: 0.2 }}
              className="text-5xl font-bold text-gold mb-2"
            >
              98%
            </motion.p>
            <p className="text-neutral-600">Satisfaction Rate</p>
          </div>
          <div className="text-center">
            <motion.p
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring', delay: 0.3 }}
              className="text-5xl font-bold text-gold mb-2"
            >
              50+
            </motion.p>
            <p className="text-neutral-600">Countries Shipped</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
