import { apiClient } from "./client";

export const engagementApi = {
  listWishlist: () => apiClient.get("/engagement/wishlist/"),
  addToWishlist: (productId) => apiClient.post("/engagement/wishlist/", { product_id: productId }),
  removeFromWishlist: (id) => apiClient.delete(`/engagement/wishlist/${id}/`),

  listReviews: (params) => apiClient.get("/engagement/reviews/", { params }),
  createReview: (payload) => apiClient.post("/engagement/reviews/", payload),
  deleteReview: (id) => apiClient.delete(`/engagement/reviews/${id}/`),
};
