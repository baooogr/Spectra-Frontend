// Centralized API configuration
export const API_BASE_URL = "https://myspectra.runasp.net/api";

// API endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/Auth/login",
    REGISTER: "/Auth/register",
    GOOGLE: "/Auth/google",
    FORGOT_PASSWORD: "/Auth/forgot-password",
    CHANGE_PASSWORD: "/Auth/change-password",
  },
  // Users
  USERS: {
    ME: "/Users/me",
    LIST: "/Users",
    ROLE: (id) => `/Users/${id}/role`,
    STATUS: (id) => `/Users/${id}/status`,
  },
  // Frames (Products)
  FRAMES: {
    LIST: "/Frames",
    DETAIL: (id) => `/Frames/${id}`,
    LENS_TYPES: (id) => `/Frames/${id}/lens-types`,
    OUT_OF_STOCK: "/Frames/inventory/out-of-stock",
  },
  // Frame Media
  FRAME_MEDIA: {
    BY_FRAME: (id) => `/FrameMedia/frame/${id}`,
    UPLOAD: (id) => `/FrameMedia/upload/${id}`,
    DELETE: (id) => `/FrameMedia/${id}`,
  },
  // Catalog
  SHAPES: "/Shapes",
  MATERIALS: "/Materials",
  BRANDS: "/Brands",
  COLORS: "/Colors",
  // Lens
  LENS_TYPES: "/LensTypes",
  LENS_FEATURES: "/LensFeatures",
  LENS_INDICES: "/LensIndices",
  // Orders
  ORDERS: {
    LIST: "/OrdersV2",
    MY: "/OrdersV2/my",
    DETAIL: (id) => `/OrdersV2/${id}`,
    STATUS: (id) => `/OrdersV2/${id}/status`,
    CONFIRM_DELIVERY: (id) => `/OrdersV2/${id}/confirm-delivery`,
    CANCEL: (id) => `/OrdersV2/${id}/cancel`,
  },
  // Preorders
  PREORDERS: {
    LIST: "/Preorders",
    MY: "/Preorders/my",
    DETAIL: (id) => `/Preorders/${id}`,
    CONVERT: (id) => `/Preorders/${id}/convert`,
  },
  // Preorder Campaigns
  CAMPAIGNS: {
    LIST: "/PreorderCampaigns",
    DETAIL: (id) => `/PreorderCampaigns/${id}`,
    END: (id) => `/PreorderCampaigns/${id}/end`,
  },
  // Payments
  PAYMENTS: {
    CREATE: "/Payments",
    PREORDER: (id) => `/Payments/preorder/${id}`,
  },
  // Complaints
  COMPLAINTS: {
    LIST: "/Complaints",
    MY: "/Complaints/my",
    DETAIL: (id) => `/Complaints/${id}`,
    STATUS: (id) => `/Complaints/${id}/status`,
    BY_STATUS: (status) => `/Complaints/status/${status}`,
    PROCESS_REFUND: (id) => `/Complaints/${id}/process-refund`,
  },
  // Prescriptions
  PRESCRIPTIONS: {
    LIST: "/Prescriptions",
    MY: "/Prescriptions/my",
    MY_VALID: "/Prescriptions/my/valid",
    DETAIL: (id) => `/Prescriptions/${id}`,
  },
  // Reviews
  REVIEWS: {
    BY_FRAME: (frameId) => `/ProductReviews/frame/${frameId}`,
    CREATE: "/ProductReviews",
  },
  // Dashboard
  DASHBOARD: {
    STATISTICS: "/Dashboard/statistics",
    REVENUE_DAILY: "/Dashboard/revenue/daily",
    REVENUE_MONTHLY: "/Dashboard/revenue/monthly",
    POPULAR_FRAMES: "/Dashboard/popular-frames",
    ORDERS_SUMMARY: "/Dashboard/orders/summary",
  },
  // Shipping
  SHIPPING: {
    TRACKING: (id) => `/Shipping/orders/${id}/tracking`,
    METHODS: "/Shipping/methods",
    CALCULATE: "/Shipping/calculate",
    // Ahamove (legacy - kept for backward compatibility)
    AHAMOVE_STATUS: "/Shipping/ahamove/status",
    AHAMOVE_ESTIMATE: "/Shipping/ahamove/estimate",
    AHAMOVE_ORDERS: "/Shipping/ahamove/orders",
    AHAMOVE_ORDER_DETAIL: (ahamoveOrderId) =>
      `/Shipping/ahamove/orders/${ahamoveOrderId}`,
    // GHN (Giao Hàng Nhanh) - Primary shipping provider
    GHN_STATUS: "/Shipping/ghn/status",
    GHN_PROVINCES: "/Shipping/ghn/provinces",
    GHN_DISTRICTS: (provinceId) => `/Shipping/ghn/districts/${provinceId}`,
    GHN_WARDS: (districtId) => `/Shipping/ghn/wards/${districtId}`,
    GHN_SERVICES: "/Shipping/ghn/services",
    GHN_CALCULATE: "/Shipping/ghn/calculate",
    GHN_ORDERS: "/Shipping/ghn/orders",
    GHN_ORDER_DETAIL: (orderCode) => `/Shipping/ghn/orders/${orderCode}`,
    GHN_SWITCH_STATUS: (orderCode) =>
      `/Shipping/ghn/orders/${orderCode}/switch-status`,
  },
  // Exchange Rate
  EXCHANGE_RATE: {
    USD_VND: "/ExchangeRate/usd-vnd",
  },
  // Business Rules
  BUSINESS_RULES: {
    LIST: "/BusinessRules",
    BY_CATEGORY: (category) => `/BusinessRules/category/${category}`,
    DETAIL: (ruleKey) => `/BusinessRules/${ruleKey}`,
    PUBLIC: "/BusinessRules/public",
  },
};

// Build full URL from endpoint
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

// Get auth headers
export const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` }),
});
