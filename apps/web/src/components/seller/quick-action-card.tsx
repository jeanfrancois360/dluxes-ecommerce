'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  index?: number;
}

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  index = 0,
}: QuickActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={href}
        className="block bg-white rounded-lg shadow-sm border border-neutral-200 p-6 transition-all duration-200 hover:shadow-md hover:border-[#CBB57B]"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-black rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-black mb-1">{title}</h3>
            <p className="text-sm text-neutral-600">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
