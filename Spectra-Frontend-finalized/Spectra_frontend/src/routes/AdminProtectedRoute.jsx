import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

export default function AdminProtectedRoute() {
  const { user } = useContext(UserContext);

  // Lấy role từ user context (chuẩn chữ thường)
  const role = user?.role || "";

  // Cho phép admin, manager và staff vào khu vực quản trị chung.
  if (role !== "admin" && role !== "manager" && role !== "staff") {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
}