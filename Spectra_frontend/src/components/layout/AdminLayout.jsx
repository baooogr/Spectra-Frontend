import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css'; 

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user"); // Xóa token khi thoát
    navigate("/login");
  };

  // ⚡ LẤY QUYỀN CỦA TÀI KHOẢN ĐANG ĐĂNG NHẬP
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const role = (currentUser.role || "").toLowerCase();
  
  // ⚡ Kiểm tra xem có phải là Admin/Manager đích thực không (được toàn quyền)
  const isSuperAdmin = role === 'admin' || role === 'manager';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">Spectra Admin</div>
        
        <nav className="admin-nav">
          <Link to="/admin" className="admin-link">Tổng quan</Link>
          <Link to="/admin/products" className="admin-link">Quản lý Kính</Link>
          <Link to="/admin/lenstypes" className="admin-link">Quản lý Tròng Kính</Link> 
          <Link to="/admin/lensfeatures" className="admin-link">Quản lý Tính Năng Tròng</Link>
          <Link to="/admin/orders" className="admin-link">Đơn hàng</Link>
          <Link to="/admin/complaints" className="admin-link">Quản lý đơn khiếu nại</Link>

          {/* ⚡ ĐIỀU KIỆN CHẶN STAFF: Chỉ có Admin/Manager mới thấy mục Quản lý người dùng */}
          {isSuperAdmin && (
            <Link to="/admin/users" className="admin-link">Quản lý Người Dùng</Link>
          )}

        </nav>

        <button onClick={handleLogout} className="admin-logout-btn">
          🚪 Thoát Admin
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}