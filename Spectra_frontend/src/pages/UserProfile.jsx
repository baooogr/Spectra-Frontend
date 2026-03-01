import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css'; // Gọi file CSS

export default function UserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '', address: '', role: '', status: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchMyProfile();
  }, [token, navigate]);

  const fetchMyProfile = async () => {
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Users/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          fullName: data.fullName || '', email: data.email || '', phone: data.phone || '',
          address: data.address || '', role: data.role || 'Customer', status: data.status || 'Active'
        });
      } else navigate('/login');
    } catch (err) { setMessage("❌ Lỗi tải thông tin hồ sơ"); } 
    finally { setIsLoading(false); }
  };

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true); setMessage('');
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone, address: profile.address })
      });

      if (res.ok) {
        setMessage("✅ Cập nhật hồ sơ thành công!");
        const lsUser = JSON.parse(localStorage.getItem("user"));
        if (lsUser) { lsUser.fullName = profile.fullName; localStorage.setItem("user", JSON.stringify(lsUser)); }
      } else setMessage("❌ Cập nhật thất bại.");
    } catch (err) { setMessage("❌ Lỗi kết nối đến máy chủ."); } 
    finally { setIsSaving(false); }
  };

  if (isLoading) return <p style={{ textAlign: "center", marginTop: "50px" }}>⏳ Đang tải hồ sơ...</p>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">👤 Hồ Sơ Cá Nhân</h2>
      
      {message && <div className={`profile-msg ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div><label className="form-label">Email (Không thể thay đổi):</label><input type="email" value={profile.email} disabled className="form-input" /></div>
        <div><label className="form-label">Họ và Tên:</label><input type="text" name="fullName" value={profile.fullName} onChange={handleChange} required className="form-input" /></div>
        <div><label className="form-label">Số Điện Thoại:</label><input type="tel" name="phone" value={profile.phone} onChange={handleChange} className="form-input" /></div>
        <div><label className="form-label">Địa Chỉ Giao Hàng:</label><textarea name="address" value={profile.address} onChange={handleChange} rows="3" className="form-input" style={{ resize: 'vertical' }} /></div>

        <div className="profile-info-row">
          <p className="profile-info-text">Quyền hạn: <strong>{profile.role}</strong></p>
          <p className="profile-info-text">Trạng thái: <strong className="profile-status">{profile.status}</strong></p>
        </div>

        <button type="submit" disabled={isSaving} className="profile-btn-save">
          {isSaving ? "⏳ Đang lưu..." : "💾 Lưu Thay Đổi"}
        </button>
      </form>
    </div>
  );
}