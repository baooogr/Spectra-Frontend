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
            Back to Home
          </Link>
          <Link to="/admin" className="admin-link">
            Dashboard
          </Link>
          <Link to="/admin/products" className="admin-link">
            Glasses Management
          </Link>
          <Link to="/admin/lenstypes" className="admin-link">
            Lens Types Management
          </Link>
          <Link to="/admin/lensfeatures" className="admin-link">
            Lens Features Management
          </Link>
          <Link to="/admin/lensindices" className="admin-link">
            Lens Indices Management
          </Link>
          <Link to="/admin/orders" className="admin-link">
            Orders
          </Link>
          <Link to="/admin/campaigns" className="admin-link">
            Pre-order Management
          </Link>
          <Link to="/admin/complaints" className="admin-link">
            Complaints
          </Link>
          <Link to="/admin/shipping" className="admin-link">
            Shipping
          </Link>

          {(role === "admin" || role === "manager") && (
            <Link to="/admin/users" className="admin-link">
              User Management
            </Link>
          )}
          {(role === "admin" || role === "manager") && (
            <Link to="/admin/business-rules" className="admin-link">
              Business Rules
            </Link>
          )}
        </nav>

        <button onClick={handleLogout} className="admin-logout-btn">
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}