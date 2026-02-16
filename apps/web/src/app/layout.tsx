import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { WishlistProvider } from '@/contexts/wishlist-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { RouteLoadingProvider } from '@/components/providers/route-loading-provider';
import { ToastListener } from '@/components/toast-listener';
import { WhatsAppChat } from '@/components/whatsapp-chat';
import { VersionChecker } from '@/components/version-checker';
import { Toaster } from 'sonner';
import { siteConfig } from '@/lib/seo';
import './globals.css';

// Force dynamic rendering to avoid static generation issues with client contexts
export const dynamic = 'force-dynamic';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteConfig.name,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@luxurymarketplace',
    site: '@luxurymarketplace',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  verification: {
    google: 'your-google-verification-code',
    // Add other verification codes as needed
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${poppins.variable} overflow-x-hidden`}
    >
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://m.stripe.com" />
        <link rel="preconnect" href="https://m.stripe.network" />

        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://m.stripe.com" />
      </head>
      <body className="font-sans antialiased bg-white text-black overflow-x-hidden">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RouteLoadingProvider>
            <LocaleProvider>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    {children}
                    <VersionChecker />
                    <Toaster
                      position="top-right"
                      theme="dark"
                      closeButton
                      toastOptions={{
                        duration: 4000,
                      }}
                    />
                    <WhatsAppChat
                      phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '1234567890'}
                      businessName={process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NAME || 'NextPik'}
                      defaultMessage={
                        process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
                        "Hello! I'm interested in NextPik's premium products."
                      }
                      position="bottom-right"
                      showOnMobile={true}
                    />
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </LocaleProvider>
          </RouteLoadingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
