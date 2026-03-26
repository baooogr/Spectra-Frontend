import React, { useContext } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = user?.role || "";

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">Spectra Admin</div>

        <nav className="admin-nav">
          <Link
            to="/"
            className="admin-link"
            style={{
              color: "#10b981",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Về Trang Chủ
          </Link>
          <Link to="/admin" className="admin-link">
            Tổng quan
          </Link>
          <Link to="/admin/products" className="admin-link">
            Quản lý Kính
          </Link>
          <Link to="/admin/lenstypes" className="admin-link">
            Quản lý Tròng Kính
          </Link>
          <Link to="/admin/lensfeatures" className="admin-link">
            Quản lý Tính Năng Tròng
          </Link>
          <Link to="/admin/lensindices" className="admin-link">
            Quản lý Chiết Suất Tròng
          </Link>
          <Link to="/admin/orders" className="admin-link">
            Đơn hàng
          </Link>
          <Link to="/admin/campaigns" className="admin-link">
            Chiến Dịch Pre-order
          </Link>
          <Link to="/admin/complaints" className="admin-link">
            Khiếu nại
          </Link>
          <Link to="/admin/shipping" className="admin-link">
            Vận Chuyển
          </Link>

          {/*  DEMO: Mở nút này cho cả admin và manager */}
          {(role === "admin" || role === "manager") && (
            <Link to="/admin/users" className="admin-link">
              Quản lý Người Dùng
            </Link>
          )}
        </nav>

        <button onClick={handleLogout} className="admin-logout-btn">
          Thoat Admin
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
