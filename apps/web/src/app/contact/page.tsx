'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FloatingInput, FloatingSelect, FloatingTextarea, Button } from '@nextpik/ui';
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[300px] flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            {t('getInTouch')}
          </h1>
          <p className="text-xl md:text-2xl text-white/80">
            {t('hereToHelp')}
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">{t('sendMessage')}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FloatingInput
                    label={t('fullName')}
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                  <FloatingInput
                    label={t('emailAddress')}
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FloatingInput
                    label={t('phoneOptional')}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    }
                  />
                  <FloatingSelect
                    label={t('subject')}
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    options={[
                      { value: 'general', label: t('generalInquiry') },
                      { value: 'consultation', label: t('designConsultation') },
                      { value: 'order', label: t('orderSupport') },
                      { value: 'wholesale', label: t('wholesaleInquiry') },
                    ]}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    }
                  />
                </div>

                <FloatingTextarea
                  label={t('message')}
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                />

                <Button
                  type="submit"
                  className="w-full bg-gold text-black py-4 rounded-lg hover:bg-gold/90 transition-all duration-300 font-semibold text-lg"
                >
                  {submitted ? t('messageSent') : t('sendMessageButton')}
                </Button>

                {submitted && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-success-DEFAULT text-center"
                  >
                    {t('thankYouResponse')}
                  </motion.p>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">{t('contactInfo')}</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{t('email')}</h3>
                    <a href="mailto:support@nextpik.com" className="text-neutral-600 hover:text-[#CBB57B] transition-colors">
                      support@nextpik.com
                    </a>
                    <p className="text-sm text-neutral-500 mt-1">{t('respondWithin24h')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">
            {t('faq')}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: t('faqDesignConsultation'),
                a: t('faqDesignConsultationAnswer'),
              },
              {
                q: t('faqReturnPolicy'),
                a: t('faqReturnPolicyAnswer'),
              },
              {
                q: t('faqShipInternationally'),
                a: t('faqShipInternationallyAnswer'),
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-neutral-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
