import { api } from './client';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
}

export const cartAPI = {
  get: () =>
    api.get<Cart>('/cart'),

  addItem: (productId: string, quantity: number = 1, currency?: string) =>
    api.post<Cart>('/cart/items', { productId, quantity, currency }),

  updateItem: (itemId: string, quantity: number) =>
    api.patch<Cart>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) =>
    api.delete<Cart>(`/cart/items/${itemId}`),

  clear: () =>
    api.delete<void>('/cart'),
};
