'use client';

import { motion } from 'framer-motion';
import { cn } from '@nextpik/ui';

export type CheckoutStep = 'shipping' | 'payment' | 'review';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepClick?: (step: CheckoutStep) => void;
  className?: string;
}

const STEPS: Array<{ id: CheckoutStep; label: string; number: number }> = [
  { id: 'shipping', label: 'Shipping', number: 1 },
  { id: 'payment', label: 'Payment', number: 2 },
  { id: 'review', label: 'Review', number: 3 },
];

export function CheckoutStepper({
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: CheckoutStepperProps) {
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  const isStepCompleted = (stepId: CheckoutStep) => {
    return completedSteps.includes(stepId);
  };

  const isStepActive = (stepId: CheckoutStep) => {
    return currentStep === stepId;
  };

  const isStepClickable = (stepId: CheckoutStep, index: number) => {
    // Can click on completed steps or the current step
    return isStepCompleted(stepId) || index <= currentStepIndex;
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile View - Horizontal Pills */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, index) => (
            <motion.button
              key={step.id}
              onClick={() => {
                if (isStepClickable(step.id, index) && onStepClick) {
                  onStepClick(step.id);
                }
              }}
              disabled={!isStepClickable(step.id, index)}
              whileHover={isStepClickable(step.id, index) ? { scale: 1.05 } : {}}
              whileTap={isStepClickable(step.id, index) ? { scale: 0.95 } : {}}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:cursor-not-allowed',
                isStepActive(step.id) && 'bg-gold text-white shadow-lg shadow-gold/20',
                isStepCompleted(step.id) && !isStepActive(step.id) && 'bg-green-100 text-green-800',
                !isStepActive(step.id) && !isStepCompleted(step.id) && 'bg-neutral-100 text-neutral-500'
              )}
            >
              {isStepCompleted(step.id) ? (
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {step.label}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  {step.number}. {step.label}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Desktop View - Horizontal Stepper */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-0 top-6 w-full h-0.5 bg-neutral-200">
            <motion.div
              initial={{ width: '0%' }}
              animate={{
                width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="h-full bg-gold"
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = isStepCompleted(step.id);
              const isActive = isStepActive(step.id);
              const isClickable = isStepClickable(step.id, index);

              return (
                <motion.button
                  key={step.id}
                  onClick={() => {
                    if (isClickable && onStepClick) {
                      onStepClick(step.id);
                    }
                  }}
                  disabled={!isClickable}
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  className={cn(
                    'flex flex-col items-center gap-3 relative',
                    'transition-all disabled:cursor-not-allowed',
                    isClickable && 'cursor-pointer'
                  )}
                >
                  {/* Step Circle */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-base transition-all relative z-10',
                      isActive &&
                        'bg-gold text-white shadow-lg shadow-gold/30 ring-4 ring-gold/20',
                      isCompleted &&
                        !isActive &&
                        'bg-green-500 text-white shadow-md shadow-green-500/20',
                      !isActive && !isCompleted && 'bg-white text-neutral-400 border-2 border-neutral-300'
                    )}
                  >
                    {isCompleted ? (
                      <motion.svg
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </motion.div>

                  {/* Step Label */}
                  <div className="text-center">
                    <p
                      className={cn(
                        'text-sm font-semibold transition-colors',
                        isActive && 'text-gold',
                        isCompleted && !isActive && 'text-green-700',
                        !isActive && !isCompleted && 'text-neutral-500'
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {isCompleted && !isActive ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                    </p>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-2 w-full h-1 bg-gold rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Description */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 p-4 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 rounded-lg"
      >
        <p className="text-sm text-neutral-600 text-center">
          {currentStep === 'shipping' && (
            <>
              <span className="font-semibold text-black">Step 1:</span> Enter your shipping address
              and contact information
            </>
          )}
          {currentStep === 'payment' && (
            <>
              <span className="font-semibold text-black">Step 2:</span> Select your shipping method
              and enter payment details
            </>
          )}
          {currentStep === 'review' && (
            <>
              <span className="font-semibold text-black">Step 3:</span> Review your order and
              complete your purchase
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
