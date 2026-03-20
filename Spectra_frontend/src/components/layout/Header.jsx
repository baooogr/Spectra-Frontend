import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import "./Header.css";
import logo from "../../assets/logo.png";
import { useCurrentUser } from "../../api";

export default function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { user, logout } = useContext(UserContext);
  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  // Use cached user data for role checking
  const { user: apiUser } = useCurrentUser();

  // Determine admin status from cached API data or stored user
  const isAdmin = (() => {
    const role = (apiUser?.role || currentUser?.role || "").toLowerCase();
    return role === "manager" || role === "admin";
  })();

  // Update localStorage if API returns newer role data
  useEffect(() => {
    if (apiUser?.role && currentUser && apiUser.role !== currentUser.role) {
      const updated = { ...currentUser, role: apiUser.role };
      localStorage.setItem("user", JSON.stringify(updated));
    }
  }, [apiUser, currentUser]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      const trimmedTerm = searchTerm.trim();
      if (trimmedTerm) {
        navigate(`/?search=${encodeURIComponent(trimmedTerm)}`);
      } else {
        navigate(`/`);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-promo">
        Starting at <span>$6.95</span> — Premium eyewear, unbeatable prices.
        Free shipping on orders over $50!
      </div>
      <div className="header-top">
        <Link to="/" className="header-logo">
          <img src={logo} alt="Spectra Logo" />
        </Link>

        <div className="header-search-container">
          <div className="header-search-box">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Search frames, sunglasses, lenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        <div className="header-actions">
          {isAdmin && (
            <Link to="/admin" className="header-action-btn">
              <span className="icon">⚙️</span>
              <span className="text">Admin</span>
            </Link>
          )}

          <Link to="/orders" className="header-action-btn">
            <span className="icon">📦</span>
            <span className="text">Orders</span>
          </Link>

          <Link to="/cart" className="header-action-btn">
            <span className="icon">🛒</span>
            <span className="text">Cart</span>
          </Link>

          {currentUser ? (
            <>
              <Link
                to="/profile"
                className="header-action-btn"
                title="Đi đến Hồ sơ cá nhân"
              >
                <span className="icon">👤</span>
                <span className="text">
                  {currentUser.fullName || currentUser.userName || "Profile"}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="header-action-btn"
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px 14px",
                }}
                title="Đăng xuất khỏi hệ thống"
              >
                <span className="icon">🚪</span>
                <span className="text">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="header-action-btn">
              <span className="icon">👤</span>
              <span className="text">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      <nav className="header-nav">
        <Link to="/" className="header-nav-link">
          Home
        </Link>
        <Link to="/?category=eyeglasses" className="header-nav-link">
          Eyeglasses
        </Link>
        <Link to="/?category=sunglasses" className="header-nav-link">
          Sunglasses
        </Link>
        <Link to="/orders" className="header-nav-link">
          My Orders
        </Link>
      </nav>
    </header>
  );
}
