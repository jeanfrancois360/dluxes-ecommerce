'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripe } from '@/lib/stripe';
import { useCart } from '@/hooks/use-cart';
import { useCheckout } from '@/hooks/use-checkout';
import { useAuth } from '@/hooks/use-auth';
import { useCurrencyConverter } from '@/hooks/use-currency';
import { toast, standardToasts } from '@/lib/utils/toast';
import { CheckoutStepper, CheckoutStep } from '@/components/checkout/checkout-stepper';
import { AddressForm, Address } from '@/components/checkout/address-form';
import { ShippingMethodSelector } from '@/components/checkout/shipping-method';
import { PaymentForm } from '@/components/checkout/payment-form';
import { OrderSummary } from '@/components/checkout/order-summary';
import { ShippingSummaryCard } from '@/components/checkout/shipping-summary-card';
import { CheckoutSkeleton } from '@/components/loading/skeleton';
import { calculateShippingCost, getShippingMethodById } from '@/lib/shipping-config';
import { CheckoutUpsellAd } from '@/components/ads';

// Wrapper component to handle async Stripe loading
function StripeElementsWrapper({
  clientSecret,
  amount,
  onSuccess,
  onError,
  onBack,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => Promise<void>;
  onError: (error: string) => void;
  onBack: () => void;
}) {
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
          <p className="text-neutral-600">Loading payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm
          amount={amount}
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
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const { items, totals, clearCart, cartCurrency } = useCart();
  const { convertPrice } = useCurrencyConverter();
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

  // Redirect if not authenticated
  useEffect(() => {
    // Wait for auth to initialize before making redirect decision
    if (isInitialized && !user) {
      toast.warning('Please login to continue with checkout');
      router.push('/auth/login?redirect=/checkout');
    }
  }, [user, isInitialized, router]);

  // Redirect if cart is empty
  useEffect(() => {
    // Only check after auth is initialized and user is confirmed
    if (isInitialized && user && items.length === 0) {
      toast.info('Your cart is empty. Please add items before checkout');
      router.push('/cart');
    }
  }, [items, router, isInitialized, user]);

  // Create order and payment intent when shipping method is confirmed
  useEffect(() => {
    if (step === 'payment' && shippingMethodConfirmed && !clientSecret && items.length > 0 && shippingAddress && user) {
      // Calculate dynamic shipping cost based on subtotal
      const shippingCalculation = calculateShippingCost(selectedShippingMethod, totals.subtotal);
      // Convert shipping cost from USD to selected currency
      const convertedShipping = convertPrice(shippingCalculation.finalPrice, 'USD');

      createOrderAndPaymentIntent(items, {
        ...totals,
        shipping: convertedShipping,
      }).catch((err) => {
        // Use longer duration for stock errors (they may contain multiple items)
        const duration = err.message?.includes('Insufficient stock') ? 8000 : 5000;
        toast.error(err.message || 'Failed to initialize checkout. Please try again.', { duration });
        setShippingMethodConfirmed(false);
        goToStep('shipping');
      });
    }
  }, [step, shippingMethodConfirmed, clientSecret, items, selectedShippingMethod, totals, shippingAddress, createOrderAndPaymentIntent, goToStep, user, convertPrice]);

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

  const handleAddressSubmit = async (address: Address) => {
    try {
      await saveShippingAddress(address);
      toast.success('Shipping address saved successfully');
    } catch (error) {
      toast.error('Failed to save shipping address');
    }
  };

  const handleShippingMethodContinue = () => {
    const methodConfig = getShippingMethodById(selectedShippingMethod);
    const shippingCalculation = calculateShippingCost(selectedShippingMethod, totals.subtotal);
    // Convert shipping cost from USD to selected currency
    const convertedShipping = convertPrice(shippingCalculation.finalPrice, 'USD');

    if (methodConfig) {
      saveShippingMethod({
        id: methodConfig.id,
        name: methodConfig.name,
        price: convertedShipping,
      });
      // Confirm shipping method to trigger payment intent creation
      setShippingMethodConfirmed(true);
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
      toast.error(error.message || 'Failed to complete order. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error || 'Payment failed. Please try again.');
  };

  const handleStepClick = (stepId: CheckoutStep) => {
    if (completedSteps.includes(stepId)) {
      goToStep(stepId);
    }
  };

  // Calculate totals with selected shipping method (dynamic pricing)
  const shippingCalculation = calculateShippingCost(selectedShippingMethod, totals.subtotal);
  // Convert shipping cost from USD to selected currency
  const convertedShippingCost = convertPrice(shippingCalculation.finalPrice, 'USD');
  const totalWithShipping = totals.total - totals.shipping + convertedShippingCost;

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
          <h1 className="text-4xl font-serif font-bold text-black mb-2">Checkout</h1>
          <p className="text-neutral-600">Complete your purchase securely</p>
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
                    className="bg-white p-6 md:p-8 rounded-lg border-2 border-neutral-200 shadow-sm"
                  >
                    <AddressForm
                      initialAddress={shippingAddress || undefined}
                      onSubmit={handleAddressSubmit}
                      isLoading={isLoading}
                    />
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
                          />
                        </motion.div>
                      )}

                      {/* Loading Payment Intent - Show when confirmed but no clientSecret yet */}
                      {shippingMethodConfirmed && !clientSecret && (
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
                            <p className="text-neutral-600 mb-2">Initializing secure payment...</p>
                            <p className="text-sm text-neutral-500">Preparing your order and payment details</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Payment Form - Only show if we have client secret */}
                      {shippingMethodConfirmed && clientSecret && (
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
                              price: convertedShippingCost,
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

                          <StripeElementsWrapper
                            clientSecret={clientSecret}
                            amount={totalWithShipping}
                            onSuccess={onPaymentSuccess}
                            onError={handlePaymentError}
                            onBack={() => setShippingMethodConfirmed(false)}
                          />
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
                    <h3 className="text-2xl font-serif font-bold mb-6">Review Your Order</h3>
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
                shipping={convertedShippingCost}
                tax={totals.tax}
                total={totalWithShipping}
                shippingMethod={{
                  name: getShippingMethodById(selectedShippingMethod)?.name || 'Standard Shipping',
                  price: convertedShippingCost,
                }}
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
                    Processing Your Order
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    Please wait while we complete your purchase...
                  </p>
                  <p className="text-sm text-neutral-500">
                    Do not close this window or press the back button
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
