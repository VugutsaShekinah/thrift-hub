import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import { ProtectedRoute, StaffRoute } from "./auth/ProtectedRoute";

import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminSuppliersPage from "./pages/admin/AdminSuppliersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
          <Route path="orders/:orderNumber/confirmation" element={<OrderConfirmationPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<StaffRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="suppliers" element={<AdminSuppliersPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
