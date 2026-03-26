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
    LIST: "/Orders",
    MY: "/Orders/my",
    DETAIL: (id) => `/Orders/${id}`,
    STATUS: (id) => `/Orders/${id}/status`,
    CONFIRM_DELIVERY: (id) => `/Orders/${id}/confirm-delivery`,
    CANCEL: (id) => `/Orders/${id}/cancel`,
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
  },
  // Exchange Rate
  EXCHANGE_RATE: {
    USD_VND: "/ExchangeRate/usd-vnd",
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
