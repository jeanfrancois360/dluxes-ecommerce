import { z } from 'zod';
import { AddressSchema } from './user';

/**
 * Order-related types and schemas
 */

export const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PaymentStatusSchema = z.enum([
  'pending',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentMethodSchema = z.enum(['credit_card', 'paypal', 'stripe', 'bank_transfer']);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  total: z.number().positive(),
  image: z.string().url().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  userId: z.string(),
  items: z.array(OrderItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  total: z.number().positive(),
  currency: z.string().default('USD'),
  status: OrderStatusSchema.default('pending'),
  paymentStatus: PaymentStatusSchema.default('pending'),
  paymentMethod: PaymentMethodSchema.optional(),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
