import { apiClient } from "./client";

export const catalogApi = {
  listProducts: (params) => apiClient.get("/catalog/products/", { params }),
  getProduct: (slug) => apiClient.get(`/catalog/products/${slug}/`),
  relatedProducts: (slug) => apiClient.get(`/catalog/products/${slug}/related/`),
  productReviews: (slug, params) => apiClient.get(`/catalog/products/${slug}/reviews/`, { params }),
  createProduct: (payload) => apiClient.post("/catalog/products/", payload),
  updateProduct: (slug, payload) => apiClient.patch(`/catalog/products/${slug}/`, payload),
  uploadProductImage: (slug, formData) =>
    apiClient.post(`/catalog/products/${slug}/images/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  listCategories: (params) => apiClient.get("/catalog/categories/", { params }),
  createCategory: (payload) => apiClient.post("/catalog/categories/", payload),

  listSuppliers: (params) => apiClient.get("/catalog/suppliers/", { params }),
  createSupplier: (payload) => apiClient.post("/catalog/suppliers/", payload),
  updateSupplier: (id, payload) => apiClient.patch(`/catalog/suppliers/${id}/`, payload),

  listBaleBatches: (params) => apiClient.get("/catalog/bale-batches/", { params }),
  createBaleBatch: (payload) => apiClient.post("/catalog/bale-batches/", payload),
};
