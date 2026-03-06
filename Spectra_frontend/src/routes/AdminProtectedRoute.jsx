import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function AdminProtectedRoute() {
  const [isAuthorized, setIsAuthorized] = useState(null); // null = đang kiểm tra
  
  useEffect(() => {
    const checkRole = async () => {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      
      if (!currentUser || !currentUser.token) {
        setIsAuthorized(false);
        return;
      }

      const role = (currentUser.role || "").toLowerCase();
      
      // ⚡ NỚI LỎNG CỬA VÀO: Cho phép Admin, Manager hoặc Staff đi vào
      if (role === 'admin' || role === 'manager' || role === 'staff') {
        setIsAuthorized(true);
        return;
      }

      // ⚡ NẾU THIẾU QUYỀN (ví dụ user mới đăng nhập chưa kịp cập nhật role) -> Gọi API check
      try {
        const res = await fetch('https://myspectra.runasp.net/api/Users/me', {
          headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const updatedUser = { ...currentUser, role: data.role, fullName: data.fullName };
          localStorage.setItem("user", JSON.stringify(updatedUser));

          const realRole = (data.role || "").toLowerCase();
          
          // Kiểm tra lại lần nữa với role chuẩn từ API
          if (realRole === 'admin' || realRole === 'manager' || realRole === 'staff') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false); // Chỉ là Customer -> Đuổi về trang chủ
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        setIsAuthorized(false);
      }
    };

    checkRole();
  }, []);

  if (isAuthorized === null) return <div style={{ textAlign: "center", marginTop: "50px", fontSize: "18px" }}>⏳ Đang xác thực quyền quản trị...</div>;
  if (isAuthorized === false) return <Navigate to="/" replace />;
  
  return <Outlet />;
}