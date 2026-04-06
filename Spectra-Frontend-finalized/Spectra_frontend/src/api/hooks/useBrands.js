import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { fetcher } from "../fetcher";

/**
 * Hook for fetching brands with caching
 */
export function useBrands() {
  const url = buildUrl(ENDPOINTS.BRANDS);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
  });

  return {
    brands: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
