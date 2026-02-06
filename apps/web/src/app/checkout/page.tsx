'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';
import { getStripe } from '@/lib/stripe';
import { useCart } from '@/hooks/use-cart';
import { useCheckout } from '@/hooks/use-checkout';
import { useAuth } from '@/hooks/use-auth';
import { useCurrencyConverter } from '@/hooks/use-currency';
import { toast, standardToasts } from '@/lib/utils/toast';
import { CheckoutStepper, CheckoutStep } from '@/components/checkout/checkout-stepper';
import { UniversalAddressForm, AddressFormData, PaymentMethodSelector, PaymentMethodType, PayPalPayment } from '@/components/checkout';
import { getCountryConfig, getAllCountries } from '@/lib/data/address-countries';
import { useAddresses } from '@/hooks/use-addresses';
import { Address as APIAddress } from '@/lib/api/addresses';
import { ordersAPI, ShippingOption as APIShippingOption, OrderCalculationResponse } from '@/lib/api/orders';

// Legacy Address interface for backend compatibility (matches backend schema)
interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  saveAsDefault?: boolean;
}
import { ShippingMethodSelector } from '@/components/checkout/shipping-method';
import { PaymentForm } from '@/components/checkout/payment-form';
import { OrderSummary } from '@/components/checkout/order-summary';
import { ShippingSummaryCard } from '@/components/checkout/shipping-summary-card';
import { CheckoutSkeleton } from '@/components/loading/skeleton';
import { calculateShippingCost, getShippingMethodById } from '@/lib/shipping-config';
import { CheckoutUpsellAd } from '@/components/ads';

/**
 * Convert new AddressFormData to legacy Address format for backend
 */
function convertToLegacyAddress(data: AddressFormData, addressId?: string | null): Address {
  // Split full name into first and last name
  const nameParts = data.fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

  // Get country full name from country code
  const countryConfig = getCountryConfig(data.country);

  return {
    id: addressId || undefined, // Include ID if this is a saved address
    firstName,
    lastName,
    addressLine1: data.address,
    addressLine2: data.deliveryNotes || undefined,
    city: data.city,
    state: data.state || '',
    postalCode: data.postalCode || '',
    country: countryConfig.name,
    phone: data.phone,
    saveAsDefault: data.isDefault,
  };
}

/**
 * Convert legacy Address to new AddressFormData format
 */
function convertFromLegacyAddress(address: Address): Partial<AddressFormData> {
  // Find country code from country name
  const fullName = `${address.firstName} ${address.lastName}`.trim();

  return {
    country: 'US', // Default, will be overridden if we can map the country name
    fullName,
    phone: address.phone || '',
    address: address.addressLine1,
    city: address.city,
    state: address.state || undefined,
    postalCode: address.postalCode || undefined,
    deliveryNotes: address.addressLine2 || undefined,
    isDefault: address.saveAsDefault || false,
  };
}

/**
 * Convert API Address to AddressFormData format
 */
function convertApiAddressToFormData(apiAddress: APIAddress): Partial<AddressFormData> {
  const fullName = `${apiAddress.firstName} ${apiAddress.lastName}`.trim();

  // Find country code from country name
  const allCountries = getAllCountries();
  const countryMatch = allCountries.find(c => c.name === apiAddress.country);
  const countryCode = countryMatch?.code || 'US';

  return {
    country: countryCode,
    fullName,
    phone: apiAddress.phone || '',
    address: apiAddress.address1,
    city: apiAddress.city,
    state: apiAddress.province || undefined,
    postalCode: apiAddress.postalCode || undefined,
    deliveryNotes: apiAddress.address2 || undefined,
    isDefault: apiAddress.isDefault,
  };
}

// Wrapper component to handle async Stripe loading
function StripeElementsWrapper({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
  onBack,
}: {
  clientSecret: string;
  amount: number;
  currency?: string;
  onSuccess: (paymentIntentId: string) => Promise<void>;
  onError: (error: string) => void;
  onBack: () => void;
}) {
  const t = useTranslations('checkout');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    // Load Stripe instance
    getStripe().then((stripe) => {
      setStripePromise(Promise.resolve(stripe));
    }).catch((error) => {
      console.error('Failed to load Stripe:', error);
      toast.error('Failed to initialize payment system. Please check your settings.');
    });
  }, []);

  if (!stripePromise) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12">
          <svg
            className="animate-spin h-12 w-12 text-gold mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-neutral-600">{t('loadingPayment')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm
          amount={amount}
          currency={currency}
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onError={onError}
          onBack={onBack}
        />
      </Elements>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations('checkout');
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const { items, totals, clearCart, cartCurrency } = useCart();
  const { convertPrice, selectedCurrency } = useCurrencyConverter();
  const {
    step,
    completedSteps,
    shippingAddress,
    shippingMethod,
    clientSecret,
    orderId,
    isLoading,
    error: checkoutError,
    goToStep,
    saveShippingAddress,
    saveShippingMethod,
    createOrderAndPaymentIntent,
    handlePaymentSuccess,
    resetCheckout,
  } = useCheckout();

  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethodConfirmed, setShippingMethodConfirmed] = useState(false);

  // Payment method selection (Stripe or PayPal)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('stripe');

  // Saved addresses
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [savedAddressFormData, setSavedAddressFormData] = useState<Partial<AddressFormData> | undefined>(undefined);

  // Dynamic shipping options from backend
  const [availableShippingOptions, setAvailableShippingOptions] = useState<APIShippingOption[]>([]);
  const [isLoadingShippingOptions, setIsLoadingShippingOptions] = useState(false);
  const [backendCalculation, setBackendCalculation] = useState<OrderCalculationResponse | null>(null);

  // Calculate shipping and tax on checkout (not in cart)
  const [calculatedShipping, setCalculatedShipping] = useState<number>(0);
  const [calculatedTax, setCalculatedTax] = useState<number>(0);

  // Fetch shipping options and tax from backend after address is entered
  const fetchShippingOptionsAndTax = useCallback(async (addressId: string) => {
    if (!addressId || items.length === 0) return;

    setIsLoadingShippingOptions(true);
    try {
      const calculation = await ordersAPI.calculateTotals({
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.priceAtAdd || 0, // Use locked price, fallback to 0
        })),
        shippingAddressId: addressId,
        shippingMethod: selectedShippingMethod,
        currency: cartCurrency,
      });

      // API client auto-unwraps { success, data } responses
      setBackendCalculation(calculation);
      setAvailableShippingOptions(calculation.shippingOptions);

      // Set initial tax from backend
      setCalculatedTax(calculation.tax.amount);

      // If a shipping method is selected, use its price
      if (selectedShippingMethod) {
        const selectedOption = calculation.shippingOptions.find(
          (opt: APIShippingOption) => opt.id === selectedShippingMethod
        );
        if (selectedOption) {
          setCalculatedShipping(selectedOption.price);
        }
      }

      console.log('Backend shipping options:', calculation.shippingOptions);
      console.log('Tax calculation:', calculation.tax);
    } catch (error: any) {
      console.error('Failed to fetch shipping options:', error);
      // Fallback to hardcoded options if backend fails
      toast.error(t('couldNotLoadShipping'));
    } finally {
      setIsLoadingShippingOptions(false);
    }
  }, [items, selectedShippingMethod, cartCurrency, t]);

  // Update shipping cost when shipping method changes
  // Only calculate if we've completed the shipping address step
  useEffect(() => {
    if (completedSteps.includes('shipping') && backendCalculation) {
      // Use backend calculation
      const selectedOption = backendCalculation.shippingOptions.find(
        opt => opt.id === selectedShippingMethod
      );
      if (selectedOption) {
        setCalculatedShipping(selectedOption.price);
      }
    } else if (!completedSteps.includes('shipping')) {
      // Reset shipping if we go back to address step
      setCalculatedShipping(0);
      setCalculatedTax(0);
    }
  }, [selectedShippingMethod, completedSteps, backendCalculation]);

  // Redirect if not authenticated
  useEffect(() => {
    // Wait for auth to initialize before making redirect decision
    if (isInitialized && !user) {
      toast.warning(t('loginRequired'));
      router.push('/auth/login?redirect=/checkout');
    }
  }, [user, isInitialized, router, t]);

  // Redirect if cart is empty
  useEffect(() => {
    // Only check after auth is initialized and user is confirmed
    if (isInitialized && user && items.length === 0) {
      toast.info(t('emptyCartRedirect'));
      router.push('/cart');
    }
  }, [items, router, isInitialized, user, t]);

  // Create order and payment intent when shipping method is confirmed
  useEffect(() => {
    if (step === 'payment' && shippingMethodConfirmed && !clientSecret && items.length > 0 && shippingAddress && user) {
      // Create totals with calculated shipping and tax from checkout
      const checkoutTotals = {
        ...totals,
        shipping: calculatedShipping,
        tax: calculatedTax,
        total: totals.subtotal + calculatedShipping + calculatedTax,
      };

      // Pass cart's locked currency to ensure payment uses same currency
      createOrderAndPaymentIntent(items, checkoutTotals, cartCurrency).catch((err) => {
        // Use longer duration for stock errors (they may contain multiple items)
        const duration = err.message?.includes('Insufficient stock') ? 8000 : 5000;
        toast.error(err.message || t('failedInitCheckout'), { duration });
        setShippingMethodConfirmed(false);
        goToStep('shipping');
      });
    }
  }, [step, shippingMethodConfirmed, clientSecret, items, selectedShippingMethod, totals, calculatedShipping, calculatedTax, shippingAddress, createOrderAndPaymentIntent, goToStep, user, cartCurrency, t]);

  // Reset shipping method confirmation when leaving payment step
  useEffect(() => {
    if (step !== 'payment') {
      setShippingMethodConfirmed(false);
    }
  }, [step]);

  // Show loading skeleton while auth is initializing or checkout is loading
  if (!isInitialized || authLoading || (isLoading && !clientSecret)) {
    return <CheckoutSkeleton />;
  }

  // Don't render checkout if not authenticated (after initialization)
  if (!user) {
    return null;
  }

  const handleSavedAddressSelect = (addressId: string | null) => {
    if (!addressId) {
      // "New address" selected - clear form
      setSelectedSavedAddressId(null);
      setSavedAddressFormData(undefined);
      return;
    }

    // Find selected address
    const selectedAddress = addresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setSelectedSavedAddressId(addressId);
      setSavedAddressFormData(convertApiAddressToFormData(selectedAddress));
    }
  };

  const handleAddressSubmit = async (data: AddressFormData) => {
    try {
      // Convert new AddressFormData to legacy Address format
      // Pass selectedSavedAddressId to avoid creating duplicates
      const legacyAddress = convertToLegacyAddress(data, selectedSavedAddressId);
      console.log('Submitting address:', legacyAddress);
      const savedAddress = await saveShippingAddress(legacyAddress);

      if (selectedSavedAddressId) {
        toast.success(t('usingSavedAddress'));
      } else {
        toast.success(t('addressSaved'));
      }

      // Fetch shipping options and tax calculation from backend
      const addressId = savedAddress?.id || selectedSavedAddressId;
      if (addressId) {
        console.log('Fetching shipping options for address:', addressId);
        await fetchShippingOptionsAndTax(addressId);
      }
    } catch (error: any) {
      console.error('Error saving shipping address:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || t('failedSaveAddress'));
    }
  };

  const handleShippingMethodContinue = () => {
    // First check if this is a backend shipping option
    const backendOption = availableShippingOptions.find(opt => opt.id === selectedShippingMethod);

    if (backendOption) {
      // Using backend/zone-based shipping option
      saveShippingMethod({
        id: backendOption.id,
        name: backendOption.name,
        price: backendOption.price, // Backend already calculated the price
      });
      setShippingMethodConfirmed(true);
      return;
    }

    // Fallback to hardcoded shipping method (for backward compatibility)
    const methodConfig = getShippingMethodById(selectedShippingMethod);
    if (methodConfig) {
      saveShippingMethod({
        id: methodConfig.id,
        name: methodConfig.name,
        price: calculatedShipping, // Use checkout's calculated shipping
      });
      setShippingMethodConfirmed(true);
    } else {
      // No valid shipping method found
      toast.error(t('selectValidShipping'));
    }
  };

  const onPaymentSuccess = async (paymentIntentId: string) => {
    setIsProcessing(true);

    try {
      // Payment succeeded - order was already created
      await handlePaymentSuccess(paymentIntentId);

      // Clear cart after successful payment
      await clearCart();

      // Redirect to success page
      router.push(`/checkout/success?orderId=${orderId}`);

      standardToasts.order.created();
    } catch (error: any) {
      console.error('Payment completion failed:', error);
      toast.error(error.message || t('failedCompleteOrder'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error || t('paymentFailed'));
  };

  const handleStepClick = (stepId: CheckoutStep) => {
    if (completedSteps.includes(stepId)) {
      goToStep(stepId);
    }
  };

  // Calculate checkout totals (shipping and tax calculated here, not in cart)
  const methodConfig = getShippingMethodById(selectedShippingMethod);

  // Use calculated shipping and tax from checkout (not cart)
  const shippingCost = calculatedShipping;
  const taxAmount = calculatedTax;
  const totalWithShipping = totals.subtotal + shippingCost + taxAmount;

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto mb-8"
        >
          <h1 className="text-4xl font-serif font-bold text-black mb-2">{t('checkout')}</h1>
          <p className="text-neutral-600">{t('completeSecurely')}</p>
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-6xl mx-auto mb-12"
        >
          <CheckoutStepper
            currentStep={step}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Shipping Address */}
                {step === 'shipping' && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Saved Address Selector */}
                    {!addressesLoading && addresses.length > 0 && (
                      <div className="mb-6">
                        <div className="bg-gradient-to-br from-gold/5 to-neutral-50 rounded-lg border-2 border-gold/20 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                            <h3 className="text-base font-semibold text-black">{t('useSavedAddress')}</h3>
                          </div>

                          <div className="space-y-3">
                            {/* New Address Option */}
                            <label
                              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                !selectedSavedAddressId
                                  ? 'border-gold bg-gold/5 shadow-sm'
                                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name="saved-address"
                                value="new"
                                checked={!selectedSavedAddressId}
                                onChange={() => handleSavedAddressSelect(null)}
                                className="mt-1 w-4 h-4 text-gold focus:ring-gold"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span className="font-medium text-black">{t('enterNewAddress')}</span>
                                </div>
                              </div>
                            </label>

                            {/* Saved Addresses */}
                            {addresses.map((address) => (
                              <label
                                key={address.id}
                                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  selectedSavedAddressId === address.id
                                    ? 'border-gold bg-gold/5 shadow-sm'
                                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="saved-address"
                                  value={address.id}
                                  checked={selectedSavedAddressId === address.id}
                                  onChange={() => handleSavedAddressSelect(address.id)}
                                  className="mt-1 w-4 h-4 text-gold focus:ring-gold"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-black">
                                      {address.firstName} {address.lastName}
                                    </span>
                                    {address.isDefault && (
                                      <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-semibold rounded-full">
                                        {t('default')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-neutral-600 leading-relaxed">
                                    {address.address1}
                                    {address.address2 && `, ${address.address2}`}
                                    <br />
                                    {address.city}
                                    {address.province && `, ${address.province}`}
                                    {address.postalCode && ` ${address.postalCode}`}
                                    <br />
                                    {address.country}
                                  </p>
                                  {address.phone && (
                                    <p className="text-sm text-neutral-500 mt-1">
                                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                      </svg>
                                      {address.phone}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address Form */}
                    <div className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm">
                      <UniversalAddressForm
                        initialData={savedAddressFormData || (shippingAddress ? convertFromLegacyAddress(shippingAddress) : undefined)}
                        onSubmit={handleAddressSubmit}
                        submitLabel={t('continueToShipping')}
                        key={selectedSavedAddressId || 'new'}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Payment */}
                {step === 'payment' && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <AnimatePresence mode="wait">
                      {/* Shipping Method - Only show if not confirmed */}
                      {!shippingMethodConfirmed && (
                        <motion.div
                          key="shipping-method"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm"
                        >
                          <ShippingMethodSelector
                            selectedMethod={selectedShippingMethod}
                            onSelect={setSelectedShippingMethod}
                            onContinue={handleShippingMethodContinue}
                            onBack={() => goToStep('shipping')}
                            isLoading={isLoading}
                            subtotal={totals.subtotal}
                            shippingOptions={availableShippingOptions}
                            isLoadingOptions={isLoadingShippingOptions}
                            currency={cartCurrency}
                          />
                        </motion.div>
                      )}

                      {/* Loading Payment Intent - Show when confirmed but no clientSecret yet (Stripe only) */}
                      {shippingMethodConfirmed && selectedPaymentMethod === 'stripe' && !clientSecret && (
                        <motion.div
                          key="loading-payment"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm"
                        >
                          <div className="flex flex-col items-center justify-center py-12">
                            <svg
                              className="animate-spin h-12 w-12 text-gold mb-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <p className="text-neutral-600 mb-2">{t('initializingPayment')}</p>
                            <p className="text-sm text-neutral-500">{t('preparingOrder')}</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Payment Form - Show for Stripe (with clientSecret) or PayPal (no clientSecret needed) */}
                      {shippingMethodConfirmed && (selectedPaymentMethod === 'paypal' || (selectedPaymentMethod === 'stripe' && clientSecret)) && (
                        <motion.div
                          key="payment-form"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          {/* Show selected shipping method summary */}
                          <ShippingSummaryCard
                            shippingMethod={{
                              name: getShippingMethodById(selectedShippingMethod)?.name || 'Standard Shipping',
                              price: shippingCost,
                              estimatedDays: getShippingMethodById(selectedShippingMethod)?.estimatedDays || '5-7 business days',
                            }}
                            shippingAddress={shippingAddress ? {
                              firstName: shippingAddress.firstName,
                              lastName: shippingAddress.lastName,
                              addressLine1: shippingAddress.addressLine1,
                              city: shippingAddress.city,
                              state: shippingAddress.state,
                              postalCode: shippingAddress.postalCode,
                            } : undefined}
                          />

                          {/* Payment Method Selector */}
                          <PaymentMethodSelector
                            selectedMethod={selectedPaymentMethod}
                            onMethodChange={setSelectedPaymentMethod}
                          />

                          {/* Conditional Payment Form - Stripe or PayPal */}
                          {selectedPaymentMethod === 'stripe' ? (
                            <StripeElementsWrapper
                              clientSecret={clientSecret || ''}
                              amount={totalWithShipping}
                              currency={cartCurrency || 'USD'}
                              onSuccess={onPaymentSuccess}
                              onError={handlePaymentError}
                              onBack={() => setShippingMethodConfirmed(false)}
                            />
                          ) : (
                            <PayPalPayment
                              orderId={orderId || ''}
                              amount={totalWithShipping}
                              currency={cartCurrency}
                              items={items.map((item) => ({
                                name: item.name || 'Product',
                                quantity: item.quantity,
                                price: item.priceAtAdd || 0,
                              }))}
                              shippingAddress={shippingAddress}
                              onSuccess={async (paypalOrderId) => {
                                // Handle PayPal payment success
                                toast.success('Payment successful! Redirecting...');
                                router.push(`/orders/${orderId}`);
                              }}
                              onError={handlePaymentError}
                              onBack={() => setShippingMethodConfirmed(false)}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Review - This would show order review */}
                {step === 'review' && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm"
                  >
                    <h3 className="text-2xl font-serif font-bold mb-6">{t('reviewYourOrder')}</h3>
                    <p className="text-neutral-600">
                      Review step would go here (currently handled in payment step)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Checkout Upsell Ad */}
              <CheckoutUpsellAd />

              {/* Order Summary */}
              <OrderSummary
                items={items}
                subtotal={totals.subtotal}
                shipping={shippingCost}
                tax={taxAmount}
                total={totalWithShipping}
                cartCurrency={cartCurrency} // Pass locked currency to prevent double conversion
                shippingMethod={{
                  name: getShippingMethodById(selectedShippingMethod)?.name || 'Standard Shipping',
                  price: shippingCost,
                }}
                hasShippingAddress={!!shippingAddress} // Show "Calculated at next step" before address entered
              />
            </div>
          </div>
        </div>

        {/* Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-8 rounded-lg shadow-2xl max-w-md mx-4"
              >
                <div className="flex flex-col items-center text-center">
                  <svg
                    className="animate-spin h-16 w-16 text-gold mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <h3 className="text-xl font-serif font-bold text-black mb-2">
                    {t('processingOrder')}
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    {t('pleaseWait')}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {t('doNotClose')}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
