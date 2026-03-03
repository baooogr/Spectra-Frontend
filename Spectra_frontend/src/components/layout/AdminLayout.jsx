import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css'; // Gọi file CSS

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

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
          <Link to="/admin/users" className="admin-link">Người dùng</Link>
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