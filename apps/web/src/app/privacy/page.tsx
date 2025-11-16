import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-neutral-600">
              Last updated: January 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">1. Introduction</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                At Luxury E-commerce ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                This privacy policy applies to information we collect when you use our website, mobile application, or otherwise interact with us.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">2. Information We Collect</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We collect several types of information for various purposes to provide and improve our service to you:
              </p>

              <h3 className="text-2xl font-semibold text-black mb-3 mt-6">Personal Information</h3>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>Name and contact information (email, phone number, address)</li>
                <li>Payment and billing information</li>
                <li>Account credentials (username and password)</li>
                <li>Purchase history and preferences</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-2xl font-semibold text-black mb-3 mt-6">Usage Information</h3>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Browsing behavior and shopping patterns</li>
                <li>Pages visited and time spent on our website</li>
                <li>Search queries and product interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">3. How We Use Your Information</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We use the information we collect for various purposes:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>To process and fulfill your orders</li>
                <li>To communicate with you about your account and orders</li>
                <li>To provide customer support and respond to your inquiries</li>
                <li>To personalize your shopping experience</li>
                <li>To send you marketing communications (with your consent)</li>
                <li>To detect and prevent fraud and security issues</li>
                <li>To improve our website, products, and services</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">4. Sharing Your Information</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We may share your personal information with:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our business (payment processors, shipping companies, marketing platforms)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our website and store certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
              </p>
              <h3 className="text-2xl font-semibold text-black mb-3 mt-6">Types of Cookies We Use:</h3>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the website to function</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Marketing Cookies:</strong> Track your browsing to show relevant ads</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">6. Data Security</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                However, please note that no method of transmission over the internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">7. Your Privacy Rights</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
                <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Restriction:</strong> Request restriction of processing your data</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at privacy@luxury.com.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">8. Children's Privacy</h2>
              <p className="text-neutral-700 leading-relaxed">
                Our website is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">9. International Data Transfers</h2>
              <p className="text-neutral-700 leading-relaxed">
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ. We will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this privacy policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-neutral-700 leading-relaxed">
                We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date. You are advised to review this privacy policy periodically for any changes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-black mb-4">11. Contact Us</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                If you have any questions about this privacy policy, please contact us:
              </p>
              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <p className="text-neutral-700">
                  <strong>Data Protection Officer</strong><br />
                  Luxury E-commerce<br />
                  123 Design Avenue<br />
                  New York, NY 10001<br />
                  Email: privacy@luxury.com<br />
                  Phone: +1 (555) 123-4567
                </p>
              </div>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-neutral-200 flex flex-wrap gap-6">
            <Link href="/terms" className="text-gold hover:text-accent-700 font-medium transition-colors">
              Terms of Service
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
