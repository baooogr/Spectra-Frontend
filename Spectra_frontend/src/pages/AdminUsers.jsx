import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminUsers.css';

export default function AdminUsers() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

 
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const myRole = (currentUser.role || "").toLowerCase();

  const token = user?.token || currentUser?.token;
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

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

  useEffect(() => { 
    if (myRole === 'admin' || myRole === 'manager') {
      fetchUsers(); 
    }
  }, [myRole]);

  
  if (myRole !== 'admin' && myRole !== 'manager') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#dc2626' }}>
        <h2>⛔ Bạn không có quyền truy cập chức năng này!</h2>
        <p>Chức năng phân quyền chỉ dành riêng cho Admin.</p>
      </div>
    );
  }

  
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi quyền của người dùng này thành ${newRole}?`)) return;
    
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Users/${userId}/role`, {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        alert("Cập nhật quyền thành công!");
        fetchUsers(); 
      } else if (res.status === 403) {
        alert("Lỗi 403: Tài khoản Admin của bạn không có đủ quyền tối cao trên Server để đổi quyền người khác!");
      } else {
        try {
          const errorData = await res.json();
          alert("Lỗi khi cập nhật quyền: " + (errorData.message || "Kiểm tra lại Backend"));
        } catch(e) {
           alert("Lỗi khi cập nhật quyền: Server trả về lỗi " + res.status);
        }
      }
    } catch (err) { 
      alert("Lỗi kết nối mạng: Không thể chạm tới Server."); 
    }
  };

  
  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi trạng thái thành ${newStatus}?`)) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        alert("Cập nhật trạng thái thành công!");
        fetchUsers();
      } else if (res.status === 403) {
        alert("Lỗi 403: Backend từ chối hành động đổi trạng thái này!");
      } else {
        try {
          const errorData = await res.json();
          alert("Lỗi khi cập nhật trạng thái: " + (errorData.message || "Kiểm tra lại Backend"));
        } catch(e) {
           alert("Lỗi khi cập nhật trạng thái: Server trả về lỗi " + res.status);
        }
      }
    } catch (err) { 
      alert("Lỗi kết nối mạng: Không thể chạm tới Server."); 
    }
  };

  return (
    <div className="admin-users-container" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div className="admin-users-header" style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '15px', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0 }}>👥 Quản Lý Người Dùng & Phân Quyền</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Cấp quyền Admin/Staff cho nhân viên hoặc khóa tài khoản khách hàng vi phạm.</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Đang tải dữ liệu...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', color: '#374151' }}>Họ và Tên</th>
                <th style={{ padding: '12px', color: '#374151' }}>Email</th>
                <th style={{ padding: '12px', color: '#374151' }}>Ngày tham gia</th>
                <th style={{ padding: '12px', color: '#374151' }}>Vai trò (Role)</th>
                <th style={{ padding: '12px', color: '#374151' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId || u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.fullName || "Chưa cập nhật"}</td>
                  <td style={{ padding: '12px' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  
                  {/* CỘT PHÂN QUYỀN */}
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={u.role || "Customer"} 
                      onChange={(e) => handleRoleChange(u.userId || u.id, e.target.value)}
                      disabled={u.userId === currentUser.userId} 
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '4px', 
                        border: '1px solid #d1d5db',
                        outline: 'none',
                        cursor: u.userId === currentUser.userId ? 'not-allowed' : 'pointer',
                        backgroundColor: u.role === 'Admin' ? '#fee2e2' : u.role === 'Staff' ? '#dbeafe' : '#f3f4f6',
                        color: u.role === 'Admin' ? '#991b1b' : u.role === 'Staff' ? '#1e40af' : '#374151',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="Customer">Khách hàng (Customer)</option>
                      <option value="Staff">Nhân viên (Staff)</option>
                      <option value="Admin">Quản trị viên (Admin)</option>
                    </select>
                  </td>

                  {/* CỘT TRẠNG THÁI */}
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={u.status || "Active"} 
                      onChange={(e) => handleStatusChange(u.userId || u.id, e.target.value)}
                      disabled={u.userId === currentUser.userId}
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '4px', 
                        border: '1px solid #d1d5db',
                        outline: 'none',
                        cursor: u.userId === currentUser.userId ? 'not-allowed' : 'pointer',
                        backgroundColor: u.status === 'Active' ? '#d1fae5' : '#fee2e2',
                        color: u.status === 'Active' ? '#065f46' : '#991b1b',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="Active">🟢 Đang hoạt động</option>
                      <option value="Inactive">🔴 Đã khóa (Banned)</option>
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