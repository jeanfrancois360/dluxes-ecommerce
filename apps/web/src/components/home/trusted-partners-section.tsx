'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Partner {
  id: string;
  name: string;
  logo: string;
  website: string | null;
}

export function TrustedPartnersSection() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/partners/active`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPartners(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (partners.length === 0) return null;

  return (
    <section className="py-10 bg-white border-t border-neutral-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">
          Trusted Partners
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {partners.map((partner, i) => {
            const content = (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center justify-center h-10 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-10 max-w-[120px] object-contain"
                  title={partner.name}
                />
              </motion.div>
            );

            return partner.website ? (
              <a
                key={partner.id}
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={partner.name}
              >
                {content}
              </a>
            ) : (
              <div key={partner.id}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
