/**
 * Enhanced Card Brand Logos Component
 * Beautiful SVG card brand logos with proper colors and styling
 */

interface CardBrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LOGO_SIZES = {
  sm: 'w-8 h-5',
  md: 'w-12 h-8',
  lg: 'w-16 h-10',
};

export function CardBrandLogo({ brand, size = 'md', className = '' }: CardBrandLogoProps) {
  const sizeClass = LOGO_SIZES[size];
  const lowerBrand = brand.toLowerCase();

  // Visa Logo
  if (lowerBrand === 'visa') {
    return (
      <svg
        viewBox="0 0 64 40"
        className={`${sizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="40" rx="4" fill="#1A1F71" />
        <path
          d="M26.2 27.2l2.8-16.8h4.4l-2.8 16.8h-4.4zm20.4-16.4c-.9-.3-2.2-.7-3.9-.7-4.3 0-7.3 2.2-7.3 5.3 0 2.3 2.1 3.6 3.7 4.4 1.6.8 2.2 1.3 2.2 2 0 1.1-1.4 1.6-2.6 1.6-1.8 0-2.7-.3-4.2-.9l-.6-.3-.6 3.6c1 .4 2.9.8 4.9.8 4.6 0 7.6-2.2 7.6-5.6 0-1.8-1.1-3.2-3.5-4.3-1.5-.7-2.4-1.2-2.4-2 0-.7.8-1.4 2.5-1.4 1.4 0 2.4.3 3.2.6l.4.2.6-3.4zm10.8-.4h-3.4c-1.1 0-1.9.3-2.3 1.4L45 27.2h4.6s.8-2 .9-2.5h5.7c.1.6.5 2.5.5 2.5h4.1l-3.6-16.8h-3.8zm-6.1 10.8c.4-.9 1.7-4.5 1.7-4.5s.4-.9.6-1.5l.3 1.5s.9 4.1 1.1 5h-3.7v-.5zM21.6 10.4l-4.3 11.5-.5-2.3c-.8-2.6-3.3-5.4-6.1-6.8l4 14.4h4.6l6.9-16.8h-4.6z"
          fill="white"
        />
        <path
          d="M13.3 10.4H5.4L5.3 10.8c5.5 1.3 9.1 4.6 10.6 8.5l-1.5-7.5c-.3-1.1-1-1.4-2.1-1.4z"
          fill="#F7B600"
        />
      </svg>
    );
  }

  // Mastercard Logo
  if (lowerBrand === 'mastercard') {
    return (
      <svg
        viewBox="0 0 64 40"
        className={`${sizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="40" rx="4" fill="#000000" />
        <circle cx="24" cy="20" r="12" fill="#EB001B" />
        <circle cx="40" cy="20" r="12" fill="#F79E1B" />
        <path
          d="M32 11.2a11.95 11.95 0 00-4 8.8c0 3.5 1.5 6.6 4 8.8 2.5-2.2 4-5.3 4-8.8 0-3.5-1.5-6.6-4-8.8z"
          fill="#FF5F00"
        />
      </svg>
    );
  }

  // American Express Logo
  if (lowerBrand === 'amex') {
    return (
      <svg
        viewBox="0 0 64 40"
        className={`${sizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="40" rx="4" fill="#006FCF" />
        <text
          x="32"
          y="25"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="12"
          fontWeight="bold"
          fill="white"
        >
          AMEX
        </text>
      </svg>
    );
  }

  // Discover Logo
  if (lowerBrand === 'discover') {
    return (
      <svg
        viewBox="0 0 64 40"
        className={`${sizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="40" rx="4" fill="#FF6000" />
        <circle cx="48" cy="20" r="16" fill="#F79E1B" opacity="0.8" />
      </svg>
    );
  }

  // Diners Club Logo
  if (lowerBrand === 'diners') {
    return (
      <svg
        viewBox="0 0 64 40"
        className={`${sizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="40" rx="4" fill="#0079BE" />
        <circle cx="24" cy="20" r="12" fill="white" />
        <circle cx="40" cy="20" r="12" fill="white" />
        <path
          d="M24 10a10 10 0 100 20V10zm16 0v20a10 10 0 000-20z"
          fill="#0079BE"
        />
      </svg>
    );
  }

  // JCB Logo
  if (lowerBrand === 'jcb') {
    return (
      <svg
        viewBox="0 0 64 40"
        className={`${sizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="40" rx="4" fill="#0E4C96" />
        <rect x="4" y="8" width="16" height="24" rx="2" fill="#006EBC" />
        <rect x="24" y="8" width="16" height="24" rx="2" fill="#ED1C24" />
        <rect x="44" y="8" width="16" height="24" rx="2" fill="#00A651" />
      </svg>
    );
  }

  // UnionPay Logo
  if (lowerBrand === 'unionpay') {
    return (
      <svg
        viewBox="0 0 64 40"
        className={`${sizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="40" rx="4" fill="#002663" />
        <rect x="36" y="0" width="28" height="40" fill="#E21836" />
      </svg>
    );
  }

  // Default Generic Card
  return (
    <svg
      viewBox="0 0 64 40"
      className={`${sizeClass} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="40" rx="4" fill="#6B7280" />
      <rect x="6" y="12" width="52" height="6" rx="1" fill="#9CA3AF" />
      <rect x="6" y="24" width="24" height="4" rx="1" fill="#9CA3AF" />
      <rect x="36" y="24" width="16" height="4" rx="1" fill="#9CA3AF" />
    </svg>
  );
}

export default CardBrandLogo;
