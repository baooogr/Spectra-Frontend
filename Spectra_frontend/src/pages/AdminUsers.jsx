import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminUsers.css';

export default function AdminUsers() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
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

  useEffect(() => { fetchUsers(); }, []);

  // ⚡ API CẬP NHẬT ROLE (QUYỀN)
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi quyền của người dùng này thành ${newRole}?`)) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Users/${userId}/role`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        alert("Cập nhật quyền thành công!");
        fetchUsers(); // Tải lại danh sách
      } else {
        const text = await res.text();
        alert("Lỗi khi cập nhật quyền: " + text);
      }
    } catch (err) { alert("Lỗi kết nối mạng."); }
  };

  // ⚡ API CẬP NHẬT STATUS (TRẠNG THÁI)
  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi trạng thái thành ${newStatus}?`)) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Users/${userId}/status`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert("Cập nhật trạng thái thành công!");
        fetchUsers();
      } else {
        const text = await res.text();
        alert("Lỗi khi cập nhật trạng thái: " + text);
      }
    } catch (err) { alert("Lỗi kết nối mạng."); }
  };

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <h2 className="admin-users-title">👥 Quản Lý Người Dùng</h2>
        <button className="btn-refresh" onClick={fetchUsers}>🔄 Làm mới</button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Số điện thoại</th>
              <th>Ngày tham gia</th>
              <th>Phân quyền (Role)</th>
              <th>Trạng thái (Status)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>⏳ Đang tải dữ liệu...</td></tr> : 
             users.length === 0 ? <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>Không có tài khoản nào.</td></tr> :
             users.map((u, index) => {
               const roleClass = u.role?.toLowerCase() === 'admin' ? 'admin' : 'customer';
               const statusClass = u.status?.toLowerCase() || 'active';
               
               return (
                <tr key={index}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">{u.fullName?.charAt(0)?.toUpperCase() || 'U'}</div>
                      <div>
                        <p className="user-name">{u.fullName || 'Chưa cập nhật'}</p>
                        <p className="user-email">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{u.phone || '---'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  
                  {/* DROPDOWN CHỌN ROLE */}
                  <td>
                    <select 
                      className={`select-control select-role ${roleClass}`} 
                      value={u.role || 'Customer'}
                      onChange={(e) => handleRoleChange(u.userId || u.id, e.target.value)}
                    >
                      <option value="Customer">Customer</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>

                  {/* DROPDOWN CHỌN STATUS */}
                  <td>
                    <select 
                      className={`select-control select-status ${statusClass}`} 
                      value={u.status || 'Active'}
                      onChange={(e) => handleStatusChange(u.userId || u.id, e.target.value)}
                    >
                      <option value="Active">🟢 Active (Hoạt động)</option>
                      <option value="Inactive">🔴 Inactive (Vô hiệu hóa)</option>
                      <option value="Banned">⚫ Banned (Bị cấm)</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}