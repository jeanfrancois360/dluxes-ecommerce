import { LegalPageLayout } from '@/components/legal/legal-page-layout';
import Link from 'next/link';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'account-security', title: '2. Account Registration and Security' },
  { id: 'platform-usage', title: '3. Platform Usage' },
  { id: 'product-listings', title: '4. Product Listings and Purchases' },
  { id: 'multi-vendor', title: '5. Multi-Vendor Marketplace' },
  { id: 'shipping', title: '6. Shipping and Delivery' },
  { id: 'returns', title: '7. Returns, Refunds, and Cancellations' },
  { id: 'reviews', title: '8. Reviews and Ratings' },
  { id: 'prohibited', title: '9. Prohibited Activities' },
  { id: 'privacy', title: '10. Privacy and Data Protection' },
  { id: 'disclaimers', title: '11. Disclaimers and Limitations of Liability' },
  { id: 'indemnification', title: '12. Indemnification' },
  { id: 'disputes', title: '13. Dispute Resolution' },
  { id: 'platform-features', title: '14. Platform Features and Policies' },
  { id: 'contact', title: '15. Contact Information' },
  { id: 'acknowledgment', title: '16. Acknowledgment' },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="January 2, 2026"
      effectiveDate="January 3, 2026"
      version="1.0.0"
      sections={sections}
    >
      {/* 1. Introduction */}
      <section id="introduction" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">1. Introduction</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Welcome to NextPik ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the NextPik platform, including our website, mobile applications, and related services (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4 mt-6">1.1 Acceptance of Terms</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          By creating an account, browsing products, making a purchase, or otherwise using our Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not use the Platform.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">1.2 Eligibility</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          You must be at least 18 years old to use the Platform. By using the Platform, you represent and warrant that you are of legal age to form a binding contract and meet all eligibility requirements.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">1.3 Changes to Terms</h3>
        <p className="text-neutral-700 leading-relaxed">
          We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Platform and updating the "Last Updated" date. Your continued use of the Platform after such changes constitutes your acceptance of the modified Terms.
        </p>
      </section>

      {/* 2. Account Registration and Security */}
      <section id="account-security" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">2. Account Registration and Security</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">2.1 Account Creation</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          To access certain features of the Platform, you must create an account. You agree to:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain and promptly update your account information</li>
          <li>Keep your password secure and confidential</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
          <li>Be responsible for all activities that occur under your account</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">2.2 Account Types</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          NextPik offers different account types:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li><strong>Buyer Account:</strong> For purchasing products</li>
          <li><strong>Seller Account:</strong> For selling products (subject to additional Seller Agreement)</li>
          <li><strong>Delivery Partner Account:</strong> For providing delivery services</li>
          <li><strong>Admin Account:</strong> For platform management (by invitation only)</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">2.3 Account Termination</h3>
        <p className="text-neutral-700 leading-relaxed">
          We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or extended period of inactivity. You may terminate your account at any time by contacting customer support.
        </p>
      </section>

      {/* 3. Platform Usage */}
      <section id="platform-usage" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">3. Platform Usage</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">3.1 Permitted Use</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You may use the Platform only for lawful purposes and in accordance with these Terms. You agree not to:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon the rights of others</li>
          <li>Transmit any harmful or malicious code</li>
          <li>Attempt to gain unauthorized access to the Platform</li>
          <li>Interfere with the proper functioning of the Platform</li>
          <li>Use automated systems (bots, scrapers) without our permission</li>
          <li>Engage in any fraudulent or deceptive practices</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">3.2 Intellectual Property</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          All content on the Platform, including text, graphics, logos, images, software, and designs, is the property of NextPik or our licensors and is protected by copyright, trademark, and other intellectual property laws.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">3.3 User-Generated Content</h3>
        <p className="text-neutral-700 leading-relaxed">
          By posting content on the Platform (reviews, comments, product listings), you grant NextPik a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content.
        </p>
      </section>

      {/* 4. Product Listings and Purchases */}
      <section id="product-listings" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">4. Product Listings and Purchases</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">4.1 Product Information</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Product listings on the Platform are created by sellers. While we strive for accuracy, we cannot guarantee that all product descriptions, images, prices, and availability information are complete, accurate, or current. You should verify important information before making a purchase.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">4.2 Pricing and Payment</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          All prices are displayed in the currency you select. We accept the following payment methods:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Credit and debit cards (Visa, Mastercard, American Express)</li>
          <li>Digital wallets (Apple Pay, Google Pay)</li>
          <li>Other payment methods as available in your region</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">4.3 Order Confirmation</h3>
        <p className="text-neutral-700 leading-relaxed">
          When you place an order, you will receive an email confirmation. This confirmation does not signify our acceptance of your order, nor does it constitute confirmation of our offer to sell. We reserve the right to accept or decline your order for any reason.
        </p>
      </section>

      {/* 5. Multi-Vendor Marketplace */}
      <section id="multi-vendor" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">5. Multi-Vendor Marketplace</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">5.1 Platform Role</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          NextPik operates as a multi-vendor marketplace. We provide the platform that enables transactions between buyers and sellers, but we are not a party to the transaction itself. The contract of sale is directly between you and the seller.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">5.2 Seller Responsibility</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Sellers are responsible for their product listings, inventory accuracy, order fulfillment, and customer service. While we monitor seller activity and maintain quality standards, we are not responsible for seller actions or product quality.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">5.3 Escrow System</h3>
        <p className="text-neutral-700 leading-relaxed">
          For buyer protection, payments are held in escrow until order delivery is confirmed. This ensures that sellers fulfill their obligations before receiving payment. The typical escrow hold period is 7 days after delivery.
        </p>
      </section>

      {/* 6. Shipping and Delivery */}
      <section id="shipping" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">6. Shipping and Delivery</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">6.1 Shipping Methods</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Sellers determine available shipping methods and rates. Estimated delivery times are provided at checkout and are estimates only. Actual delivery times may vary based on location, shipping method, and other factors.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">6.2 Shipping Delays</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          We are not responsible for delays caused by shipping carriers, customs clearance, weather events, or other circumstances beyond our or the seller's control.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">6.3 International Shipping</h3>
        <p className="text-neutral-700 leading-relaxed">
          For international orders, you are responsible for all customs duties, import taxes, and fees imposed by your country. These charges are not included in the product price or shipping cost.
        </p>
      </section>

      {/* 7. Returns, Refunds, and Cancellations */}
      <section id="returns" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">7. Returns, Refunds, and Cancellations</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">7.1 Return Policy</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Each seller sets their own return policy. You can view the specific return policy for each product on the product page. If you are not satisfied with your purchase, please contact the seller directly through the Platform.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">7.2 Refund Processing</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Approved refunds are processed within 5-10 business days and will be credited to your original payment method. Shipping costs are generally non-refundable unless the product was defective or incorrect.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">7.3 Order Cancellation</h3>
        <p className="text-neutral-700 leading-relaxed">
          You may cancel an order before it ships. Once shipped, the seller's return policy applies. Contact the seller directly to request cancellation of an unshipped order.
        </p>
      </section>

      {/* 8. Reviews and Ratings */}
      <section id="reviews" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">8. Reviews and Ratings</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">8.1 Review Guidelines</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You may leave reviews and ratings for products you have purchased. Reviews must:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Be based on your genuine experience with the product</li>
          <li>Not contain offensive, defamatory, or inappropriate content</li>
          <li>Not include personal information about others</li>
          <li>Comply with all applicable laws</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">8.2 Review Moderation</h3>
        <p className="text-neutral-700 leading-relaxed">
          We reserve the right to remove reviews that violate our guidelines, contain prohibited content, or are suspected to be fake or manipulated. We do not verify the accuracy of reviews.
        </p>
      </section>

      {/* 9. Prohibited Activities */}
      <section id="prohibited" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">9. Prohibited Activities</h2>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You may not use the Platform to:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Sell or purchase illegal, counterfeit, stolen, or prohibited items</li>
          <li>Engage in fraudulent transactions or money laundering</li>
          <li>Manipulate reviews, ratings, or search rankings</li>
          <li>Harass, threaten, or abuse other users</li>
          <li>Violate intellectual property rights</li>
          <li>Use bots, scrapers, or automated tools without authorization</li>
          <li>Attempt to circumvent fees or payment obligations</li>
          <li>Create multiple accounts to evade restrictions</li>
        </ul>
      </section>

      {/* 10. Privacy and Data Protection */}
      <section id="privacy" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">10. Privacy and Data Protection</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using the Platform, you consent to our data practices as described in the Privacy Policy.
        </p>
        <p className="text-neutral-700 leading-relaxed">
          We implement industry-standard security measures including encryption, secure payment processing through Stripe, and regular security audits. However, no system is completely secure, and we cannot guarantee absolute security.
        </p>
      </section>

      {/* 11. Disclaimers and Limitations of Liability */}
      <section id="disclaimers" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">11. Disclaimers and Limitations of Liability</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">11.1 Platform "As Is"</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">11.2 Limitation of Liability</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXTPIK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR SERVICE INTERRUPTION.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">11.3 Maximum Liability</h3>
        <p className="text-neutral-700 leading-relaxed">
          Our total liability to you for any claims arising from your use of the Platform shall not exceed the amount you paid to us in the 12 months preceding the claim, or $100, whichever is greater.
        </p>
      </section>

      {/* 12. Indemnification */}
      <section id="indemnification" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">12. Indemnification</h2>
        <p className="text-neutral-700 leading-relaxed">
          You agree to indemnify, defend, and hold harmless NextPik, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any rights of third parties; or (d) any content you post on the Platform.
        </p>
      </section>

      {/* 13. Dispute Resolution */}
      <section id="disputes" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">13. Dispute Resolution</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">13.1 Informal Resolution</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          If you have a dispute with a seller, we encourage you to contact them directly through the Platform. Most issues can be resolved through direct communication.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">13.2 Dispute Center</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          If you cannot resolve the dispute directly, you may open a case in our Dispute Center. We will review the case and attempt to facilitate a resolution between you and the seller.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">13.3 Arbitration</h3>
        <p className="text-neutral-700 leading-relaxed">
          Any disputes that cannot be resolved through our Dispute Center shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, rather than in court, except as permitted by law.
        </p>
      </section>

      {/* 14. Platform Features and Policies */}
      <section id="platform-features" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">14. Platform Features and Policies</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">14.1 Search and Recommendations</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          We use algorithms to provide search results and product recommendations. Results may be influenced by relevance, seller performance, product popularity, and other factors.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">14.2 Currency and Language</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          The Platform supports multiple currencies and languages. Currency conversion rates are updated regularly but may not reflect real-time exchange rates. Actual charges may differ slightly based on your payment provider's rates.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4">14.3 Platform Modifications</h3>
        <p className="text-neutral-700 leading-relaxed">
          We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time without prior notice. We are not liable for any modification, suspension, or discontinuation of the Platform.
        </p>
      </section>

      {/* 15. Contact Information */}
      <section id="contact" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">15. Contact Information</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          If you have questions about these Terms or need assistance, please contact us:
        </p>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
          <ul className="text-neutral-700 space-y-2">
            <li><strong>Email:</strong> legal@nextpik.com</li>
            <li><strong>Support:</strong> support@nextpik.com</li>
            <li><strong>Address:</strong> NextPik Inc., [Address to be added]</li>
            <li><strong>Phone:</strong> [Phone number to be added]</li>
          </ul>
        </div>
      </section>

      {/* 16. Acknowledgment */}
      <section id="acknowledgment" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">16. Acknowledgment</h2>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <p className="text-neutral-800 font-semibold leading-relaxed mb-3">
            BY USING THE NEXTPIK PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
          </p>
          <p className="text-neutral-700">
            If you have any questions or concerns about these Terms, please contact us before using the Platform.
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
