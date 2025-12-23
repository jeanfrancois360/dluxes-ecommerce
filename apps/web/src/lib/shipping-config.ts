/**
 * Shipping Configuration and Utilities
 * Centralized shipping method configuration and calculation logic
 */

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  estimatedDays: string;
  carrier: string;
  icon: React.ReactNode;
}

export interface ShippingCalculation {
  methodId: string;
  originalPrice: number;
  finalPrice: number;
  isFree: boolean;
  discount: number;
  qualifiesForFreeShipping: boolean;
}

// Free shipping threshold
export const FREE_SHIPPING_THRESHOLD = 200;

// Shipping method definitions
export const SHIPPING_METHODS: Record<string, Omit<ShippingMethod, 'icon'>> = {
  standard: {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered via USPS or UPS',
    basePrice: 10,
    estimatedDays: '5-7',
    carrier: 'USPS/UPS',
  },
  express: {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivered via FedEx or UPS',
    basePrice: 25,
    estimatedDays: '2-3',
    carrier: 'FedEx/UPS',
  },
  nextday: {
    id: 'nextday',
    name: 'Next Day Delivery',
    description: 'Delivered via FedEx overnight',
    basePrice: 50,
    estimatedDays: '1',
    carrier: 'FedEx',
  },
};

/**
 * Calculate shipping cost with free shipping logic
 */
export function calculateShippingCost(
  methodId: string,
  subtotal: number
): ShippingCalculation {
  const method = SHIPPING_METHODS[methodId];

  if (!method) {
    throw new Error(`Invalid shipping method: ${methodId}`);
  }

  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const isFree = qualifiesForFreeShipping;
  const finalPrice = isFree ? 0 : method.basePrice;
  const discount = isFree ? method.basePrice : 0;

  return {
    methodId,
    originalPrice: method.basePrice,
    finalPrice,
    isFree,
    discount,
    qualifiesForFreeShipping,
  };
}

/**
 * Get amount needed to qualify for free shipping
 */
export function getAmountNeededForFreeShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return FREE_SHIPPING_THRESHOLD - subtotal;
}

/**
 * Check if subtotal qualifies for free shipping
 */
export function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

/**
 * Get estimated delivery date range
 */
export function getEstimatedDeliveryDate(estimatedDays: string): string {
  const daysMatch = estimatedDays.match(/(\d+)(?:-(\d+))?/);
  if (!daysMatch) return '';

  const minDays = parseInt(daysMatch[1]);
  const maxDays = daysMatch[2] ? parseInt(daysMatch[2]) : minDays;

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + minDays);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDays);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (minDays === maxDays) {
    return formatDate(minDate);
  }

  return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
}

/**
 * Get all available shipping methods
 */
export function getAvailableShippingMethods(): Array<Omit<ShippingMethod, 'icon'>> {
  return Object.values(SHIPPING_METHODS);
}

/**
 * Get shipping method by ID
 */
export function getShippingMethodById(
  methodId: string
): Omit<ShippingMethod, 'icon'> | null {
  return SHIPPING_METHODS[methodId] || null;
}

/**
 * Format shipping method for display
 */
export function formatShippingMethodDisplay(
  methodId: string,
  subtotal: number
): {
  name: string;
  price: string;
  originalPrice?: string;
  isFree: boolean;
  estimatedDelivery: string;
} {
  const method = getShippingMethodById(methodId);
  if (!method) {
    throw new Error(`Invalid shipping method: ${methodId}`);
  }

  const calculation = calculateShippingCost(methodId, subtotal);
  const estimatedDelivery = getEstimatedDeliveryDate(method.estimatedDays);

  return {
    name: method.name,
    price: calculation.isFree ? 'Free' : `$${calculation.finalPrice.toFixed(2)}`,
    originalPrice: calculation.isFree ? `$${calculation.originalPrice.toFixed(2)}` : undefined,
    isFree: calculation.isFree,
    estimatedDelivery,
  };
}
