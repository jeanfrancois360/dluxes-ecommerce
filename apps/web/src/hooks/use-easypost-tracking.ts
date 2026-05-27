import useSWR from 'swr';
import { safeJson } from '@/lib/safe-fetch';

interface TrackingEvent {
  id: string;
  status: string;
  statusDetail?: string;
  message: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  eventDatetime: string;
  source?: string;
  carrierCode?: string;
}

interface TrackingData {
  trackingNumber: string;
  carrier: string;
  status: string;
  statusDetail?: string;
  estDeliveryDate?: string;
  signedBy?: string;
  publicUrl?: string;
  trackingDetails?: TrackingEvent[];
  carrierDetail?: any;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.message || 'Failed to fetch tracking data');
  }

  return safeJson(response);
};

export function useEasyPostTracking(
  shipmentId: string | null,
  options?: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
  }
) {
  const { data, error, isLoading, mutate } = useSWR<TrackingData>(
    shipmentId ? `/api/v1/easypost/tracking/${shipmentId}` : null,
    fetcher,
    {
      refreshInterval: options?.refreshInterval ?? 60000, // Default: refresh every 60 seconds
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Prevent duplicate requests within 30s
    }
  );

  return {
    tracking: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook to track multiple shipments at once
 */
export function useEasyPostOrderTracking(
  orderId: string | null,
  options?: {
    refreshInterval?: number;
  }
) {
  const { data, error, isLoading, mutate } = useSWR<
    Array<{
      id: string;
      trackingNumber: string;
      carrier: string;
      service: string;
      status: string;
      trackingUrl?: string;
      estimatedDeliveryDate?: string;
      trackingEvents?: TrackingEvent[];
    }>
  >(orderId ? `/api/v1/easypost/order/${orderId}/shipments` : null, fetcher, {
    refreshInterval: options?.refreshInterval ?? 120000, // Default: refresh every 2 minutes
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    shipments: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Format tracking status for display
 */
export function formatTrackingStatus(status: string): {
  label: string;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red';
} {
  const statusMap: Record<
    string,
    { label: string; color: 'gray' | 'blue' | 'yellow' | 'green' | 'red' }
  > = {
    PENDING: { label: 'Pending', color: 'gray' },
    RATED: { label: 'Rated', color: 'gray' },
    PURCHASED: { label: 'Label Created', color: 'blue' },
    IN_TRANSIT: { label: 'In Transit', color: 'yellow' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'yellow' },
    DELIVERED: { label: 'Delivered', color: 'green' },
    RETURN_TO_SENDER: { label: 'Returning', color: 'red' },
    FAILURE: { label: 'Failed', color: 'red' },
    CANCELLED: { label: 'Cancelled', color: 'gray' },
    UNKNOWN: { label: 'Unknown', color: 'gray' },
  };

  return statusMap[status] || { label: status, color: 'gray' };
}

/**
 * Format tracking event timestamp
 */
export function formatTrackingDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
    });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
