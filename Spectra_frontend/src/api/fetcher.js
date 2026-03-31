import { API_BASE_URL, getAuthHeaders } from "./config";

// Helper to get auth token from either storage key
function getToken() {
  let token = localStorage.getItem("token");
  if (!token) {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      token = user?.token;
    } catch {
      // ignore
    }
  }
  return token;
}

// Generic fetcher for SWR (public endpoints)
export const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// Authenticated fetcher for SWR (protected endpoints)
export const authFetcher = async (url) => {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token");
  }

  const res = await fetch(url, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// POST request helper
export const postData = async (endpoint, data, authenticated = true) => {
  const token = getToken();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    headers: authenticated
      ? getAuthHeaders(token)
      : { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = new Error("Request failed");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// PUT request helper
export const putData = async (endpoint, data) => {
  const token = getToken();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = new Error("Request failed");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// PATCH request helper
export const patchData = async (endpoint, data) => {
  const token = localStorage.getItem("token");
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = new Error("Request failed");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// DELETE request helper
export const deleteData = async (endpoint) => {
  const token = localStorage.getItem("token");
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const error = new Error("Request failed");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }

  // Some DELETE endpoints return no content
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};
