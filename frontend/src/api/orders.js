import { apiClient } from "./client";

export const ordersApi = {
  checkout: (payload) => apiClient.post("/orders/checkout/", payload),
  listOrders: (params) => apiClient.get("/orders/", { params }),
  getOrder: (orderNumber) => apiClient.get(`/orders/${orderNumber}/`),
  updateOrderStatus: (orderNumber, status) =>
    apiClient.patch(`/orders/${orderNumber}/status/`, { status }),
  validateCoupon: (payload) => apiClient.post("/orders/coupons/validate/", payload),
  listCoupons: () => apiClient.get("/orders/coupons/"),
  createCoupon: (payload) => apiClient.post("/orders/coupons/", payload),
  listPromotions: (params) => apiClient.get("/orders/promotions/", { params }),
  createPromotion: (payload) => apiClient.post("/orders/promotions/", payload),
};
