import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import Layout
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

// Import Pages (Của bạn và Nhật Anh)
import MainPage from "../pages/MainPage";
import OrderHistory from "../pages/OrderHistory";
import OrderDetail from "../pages/OrderDetail";

// ---> THÊM IMPORT 3 TRANG MỚI CỦA TUẤN ANH Ở ĐÂY <---
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import CheckoutSuccess from "../pages/CheckoutSuccess";

// Import Component chi tiết sản phẩm
import ProductDetail from "../components/product/ProductDetail";

export default function AppRouter() {
  return (
    <Router>
      <Header />
      
      <main style={{ minHeight: '60vh' }}>
        <Routes>
          {/* Main pagee và Chi tiết kính */}
          <Route path="/" element={<MainPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          
          {/* Quản lý Đơn hàng */}
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />

          {/* TRANG GIỎ HÀNG & THANH TOÁN */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
        </Routes>
      </main>

      <Footer />
    </Router>
  );
}   