import useSWR from 'swr';
import { subscriptionApi, SubscriptionPlan, SubscriptionInfo } from '@/lib/api/subscription';
import { creditsApi, CreditBalance, CreditPackage } from '@/lib/api/credits';

export function useSubscriptionPlans() {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionPlan[]>(
    '/subscription/plans',
    subscriptionApi.getPlans,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    plans: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useMySubscription() {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionInfo>(
    '/subscription/my-subscription',
    subscriptionApi.getMySubscription,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    subscription: data?.subscription || null,
    plan: data?.plan || null,
    tier: data?.tier || 'FREE',
    isActive: data?.isActive ?? false,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useCreditBalance() {
  const { data, error, isLoading, mutate } = useSWR<CreditBalance>(
    '/credits/balance',
    creditsApi.getBalance,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    balance: data || null,
    availableCredits: data?.availableCredits ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useCreditPackages() {
  const { data, error, isLoading } = useSWR<CreditPackage[]>(
    '/credits/packages',
    creditsApi.getPackages,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    packages: data || [],
    isLoading,
    error,
  };
}

export function useCanListProductType(productType: string | null) {
  const { data, error, isLoading } = useSWR(
    productType ? `/subscription/can-list/${productType}` : null,
    () => productType ? subscriptionApi.canListProductType(productType) : null,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    canList: data?.canList ?? false,
    reasons: data?.reasons || {
      productTypeAllowed: false,
      meetsTierRequirement: false,
      hasListingCapacity: false,
      hasMonthlyCredits: false,
    },
    isLoading,
    error,
  };
}
