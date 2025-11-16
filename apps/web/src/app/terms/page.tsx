import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <PageLayout>
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link href="/" className="text-gold hover:text-accent-700 font-medium transition-colors mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-black mb-4">
              Terms of Service
            </h1>
            <p className="text-neutral-600">
              Last updated: January 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">1. Acceptance of Terms</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                By accessing and using Luxury E-commerce ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                We reserve the right to update, change or replace any part of these Terms of Service by posting updates and/or changes to our website. It is your responsibility to check this page periodically for changes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">2. Use License</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Permission is granted to temporarily download one copy of the materials (information or software) on Luxury E-commerce's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed">
                This license shall automatically terminate if you violate any of these restrictions and may be terminated by Luxury E-commerce at any time.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">3. Product Information</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the site. However, we do not guarantee that the colors, features, specifications, and details will be accurate, complete, reliable, current, or free of other errors.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                All products are subject to availability. We reserve the right to discontinue any products at any time for any reason. Prices for products are subject to change without notice.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">4. Pricing and Payment</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. These restrictions may include orders placed by or under the same customer account, the same credit card, and/or orders that use the same billing and/or shipping address.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                All prices are in USD and are subject to change. We accept Visa, Mastercard, American Express, PayPal, and other payment methods as indicated at checkout. Payment is due upon placing your order.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">5. Shipping and Delivery</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We ship to addresses within the United States and select international locations. Shipping times vary based on location and selected shipping method. We are not responsible for delays caused by shipping carriers or customs processing.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                Title and risk of loss for all products pass to you upon delivery to the shipping carrier. We are not responsible for products lost or damaged in transit.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">6. Returns and Refunds</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We offer a 30-day return policy on most items. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging with all tags attached.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                Once we receive your return, we will inspect it and notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will be applied to your original method of payment within 3-5 business days.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">7. User Accounts</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">8. Prohibited Uses</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                In addition to other prohibitions as set forth in the Terms of Service, you are prohibited from using the site or its content:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>For any unlawful purpose</li>
                <li>To solicit others to perform or participate in any unlawful acts</li>
                <li>To violate any international, federal, provincial or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">9. Limitation of Liability</h2>
              <p className="text-neutral-700 leading-relaxed">
                In no event shall Luxury E-commerce or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the website, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">10. Contact Information</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Questions about the Terms of Service should be sent to us at:
              </p>
              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <p className="text-neutral-700">
                  <strong>Luxury E-commerce</strong><br />
                  123 Design Avenue<br />
                  New York, NY 10001<br />
                  Email: legal@luxury.com<br />
                  Phone: +1 (555) 123-4567
                </p>
              </div>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-neutral-200 flex flex-wrap gap-6">
            <Link href="/privacy" className="text-gold hover:text-accent-700 font-medium transition-colors">
              Privacy Policy
            </Link>
            <Link href="/help" className="text-gold hover:text-accent-700 font-medium transition-colors">
              Help Center
            </Link>
            <Link href="/contact" className="text-gold hover:text-accent-700 font-medium transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
