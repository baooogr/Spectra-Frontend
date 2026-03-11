import React, { useState, useEffect } from 'react';
import './AdminShipping.css';

export default function AdminShipping() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const fetchOrders = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Orders?page=1&pageSize=50", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Lọc hiển thị đơn hàng (tuỳ API của bạn, thường là items)
        setOrders(data.items || data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách đơn hàng:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleUpdateTracking = async (orderId) => {
    const trackingNum = prompt("Nhập mã vận đơn (Tracking Number) mới:");
    if (!trackingNum) return;

    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Shipping/orders/${orderId}/tracking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ trackingNumber: trackingNum })
      });

      if (res.ok) {
        alert("Cập nhật mã vận đơn thành công!");
        fetchOrders(); // Load lại data
      } else {
        alert("Có lỗi xảy ra khi cập nhật!");
      }
    } catch (err) {
      alert("Lỗi kết nối mạng.");
    }
  };

  return (
    <div className="admin-shipping-container">
      <h2 className="shipping-header">Quản lý Vận chuyển & Mã vận đơn</h2>
      
      {isLoading ? <p>Đang tải dữ liệu...</p> : (
        <table className="shipping-table">
          <thead>
            <tr>
              <th>Mã Đơn Hàng</th>
              <th>Khách Hàng</th>
              <th>Trạng Thái</th>
              <th>Mã Vận Đơn</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.orderId || order.id}>
                <td><strong>#{order.orderId?.substring(0,8) || order.id?.substring(0,8)}</strong></td>
                <td>{order.fullName || order.customerName}</td>
                <td>{order.status}</td>
                <td>
                  <span className={order.trackingNumber ? "badge-tracking" : ""}>
                    {order.trackingNumber || "Chưa có"}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-update-tracking"
                    onClick={() => handleUpdateTracking(order.orderId || order.id)}
                  >
                    Cập nhật
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}