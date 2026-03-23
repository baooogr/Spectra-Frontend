import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { authFetcher } from "../fetcher";

/**
 * Hook for fetching current user data with caching
 * Only fetches when user is authenticated (has token)
 */
export function useCurrentUser() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const url = token ? buildUrl(ENDPOINTS.USERS.ME) : null;

  const { data, error, isLoading, mutate } = useSWR(url, authFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
    shouldRetryOnError: false, // Don't retry on 401/403
  });

  return {
    user: data,
    isLoading: token ? isLoading : false,
    isError: error,
    isAuthenticated: !!token && !!data,
    mutate,
  };
}

/**
 * Hook for fetching all users (admin)
 */
export function useUsers(options = {}) {
  const { page = 1, pageSize = 100 } = options;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const url = token ? buildUrl(ENDPOINTS.USERS.LIST, { page, pageSize }) : null;

  const { data, error, isLoading, mutate } = useSWR(url, authFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    users: data?.items || data || [],
    rawData: data,
    isLoading,
    isError: error,
    mutate,
  };
}
