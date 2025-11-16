'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Collection } from '@/lib/api/types';
import { APIError } from '@/lib/api/client';

interface UseCollectionsReturn {
  collections: Collection[];
  isLoading: boolean;
  error: APIError | null;
  refetch: () => Promise<void>;
}

export function useCollections(includeInactive: boolean = false): UseCollectionsReturn {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (!includeInactive) {
        params.append('isActive', 'true');
      }
      const response = await api.get<Collection[]>(`/collections?${params.toString()}`);
      setCollections(response);
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError('Failed to fetch collections', 500);
      setError(apiError);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [includeInactive]);

  return {
    collections,
    isLoading,
    error,
    refetch: fetchCollections,
  };
}

// Hook for a single collection
interface UseCollectionReturn {
  collection: Collection | null;
  isLoading: boolean;
  error: APIError | null;
}

export function useCollection(slugOrId: string, bySlug: boolean = true): UseCollectionReturn {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!slugOrId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const endpoint = bySlug ? `/collections/slug/${slugOrId}` : `/collections/${slugOrId}`;
        const response = await api.get<Collection>(endpoint);
        setCollection(response);
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError('Failed to fetch collection', 500);
        setError(apiError);
        setCollection(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [slugOrId, bySlug]);

  return { collection, isLoading, error };
}
