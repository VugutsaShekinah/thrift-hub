import { apiClient } from "./client";

export const inventoryApi = {
  lowStock: () => apiClient.get("/inventory/low-stock/"),
  listStockMovements: (params) => apiClient.get("/inventory/stock-movements/", { params }),
  createStockMovement: (payload) => apiClient.post("/inventory/stock-movements/", payload),
};
