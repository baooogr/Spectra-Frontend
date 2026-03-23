import useSWR from "swr";
import { buildUrl, ENDPOINTS } from "../config";
import { fetcher } from "../fetcher";

/**
 * Hook for fetching frames/products with caching
 * Data is cached and shared across all components using this hook
 */
export function useFrames(options = {}) {
  const { page = 1, pageSize = 100 } = options;

  const url = buildUrl(ENDPOINTS.FRAMES.LIST, { page, pageSize });

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false, // Don't refetch when window regains focus
    revalidateOnReconnect: true, // Refetch when reconnecting after being offline
    dedupingInterval: 60000, // Dedupe requests within 1 minute
    keepPreviousData: true, // Keep showing old data while fetching new
  });

  // Process frames to remove duplicates by name
  const frames = (() => {
    const allFrames = data?.items || data || [];
    const uniqueFrames = [];
    const seenNames = new Set();

    allFrames.forEach((frame) => {
      if (!seenNames.has(frame.frameName)) {
        seenNames.add(frame.frameName);
        uniqueFrames.push(frame);
      }
    });

    return uniqueFrames;
  })();

  return {
    frames,
    rawData: data,
    isLoading,
    isError: error,
    mutate, // Function to manually revalidate
  };
}

/**
 * Hook for fetching a single frame detail
 */
export function useFrame(frameId) {
  const url = frameId ? buildUrl(ENDPOINTS.FRAMES.DETAIL(frameId)) : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    frame: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching lens types for a specific frame
 */
export function useFrameLensTypes(frameId) {
  const url = frameId ? buildUrl(ENDPOINTS.FRAMES.LENS_TYPES(frameId)) : null;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    lensTypes: data || [],
    isLoading,
    isError: error,
  };
}
