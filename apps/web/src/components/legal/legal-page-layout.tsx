'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  effectiveDate: string;
  version: string;
  sections: Section[];
  children: React.ReactNode;
  relatedLinks?: { label: string; href: string }[];
}

export function LegalPageLayout({
  title,
  lastUpdated,
  effectiveDate,
  version,
  sections,
  children,
  relatedLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Seller Agreement', href: '/seller-agreement' },
  ],
}: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showTOC, setShowTOC] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Show back to top button
      setShowBackToTop(window.scrollY > 400);

      // Find active section
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const currentSection = sectionElements.find(el => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
      setShowTOC(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Screen Version - Hidden in Print */}
      <div className="print:hidden">
        <PageLayout showFooter={true}>
          <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-200 print:border-0 print:bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 print:py-0">
            <div className="max-w-4xl">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-neutral-600 hover:text-gold font-medium transition-colors mb-6 print:hidden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>

              <h1 className="text-4xl md:text-5xl font-serif font-bold text-black mb-4 print:text-3xl print:mb-2">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-600 print:gap-4 print:mb-4">
                <div className="flex items-center gap-2 print:gap-1">
                  <svg className="w-4 h-4 print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="print:text-xs">Last Updated: {lastUpdated}</span>
                </div>
                <div className="flex items-center gap-2 print:gap-1">
                  <svg className="w-4 h-4 print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="print:text-xs">Effective: {effectiveDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gold/10 text-gold rounded text-xs font-semibold print:bg-transparent print:px-0 print:py-0">
                    Version {version}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 print:hidden">
                <button
                  onClick={() => setShowTOC(!showTOC)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-neutral-200 rounded-lg hover:border-gold transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Table of Contents
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-neutral-200 rounded-lg hover:border-gold transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Download
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table of Contents Dropdown */}
        <AnimatePresence>
          {showTOC && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-neutral-200 bg-neutral-50 overflow-hidden print:hidden"
            >
              <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                <div className="max-w-4xl">
                  <h3 className="text-lg font-semibold text-black mb-4">Jump to Section</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          activeSection === section.id
                            ? 'border-gold bg-gold/5 text-black font-medium'
                            : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                        }`}
                      >
                        {section.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 print:py-6 print:px-0">
          <div className="grid lg:grid-cols-[1fr_300px] gap-12 print:grid-cols-1 print:gap-0">
            {/* Content */}
            <div className="max-w-4xl print:max-w-none">
              <div className="prose prose-lg max-w-none legal-content">
                {children}
              </div>

              {/* Related Documents */}
              <div className="mt-16 pt-8 border-t border-neutral-200 print:hidden">
                <h3 className="text-lg font-semibold text-black mb-4">Related Documents</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {relatedLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-lg hover:border-gold transition-colors group"
                    >
                      <svg className="w-5 h-5 text-neutral-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-neutral-700 group-hover:text-black">
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="mt-8 p-6 bg-neutral-50 rounded-xl border border-neutral-200 print:hidden">
                <h4 className="font-semibold text-black mb-2">Questions about this document?</h4>
                <p className="text-sm text-neutral-600 mb-3">
                  If you have any questions or concerns, please contact our legal team.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-gold hover:text-accent-700 font-medium text-sm transition-colors"
                >
                  Contact Us
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Sticky Sidebar - Desktop Only */}
            <div className="hidden lg:block print:hidden">
              <div className="sticky top-24 space-y-6">
                {/* Quick Navigation */}
                <div className="bg-white border-2 border-neutral-200 rounded-xl p-6">
                  <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Quick Navigation
                  </h3>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-gold/10 text-gold font-medium'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                        }`}
                      >
                        {section.title}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-br from-gold/5 to-amber-50 border-2 border-gold/20 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-black text-sm mb-1">
                        Document Information
                      </p>
                      <ul className="text-xs text-neutral-600 space-y-1">
                        <li>Version: {version}</li>
                        <li>Last Updated: {lastUpdated}</li>
                        <li>Effective: {effectiveDate}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 p-4 bg-gold text-black rounded-full shadow-lg hover:shadow-xl transition-all print:hidden z-50 group"
              aria-label="Back to top"
            >
              <svg className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

      </div>
      </PageLayout>
      </div>

      {/* Print-Only Version - Clean Document */}
      <div className="hidden print:block">
        <div className="print-document">
          {/* Title and Metadata */}
          <div className="print-header">
            <h1>{title}</h1>
            <div className="print-meta">
              Last Updated: {lastUpdated} • Effective: {effectiveDate} • Version {version}
            </div>
          </div>

          {/* Content */}
          <div className="legal-content print-content">
            {children}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except print version */
          body > div > div:first-child {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          /* Show only print version */
          .print\\:block {
            display: block !important;
          }

          /* Page setup */
          @page {
            margin: 0.75in;
            size: letter;
          }

          /* Reset */
          body,
          html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Print header styling */
          .print-header h1 {
            font-size: 20pt;
            font-weight: bold;
            margin: 0 0 6pt 0;
            color: #000;
          }

          .print-meta {
            font-size: 9pt;
            color: #666;
            margin-bottom: 18pt;
          }

          /* Legal content typography */
          .print-content {
            font-size: 10.5pt;
            line-height: 1.5;
            color: #000;
          }

          .print-content h2 {
            font-size: 14pt;
            font-weight: bold;
            margin: 16pt 0 8pt 0;
            page-break-after: avoid;
          }

          .print-content h3 {
            font-size: 12pt;
            font-weight: 600;
            margin: 10pt 0 6pt 0;
            page-break-after: avoid;
          }

          .print-content h4 {
            font-size: 11pt;
            font-weight: 600;
            margin: 8pt 0 4pt 0;
            page-break-after: avoid;
          }

          .print-content p {
            margin: 0 0 6pt 0;
            line-height: 1.5;
          }

          .print-content ul,
          .print-content ol {
            margin: 4pt 0 8pt 0;
            padding-left: 18pt;
          }

          .print-content li {
            margin-bottom: 3pt;
            line-height: 1.4;
          }

          .print-content section {
            margin-bottom: 12pt;
          }

          /* Styled boxes */
          .print-content div[class*="bg-"] {
            border: 1pt solid #999;
            padding: 6pt;
            margin: 6pt 0;
            background: white !important;
          }

          /* Links */
          .print-content a {
            color: #000;
            text-decoration: none;
          }

          /* Remove decorative elements */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
            background-image: none !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
