import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css'; 
import logo from '../../assets/logo.png'; 

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="header-logo">
          <img src={logo} alt="Spectra Logo" />
        </Link>

        <div className="header-search-container">
          <div className="header-search-box">
            <span className="search-icon"></span>
            <input 
              type="text" 
              placeholder="Search glasses" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch} 
            />
          </div>
        </div>

        <div className="header-actions">
          <Link to="/orders" className="header-action-btn">
            <span className="icon">📦</span>
            <span className="text">Orders</span>
          </Link>
          
          <Link to="/cart" className="header-action-btn">
            <span className="icon">🛒</span>
            <span className="text">Cart</span>
          </Link>
        </div>
      </div>

      <div className="header-nav">
        <Link to="/" className="header-nav-link">Home</Link>
      </div>
    </header>
  );
}