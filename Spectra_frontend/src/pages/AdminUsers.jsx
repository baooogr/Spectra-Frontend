import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminUsers.css';

export default function AdminUsers() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const myRole = user?.role || "";
  const myUserId = user?.userId;
  const token = user?.token;

  const headers = { 
    "Content-Type": "application/json", 
    "Authorization": `Bearer ${token}` 
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users?page=1&pageSize=100", { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || data || []);
      } else {
        console.error("Lỗi lấy danh sách user");
      }
    } catch (err) {
      console.error("Lỗi mạng:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cho phép cả manager fetch data
  useEffect(() => { 
    if (myRole === 'admin' || myRole === 'manager') {
      fetchUsers(); 
    }
  }, [myRole]);

  // Đuổi những ai KHÔNG PHẢI admin VÀ KHÔNG PHẢI manager
  if (myRole !== 'admin' && myRole !== 'manager') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#dc2626' }}>
        <h2>⛔ Bạn không có quyền truy cập chức năng này!</h2>
        <p>Chức năng phân quyền và quản lý tài khoản chỉ dành riêng cho Admin/Manager.</p>
      </div>
    );
  }

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi quyền của người dùng này thành ${newRole}?`)) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Users/${userId}/role`, {
        method: "PUT", headers,
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        alert("Cập nhật quyền thành công!");
        fetchUsers(); 
      } else if (res.status === 403) {
        alert("Lỗi 403: Tài khoản của bạn không đủ quyền trên Server (Backend chặn)!");
      } else {
        try {
          const errorData = await res.json();
          alert("Lỗi khi cập nhật quyền: " + (errorData.message || "Kiểm tra lại Backend"));
        } catch {
           alert("Lỗi khi cập nhật quyền: Server trả về lỗi " + res.status);
        }
      }
    } catch (err) { alert("Lỗi kết nối mạng: Không thể chạm tới Server."); }
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi trạng thái thành ${newStatus}?`)) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Users/${userId}/status`, {
        method: "PUT", headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert("Cập nhật trạng thái thành công!");
        fetchUsers();
      } else if (res.status === 403) {
        alert("Lỗi 403: Backend từ chối đổi trạng thái!");
      } else {
        try {
          const errorData = await res.json();
          alert("Lỗi khi cập nhật trạng thái: " + (errorData.message || "Kiểm tra lại Backend"));
        } catch {
           alert("Lỗi khi cập nhật trạng thái: Server trả về lỗi " + res.status);
        }
      }
    } catch (err) { alert("Lỗi kết nối mạng."); }
  };

  return (
    <div className="admin-users-container" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div className="admin-users-header" style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '15px', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0 }}>👥 Quản Lý Người Dùng & Phân Quyền (Chế độ Demo)</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Quản lý chi tiết thông tin và cấp quyền cho hệ thống.</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Đang tải dữ liệu...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', color: '#374151' }}>Họ và Tên</th>
                <th style={{ padding: '12px', color: '#374151' }}>Email</th>
                {/* ⚡ THÊM CỘT SĐT VÀ ĐỊA CHỈ */}
                <th style={{ padding: '12px', color: '#374151' }}>Số điện thoại</th>
                <th style={{ padding: '12px', color: '#374151' }}>Địa chỉ</th>
                <th style={{ padding: '12px', color: '#374151' }}>Ngày tham gia</th>
                <th style={{ padding: '12px', color: '#374151' }}>Vai trò (Role)</th>
                <th style={{ padding: '12px', color: '#374151' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.fullName || "Chưa cập nhật"}</td>
                  <td style={{ padding: '12px' }}>{u.email}</td>
                  
                  {/* ⚡ HIỂN THỊ SĐT VÀ ĐỊA CHỈ */}
                  <td style={{ padding: '12px' }}>{u.phone || <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Chưa có</span>}</td>
                  <td style={{ padding: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.address}>
                    {u.address || <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Chưa có</span>}
                  </td>
                  
                  <td style={{ padding: '12px' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={u.role || "customer"} 
                      onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                      disabled={u.userId === myUserId} 
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '4px', border: '1px solid #d1d5db', outline: 'none',
                        cursor: u.userId === myUserId ? 'not-allowed' : 'pointer',
                        backgroundColor: u.role === 'admin' ? '#fee2e2' : u.role === 'manager' ? '#fef3c7' : u.role === 'staff' ? '#dbeafe' : '#f3f4f6',
                        color: u.role === 'admin' ? '#991b1b' : u.role === 'manager' ? '#92400e' : u.role === 'staff' ? '#1e40af' : '#374151',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="customer">Khách hàng (Customer)</option>
                      <option value="staff">Nhân viên (Staff)</option>
                      <option value="manager">Quản lý (Manager)</option>
                      <option value="admin">Quản trị tối cao (Admin)</option>
                    </select>
                  </td>

                  <td style={{ padding: '12px' }}>
                    <select 
                      value={u.status || "active"} 
                      onChange={(e) => handleStatusChange(u.userId, e.target.value)}
                      disabled={u.userId === myUserId}
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '4px', border: '1px solid #d1d5db', outline: 'none',
                        cursor: u.userId === myUserId ? 'not-allowed' : 'pointer',
                        backgroundColor: u.status === 'active' ? '#d1fae5' : u.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: u.status === 'active' ? '#065f46' : u.status === 'pending' ? '#92400e' : '#991b1b',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="active">🟢 Hoạt động (Active)</option>
                      <option value="pending">🟡 Chờ duyệt (Pending)</option>
                      <option value="inactive">⚪ Vô hiệu hóa (Inactive)</option>
                      <option value="suspended">🔴 Bị đình chỉ (Suspended)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}