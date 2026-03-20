import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { fetcher } from "../fetcher";

/**
 * Hook for fetching shapes with caching
 * This data rarely changes, so we cache aggressively
 */
export function useShapes() {
  const url = buildUrl(ENDPOINTS.SHAPES);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes - shapes rarely change
    revalidateIfStale: false,
  });

  return {
    shapes: data || [],
    isLoading,
    isError: error,
  };
}
