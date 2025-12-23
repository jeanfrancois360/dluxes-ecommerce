'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Order, PaginatedResponse } from '@/lib/api/types';

interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: 'recent' | 'oldest';
}

interface UseOrdersReturn {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const { page = 1, limit = 10, status, sortBy = 'recent' } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.orders.getOrders({
        page,
        limit,
        status,
        sortBy: sortBy === 'recent' ? 'createdAt' : undefined,
        sortOrder: sortBy === 'recent' ? 'desc' : 'asc',
      });

      // apiClient already unwraps { success, data } response
      // so response = { data: [...orders], meta: {...} }
      if (response && response.data) {
        setOrders(response.data);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.orders.getOrder(id);

      // apiClient already unwraps { success, data } response
      if (response) {
        setOrder(response);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  };
}

export function useCancelOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = async (orderId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.orders.cancelOrder(orderId);

      // apiClient already unwraps { success, data } response
      if (response) {
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelOrder,
    isLoading,
    error,
  };
}

export function useTrackOrder() {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackOrder = async (orderNumber: string, email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.orders.trackOrder(orderNumber, email);

      // apiClient already unwraps { success, data } response
      if (response) {
        setTrackingData(response);
        return response;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to track order');
      setTrackingData(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trackOrder,
    trackingData,
    isLoading,
    error,
  };
}

export function useDownloadInvoice() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadInvoice = async (orderId: string, orderNumber: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.orders.downloadInvoice(orderId);

      // Create blob and download
      const blob = new Blob([response as any], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to download invoice');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    downloadInvoice,
    isLoading,
    error,
  };
}
