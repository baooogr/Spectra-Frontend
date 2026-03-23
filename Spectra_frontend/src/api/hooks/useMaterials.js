import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { fetcher } from "../fetcher";

/**
 * Hook for fetching materials with caching
 * This data rarely changes, so we cache aggressively
 */
export function useMaterials() {
  const url = buildUrl(ENDPOINTS.MATERIALS);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes - materials rarely change
    revalidateIfStale: false,
  });

  return {
    materials: data || [],
    isLoading,
    isError: error,
  };
}
