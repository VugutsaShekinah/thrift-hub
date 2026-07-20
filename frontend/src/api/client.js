import axios from "axios";

// In dev, Vite proxies /api to the Django backend (see vite.config.js) so
// this stays same-origin and the httpOnly refresh cookie is sent without
// extra CORS configuration. In prod, set VITE_API_BASE_URL.
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refresh_token cookie
});

// The access token lives in memory only (never localStorage) — see
// docs/02-system-design.md §6. AuthContext calls setAccessToken on
// login/refresh/logout.
let accessToken = null;
let onAuthExpired = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setOnAuthExpired(callback) {
  onAuthExpired = callback;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes("/auth/login") || config?.url?.includes("/auth/register");

    if (response?.status === 401 && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      try {
        refreshPromise ??= apiClient
          .post("/auth/token/refresh/")
          .finally(() => {
            refreshPromise = null;
          });
        const { data } = await refreshPromise;
        setAccessToken(data.access);
        config.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(config);
      } catch (refreshError) {
        setAccessToken(null);
        onAuthExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/** Normalizes DRF error payloads (field errors, `detail`, DomainError `code`)
 * into a single human-readable string for toasts/inline messages. */
export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstField = Object.keys(data)[0];
  if (firstField) {
    const value = data[firstField];
    return Array.isArray(value) ? value[0] : String(value);
  }
  return "Something went wrong. Please try again.";
}
