'use client';

import React from 'react';
import { cn } from '@nextpik/ui';
import { Package, CreditCard, ShieldCheck, Check } from 'lucide-react';

export type CheckoutStep = 'shipping' | 'payment' | 'review';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepClick?: (step: CheckoutStep) => void;
  className?: string;
}

const STEPS: Array<{
  id: CheckoutStep;
  label: string;
  number: number;
  icon: any;
}> = [
  {
    id: 'shipping',
    label: 'Shipping Details',
    number: 1,
    icon: Package,
  },
  {
    id: 'payment',
    label: 'Payment Info',
    number: 2,
    icon: CreditCard,
  },
  {
    id: 'review',
    label: 'Review Order',
    number: 3,
    icon: ShieldCheck,
  },
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
    return isStepCompleted(stepId) || index <= currentStepIndex;
  };

  const getStepStatus = (stepId: CheckoutStep) => {
    if (isStepCompleted(stepId)) return 'completed';
    if (isStepActive(stepId)) return 'in-progress';
    return 'pending';
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Horizontal Stepper */}
      <div className="relative">
        {/* Connecting Lines */}
        <div className="absolute top-6 left-0 right-0 flex items-center px-12">
          <div className="flex-1 flex items-center gap-4">
            {STEPS.slice(0, -1).map((step, index) => {
              const isCompleted = isStepCompleted(step.id);
              const isBeforeCurrent = index < currentStepIndex;

              return (
                <div key={step.id} className="flex-1 h-1 rounded-full bg-neutral-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      (isCompleted || isBeforeCurrent) && 'bg-green-500',
                      isStepActive(step.id) && 'bg-gold w-1/2'
                    )}
                    style={{
                      width: (isCompleted || isBeforeCurrent) ? '100%' : isStepActive(step.id) ? '50%' : '0%'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = isStepCompleted(step.id);
            const isActive = isStepActive(step.id);
            const isClickable = isStepClickable(step.id, index);
            const Icon = step.icon;
            const status = getStepStatus(step.id);

            return (
              <button
                key={step.id}
                onClick={() => {
                  if (isClickable && onStepClick) {
                    onStepClick(step.id);
                  }
                }}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-3 relative z-10',
                  'transition-all disabled:cursor-not-allowed',
                  isClickable && 'cursor-pointer hover:scale-105'
                )}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                    'border-2',
                    isCompleted && 'bg-green-500 border-green-500',
                    isActive && 'bg-gold border-gold ring-4 ring-gold/20',
                    !isActive && !isCompleted && 'bg-white border-neutral-300'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  ) : (
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isActive && 'text-white',
                        !isActive && 'text-neutral-400'
                      )}
                    />
                  )}
                </div>

                {/* Labels */}
                <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                    Step {step.number}
                  </p>
                  <p
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      isActive && 'text-neutral-900',
                      isCompleted && !isActive && 'text-neutral-700',
                      !isActive && !isCompleted && 'text-neutral-400'
                    )}
                  >
                    {step.label}
                  </p>
                  <span
                    className={cn(
                      'text-xs font-medium px-3 py-1 rounded-full transition-all',
                      status === 'completed' && 'bg-green-100 text-green-700',
                      status === 'in-progress' && 'bg-gold/10 text-gold',
                      status === 'pending' && 'bg-neutral-100 text-neutral-500'
                    )}
                  >
                    {status === 'completed' && 'Completed'}
                    {status === 'in-progress' && 'In Progress'}
                    {status === 'pending' && 'Pending'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
