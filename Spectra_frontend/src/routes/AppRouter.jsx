import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";

import AdminProtectedRoute from "./AdminProtectedRoute";
import UserProfile from "../pages/UserProfile";
// --- IMPORT CÁC COMPONENT LAYOUT ---
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AdminLayout from "../components/layout/AdminLayout"; 

// --- IMPORT CÁC TRANG KHÁCH HÀNG ---
import MainPage from "../pages/MainPage";
import OrderHistory from "../pages/OrderHistory";
import PreorderDetail from "../pages/PreorderDetail";
import OrderDetail from "../pages/OrderDetail";
import CartPage from "../pages/CartPage";

import CheckoutPreorderPage from "../pages/CheckoutPreorderPage";
import CheckoutPage from "../pages/CheckoutPage";
import CheckoutSuccess from "../pages/CheckoutSuccess";
import ProductDetail from "../components/product/ProductDetail";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

import ComplaintPage from "../pages/ComplaintPage";
import ComplaintHistoryPage from "../pages/ComplaintHistoryPage";

// --- IMPORT CÁC TRANG ADMIN ---
import AdminUsers from "../pages/AdminUsers";
import AdminLensFeatures from "../pages/AdminLensFeatures";
import AdminLensTypes from "../pages/AdminLens";
import AdminDashboard from "../pages/AdminDashboard";
import AdminProducts from "../pages/AdminProducts";
import AdminOrders from "../pages/AdminOrders";
import ComplaintManagementPage from "../pages/ComplaintManagementPage";

// VNPay
import VNPayReturnPage from "../pages/VNPayReturnPage";


const CustomerLayout = () => {
  return (
    <>
      <Header />
      <main style={{ minHeight: '60vh' }}>
        <Outlet /> 
      </main>
      <Footer />
    </>
  );
};

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        
        {/* --- ROUTES DÀNH CHO ADMIN & STAFF --- */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} /> 
            <Route path="products" element={<AdminProducts />} />
            <Route path="lenstypes" element={<AdminLensTypes />} />
            <Route path="lensfeatures" element={<AdminLensFeatures />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="complaints" element={<ComplaintManagementPage />} />

          </Route>
        </Route>

        {/* --- ROUTES DÀNH CHO KHÁCH HÀNG CHUNG --- */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/preorders/:id" element={<PreorderDetail />} />
          <Route path="/orders/:id" element={<OrderDetail />} />

          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          <Route path="/complaint" element={<ComplaintPage />} />
          <Route path="/complaint-history" element={<ComplaintHistoryPage />} />
          
          <Route path="/checkout-preorder" element={<CheckoutPreorderPage />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/payment/return" element={<VNPayReturnPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>

      </Routes>
    </Router>
  );
}