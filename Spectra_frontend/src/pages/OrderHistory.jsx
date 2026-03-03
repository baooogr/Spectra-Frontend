import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./OrderHistory.css";

export default function OrderHistory() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Ưu tiên lấy token từ Context, nếu không có thì lấy từ LocalStorage
    const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchMyOrders = async () => {
      try {
        const res = await fetch("https://myspectra.runasp.net/api/Orders/my?page=1&pageSize=100", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}` 
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setOrders(data.items || data || []);
        } else if (res.status === 401 || res.status === 403) {
          // Lỗi này do Backend từ chối Token. Có thể do Token thực sự hết hạn, hoặc do tài khoản (Role) không được phép truy cập API này.
          setError(`Lỗi xác thực (Mã ${res.status}): Phiên đăng nhập không hợp lệ hoặc tài khoản không có quyền truy cập.`);
        } else {
          setError(`Không thể lấy danh sách đơn hàng (Lỗi ${res.status}).`);
        }
      } catch (err) {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyOrders();
  }, [user, navigate]);

  const translateStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === 'pending') return { text: 'Chờ xác nhận', color: '#f59e0b' }; // Cam
    if (s === 'processing') return { text: 'Đang xử lý', color: '#3b82f6' }; // Xanh dương
    if (s === 'shipped' || s === 'delivering') return { text: 'Đang giao hàng', color: '#8b5cf6' }; // Tím
    if (s === 'delivered' || s === 'completed') return { text: 'Thành công', color: '#10b981' }; // Xanh lá
    if (s === 'cancelled') return { text: 'Đã hủy', color: '#ef4444' }; // Đỏ
    return { text: status || 'Chưa rõ', color: 'gray' };
  };

  return (
    <div className="order-container" style={{maxWidth: '800px', margin: '40px auto', padding: '20px'}}>
      <h2>📦 Lịch Sử Đơn Hàng Của Bạn</h2>

      {isLoading && <p style={{textAlign: 'center', color: '#666'}}>⏳ Đang tải dữ liệu đơn hàng...</p>}
      
      {error && (
        <div style={{textAlign: 'center', padding: '20px', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#b91c1c', marginBottom: '20px'}}>
          <p><b>{error}</b></p>
          <p style={{fontSize: '14px', marginTop: '10px'}}>Gợi ý: Hãy thử đăng xuất và đăng nhập lại bằng một tài khoản Khách hàng (Customer).</p>
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div style={{textAlign: 'center', padding: '40px 0', backgroundColor: '#f9fafb', borderRadius: '8px'}}>
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link to="/" style={{display: 'inline-block', marginTop: '10px', padding: '10px 20px', background: '#111827', color: 'white', textDecoration: 'none', borderRadius: '5px'}}>
            Bắt đầu mua sắm ngay
          </Link>
        </div>
      )}

      {!isLoading && orders.length > 0 && orders.map((order) => {
        const statusObj = translateStatus(order.status);
        return (
          <div key={order.id || order.orderId} className="order-card" style={{marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
            <div className="order-header" style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '15px'}}>
              <div>
                <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666'}}>
                  <b>Mã Đơn:</b> #{order.id || order.orderId}
                </p>
                <p className="order-date" style={{margin: 0, fontWeight: 'bold'}}>
                  Ngày đặt: {new Date(order.orderDate || order.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <span className="order-status" style={{fontWeight: 'bold', color: statusObj.color, backgroundColor: `${statusObj.color}15`, padding: '5px 12px', borderRadius: '20px'}}>
                ● {statusObj.text}
              </span>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <p style={{margin: '0 0 5px 0'}}>Tổng tiền: <strong style={{color: '#10b981', fontSize: '18px'}}>${order.totalAmount || order.totalPrice || 0}</strong></p>
                <p style={{margin: 0, fontSize: '14px', color: '#666'}}>Số lượng sản phẩm: {order.orderDetails?.length || order.items?.length || 0}</p>
              </div>
              <Link to={`/orders/${order.id || order.orderId}`} style={{padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '5px', textDecoration: 'none', color: '#111827', fontWeight: '500', transition: '0.2s'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                Xem Chi Tiết ➔
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}