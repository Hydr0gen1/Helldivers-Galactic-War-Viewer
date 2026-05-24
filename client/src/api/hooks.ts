import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client.js';
import type { WarSnapshot, Recommendation } from './types.js';

export function useSnapshot() {
  return useQuery<WarSnapshot>({
    queryKey: ['snapshot'],
    queryFn: () => apiClient.snapshot() as Promise<WarSnapshot>,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.startsWith('503')) {
        return failureCount < 6;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(10_000 * Math.pow(2, attempt), 30_000),
  });
}

export function useRecommendation() {
  return useQuery<Recommendation>({
    queryKey: ['recommendation'],
    queryFn: () => apiClient.recommendation() as Promise<Recommendation>,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}
