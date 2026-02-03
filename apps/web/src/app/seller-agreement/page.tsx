import { LegalPageLayout } from '@/components/legal/legal-page-layout';
import Link from 'next/link';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'seller-account', title: '2. Seller Account and Registration' },
  { id: 'product-listings', title: '3. Product Listings' },
  { id: 'order-fulfillment', title: '4. Order Fulfillment and Shipping' },
  { id: 'commission-fees', title: '5. Commission and Fees' },
  { id: 'payments-payouts', title: '6. Payments and Payouts' },
  { id: 'seller-responsibilities', title: '7. Seller Responsibilities and Obligations' },
  { id: 'returns-refunds', title: '8. Returns, Refunds, and Disputes' },
  { id: 'performance-metrics', title: '9. Performance Metrics and Standards' },
  { id: 'account-suspension', title: '10. Account Suspension and Termination' },
  { id: 'taxes-legal', title: '11. Taxes and Legal Obligations' },
  { id: 'contact', title: '12. Contact Information' },
  { id: 'acknowledgment', title: '13. Acknowledgment' },
];

export default function SellerAgreementPage() {
  return (
    <LegalPageLayout
      title="Seller Agreement"
      lastUpdated="January 2, 2026"
      effectiveDate="January 3, 2026"
      version="1.0.0"
      sections={sections}
      relatedLinks={[
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Become a Seller', href: '/become-seller' },
      ]}
    >
      {/* 1. Introduction */}
      <section id="introduction" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">1. Introduction</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          This Seller Agreement ("Agreement") is a legally binding contract between you (the "Seller") and NextPik ("we," "our," or "us"). By registering as a seller on the NextPik platform (the "Platform"), you agree to comply with this Agreement, our Terms of Service, and Privacy Policy.
        </p>

        <h3 className="text-2xl font-semibold text-black mb-4 mt-6">1.1 Scope of Agreement</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          This Agreement governs:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Your use of the Platform as a seller</li>
          <li>Sale of products through the Platform</li>
          <li>Commission structure and payment terms</li>
          <li>Your responsibilities and obligations</li>
          <li>Platform rules and policies</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">1.2 Eligibility</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          To become a seller, you must:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li>Be at least 18 years of age</li>
          <li>Have legal capacity to enter into binding contracts</li>
          <li>Provide accurate business and tax information</li>
          <li>Comply with all applicable laws and regulations</li>
          <li>Not be suspended or banned from the Platform</li>
        </ul>
      </section>

      {/* 2. Seller Account and Registration */}
      <section id="seller-account" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">2. Seller Account and Registration</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">2.1 Account Creation</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          To sell on NextPik, you must:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Create a seller account with accurate information</li>
          <li>Verify your email address and phone number</li>
          <li>Provide business registration details (if applicable)</li>
          <li>Submit tax identification information</li>
          <li>Set up payment/payout methods</li>
          <li>Complete identity verification (KYC)</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">2.2 Business Information Required</h3>
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-black mb-3">Individual Sellers:</h4>
          <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
            <li>Full legal name and date of birth</li>
            <li>Government-issued ID (for verification)</li>
            <li>Tax ID or Social Security Number</li>
            <li>Residential address</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="text-xl font-semibold text-black mb-3">Business Sellers:</h4>
          <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
            <li>Business legal name and registration number</li>
            <li>Business type (LLC, Corporation, Partnership, etc.)</li>
            <li>Tax ID (EIN or equivalent)</li>
            <li>Business address and authorized representative information</li>
            <li>Business license (if required in your jurisdiction)</li>
          </ul>
        </div>

        <h3 className="text-2xl font-semibold text-black mb-4">2.3 Store Profile</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You must create and maintain a store profile including:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li>Store name (unique, not misleading)</li>
          <li>Store description and branding</li>
          <li>Logo and banner images</li>
          <li>Contact information and return policies</li>
          <li>Shipping information</li>
        </ul>
      </section>

      {/* 3. Product Listings */}
      <section id="product-listings" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">3. Product Listings</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">3.1 Listing Requirements</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          All product listings must include:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Accurate product title and description</li>
          <li>Clear, high-quality product images (minimum 800x800px)</li>
          <li>Correct category and pricing</li>
          <li>Inventory quantity and product condition</li>
          <li>Shipping dimensions and weight (for physical products)</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">3.2 Prohibited Products</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You may not list products that:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Are illegal or restricted in any jurisdiction</li>
          <li>Violate intellectual property rights</li>
          <li>Are counterfeit, fake, or unauthorized replicas</li>
          <li>Contain harmful, dangerous, or hazardous materials</li>
          <li>Promote hate, violence, or discrimination</li>
          <li>Require special licenses you do not possess</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">3.3 Product Types Supported</h3>
        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="text-lg font-semibold text-black mb-2">Physical Products:</h4>
            <p className="text-neutral-700 leading-relaxed">Tangible goods shipped to buyers with accurate shipping information</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="text-lg font-semibold text-black mb-2">Real Estate:</h4>
            <p className="text-neutral-700 leading-relaxed">Property listings for sale or rent (inquiry-based, requires property verification)</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="text-lg font-semibold text-black mb-2">Vehicles:</h4>
            <p className="text-neutral-700 leading-relaxed">Cars, motorcycles, boats (must include VIN, mileage, condition report)</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="text-lg font-semibold text-black mb-2">Services:</h4>
            <p className="text-neutral-700 leading-relaxed">Professional services, consultations, bookings (requires valid licenses and insurance)</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="text-lg font-semibold text-black mb-2">Digital Products:</h4>
            <p className="text-neutral-700 leading-relaxed">Software, licenses, downloads, courses (instant delivery after payment)</p>
          </div>
        </div>
      </section>

      {/* 4. Order Fulfillment and Shipping */}
      <section id="order-fulfillment" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">4. Order Fulfillment and Shipping</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">4.1 Order Processing Time</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You must:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Process orders within 2 business days (or as specified in your settings)</li>
          <li>Ship orders within stated timeframe</li>
          <li>Update order status promptly</li>
          <li>Provide tracking information when available</li>
          <li>Communicate delays to buyers immediately</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">4.2 Shipping Responsibilities</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          For Physical Products:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li>Package items securely to prevent damage</li>
          <li>Use appropriate shipping carriers</li>
          <li>Provide accurate shipping costs at checkout</li>
          <li>Ship to the address provided by buyer</li>
          <li>Obtain proof of shipment (tracking number, receipt)</li>
        </ul>
      </section>

      {/* 5. Commission and Fees */}
      <section id="commission-fees" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">5. Commission and Fees</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">5.1 Platform Commission</h3>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <p className="text-neutral-800 mb-3 leading-relaxed">
            <strong>NextPik charges a commission on each sale:</strong>
          </p>
          <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
            <li>Default commission rate: 10-15% of order total (configurable by category)</li>
            <li>Commission is calculated automatically on each transaction</li>
            <li>Deducted from your payout</li>
            <li>Displayed in your seller dashboard</li>
          </ul>
        </div>

        <h3 className="text-2xl font-semibold text-black mb-4">5.2 Commission Calculation Example</h3>
        <div className="bg-neutral-50 rounded-xl p-6 border-2 border-neutral-200 mb-6">
          <p className="text-neutral-700 mb-2 leading-relaxed"><strong>Example:</strong></p>
          <p className="text-neutral-700">Product Price: $100.00</p>
          <p className="text-neutral-700">Commission Rate: 12%</p>
          <p className="text-neutral-700">Platform Commission: $12.00</p>
          <p className="text-neutral-700 font-semibold mt-2">Your Earnings: $88.00</p>
        </div>

        <h3 className="text-2xl font-semibold text-black mb-4">5.3 Payment Processing Fees</h3>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Stripe Processing Fees: 2.9% + $0.30 per successful transaction</li>
          <li>These fees are separate from platform commission</li>
          <li>Deducted automatically by Stripe</li>
          <li>Non-refundable, even if order is cancelled</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">5.4 Fee Transparency</h3>
        <p className="text-neutral-700 leading-relaxed">
          All fees are disclosed clearly before you list products, visible in your seller dashboard, itemized in payout reports, and subject to change with 30 days notice.
        </p>
      </section>

      {/* 6. Payments and Payouts */}
      <section id="payments-payouts" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">6. Payments and Payouts</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">6.1 Escrow System</h3>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
          <p className="text-neutral-800 font-semibold mb-3 leading-relaxed">How Escrow Works:</p>
          <ol className="list-decimal pl-6 text-neutral-700 space-y-2 leading-relaxed">
            <li>Buyer pays for order</li>
            <li>Funds are held in escrow (not immediately available to you)</li>
            <li>You ship the product</li>
            <li>Buyer receives product</li>
            <li>Escrow hold period begins (default: 7 days, configurable 1-90 days)</li>
            <li>After hold period (if no disputes), funds are released to you</li>
            <li>Payout is processed according to schedule</li>
          </ol>
          <p className="text-neutral-700 mt-4 leading-relaxed">
            <strong>Purpose:</strong> Protects buyers from non-delivery and protects sellers from fraudulent chargebacks.
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-black mb-4">6.2 Payout Schedule</h3>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Payout Frequency: Configurable (Daily, Weekly, Biweekly, Monthly)</li>
          <li>Default: Weekly (every Monday)</li>
          <li>First payout may be delayed for verification</li>
          <li>Payout typically arrives within 2-5 business days</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">6.3 Payout Methods</h3>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li><strong>Bank Transfer (ACH/Wire):</strong> Provide bank account details and verify with micro-deposits</li>
          <li><strong>PayPal (if supported):</strong> Link your PayPal account (additional fees may apply)</li>
          <li>Other methods as available in your region</li>
        </ul>
      </section>

      {/* 7. Seller Responsibilities */}
      <section id="seller-responsibilities" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">7. Seller Responsibilities and Obligations</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">7.1 Product Quality and Accuracy</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You must:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Provide accurate, truthful product descriptions</li>
          <li>Ship products that match the listing</li>
          <li>Ensure products are in stated condition</li>
          <li>Include all accessories and components as listed</li>
          <li>Package products to prevent damage</li>
          <li>Not misrepresent product features or benefits</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">7.2 Legal Compliance</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You are responsible for:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Complying with all applicable laws (consumer protection, tax, labor)</li>
          <li>Obtaining necessary business licenses and permits</li>
          <li>Collecting and remitting sales tax (if required in your jurisdiction)</li>
          <li>Complying with export/import regulations</li>
          <li>Meeting product safety and labeling requirements</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">7.3 Customer Service</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You must:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li>Respond to buyer inquiries within 24 hours</li>
          <li>Provide helpful, professional customer support</li>
          <li>Address complaints and issues promptly</li>
          <li>Honor your stated return and refund policies</li>
          <li>Maintain a professional and courteous tone</li>
        </ul>
      </section>

      {/* 8. Returns, Refunds, and Disputes */}
      <section id="returns-refunds" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">8. Returns, Refunds, and Disputes</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">8.1 Return Policy</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You must establish and clearly state your return policy:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Minimum: 14-day return window (or as required by law)</li>
          <li>Recommended: 30-day return policy</li>
          <li>Specify return conditions (unopened, unused, original packaging)</li>
          <li>Indicate who pays return shipping</li>
          <li>Restocking fees (if any) must be disclosed upfront</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">8.2 Refund Process</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          When a return is approved:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Buyer ships product back to you</li>
          <li>You inspect returned product</li>
          <li>If product meets return conditions, issue refund within 5 business days</li>
          <li>Refund amount includes product price (shipping typically excluded)</li>
          <li>Buyer receives refund to original payment method</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">8.3 Disputes and Chargebacks</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          Buyer Disputes:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li>Buyers may file disputes for non-delivery, misrepresentation, or defects</li>
          <li>You will be notified and given opportunity to respond</li>
          <li>Provide evidence (photos, tracking, communication logs)</li>
          <li>NextPik may mediate and make final decision</li>
          <li>Funds remain in escrow during dispute</li>
        </ul>
      </section>

      {/* 9. Performance Metrics */}
      <section id="performance-metrics" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">9. Performance Metrics and Standards</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">9.1 Key Performance Indicators (KPIs)</h3>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Your seller account is evaluated based on:
        </p>

        <div className="space-y-4">
          <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
            <p className="font-semibold text-black">Order Defect Rate (ODR)</p>
            <p className="text-neutral-700">Target: &lt; 1%</p>
            <p className="text-neutral-700 text-sm">Includes negative feedback, A-to-Z claims, chargebacks</p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
            <p className="font-semibold text-black">Late Shipment Rate</p>
            <p className="text-neutral-700">Target: &lt; 4%</p>
            <p className="text-neutral-700 text-sm">Orders not shipped within promised timeframe</p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
            <p className="font-semibold text-black">Order Cancellation Rate</p>
            <p className="text-neutral-700">Target: &lt; 2.5%</p>
            <p className="text-neutral-700 text-sm">Seller-initiated cancellations (excluding buyer requests)</p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
            <p className="font-semibold text-black">Response Time</p>
            <p className="text-neutral-700">Target: &lt; 24 hours</p>
            <p className="text-neutral-700 text-sm">For buyer messages, measured 7 days a week</p>
          </div>
        </div>
      </section>

      {/* 10. Account Suspension and Termination */}
      <section id="account-suspension" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">10. Account Suspension and Termination</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">10.1 Grounds for Suspension</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          We may suspend your seller account for:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Violation of this Agreement or Terms of Service</li>
          <li>Excessive order defects or complaints</li>
          <li>Selling prohibited products</li>
          <li>Fraudulent or deceptive practices</li>
          <li>Intellectual property infringement</li>
          <li>Failure to fulfill orders</li>
          <li>Poor performance metrics</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">10.2 Suspension Process</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          If your account is suspended:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>You will receive email notification with reason</li>
          <li>You cannot list new products or process new orders</li>
          <li>Existing orders must still be fulfilled</li>
          <li>Funds may be held pending resolution</li>
          <li>You may appeal or provide explanation</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">10.3 Termination by Seller</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You may close your seller account at any time by:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li>Submitting account closure request</li>
          <li>Fulfilling all pending orders</li>
          <li>Processing all returns</li>
          <li>Settling outstanding fees or balances</li>
        </ul>
      </section>

      {/* 11. Taxes and Legal Obligations */}
      <section id="taxes-legal" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">11. Taxes and Legal Obligations</h2>

        <h3 className="text-2xl font-semibold text-black mb-4">11.1 Tax Responsibilities</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You are responsible for:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6 leading-relaxed">
          <li>Determining which taxes apply to your sales</li>
          <li>Collecting sales tax, VAT, GST (if required)</li>
          <li>Remitting taxes to appropriate authorities</li>
          <li>Filing tax returns and maintaining accurate tax records</li>
        </ul>

        <h3 className="text-2xl font-semibold text-black mb-4">11.2 Tax Identification</h3>
        <p className="text-neutral-700 leading-relaxed mb-3">
          You must provide:
        </p>
        <ul className="list-disc pl-6 text-neutral-700 space-y-2 leading-relaxed">
          <li>Tax ID (SSN, EIN, VAT number, etc.)</li>
          <li>W-9 form (US sellers)</li>
          <li>Other tax forms as required</li>
        </ul>
      </section>

      {/* 12. Contact Information */}
      <section id="contact" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">12. Contact Information</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          For questions about this Seller Agreement:
        </p>
        <div className="bg-neutral-50 rounded-xl p-6 border-2 border-neutral-200">
          <p className="text-neutral-700 leading-relaxed">
            <strong>Seller Support:</strong><br />
            Email: seller-support@nextpik.com<br />
            Subject Line: Seller Agreement Inquiry<br /><br />
            <strong>Account Issues:</strong><br />
            Email: seller-support@nextpik.com<br />
            Subject Line: Account Issue - [Your Store Name]<br /><br />
            <strong>Response Time:</strong> We will respond within 48 hours
          </p>
        </div>
      </section>

      {/* 13. Acknowledgment */}
      <section id="acknowledgment" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-6">13. Acknowledgment</h2>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <p className="text-neutral-800 font-semibold leading-relaxed mb-3">
            BY REGISTERING AS A SELLER ON THE NEXTPIK PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS SELLER AGREEMENT.
          </p>
          <p className="text-neutral-700">
            If you have any questions or concerns about this Agreement, please contact us before selling on the Platform.
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
