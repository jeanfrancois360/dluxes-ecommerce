import { Metadata } from 'next';
import { helpMetadata } from '@/lib/metadata';
import { StructuredData, generateFAQSchema } from '@/lib/seo';

export const metadata: Metadata = helpMetadata;

const faqSchema = generateFAQSchema([
  {
    question: 'How long does shipping take?',
    answer:
      'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Overnight delivery is available in select regions.',
  },
  {
    question: 'Do you ship internationally?',
    answer:
      'Yes, NextPik ships to over 100 countries. International shipping typically takes 7-14 business days depending on the destination.',
  },
  {
    question: 'How do I track my order?',
    answer:
      'Once your order ships, you will receive a tracking number via email. You can also track your order in the "My Orders" section of your account.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 30-day return policy for most items. Items must be in original condition with all tags attached. Some categories like luxury goods may have specific return conditions.',
  },
  {
    question: 'How do I initiate a return?',
    answer:
      'To initiate a return, go to your account, find the order, and click "Request Return". Our team will review your request within 24 hours.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers. All payments are secured with SSL encryption.',
  },
  {
    question: 'How do I become a seller on NextPik?',
    answer:
      'To become a seller, click "Become a Seller" in the navigation, complete the application form, and submit your store details. Approval typically takes 1-2 business days.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Yes. NextPik uses Stripe for payment processing, which is PCI DSS Level 1 certified — the highest level of security in the payment industry. We never store your full card details.',
  },
]);

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={faqSchema} />
      {children}
    </>
  );
}
