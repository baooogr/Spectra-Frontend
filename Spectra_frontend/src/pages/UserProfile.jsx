import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullName: '', email: '', phone: '', address: '', role: '', status: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Lấy token từ LocalStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchMyProfile();
  }, [token, navigate]);

  // Gọi API lấy thông tin Profile
  const fetchMyProfile = async () => {
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          role: data.role || 'Customer',
          status: data.status || 'Active'
        });
      } else {
        navigate('/login'); // Token hết hạn
      }
    } catch (err) {
      setMessage("❌ Lỗi tải thông tin hồ sơ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Gọi API cập nhật Profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          address: profile.address
        })
      });

      if (res.ok) {
        setMessage("✅ Cập nhật hồ sơ thành công!");
        // Cập nhật lại fullName trong localStorage để Header đổi tên theo
        const lsUser = JSON.parse(localStorage.getItem("user"));
        if (lsUser) {
          lsUser.fullName = profile.fullName;
          localStorage.setItem("user", JSON.stringify(lsUser));
        }
      } else {
        setMessage("❌ Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setMessage("❌ Lỗi kết nối đến máy chủ.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p style={{ textAlign: "center", marginTop: "50px" }}>⏳ Đang tải hồ sơ...</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>👤 Hồ Sơ Cá Nhân</h2>
      
      {message && (
        <div style={{ padding: '10px', marginBottom: '20px', borderRadius: '6px', textAlign: 'center', backgroundColor: message.includes('✅') ? '#dcfce7' : '#fee2e2', color: message.includes('✅') ? '#15803d' : '#b91c1c' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={labelStyle}>Email (Không thể thay đổi):</label>
          <input type="email" value={profile.email} disabled style={{...inputStyle, backgroundColor: '#f3f4f6', cursor: 'not-allowed'}} />
        </div>

        <div>
          <label style={labelStyle}>Họ và Tên:</label>
          <input type="text" name="fullName" value={profile.fullName} onChange={handleChange} required style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Số Điện Thoại:</label>
          <input type="tel" name="phone" value={profile.phone} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Địa Chỉ Giao Hàng:</label>
          <textarea name="address" value={profile.address} onChange={handleChange} rows="3" style={{...inputStyle, resize: 'vertical'}} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Quyền hạn: <strong>{profile.role}</strong></p>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Trạng thái: <strong style={{color: '#10b981'}}>{profile.status}</strong></p>
        </div>

        <button type="submit" disabled={isSaving} style={{ padding: '12px', backgroundColor: '#000', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
          {isSaving ? "⏳ Đang lưu..." : "💾 Lưu Thay Đổi"}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' };