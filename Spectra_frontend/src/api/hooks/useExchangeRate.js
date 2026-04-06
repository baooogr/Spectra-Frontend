import useSWR from "swr";
import { API_BASE_URL, ENDPOINTS } from "../config";
import { fetcher } from "../fetcher";

const FALLBACK_RATE = 25400;

/**
 * Hook to get live USD→VND exchange rate from backend (cached 1 hour server-side, SWR caches client-side).
 * Returns { rate, isLoading, error }.
 * Falls back to 25400 if API is unreachable.
 */
export function useExchangeRate() {
  const { data, error, isLoading } = useSWR(
    `${API_BASE_URL}${ENDPOINTS.EXCHANGE_RATE.USD_VND}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1 hour dedup
      refreshInterval: 3600000, // refresh every hour
      fallbackData: { rate: FALLBACK_RATE },
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        if (retryCount >= 2) return; // stop after 2 retries
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    },
  );

  return {
    rate: data?.rate ?? FALLBACK_RATE,
    isLoading,
    error,
  };
}
