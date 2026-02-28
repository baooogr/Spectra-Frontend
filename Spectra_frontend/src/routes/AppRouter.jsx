import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";

// --- IMPORT CÁC COMPONENT LAYOUT ---
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AdminLayout from "../components/layout/AdminLayout"; // Nhớ đảm bảo bạn đã tạo file này ở Bước 1 nhé!

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


import AdminDashboard from "../pages/AdminDashboard";
const AdminProducts = () => <h2>👓 Trang Quản Lý Sản Phẩm (Đang xây dựng)</h2>;
const AdminOrders = () => <h2>📦 Trang Quản Lý Đơn Hàng (Đang xây dựng)</h2>;
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
        
       
        <Route path="/admin" element={<AdminLayout />}>
          
          <Route index element={<AdminDashboard />} /> 
          
          
          <Route path="products" element={<AdminProducts />} />
          
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
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
        </Route>

      </Routes>
    </Router>
  );
}