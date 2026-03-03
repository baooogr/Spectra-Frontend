import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./OrderDetail.css";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchOrderDetail = async () => {
      try {
        const res = await fetch(`https://myspectra.runasp.net/api/Orders/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else if (res.status === 404) {
          setError("Không tìm thấy đơn hàng này.");
        } else {
          setError("Có lỗi xảy ra khi lấy chi tiết đơn hàng.");
        }
      } catch (err) {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id, user, navigate]);

  if (isLoading) return <div style={{textAlign: 'center', padding: '50px', color: '#666'}}>⏳ Đang tải chi tiết đơn hàng...</div>;
  
  if (error || !order) {
    return (
      <div className="order-detail-container" style={{textAlign: 'center', padding: '50px'}}>
        <h2 style={{color: 'red'}}>❌ {error}</h2>
        <Link to="/orders" style={{color: '#3b82f6', textDecoration: 'underline'}}>← Quay lại lịch sử đơn hàng</Link>
      </div>
    );
  }

  
  const itemsList = order.orderDetails || order.items || [];

  return (
    <div className="order-detail-container" style={{maxWidth: '800px', margin: '40px auto', padding: '20px'}}>
      <Link to="/orders" style={{color: '#6b7280', textDecoration: 'none', marginBottom: '20px', display: 'inline-block'}}>
        ← Trở về Lịch sử mua hàng
      </Link>

      <div style={{backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <h2 style={{borderBottom: '2px solid #f3f4f6', paddingBottom: '15px', marginTop: 0}}>Chi Tiết Đơn Hàng #{order.id || order.orderId}</h2>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', marginTop: '20px'}}>
          <div style={{backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
            <h4 style={{marginTop: 0, color: '#4b5563'}}>Thông tin chung</h4>
            <p><b>Trạng thái:</b> <span style={{color: '#f59e0b', fontWeight: 'bold'}}>{order.status || 'Đang xử lý'}</span></p>
            <p><b>Ngày đặt:</b> {new Date(order.orderDate || order.createdAt).toLocaleString('vi-VN')}</p>
            <p><b>Thanh toán:</b> {order.paymentMethod || 'Tiền mặt (COD)'}</p>
          </div>
          
          <div style={{backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
            <h4 style={{marginTop: 0, color: '#4b5563'}}>Thông tin Giao hàng</h4>
            <p><b>Người nhận:</b> {order.receiverName || order.customerName || 'Không có tên'}</p>
            <p><b>Số điện thoại:</b> {order.phoneNumber || order.phone || 'Chưa cập nhật'}</p>
            <p><b>Địa chỉ:</b> {order.shippingAddress || order.address || 'Chưa cập nhật'}</p>
          </div>
        </div>

        <h3 style={{borderBottom: '1px solid #f3f4f6', paddingBottom: '10px'}}>Sản phẩm đã mua</h3>
        <div style={{marginBottom: '30px'}}>
          {itemsList.map((item, index) => (
            <div key={index} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px dashed #eee'}}>
              <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                <div style={{width: '60px', height: '60px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px'}}>
                  👓
                </div>
                <div>
                  <p style={{margin: '0 0 5px 0', fontWeight: 'bold'}}>{item.frameName || item.productName || 'Kính mắt'}</p>
                  
                 
                  {(item.lensTypeName || item.lensFeatureName) && (
                    <p style={{margin: 0, fontSize: '13px', color: '#6b7280'}}>
                      Tròng: {item.lensTypeName} - {item.lensFeatureName}
                    </p>
                  )}
                  <p style={{margin: '5px 0 0 0', fontSize: '14px'}}>Số lượng: <b>x{item.quantity || item.qty || 1}</b></p>
                </div>
              </div>
              <div style={{fontWeight: 'bold', fontSize: '16px'}}>
                ${item.unitPrice || item.price || 0}
              </div>
            </div>
          ))}
        </div>

        <div style={{textAlign: 'right', fontSize: '20px', backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
          Tổng cộng: <strong style={{color: '#15803d', fontSize: '24px'}}>${order.totalAmount || order.totalPrice || 0}</strong>
        </div>
      </div>
    </div>
  );
}