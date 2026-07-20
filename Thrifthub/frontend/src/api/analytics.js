import { apiClient } from "./client";

export const analyticsApi = {
  sales: (period) => apiClient.get("/analytics/sales/", { params: { period } }),
  inventory: () => apiClient.get("/analytics/inventory/"),
  suppliers: () => apiClient.get("/analytics/suppliers/"),
  customers: (period) => apiClient.get("/analytics/customers/", { params: { period } }),
  auditLogs: (params) => apiClient.get("/audit/logs/", { params }),
};
