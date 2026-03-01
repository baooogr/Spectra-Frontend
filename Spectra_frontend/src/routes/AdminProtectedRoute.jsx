import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

export default function AdminProtectedRoute() {
  const { user } = useContext(UserContext);
  
  // Lấy thông tin user từ Context hoặc LocalStorage
  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  // 1. Nếu chưa đăng nhập -> Đuổi về trang Login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu đã đăng nhập nhưng KHÔNG PHẢI ADMIN -> Đuổi về trang chủ
  // LƯU Ý: Chữ "Admin" hay "admin" phụ thuộc vào việc Backend của bạn cấu hình thế nào.
  // Bạn hãy console.log(currentUser) ra để xem chính xác trường phân quyền tên là gì nhé (role, roleName, isAdmin...)
  if (currentUser.role !== "Admin") { 
    return <Navigate to="/" replace />;
  }

  // 3. Nếu đúng là Admin -> Cho phép đi tiếp vào trong (Hiển thị các trang Admin)
  return <Outlet />;
}