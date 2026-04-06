// Centralized API exports
// Configuration
export { API_BASE_URL, ENDPOINTS, buildUrl, getAuthHeaders } from "./config";

// Fetchers
export {
  fetcher,
  authFetcher,
  postData,
  putData,
  patchData,
  deleteData,
} from "./fetcher";

// Hooks - Products
export { useFrames, useFrame, useFrameLensTypes } from "./hooks/useFrames";

// Hooks - Catalog
export { useShapes } from "./hooks/useShapes";
export { useMaterials } from "./hooks/useMaterials";
export { useBrands } from "./hooks/useBrands";
export { useColors } from "./hooks/useColors";

// Hooks - Lens
export { useLensTypes, useLensFeatures, useLensIndices } from "./hooks/useLens";

// Hooks - User
export { useCurrentUser, useUsers } from "./hooks/useUser";

// Hooks - Orders
export { useMyOrders, useOrders, useOrder } from "./hooks/useOrders";

// Hooks - Exchange Rate
export { useExchangeRate } from "./hooks/useExchangeRate";
