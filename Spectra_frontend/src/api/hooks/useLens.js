import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { fetcher } from "../fetcher";

/**
 * Hook for fetching lens types with caching
 */
export function useLensTypes(options = {}) {
  const { page = 1, pageSize = 100 } = options;

  const url = buildUrl(ENDPOINTS.LENS_TYPES, { page, pageSize });

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
  });

  return {
    lensTypes: data?.items || data || [],
    rawData: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching lens features with caching
 */
export function useLensFeatures(options = {}) {
  const { page = 1, pageSize = 100 } = options;

  const url = buildUrl(ENDPOINTS.LENS_FEATURES, { page, pageSize });

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
  });

  return {
    lensFeatures: data?.items || data || [],
    rawData: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching lens indices (refractive index values) with caching
 */
export function useLensIndices(options = {}) {
  const { page = 1, pageSize = 100 } = options;

  const url = buildUrl(ENDPOINTS.LENS_INDICES, { page, pageSize });

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
  });

  return {
    lensIndices: data?.items || data || [],
    rawData: data,
    isLoading,
    isError: error,
    mutate,
  };
}
