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
import OrderDetail from "../pages/OrderDetail";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import CheckoutSuccess from "../pages/CheckoutSuccess";
import ProductDetail from "../components/product/ProductDetail";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

import AdminLensFeatures from "../pages/AdminLensFeatures";
import AdminLensTypes from "../pages/AdminLens";
import AdminDashboard from "../pages/AdminDashboard";
import AdminProducts from "../pages/AdminProducts";
import AdminOrders from "../pages/AdminOrders";
const AdminUsers = () => <h2>👥 Trang Quản Lý Người Dùng (Đang xây dựng)</h2>;

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
        
       
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} /> 
            <Route path="products" element={<AdminProducts />} />
            <Route path="lenstypes" element={<AdminLensTypes />} />
            <Route path="lensfeatures" element={<AdminLensFeatures />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

      
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />

          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>

      </Routes>
    </Router>
  );
}