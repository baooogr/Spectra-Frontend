import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { authFetcher } from "../fetcher";

/**
 * Hook for fetching user's orders with caching
 */
export function useMyOrders(options = {}) {
  const { page = 1, pageSize = 100 } = options;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const url = token ? buildUrl(ENDPOINTS.ORDERS.MY, { page, pageSize }) : null;

  const { data, error, isLoading, mutate } = useSWR(url, authFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30 seconds for orders
  });

  return {
    orders: data?.items || data || [],
    rawData: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching all orders (admin)
 */
export function useOrders(options = {}) {
  const { page = 1, pageSize = 100 } = options;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const url = token
    ? buildUrl(ENDPOINTS.ORDERS.LIST, { page, pageSize })
    : null;

  const { data, error, isLoading, mutate } = useSWR(url, authFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    orders: data?.items || data || [],
    rawData: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching a single order detail
 */
export function useOrder(orderId) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const url =
    token && orderId ? buildUrl(ENDPOINTS.ORDERS.DETAIL(orderId)) : null;

  const { data, error, isLoading, mutate } = useSWR(url, authFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 15000, // 15 seconds for single order
  });

  return {
    order: data,
    isLoading,
    isError: error,
    mutate,
  };
}
