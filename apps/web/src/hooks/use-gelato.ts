import useSWR from 'swr';
import { gelatoApi } from '@/lib/api/gelato';

export function useGelatoStatus() {
  const { data, error, isLoading, mutate } = useSWR('gelato-status', () => gelatoApi.getStatus(), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  return { status: data, error, isLoading, refresh: mutate };
}

export function useGelatoCategories() {
  const { data, error, isLoading } = useSWR('gelato-categories', () => gelatoApi.getCategories(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  return { categories: data || [], error, isLoading };
}

export function useGelatoCatalog(params?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const key = params ? `gelato-catalog-${JSON.stringify(params)}` : 'gelato-catalog';
  const { data, error, isLoading, mutate } = useSWR(key, () => gelatoApi.getProducts(params), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  return {
    products: data?.products || [],
    total: data?.total || 0,
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useGelatoProduct(productUid: string | null) {
  const { data, error, isLoading } = useSWR(
    productUid ? `gelato-product-${productUid}` : null,
    () => (productUid ? gelatoApi.getProductDetails(productUid) : null),
    { revalidateOnFocus: false }
  );
  return { product: data, error, isLoading };
}

export function usePodOrders(params?: { status?: string; orderId?: string; limit?: number }) {
  const key = params ? `pod-orders-${JSON.stringify(params)}` : 'pod-orders';
  const { data, error, isLoading, mutate } = useSWR(key, () => gelatoApi.getPodOrders(params), {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  });
  return { orders: data?.orders || [], total: data?.total || 0, error, isLoading, refresh: mutate };
}

export function usePodOrder(podOrderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    podOrderId ? `pod-order-${podOrderId}` : null,
    () => (podOrderId ? gelatoApi.getPodOrder(podOrderId) : null),
    { revalidateOnFocus: true, refreshInterval: 10000 }
  );
  return { order: data, error, isLoading, refresh: mutate };
}
