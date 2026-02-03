import Head from 'next/head';

interface PreloadResourcesProps {
  images?: string[];
  fonts?: string[];
  scripts?: string[];
}

export function PreloadResources({ images = [], fonts = [], scripts = [] }: PreloadResourcesProps) {
  return (
    <Head>
      {/* Preload critical images */}
      {images.map((src) => (
        <link
          key={src}
          rel="preload"
          as="image"
          href={src}
          crossOrigin="anonymous"
          // @ts-ignore - Next.js supports imageSrcSet
          imageSrcSet={`${src}?w=640 640w, ${src}?w=1280 1280w, ${src}?w=1920 1920w`}
          imageSizes="100vw"
        />
      ))}

      {/* Preload critical fonts */}
      {fonts.map((href) => (
        <link
          key={href}
          rel="preload"
          as="font"
          href={href}
          crossOrigin="anonymous"
          type="font/woff2"
        />
      ))}

      {/* Preload critical scripts */}
      {scripts.map((src) => (
        <link key={src} rel="preload" as="script" href={src} />
      ))}

      {/* DNS prefetch for external domains */}
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

      {/* Preconnect to critical origins */}
      <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Head>
  );
}

// Helper to add preload hints directly in layout
export function CriticalResourceHints() {
  return (
    <>
      {/* Preconnect to API */}
      <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} />

      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/playfair-display-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}
