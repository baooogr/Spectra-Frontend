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
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          }
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
  if (error || !order) return <div className="order-detail-container" style={{textAlign: 'center', padding: '50px'}}><h2 style={{color: 'red'}}>❌ {error}</h2><Link to="/orders" style={{color: '#3b82f6', textDecoration: 'underline'}}>← Quay lại lịch sử đơn hàng</Link></div>;

  const itemsList = order.orderDetails || order.orderItems || order.items || order.products || [];
  const formatUSD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  // Bắt dữ liệu giao hàng
  const customerName = order.receiverName || order.ReceiverName || order.customerName || order.CustomerName || order.fullName || order.user?.fullName || 'Khách hàng';
  const customerPhone = order.receiverPhone || order.ReceiverPhone || order.phoneNumber || order.PhoneNumber || order.phone || order.Phone || order.user?.phone || 'Chưa cập nhật';
  const customerAddress = order.shippingAddress || order.ShippingAddress || order.address || order.Address || order.user?.address || 'Chưa cập nhật';
  const orderNote = order.note || order.Note || 'Không có'; 

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return <span style={{color: '#d97706', fontWeight: 'bold'}}>Chờ xác nhận</span>;
    if (s === 'confirmed') return <span style={{color: '#059669', fontWeight: 'bold'}}>Đã xác nhận</span>;
    if (s === 'processing') return <span style={{color: '#4338ca', fontWeight: 'bold'}}>Đang xử lý</span>;
    if (s === 'shipped') return <span style={{color: '#7e22ce', fontWeight: 'bold'}}>Đang giao</span>;
    if (s === 'delivered' || s === 'completed') return <span style={{color: '#059669', fontWeight: 'bold'}}>Hoàn thành</span>;
    if (s === 'cancelled') return <span style={{color: '#dc2626', fontWeight: 'bold'}}>Đã hủy</span>;
    return <span>{status || 'Chưa rõ'}</span>;
  };

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
            <p><b>Trạng thái:</b> {getStatusBadge(order.status)}</p>
            <p><b>Ngày đặt:</b> {new Date(order.orderDate || order.createdAt).toLocaleString('vi-VN')}</p>
            <p><b>Thanh toán:</b> {order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : order.paymentMethod}</p>
          </div>
          
          <div style={{backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
            <h4 style={{marginTop: 0, color: '#4b5563'}}>Thông tin Giao hàng</h4>
            <p style={{marginBottom: '5px'}}><b>Người nhận:</b> {customerName}</p>
            <p style={{marginBottom: '5px'}}><b>Số điện thoại:</b> {customerPhone}</p>
            <p style={{marginBottom: '5px'}}><b>Địa chỉ:</b> {customerAddress}</p>
            <p style={{marginBottom: '0'}}><b>Ghi chú:</b> {orderNote}</p>
          </div>
        </div>

        <h3 style={{borderBottom: '1px solid #f3f4f6', paddingBottom: '10px'}}>Sản phẩm đã mua</h3>
        <div style={{marginBottom: '30px'}}>
          {itemsList.length === 0 ? (
            <p style={{textAlign: 'center', color: '#666', fontStyle: 'italic'}}>Không có chi tiết sản phẩm.</p>
          ) : (
            itemsList.map((item, index) => {
              const frameName = item.frameName || item.productName || item.frame?.frameName || 'Gọng kính';
              const lensType = item.lensTypeName || item.lensType?.lensSpecification || null;
              const lensFeature = item.lensFeatureName || item.lensFeature?.featureSpecification || null;
              const prescriptionImageUrl = item.prescriptionUrl || item.prescriptionImage || item.prescriptionFile;

              return (
                <div key={index} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px dashed #eee'}}>
                  <div>
                    <p style={{margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '16px'}}>{frameName}</p>
                    
                    {(lensType || lensFeature) && (
                      <div style={{backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '8px', marginBottom: '8px', display: 'inline-block'}}>
                        <p style={{margin: 0, fontSize: '13px', color: '#4338ca', fontWeight: '500'}}>
                          🔍 Tròng: {lensType} {lensFeature ? `- ${lensFeature}` : ''}
                        </p>
                      </div>
                    )}

                    <p style={{margin: '0', fontSize: '14px', color: '#666'}}>Số lượng: <b>x{item.quantity || item.qty || 1}</b></p>

                    {prescriptionImageUrl && (
                      <div style={{marginTop: '8px'}}>
                        <a href={prescriptionImageUrl} target="_blank" rel="noreferrer" style={{fontSize: '13px', color: '#b91c1c', fontWeight: 'bold', textDecoration: 'underline'}}>
                          ⚠️ Xem Toa thuốc đính kèm
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div style={{fontWeight: 'bold', fontSize: '16px', color: '#10b981'}}>
                    {formatUSD((item.unitPrice || item.price || 0) * (item.quantity || 1))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{textAlign: 'right', fontSize: '20px', backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
          Tổng cộng: <strong style={{color: '#000000', fontSize: '24px'}}>{formatUSD(order.totalAmount || order.totalPrice || 0)}</strong>
        </div>
      </div>
    </div>
  );
}