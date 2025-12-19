'use client';

import { useState, useEffect, useCallback } from 'react';
import { addressesAPI, type Address, type CreateAddressData, type UpdateAddressData } from '@/lib/api/addresses';

interface UseAddressesReturn {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all addresses for the current user
 */
export function useAddresses(): UseAddressesReturn {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await addressesAPI.getAll();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch addresses');
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return {
    addresses,
    isLoading,
    error,
    refetch: fetchAddresses,
  };
}

/**
 * Hook to fetch a single address by ID
 */
export function useAddress(id: string) {
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await addressesAPI.getById(id);
      setAddress(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch address');
      setAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  return {
    address,
    isLoading,
    error,
    refetch: fetchAddress,
  };
}

/**
 * Hook to create a new address
 */
export function useCreateAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAddress = async (data: CreateAddressData): Promise<Address | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await addressesAPI.create(data);
      return address;
    } catch (err: any) {
      setError(err.message || 'Failed to create address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createAddress,
    isLoading,
    error,
  };
}

/**
 * Hook to update an existing address
 */
export function useUpdateAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAddress = async (id: string, data: UpdateAddressData): Promise<Address | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await addressesAPI.update(id, data);
      return address;
    } catch (err: any) {
      setError(err.message || 'Failed to update address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateAddress,
    isLoading,
    error,
  };
}

/**
 * Hook to delete an address
 */
export function useDeleteAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAddress = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await addressesAPI.delete(id);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteAddress,
    isLoading,
    error,
  };
}

/**
 * Hook to set an address as default
 */
export function useSetDefaultAddress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDefaultAddress = async (id: string): Promise<Address | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await addressesAPI.setDefault(id);
      return address;
    } catch (err: any) {
      setError(err.message || 'Failed to set default address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    setDefaultAddress,
    isLoading,
    error,
  };
}
