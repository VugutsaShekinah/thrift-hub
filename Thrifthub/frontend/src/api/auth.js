import { apiClient } from "./client";

export const authApi = {
  register: (payload) => apiClient.post("/auth/register/", payload),
  login: (payload) => apiClient.post("/auth/login/", payload),
  logout: () => apiClient.post("/auth/logout/"),
  refresh: () => apiClient.post("/auth/token/refresh/"),
  requestPasswordReset: (email) => apiClient.post("/auth/password-reset/", { email }),
  confirmPasswordReset: (payload) => apiClient.post("/auth/password-reset/confirm/", payload),
  me: () => apiClient.get("/accounts/me/"),
  updateMe: (payload) => apiClient.patch("/accounts/me/", payload),
  changePassword: (payload) => apiClient.post("/accounts/change-password/", payload),
  addresses: () => apiClient.get("/accounts/addresses/"),
  createAddress: (payload) => apiClient.post("/accounts/addresses/", payload),
  updateAddress: (id, payload) => apiClient.patch(`/accounts/addresses/${id}/`, payload),
  deleteAddress: (id) => apiClient.delete(`/accounts/addresses/${id}/`),
};
