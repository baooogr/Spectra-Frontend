import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
   
    alert("Đăng xuất Admin!");
    navigate("/login");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      
      <aside style={{ width: '250px', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>
          Spectra Admin
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '20px 0', flex: 1 }}>
          <Link to="/admin" style={{ color: '#d1d5db', textDecoration: 'none', padding: '12px 20px', display: 'block' }}>📊 Tổng quan</Link>
          <Link to="/admin/products" style={{ color: '#d1d5db', textDecoration: 'none', padding: '12px 20px', display: 'block' }}>👓 Quản lý Sản phẩm</Link>
          <Link to="/admin/orders" style={{ color: '#d1d5db', textDecoration: 'none', padding: '12px 20px', display: 'block' }}>📦 Quản lý Đơn hàng</Link>
          <Link to="/admin/users" style={{ color: '#d1d5db', textDecoration: 'none', padding: '12px 20px', display: 'block' }}>👥 Quản lý Người dùng</Link>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #374151' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Đăng xuất
          </button>
        </div>
      </aside>

      
      <main style={{ flex: 1, backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: 'white', padding: '15px 30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 'bold' }}>Xin chào, Admin!</span>
        </header>
        
        <div style={{ padding: '30px', overflowY: 'auto' }}>
         
          <Outlet /> 
        </div>
      </main>

    </div>
  );
}