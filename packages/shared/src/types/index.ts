/**
 * Shared types for luxury e-commerce platform
 */

export * from './product';
export * from './user';
export * from './order';
export * from './cart';
export * from './review';
export * from './wishlist';

/**
 * Common API Response Types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * WebSocket Event Types
 */

export enum WebSocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  CART_UPDATED = 'cart:updated',
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  PRODUCT_UPDATED = 'product:updated',
  INVENTORY_UPDATED = 'inventory:updated',
}

export interface WebSocketMessage<T = any> {
  event: WebSocketEvent;
  data: T;
  timestamp: Date;
}
