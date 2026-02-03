/**
 * Returns API Client
 *
 * API methods for managing return and refund requests
 */

import { api } from './client';

export type ReturnReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'SIZE_FIT'
  | 'QUALITY'
  | 'LATE_DELIVERY'
  | 'OTHER';

export type ReturnStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ITEM_RECEIVED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'CANCELLED';

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderItemId: string | null;
  userId: string;
  reason: ReturnReason;
  description: string | null;
  images: string[] | null;
  status: ReturnStatus;
  resolution: string | null;
  refundAmount: number | null;
  refundMethod: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  order: {
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  };
  orderItem: {
    name: string;
    image: string | null;
    quantity: number;
    price: number;
  } | null;
}

export interface CreateReturnRequestDto {
  orderId: string;
  orderItemId?: string;
  reason: ReturnReason;
  description?: string;
  images?: string[];
}

export interface ReturnsResponse {
  success: boolean;
  data: ReturnRequest[];
  message?: string;
}

export interface ReturnResponse {
  success: boolean;
  data: ReturnRequest;
  message?: string;
}

export interface CanReturnResponse {
  success: boolean;
  data: {
    canReturn: boolean;
    reason?: string;
    daysRemaining?: number;
  };
}

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: 'Product is defective or damaged',
  WRONG_ITEM: 'Received wrong item',
  NOT_AS_DESCRIBED: 'Product not as described',
  CHANGED_MIND: 'Changed my mind',
  SIZE_FIT: 'Size or fit issues',
  QUALITY: 'Quality not as expected',
  LATE_DELIVERY: 'Delivery was too late',
  OTHER: 'Other reason',
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ITEM_RECEIVED: 'Item Received',
  REFUND_PROCESSING: 'Refund Processing',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  ITEM_RECEIVED: 'bg-purple-100 text-purple-800 border-purple-200',
  REFUND_PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  REFUNDED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const returnsApi = {
  /**
   * Get all return requests for current user
   */
  getMyReturns: () => api.get<ReturnsResponse>('/returns'),

  /**
   * Get a single return request by ID
   */
  getReturnById: (id: string) => api.get<ReturnResponse>(`/returns/${id}`),

  /**
   * Check if an order is eligible for return
   */
  canRequestReturn: (orderId: string) =>
    api.get<CanReturnResponse>(`/returns/can-return/${orderId}`),

  /**
   * Create a new return request
   */
  createReturnRequest: (data: CreateReturnRequestDto) =>
    api.post<ReturnResponse>('/returns', data),

  /**
   * Cancel a return request
   */
  cancelReturnRequest: (id: string) =>
    api.patch<ReturnResponse>(`/returns/${id}/cancel`, {}),
};

export default returnsApi;
