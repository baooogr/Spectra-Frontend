import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { fetcher } from "../fetcher";

/**
 * Hook for fetching colors with caching
 */
export function useColors() {
  const url = buildUrl(ENDPOINTS.COLORS);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
  });

  return {
    colors: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
