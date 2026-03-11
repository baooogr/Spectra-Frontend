import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminOrders.css';

export default function AdminOrders() {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States cho Modal Chi tiết
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

 
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Orders?page=1&pageSize=100", { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items || data || []);
      } else {
        console.error("Lỗi tải đơn hàng:", await res.text());
      }
    } catch (err) { console.error("Lỗi mạng:", err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  
  const handleViewDetails = async (orderId) => {
    setIsModalOpen(true);
    setIsLoadingDetail(true);
    setSelectedOrder(null); 
    
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Orders/${orderId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      } else {
        alert("Không thể tải chi tiết đơn hàng!");
        setIsModalOpen(false);
      }
    } catch (error) {
      alert("Lỗi kết nối khi tải chi tiết.");
      setIsModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Helper dịch trạng thái
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return <span className="status-badge status-pending">Chờ xác nhận</span>;
    if (s === 'processing') return <span className="status-badge status-processing">Đang xử lý</span>;
    if (s === 'shipped') return <span className="status-badge status-shipped">Đang giao</span>;
    if (s === 'delivered' || s === 'completed') return <span className="status-badge status-delivered">Hoàn thành</span>;
    if (s === 'cancelled') return <span className="status-badge status-cancelled">Đã hủy</span>;
    return <span className="status-badge" style={{background: '#eee', color: '#333'}}>{status || 'Chưa rõ'}</span>;
  };

  const formatUSD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  return (
    <div className="admin-orders-container">
      <div className="admin-orders-header">
        <h2 className="admin-orders-title">📦 Quản Lý Đơn Hàng</h2>
        <button className="btn-view" onClick={fetchOrders}>🔄 Làm mới</button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Khách Hàng</th>
              <th>Ngày Đặt</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
              <th className="col-action">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="6" style={{textAlign: 'center'}}>⏳ Đang tải dữ liệu...</td></tr> : 
             orders.length === 0 ? <tr><td colSpan="6" style={{textAlign: 'center'}}>Chưa có đơn hàng nào trên hệ thống.</td></tr> :
             orders.map((order, index) => (
                <tr key={index}>
                  <td className="col-id">#{order.id || order.orderId}</td>
                  <td>
                    <strong>{order.receiverName || order.customerName || 'Khách Vãng Lai'}</strong><br/>
                    <span style={{fontSize: '12px', color: '#666'}}>{order.phoneNumber || order.phone}</span>
                  </td>
                  <td className="col-date">{new Date(order.orderDate || order.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="col-price">{formatUSD(order.totalAmount || order.totalPrice)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td className="col-action">
                    <button onClick={() => handleViewDetails(order.id || order.orderId)} className="btn-view">👁️ Xem chi tiết</button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && (
        <div className="order-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="order-modal-content" onClick={e => e.stopPropagation()}>
            <div className="order-modal-header">
              <h3>📝 Chi Tiết Đơn Hàng {selectedOrder && `#${selectedOrder.id || selectedOrder.orderId}`}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="order-modal-body">
              {isLoadingDetail ? (
                <div style={{textAlign: 'center', padding: '50px'}}>⏳ Đang tải thông tin chi tiết...</div>
              ) : selectedOrder ? (
                <>
                  {/* THÔNG TIN CHUNG & KHÁCH HÀNG */}
                  <div className="info-grid">
                    <div className="info-card">
                      <h4>👤 Thông tin người nhận</h4>
                      <p><b>Họ Tên:</b> {selectedOrder.receiverName || selectedOrder.customerName}</p>
                      <p><b>SĐT:</b> {selectedOrder.phoneNumber || selectedOrder.phone}</p>
                      <p><b>Địa chỉ:</b> {selectedOrder.shippingAddress || selectedOrder.address}</p>
                      <p><b>Ghi chú:</b> {selectedOrder.note || 'Không có'}</p>
                    </div>
                    <div className="info-card">
                      <h4>🏷️ Thông tin đơn hàng</h4>
                      <p><b>Ngày đặt:</b> {new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                      <p><b>Trạng thái:</b> {getStatusBadge(selectedOrder.status)}</p>
                      <p><b>Thanh toán:</b> {selectedOrder.paymentMethod || 'COD'}</p>
                    </div>
                  </div>

                  {/* DANH SÁCH SẢN PHẨM & ẢNH TOA THUỐC */}
                  <h4>🛒 Sản phẩm đã mua</h4>
                  <div className="item-list">
                    {(selectedOrder.orderDetails || selectedOrder.items || []).map((item, idx) => {
                      // Backend có thể lưu link ảnh toa thuốc ở biến prescriptionUrl, prescriptionImage,...
                      const prescriptionImageUrl = item.prescriptionUrl || item.prescriptionImage || item.prescriptionFile;

                      return (
                        <div key={idx} className="item-row">
                          <div className="item-icon">👓</div>
                          <div className="item-details">
                            <p className="item-name">{item.frameName || item.productName || 'Gọng kính'}</p>
                            <p className="item-meta">SL: <b>{item.quantity}</b> | Giá: <b>{formatUSD(item.unitPrice || item.price)}</b></p>
                            
                            {(item.lensTypeName || item.lensFeatureName) && (
                              <p className="item-meta" style={{color: '#4338ca', marginTop: '4px'}}>
                                🔍 Tròng: {item.lensTypeName} - {item.lensFeatureName}
                              </p>
                            )}

                            
                            {prescriptionImageUrl && (
                              <div className="prescription-box">
                                <h5>Đơn thuốc đính kèm:</h5>
                                <img 
                                  src={prescriptionImageUrl} 
                                  alt="Toa thuốc khách tải lên" 
                                  className="prescription-img"
                                  onClick={() => window.open(prescriptionImageUrl, '_blank')}
                                  title="Bấm vào để xem ảnh lớn"
                                />
                                <p style={{fontSize: '11px', color: '#666', margin: '5px 0 0 0'}}>Bấm vào ảnh để xem kích thước đầy đủ</p>
                              </div>
                            )}
                          </div>
                          <div className="item-price">
                            {formatUSD((item.unitPrice || item.price) * item.quantity)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div style={{textAlign: 'center', color: 'red'}}>Không thể tải thông tin.</div>
              )}
            </div>

            <div className="modal-footer">
               <span>Tổng hóa đơn:</span>
               <span className="total-price">{selectedOrder ? formatUSD(selectedOrder.totalAmount || selectedOrder.totalPrice) : '$0.00'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}