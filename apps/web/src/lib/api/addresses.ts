import { api } from './client';

export interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault: boolean;
}

export interface CreateAddressData {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault?: boolean;
}

export type UpdateAddressData = Partial<CreateAddressData>;

export const addressesAPI = {
  getAll: () =>
    api.get<Address[]>('/addresses'),

  getById: (id: string) =>
    api.get<Address>(`/addresses/${id}`),

  create: (data: CreateAddressData) =>
    api.post<Address>('/addresses', data),

  update: (id: string, data: UpdateAddressData) =>
    api.put<Address>(`/addresses/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/addresses/${id}`),

  setDefault: (id: string) =>
    api.post<Address>(`/addresses/${id}/default`),
};
