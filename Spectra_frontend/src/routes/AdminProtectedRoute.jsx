import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function AdminProtectedRoute() {
  const [isAuthorized, setIsAuthorized] = useState(null); // null = đang kiểm tra
  
  useEffect(() => {
    const checkRole = async () => {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      
      // 1. Nếu không có token -> Chắc chắn chưa đăng nhập
      if (!currentUser || !currentUser.token) {
        setIsAuthorized(false);
        return;
      }

      const role = (currentUser.role || "").toLowerCase();
      
      // 2. Nếu trong máy đã lưu sẵn là manager -> Cho vào luôn
      if (role === 'manager' || role === 'admin') {
        setIsAuthorized(true);
        return;
      }

      // 3. NẾU THIẾU QUYỀN -> Bí mật gọi API /me để lấy quyền thật sự
      try {
        const res = await fetch('https://myspectra.runasp.net/api/Users/me', {
          headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Lưu bổ sung quyền vào máy tính để lần sau không cần gọi lại API
          const updatedUser = { ...currentUser, role: data.role, fullName: data.fullName };
          localStorage.setItem("user", JSON.stringify(updatedUser));

          const realRole = (data.role || "").toLowerCase();
          if (realRole === 'manager' || realRole === 'admin') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false); // Không phải manager -> Đuổi về
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

  // Đang đợi API trả kết quả thì hiện chữ Loading
  if (isAuthorized === null) return <div style={{ textAlign: "center", marginTop: "50px", fontSize: "18px" }}>⏳ Đang xác thực quyền quản trị...</div>;
  
  // Nếu bị từ chối -> Đá văng ra trang chủ
  if (isAuthorized === false) return <Navigate to="/" replace />;
  
  // Thành công -> Mở cửa
  return <Outlet />;
}