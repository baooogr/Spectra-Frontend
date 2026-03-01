import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

export default function AdminProtectedRoute() {
  const { user } = useContext(UserContext);
  
  // Lấy dữ liệu user từ State hoặc LocalStorage
  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  // 1. Chưa đăng nhập -> Đá ra trang Login
  if (!currentUser || !currentUser.token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Đã đăng nhập nhưng KHÔNG phải Admin -> Đá về Trang chủ ngay lập tức
  if (currentUser.role !== "Admin") { 
    return <Navigate to="/" replace />;
  }

  // 3. Đúng chuẩn Admin -> Cho phép đi vào
  return <Outlet />;
}