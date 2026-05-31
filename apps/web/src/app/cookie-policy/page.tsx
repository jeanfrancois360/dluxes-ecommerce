'use client';

import { LegalPageLayout } from '@/components/legal/legal-page-layout';
import Link from 'next/link';

export default function CookiePolicyPage() {
  const sections = [
    { id: 'what-are-cookies', title: '1. What Are Cookies' },
    { id: 'how-we-use-cookies', title: '2. How We Use Cookies' },
    { id: 'types-of-cookies', title: '3. Types of Cookies We Use' },
    { id: 'third-party-cookies', title: '4. Third-Party Cookies' },
    { id: 'cookie-duration', title: '5. Cookie Duration' },
    { id: 'managing-cookies', title: '6. Managing Your Cookie Preferences' },
    { id: 'consent', title: '7. Your Consent' },
    { id: 'updates', title: '8. Updates to This Policy' },
    { id: 'contact', title: '9. Contact Us' },
  ];

  return (
    <LegalPageLayout
      title="Cookie Policy"
      lastUpdated="May 31, 2026"
      effectiveDate="May 31, 2026"
      version="1.0.0"
      sections={sections}
    >
      {/* 1. What Are Cookies */}
      <section id="what-are-cookies" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">1. What Are Cookies</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Cookies are small text files that are placed on your device (computer, smartphone, or
          tablet) when you visit a website. They are widely used to make websites work, or work more
          efficiently, and to provide information to the website owner.
        </p>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Cookies allow websites to recognise your device and remember your preferences or actions
          over a period of time. They can also be used to track your browsing behaviour across
          different websites.
        </p>
        <p className="text-neutral-700 leading-relaxed">
          Similar technologies include web beacons (also called pixel tags or clear GIFs), local
          storage (such as HTML5 localStorage and sessionStorage), and device fingerprinting. This
          policy covers all such technologies collectively referred to as "cookies" unless otherwise
          specified.
        </p>
      </section>

      {/* 2. How We Use Cookies */}
      <section id="how-we-use-cookies" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">2. How We Use Cookies</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          NextPik uses cookies and similar technologies for the following purposes:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-neutral-700 mb-4">
          <li>
            <strong>Authentication and Security:</strong> To keep you signed in, protect your
            account, and prevent fraud.
          </li>
          <li>
            <strong>Preferences and Settings:</strong> To remember your language preference,
            currency selection, and other customisations so you do not have to re-enter them on
            every visit.
          </li>
          <li>
            <strong>Shopping Cart and Checkout:</strong> To maintain the contents of your shopping
            cart and enable the checkout process.
          </li>
          <li>
            <strong>Performance and Analytics:</strong> To understand how visitors interact with our
            platform, identify errors, and improve our service.
          </li>
          <li>
            <strong>Payment Processing:</strong> To enable secure payment transactions via our
            payment providers (Stripe, PayPal).
          </li>
        </ul>
        <p className="text-neutral-700 leading-relaxed">
          We process data collected through cookies on the legal basis of (a) contract performance
          for strictly necessary and functional cookies required to deliver the service you have
          requested, and (b) your consent for non-essential cookies (analytics, marketing) in
          accordance with Article 6(1)(a) and (b) of the GDPR and the Belgian ePrivacy Law of 13
          June 2005.
        </p>
      </section>

      {/* 3. Types of Cookies We Use */}
      <section id="types-of-cookies" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">
          3. Types of Cookies We Use
        </h2>

        <div className="space-y-8">
          {/* Strictly Necessary */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                Always Active
              </span>
              <h3 className="text-xl font-semibold text-black">Strictly Necessary Cookies</h3>
            </div>
            <p className="text-neutral-700 mb-4">
              These cookies are essential for the website to function and cannot be switched off.
              They are usually set in response to actions you take such as setting your privacy
              preferences, logging in, or filling in forms. These cookies do not require your
              consent under the ePrivacy Directive.
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-200 text-left">
                  <th className="px-3 py-2 font-semibold rounded-tl">Cookie Name</th>
                  <th className="px-3 py-2 font-semibold">Purpose</th>
                  <th className="px-3 py-2 font-semibold rounded-tr">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr className="bg-white">
                  <td className="px-3 py-2 font-mono text-xs">nextpik_access_token</td>
                  <td className="px-3 py-2">Authentication — stores your JWT session token</td>
                  <td className="px-3 py-2">7 days</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-3 py-2 font-mono text-xs">nextpik_refresh_token</td>
                  <td className="px-3 py-2">Session renewal — refreshes your authentication</td>
                  <td className="px-3 py-2">30 days</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 font-mono text-xs">NEXT_LOCALE</td>
                  <td className="px-3 py-2">Stores your language preference (EN/FR/ES)</td>
                  <td className="px-3 py-2">1 year</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-3 py-2 font-mono text-xs">nextpik_currency</td>
                  <td className="px-3 py-2">Stores your selected display currency</td>
                  <td className="px-3 py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Functional */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Functional
              </span>
              <h3 className="text-xl font-semibold text-black">Functional Cookies</h3>
            </div>
            <p className="text-neutral-700 mb-4">
              These cookies enhance the functionality of our website by storing your preferences.
              They may be set by us or by third-party providers. If you disable these cookies, some
              features may not work correctly but the website will remain functional.
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-200 text-left">
                  <th className="px-3 py-2 font-semibold rounded-tl">Cookie Name</th>
                  <th className="px-3 py-2 font-semibold">Purpose</th>
                  <th className="px-3 py-2 font-semibold rounded-tr">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr className="bg-white">
                  <td className="px-3 py-2 font-mono text-xs">nextpik_cart</td>
                  <td className="px-3 py-2">Preserves shopping cart between sessions</td>
                  <td className="px-3 py-2">30 days</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-3 py-2 font-mono text-xs">nextpik_wishlist</td>
                  <td className="px-3 py-2">Stores wishlist items for non-logged-in users</td>
                  <td className="px-3 py-2">30 days</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 font-mono text-xs">nextpik_cookie_consent</td>
                  <td className="px-3 py-2">Records your cookie consent preferences</td>
                  <td className="px-3 py-2">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Analytics */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                Analytics
              </span>
              <h3 className="text-xl font-semibold text-black">Analytics Cookies</h3>
            </div>
            <p className="text-neutral-700 mb-4">
              These cookies help us understand how visitors use our website. All information
              collected is aggregated and anonymised. We use this data to improve our platform and
              user experience. These cookies require your consent.
            </p>
            <p className="text-neutral-700 text-sm">
              We may use analytics tools that set cookies on your device. You can opt out of
              analytics cookies at any time through your cookie preferences.
            </p>
          </div>

          {/* Marketing */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                Marketing
              </span>
              <h3 className="text-xl font-semibold text-black">Marketing Cookies</h3>
            </div>
            <p className="text-neutral-700 mb-4">
              Marketing cookies are used to track visitors across websites to display relevant
              advertisements. These cookies require your explicit consent and you may withdraw your
              consent at any time.
            </p>
            <p className="text-neutral-700 text-sm">
              Currently, NextPik does not serve third-party advertising. This section will be
              updated if and when such services are introduced.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Third-Party Cookies */}
      <section id="third-party-cookies" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">4. Third-Party Cookies</h2>
        <p className="text-neutral-700 leading-relaxed mb-6">
          Some cookies on our platform are set by third-party services that appear on our pages. We
          do not control these third parties and their cookie practices are governed by their own
          privacy policies.
        </p>

        <div className="space-y-4">
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 px-4 py-3 font-semibold text-black">
              Stripe — Payment Processing
            </div>
            <div className="px-4 py-3 text-sm text-neutral-700">
              <p className="mb-2">
                Stripe sets cookies to enable secure payment processing, prevent fraud, and remember
                your payment method preferences. These are strictly necessary for checkout
                functionality.
              </p>
              <p>
                Privacy Policy:{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  stripe.com/privacy
                </a>
              </p>
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 px-4 py-3 font-semibold text-black">
              PayPal — Payment Processing
            </div>
            <div className="px-4 py-3 text-sm text-neutral-700">
              <p className="mb-2">
                PayPal uses cookies to enable the PayPal payment flow and fraud prevention. These
                are only loaded when you select PayPal as a payment method.
              </p>
              <p>
                Privacy Policy:{' '}
                <a
                  href="https://www.paypal.com/webapps/mpp/ua/privacy-full"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  paypal.com/privacy
                </a>
              </p>
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 px-4 py-3 font-semibold text-black">
              Google OAuth — Authentication (Optional)
            </div>
            <div className="px-4 py-3 text-sm text-neutral-700">
              <p className="mb-2">
                If you choose to sign in with Google, Google may set cookies on your device to
                facilitate the authentication flow. This only applies if you actively choose Google
                Sign-In.
              </p>
              <p>
                Privacy Policy:{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  policies.google.com/privacy
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cookie Duration */}
      <section id="cookie-duration" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">5. Cookie Duration</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          Cookies can be classified by how long they remain on your device:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
            <h3 className="font-semibold text-black mb-2">Session Cookies</h3>
            <p className="text-sm text-neutral-700">
              These are temporary cookies that are deleted as soon as you close your browser. They
              are used to maintain your browsing session and enable features like the shopping cart
              during a single visit.
            </p>
          </div>
          <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
            <h3 className="font-semibold text-black mb-2">Persistent Cookies</h3>
            <p className="text-sm text-neutral-700">
              These cookies remain on your device for a set period (as specified in the cookie table
              above) or until you delete them. They are used to remember your preferences and
              settings across multiple visits.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Managing Your Cookie Preferences */}
      <section id="managing-cookies" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">
          6. Managing Your Cookie Preferences
        </h2>
        <p className="text-neutral-700 leading-relaxed mb-6">
          You have several options to control the use of cookies:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-black mb-3">Browser Settings</h3>
            <p className="text-neutral-700 mb-3">
              Most web browsers allow you to control cookies through their settings. You can set
              your browser to refuse all cookies, accept only certain cookies, or to notify you when
              a cookie is being placed. However, blocking strictly necessary cookies may affect the
              functionality of our website.
            </p>
            <p className="text-neutral-700 mb-3">
              Instructions for managing cookies in common browsers:
            </p>
            <ul className="list-none space-y-2 text-sm text-neutral-700">
              <li>
                <strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other
                site data
              </li>
              <li>
                <strong>Mozilla Firefox:</strong> Options → Privacy &amp; Security → Cookies and
                Site Data
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Cookies and website data
              </li>
              <li>
                <strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Cookies
                and site data
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-black mb-3">Opt-Out Tools</h3>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>
                <strong>Google Analytics Opt-Out:</strong>{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  tools.google.com/dlpage/gaoptout
                </a>
              </li>
              <li>
                <strong>Network Advertising Initiative:</strong>{' '}
                <a
                  href="https://optout.networkadvertising.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  optout.networkadvertising.org
                </a>
              </li>
              <li>
                <strong>Your Online Choices (EU):</strong>{' '}
                <a
                  href="https://www.youronlinechoices.eu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  youronlinechoices.eu
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-800">
              <strong>Please note:</strong> Disabling essential cookies may prevent you from using
              certain features of our platform, including signing in, completing purchases, and
              maintaining your shopping cart.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Your Consent */}
      <section id="consent" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">7. Your Consent</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          In accordance with the GDPR and the Belgian Act of 13 June 2005 implementing the ePrivacy
          Directive, we obtain your consent before placing non-essential cookies on your device.
        </p>
        <p className="text-neutral-700 leading-relaxed mb-4">
          When you first visit our website, you will be presented with a cookie consent notice
          allowing you to accept or decline non-essential cookies. You can change your preferences
          at any time.
        </p>
        <p className="text-neutral-700 leading-relaxed mb-4">
          <strong>Right to withdraw consent:</strong> You may withdraw your consent to non-essential
          cookies at any time. Withdrawal of consent does not affect the lawfulness of processing
          based on consent before its withdrawal.
        </p>
        <p className="text-neutral-700 leading-relaxed">
          Strictly necessary cookies do not require your consent as they are essential for the
          provision of our services and are processed on the legal basis of contract performance
          (Article 6(1)(b) GDPR).
        </p>
      </section>

      {/* 8. Updates to This Policy */}
      <section id="updates" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">8. Updates to This Policy</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          We may update this Cookie Policy from time to time to reflect changes in technology,
          regulation, or our practices. We will notify you of any significant changes by:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
          <li>Updating the "Last Updated" date at the top of this policy</li>
          <li>Displaying a prominent notice on our website</li>
          <li>Sending an email notification (if you have an account with us)</li>
          <li>Asking for renewed consent where required by law</li>
        </ul>
        <p className="text-neutral-700 leading-relaxed">
          We encourage you to review this policy periodically to stay informed about our use of
          cookies.
        </p>
      </section>

      {/* 9. Contact Us */}
      <section id="contact" className="mb-12 scroll-mt-24">
        <h2 className="text-3xl font-serif font-bold text-black mb-4">9. Contact Us</h2>
        <p className="text-neutral-700 leading-relaxed mb-4">
          If you have any questions about our use of cookies or this Cookie Policy, please contact
          us:
        </p>
        <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 space-y-2 text-neutral-700">
          <p>
            <strong>NextPik</strong>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:privacy@nextpik.com" className="text-gold hover:underline">
              privacy@nextpik.com
            </a>
          </p>
          <p>
            Website:{' '}
            <Link href="/contact" className="text-gold hover:underline">
              nextpik.com/contact
            </Link>
          </p>
        </div>
        <p className="text-neutral-700 mt-6 leading-relaxed">
          You also have the right to lodge a complaint with the Belgian Data Protection Authority
          (Autorité de protection des données / Gegevensbeschermingsautoriteit) at{' '}
          <a
            href="https://www.dataprotectionauthority.be"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            dataprotectionauthority.be
          </a>{' '}
          if you believe your rights regarding cookie consent have been violated.
        </p>
      </section>
    </LegalPageLayout>
  );
}
