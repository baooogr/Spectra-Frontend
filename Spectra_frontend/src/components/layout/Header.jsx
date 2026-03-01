import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext'; 
import './Header.css'; 
import logo from '../../assets/logo.png'; 

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const { user, logout } = useContext(UserContext);
  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  // Cơ chế tự động kiểm tra quyền ngầm
  useEffect(() => {
    if (!currentUser || !currentUser.token) {
      setIsAdmin(false);
      return;
    }

    const currentRole = (currentUser.role || "").toLowerCase();
    
    // Nếu đã có sẵn chữ manager -> Hiện nút luôn
    if (currentRole === 'manager' || currentRole === 'admin') {
      setIsAdmin(true);
    } 
    // Nếu chưa có -> Gọi API xin quyền để check lại
    else if (!currentUser.role) {
      fetch('https://myspectra.runasp.net/api/Users/me', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      })
      .then(res => res.json())
      .then(data => {
        const fetchedRole = (data.role || "").toLowerCase();
        if (fetchedRole === 'manager' || fetchedRole === 'admin') {
          setIsAdmin(true);
          // Cập nhật lại vào máy
          const updated = { ...currentUser, role: data.role };
          localStorage.setItem("user", JSON.stringify(updated));
        }
      })
      .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
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
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="header-logo">
          <img src={logo} alt="Spectra Logo" />
        </Link>

        <div className="header-search-container">
          <div className="header-search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm kính..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch} 
            />
          </div>
        </div>

        <div className="header-actions">
          {/* NÚT ADMIN: CHỈ XUẤT HIỆN NẾU LÀ MANAGER HOẶC ADMIN */}
          {isAdmin && (
            <Link to="/admin" className="header-action-btn" style={{ color: '#10b981' }}>
              <span className="icon">⚙️</span>
              <span className="text" style={{ fontWeight: 'bold' }}>Admin</span>
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
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
               <Link to="/profile" className="header-action-btn" title="Đi đến Hồ sơ cá nhân">
                 <span className="icon">👤</span>
                 <span className="text" style={{ textTransform: 'capitalize', fontWeight: 'bold', color: '#000' }}>
                   {currentUser.fullName || currentUser.userName || 'Hồ sơ'}
                 </span>
               </Link>

               <button 
                 onClick={handleLogout} 
                 className="header-action-btn"
                 style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                 title="Đăng xuất khỏi hệ thống"
               >
                 <span className="icon" style={{ color: '#ef4444' }}>🚪</span>
                 <span className="text" style={{ color: '#ef4444' }}>Đăng xuất</span>
               </button>
            </div>
          ) : (
            <Link to="/login" className="header-action-btn">
              <span className="icon">👤</span>
              <span className="text">Login</span>
            </Link>
          )}
        </div>
      </div>

      <div className="header-nav">
        <Link to="/" className="header-nav-link">Home</Link>
      </div>
    </header>
  );
}