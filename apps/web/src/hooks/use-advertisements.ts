import useSWR from 'swr';
import {
  advertisementsApi,
  advertisementPlansApi,
  type AdvertisementDetail,
  type AdvertisementPlan,
  type AdPlanSubscription,
  type CreateAdvertisementDto,
  type UpdateAdvertisementDto,
} from '@/lib/api';

// Advertisement Hooks
export function useAdvertisements() {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementDetail[]>(
    '/advertisements',
    advertisementsApi.getAll,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    advertisements: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useActiveAdvertisements(placement?: string) {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementDetail[]>(
    placement ? `/advertisements/active?placement=${placement}` : '/advertisements/active',
    () => advertisementsApi.getActive(placement as any),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    advertisements: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useMyAdvertisements() {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementDetail[]>(
    '/advertisements/my',
    advertisementsApi.getMyAds,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    advertisements: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useAdvertisement(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementDetail | null>(
    id ? `/advertisements/${id}` : null,
    id ? () => advertisementsApi.getById(id) : null,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    advertisement: data || null,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useAdvertisementAnalytics(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/advertisements/${id}/analytics` : null,
    id ? () => advertisementsApi.getAnalytics(id) : null,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    analytics: data || null,
    isLoading,
    error,
    refresh: mutate,
  };
}

// Advertisement Plan Hooks
export function useAdvertisementPlans() {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementPlan[]>(
    '/advertisement-plans',
    advertisementPlansApi.getAll,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    plans: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useAdvertisementPlan(slug: string | null) {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementPlan | null>(
    slug ? `/advertisement-plans/${slug}` : null,
    slug ? () => advertisementPlansApi.getBySlug(slug) : null,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    plan: data || null,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useMyAdSubscription() {
  const { data, error, isLoading, mutate } = useSWR<AdPlanSubscription | null>(
    '/advertisement-plans/seller/subscription',
    advertisementPlansApi.getMySubscription,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    subscription: data || null,
    plan: data?.plan || null,
    isActive: data?.status === 'ACTIVE' || data?.status === 'TRIAL',
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useAdSubscriptionHistory() {
  const { data, error, isLoading, mutate } = useSWR<AdPlanSubscription[]>(
    '/advertisement-plans/seller/subscriptions/history',
    advertisementPlansApi.getSubscriptionHistory,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    history: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// Admin Hooks
export function useAdminAdPlans() {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementPlan[]>(
    '/advertisement-plans/admin/plans',
    advertisementPlansApi.adminGetAll,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    plans: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useAdminAdStatistics() {
  const { data, error, isLoading, mutate } = useSWR(
    '/advertisement-plans/admin/statistics',
    advertisementPlansApi.adminGetStatistics,
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    }
  );

  return {
    statistics: data || null,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useAdminAdSubscriptions() {
  const { data, error, isLoading, mutate } = useSWR<AdPlanSubscription[]>(
    '/advertisement-plans/admin/subscriptions',
    advertisementPlansApi.adminGetSubscriptions,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    subscriptions: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function usePendingAdvertisements() {
  const { data, error, isLoading, mutate } = useSWR<AdvertisementDetail[]>(
    '/advertisements/pending',
    advertisementsApi.getPending,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  return {
    pendingAds: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// Mutation Hooks
export function useAdvertisementMutations() {
  return {
    async create(data: CreateAdvertisementDto) {
      return await advertisementsApi.create(data);
    },
    async update(id: string, data: UpdateAdvertisementDto) {
      return await advertisementsApi.update(id, data);
    },
    async toggle(id: string, isActive: boolean) {
      return await advertisementsApi.toggle(id, isActive);
    },
    async delete(id: string) {
      return await advertisementsApi.delete(id);
    },
    async approve(id: string) {
      return await advertisementsApi.approve(id);
    },
    async reject(id: string, reason?: string) {
      return await advertisementsApi.reject(id, reason);
    },
  };
}

export function useAdminAdPlanMutations() {
  return {
    async createPlan(data: Partial<AdvertisementPlan>) {
      return await advertisementPlansApi.adminCreate(data);
    },
    async updatePlan(slug: string, data: Partial<AdvertisementPlan>) {
      return await advertisementPlansApi.adminUpdate(slug, data);
    },
    async deletePlan(slug: string) {
      return await advertisementPlansApi.adminDelete(slug);
    },
  };
}

export function useAdPlanSubscriptionMutations() {
  return {
    async subscribe(planSlug: string, billingPeriod?: 'MONTHLY' | 'YEARLY') {
      return await advertisementPlansApi.subscribe({ planSlug, billingPeriod });
    },
    async cancel(subscriptionId: string) {
      return await advertisementPlansApi.cancelSubscription(subscriptionId);
    },
  };
}
