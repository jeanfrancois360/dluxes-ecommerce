/**
 * Admin Hooks
 *
 * Custom hooks for admin dashboard operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  dashboardApi,
  adminProductsApi,
  adminOrdersApi,
  adminCustomersApi,
  adminCategoriesApi,
  adminReviewsApi,
  adminAnalyticsApi,
  type DashboardStats,
  type RevenueData,
  type OrdersByStatus,
  type TopProduct,
  type CustomerGrowth,
  type RecentOrder,
  type AdminProduct,
  type AdminOrder,
  type AdminCustomer,
  type Category,
  type Review,
} from '@/lib/api/admin';

// Dashboard Hooks
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await dashboardApi.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useRevenueData(days: number = 30) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const revenue = await dashboardApi.getRevenueData(days);
        setData(revenue);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [days]);

  return { data, loading, error };
}

export function useOrdersByStatus() {
  const [data, setData] = useState<OrdersByStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const orders = await dashboardApi.getOrdersByStatus();
        setData(orders);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useTopProducts(limit: number = 5) {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await dashboardApi.getTopProducts(limit);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch top products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [limit]);

  return { products, loading, error };
}

export function useCustomerGrowth(days: number = 30) {
  const [data, setData] = useState<CustomerGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const growth = await dashboardApi.getCustomerGrowth(days);
        setData(growth);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customer growth');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [days]);

  return { data, loading, error };
}

export function useRecentOrders(limit: number = 10) {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await dashboardApi.getRecentOrders(limit);
        setOrders(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recent orders');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [limit]);

  return { orders, loading, error };
}

// Products Hooks
export function useAdminProducts(params?: Parameters<typeof adminProductsApi.getAll>[0]) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent infinite loops
  const memoizedParams = useMemo(() => params, [
    params?.page,
    params?.limit,
    params?.search,
    params?.category,
    params?.status,
    params?.sortBy,
    params?.sortOrder,
  ]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductsApi.getAll(memoizedParams);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, total, pages, loading, error, refetch: fetchProducts };
}

export function useAdminProduct(id: string) {
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setProduct(null);
      setError(null);
      const data = await adminProductsApi.getById(id);
      setProduct(data);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setProduct(null);
      setError(err?.message || err?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}

// Orders Hooks
export function useAdminOrders(params?: Parameters<typeof adminOrdersApi.getAll>[0]) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent infinite loops
  const memoizedParams = useMemo(() => params, [
    params?.page,
    params?.limit,
    params?.status,
    params?.paymentStatus,
    params?.search,
    params?.startDate,
    params?.endDate,
  ]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminOrdersApi.getAll(memoizedParams);
      setOrders(data.orders);
      setTotal(data.total);
      setPages(data.pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, total, pages, loading, error, refetch: fetchOrders };
}

export function useAdminOrder(id: string) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await adminOrdersApi.getById(id);
        setOrder(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  return { order, loading, error };
}

// Customers Hooks
export function useAdminCustomers(params?: Parameters<typeof adminCustomersApi.getAll>[0]) {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent infinite loops
  const memoizedParams = useMemo(() => params, [
    params?.page,
    params?.limit,
    params?.search,
    params?.status,
  ]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminCustomersApi.getAll(memoizedParams);
      setCustomers(data.customers);
      setTotal(data.total);
      setPages(data.pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, total, pages, loading, error, refetch: fetchCustomers };
}

// Categories Hooks
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminCategoriesApi.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}

// Reviews Hooks
export function useAdminReviews(params?: Parameters<typeof adminReviewsApi.getAll>[0]) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent infinite loops
  const memoizedParams = useMemo(() => params, [
    params?.page,
    params?.limit,
    params?.productId,
    params?.status,
  ]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminReviewsApi.getAll(memoizedParams);
      setReviews(data.reviews);
      setTotal(data.total);
      setPages(data.pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, total, pages, loading, error, refetch: fetchReviews };
}
