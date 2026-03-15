import React, { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminOrders.css';

function parseShippingInfo(shippingAddress) {
  if (!shippingAddress) return { name: null, phone: null, email: null, address: shippingAddress };
  const matchNew   = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\] (.*)$/);
  const matchError = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*?)] (.*)$/);
  const matchOld   = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*)$/);
  if (matchNew)   return { name: matchNew[1],   phone: matchNew[2],   email: matchNew[3].trim(),   address: matchNew[4]   };
  if (matchError) return { name: matchError[1], phone: matchError[2], email: matchError[3].trim(), address: matchError[4] };
  if (matchOld)   return { name: matchOld[1],   phone: matchOld[2],   email: null,                 address: matchOld[3]   };
  return { name: null, phone: null, email: null, address: shippingAddress };
}

function fmtRx(val) {
  if (val === null || val === undefined) return '—';
  const n = Number(val);
  if (n === 0) return '0.00';
  return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

const thStyle = { padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: '#78350f', border: '1px solid #fde68a' };
const tdStyle = { padding: '5px 8px', textAlign: 'center', border: '1px solid #fde68a' };

// PrescriptionCard: collapsible, lazy-fetch nếu chỉ có prescriptionId
function PrescriptionCard({ prescription, prescriptionId, headers }) {
  const [rxData, setRxData]         = useState(prescription || null);
  const [isLoading, setIsLoading]   = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const handleExpand = useCallback(async () => {
    if (isExpanded) { setIsExpanded(false); return; }
    setIsExpanded(true);
    if (rxData) return;
    if (!prescriptionId) return;
    setIsLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Prescriptions/${prescriptionId}`, { headers });
      if (res.ok) { setRxData(await res.json()); } else { setFetchError(true); }
    } catch { setFetchError(true); }
    finally { setIsLoading(false); }
  }, [isExpanded, rxData, prescriptionId, headers]);

  if (!prescription && !prescriptionId) return null;

  return (
    <div style={{ marginTop: '8px', border: '1px solid #fbbf24', borderRadius: '8px', backgroundColor: '#fffbeb', overflow: 'hidden' }}>
      <button onClick={handleExpand} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#92400e' }}>
        <span>📋 Đơn kính đính kèm</span>
        <span style={{ fontSize: '11px', color: '#b45309' }}>{isExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}</span>
      </button>
      {isExpanded && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #fde68a' }}>
          {isLoading && <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>⏳ Đang tải...</p>}
          {fetchError && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>❌ Không thể tải đơn kính. Có thể đơn đã bị xóa.</p>}
          {rxData && !isLoading && (
            <>
              {(rxData.doctorName || rxData.clinicName) && (
                <p style={{ fontSize: '12px', color: '#78350f', margin: '0 0 8px 0' }}>
                  <b>Bác sĩ:</b> {rxData.doctorName || '—'} &nbsp;|&nbsp; <b>Phòng khám:</b> {rxData.clinicName || '—'}
                </p>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '6px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fde68a' }}>
                    <th style={thStyle}>Mắt</th>
                    <th style={thStyle}>SPH (độ cầu)</th>
                    <th style={thStyle}>CYL (loạn)</th>
                    <th style={thStyle}>AXIS (trục)</th>
                    <th style={thStyle}>ADD (lão)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#dc2626' }}>Mắt Phải (OD)</td>
                    <td style={tdStyle}>{fmtRx(rxData.sphereRight)}</td>
                    <td style={tdStyle}>{fmtRx(rxData.cylinderRight)}</td>
                    <td style={tdStyle}>{rxData.axisRight ?? '—'}°</td>
                    <td style={tdStyle}>{fmtRx(rxData.addRight)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#fef9c3' }}>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#2563eb' }}>Mắt Trái (OS)</td>
                    <td style={tdStyle}>{fmtRx(rxData.sphereLeft)}</td>
                    <td style={tdStyle}>{fmtRx(rxData.cylinderLeft)}</td>
                    <td style={tdStyle}>{rxData.axisLeft ?? '—'}°</td>
                    <td style={tdStyle}>{fmtRx(rxData.addLeft)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#78350f' }}>
                {rxData.pupillaryDistance != null && <span><b>PD:</b> {rxData.pupillaryDistance} mm</span>}
                {rxData.expirationDate && (
                  <span>
                    <b>Hết hạn:</b> {new Date(rxData.expirationDate).toLocaleDateString('vi-VN')}
                    {rxData.isExpired && <span style={{ marginLeft: '6px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Đã hết hạn</span>}
                  </span>
                )}
              </div>
              <p style={{ marginTop: '8px', fontSize: '11px', color: '#a16207', fontStyle: 'italic', borderTop: '1px dashed #fde68a', paddingTop: '6px', marginBottom: 0 }}>
                ℹ️ Đây là dữ liệu số khách nhập khi đặt hàng. API hiện chưa hỗ trợ upload ảnh scan toa thuốc.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const { user } = useContext(UserContext);
  const [orders, setOrders]             = useState([]);
  const [preorders, setPreorders]       = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [activeTab, setActiveTab]       = useState('orders');
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const token   = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const fetchOrdersData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, preordersRes] = await Promise.all([
        fetch("https://myspectra.runasp.net/api/Orders?page=1&pageSize=100", { headers }),
        fetch("https://myspectra.runasp.net/api/Preorders?page=1&pageSize=100", { headers })
      ]);
      if (ordersRes.ok)    { const d = await ordersRes.json();    setOrders(d.items    || d || []); }
      if (preordersRes.ok) { const d = await preordersRes.json(); setPreorders(d.items || d || []); }
    } catch (err) { console.error("Lỗi mạng:", err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchOrdersData(); }, []);

  const handleViewDetails = async (id, isPreorder) => {
    setIsModalOpen(true); setIsLoadingDetail(true); setSelectedOrder(null);
    const endpoint = isPreorder ? `Preorders/${id}` : `Orders/${id}`;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/${endpoint}`, { headers });
      if (res.ok) { setSelectedOrder({ ...await res.json(), isPreorder }); }
      else { alert("Không thể tải chi tiết đơn hàng!"); setIsModalOpen(false); }
    } catch { alert("Lỗi kết nối khi tải chi tiết."); setIsModalOpen(false); }
    finally { setIsLoadingDetail(false); }
  };

  const handleUpdateStatus = async (id, isPreorder, newStatus) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đổi trạng thái thành "${newStatus}"?`)) return;
    if (isPreorder && newStatus === 'converted') {
      const orderObj = preorders.find(p => (p.id || p.preorderId) === id);
      const addr = prompt("Vui lòng xác nhận địa chỉ giao hàng để chuyển sang Đơn thường:", orderObj?.shippingAddress || orderObj?.address || "");
      if (addr === null) return;
      try {
        const res = await fetch(`https://myspectra.runasp.net/api/Preorders/${id}/convert`, { method: "POST", headers, body: JSON.stringify({ shippingAddress: addr || "Đã xác nhận" }) });
        if (res.ok) { alert("Chuyển đổi thành công!"); fetchOrdersData(); if (isModalOpen) setIsModalOpen(false); }
        else { const err = await res.json(); alert("Lỗi chuyển đổi: " + (err.message || "Kiểm tra lại trạng thái")); }
      } catch { alert("Lỗi mạng!"); }
      return;
    }
    const endpoint = isPreorder ? `Preorders/${id}/status` : `Orders/${id}/status`;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/${endpoint}`, { method: "PUT", headers, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) {
        alert("Cập nhật trạng thái thành công!"); fetchOrdersData();
        if (selectedOrder && (selectedOrder.id || selectedOrder.orderId || selectedOrder.preorderId) === id)
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      } else { const err = await res.json(); alert("Lỗi cập nhật: " + (err.message || res.status)); }
    } catch { alert("Lỗi mạng!"); }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending')    return <span className="status-badge status-pending">Pending</span>;
    if (s === 'confirmed')  return <span className="status-badge status-confirmed">Confirmed</span>;
    if (s === 'paid')       return <span className="status-badge status-paid">Paid</span>;
    if (s === 'processing') return <span className="status-badge status-processing">Processing</span>;
    if (s === 'shipped')    return <span className="status-badge status-shipped">Shipped</span>;
    if (s === 'delivered')  return <span className="status-badge status-delivered">Delivered</span>;
    if (s === 'converted')  return <span className="status-badge status-converted">Converted</span>;
    if (s === 'cancelled')  return <span className="status-badge status-cancelled">Cancelled</span>;
    return <span className="status-badge" style={{ background: '#eee', color: '#333' }}>{status || 'Chưa rõ'}</span>;
  };

  const formatUSD   = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  const displayList = activeTab === 'orders' ? orders : preorders;

  const renderModalBody = () => {
    if (isLoadingDetail) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Đang tải thông tin chi tiết...</div>;
    if (!selectedOrder)  return <div style={{ textAlign: 'center', color: 'red' }}>Không thể tải thông tin.</div>;

    let displayName, displayPhone, displayEmail, displayAddress;
    if (selectedOrder.isPreorder) {
      displayName    = selectedOrder.receiverName || selectedOrder.customerName || selectedOrder.user?.fullName || "N/A";
      displayPhone   = selectedOrder.phoneNumber  || selectedOrder.phone        || selectedOrder.user?.phone   || "N/A";
      displayEmail   = selectedOrder.email        || selectedOrder.user?.email  || null;
      displayAddress = selectedOrder.shippingAddress || selectedOrder.address   || "N/A";
    } else {
      const parsed   = parseShippingInfo(selectedOrder.shippingAddress);
      displayName    = parsed.name  || selectedOrder.user?.fullName || "N/A";
      displayPhone   = parsed.phone || selectedOrder.user?.phone    || "N/A";
      displayEmail   = parsed.email || selectedOrder.user?.email    || null;
      displayAddress = parsed.address || "N/A";
    }

    const itemsList = selectedOrder.isPreorder
      ? (selectedOrder.preorderItems || selectedOrder.items || selectedOrder.orderItems || [])
      : (selectedOrder.orderItems    || selectedOrder.items || selectedOrder.orderDetails || []);

    return (
      <>
        <div className="info-grid">
          <div className="info-card">
            <h4>👤 Thông tin khách hàng</h4>
            <p><b>Họ Tên:</b> {displayName}</p>
            <p><b>SĐT:</b> {displayPhone}</p>
            {displayEmail && <p><b>Email:</b> {displayEmail}</p>}
            <p><b>Địa chỉ:</b> {displayAddress}</p>
            <p><b>Ghi chú:</b> {selectedOrder.note || 'Không có'}</p>
          </div>
          <div className="info-card">
            <h4>🏷️ Thông tin đơn</h4>
            <p><b>Ngày đặt:</b> {new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
            <p><b>Trạng thái:</b> {getStatusBadge(selectedOrder.status)}</p>
            <p><b>Thanh toán:</b> {selectedOrder.paymentMethod || 'VNPay / COD'}</p>
            {selectedOrder.isPreorder && selectedOrder.expectedDate && (
              <p style={{ color: '#2563eb' }}><b>Ngày mong muốn:</b> {new Date(selectedOrder.expectedDate).toLocaleString('vi-VN')}</p>
            )}
          </div>
        </div>

        <h4>🛒 Sản phẩm đã mua</h4>
        {itemsList.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>Không có thông tin sản phẩm.</p>
        ) : (
          <div className="item-list">
            {itemsList.map((item, idx) => {
              const frameName      = item.frame?.frameName || item.frameName || item.productName || 'Gọng kính';
              const unitPrice      = item.orderPrice || item.unitPrice || item.price || item.preorderPrice || 0;
              const lensType       = item.lensType?.lensSpecification || item.lensTypeName || null;
              const lensFeatureObj = item.lensFeature || item.feature;
              const lensFeature    = lensFeatureObj?.featureSpecification || item.lensFeatureName || null;
              const requiresRx     = item.lensType?.requiresPrescription || false;
              const embeddedRx     = item.prescription || null;
              const prescriptionId = item.prescriptionId || embeddedRx?.prescriptionId || null;

              return (
                <div key={item.orderItemId || item.preorderItemId || idx} className="item-row">
                  <div className="item-icon">👓</div>
                  <div className="item-details">
                    <p className="item-name">{frameName}</p>
                    <p className="item-meta">SL: <b>{item.quantity || 1}</b> | Giá: <b>{formatUSD(unitPrice)}</b></p>

                    {(lensType || lensFeature) && (
                      <p className="item-meta" style={{ color: '#4338ca', marginTop: '4px' }}>
                        🔍 Tròng: {lensType || 'Không chọn'}{lensFeature ? ` — ${lensFeature}` : ''}
                        {requiresRx && (
                          <span style={{ marginLeft: '8px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            Cần đơn kính
                          </span>
                        )}
                      </p>
                    )}

                    {/* ĐƠN KÍNH — collapsible, lazy-fetch khi cần */}
                    {(prescriptionId || embeddedRx) && (
                      <PrescriptionCard prescription={embeddedRx} prescriptionId={prescriptionId} headers={headers} />
                    )}

                    {requiresRx && !prescriptionId && !embeddedRx && (
                      <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px', fontStyle: 'italic' }}>
                        ⚠️ Tròng này yêu cầu đơn kính nhưng không tìm thấy dữ liệu đơn kính.
                      </p>
                    )}
                  </div>
                  <div className="item-price">{formatUSD(unitPrice * (item.quantity || 1))}</div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="admin-orders-container">
      <div className="admin-orders-header">
        <h2 className="admin-orders-title">📦 Quản Lý Đơn Hàng</h2>
        <button className="btn-view" onClick={fetchOrdersData}>🔄 Làm mới</button>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          Đơn Hàng Thường ({orders.length})
        </button>
        <button className={`tab-btn ${activeTab === 'preorders' ? 'active' : ''}`} onClick={() => setActiveTab('preorders')}>
          Đơn Đặt Trước (Pre-order) ({preorders.length})
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã Đơn</th><th>Khách Hàng</th><th>Ngày Đặt</th>
              <th>Tổng Tiền</th><th>Trạng Thái</th><th className="col-action">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>⏳ Đang tải dữ liệu...</td></tr>
              : displayList.length === 0
                ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>Chưa có đơn hàng nào trong mục này.</td></tr>
                : displayList.map((order, index) => {
                    const id = order.id || order.orderId || order.preorderId;
                    const isPreorder = activeTab === 'preorders';
                    return (
                      <tr key={index}>
                        <td className="col-id">#{id}</td>
                        <td>
                          <strong>{order.receiverName || order.customerName || 'Khách Vãng Lai'}</strong><br />
                          <span style={{ fontSize: '12px', color: '#666' }}>{order.phoneNumber || order.phone}</span>
                        </td>
                        <td className="col-date">{new Date(order.orderDate || order.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="col-price">{formatUSD(order.totalAmount || order.totalPrice)}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {getStatusBadge(order.status)}
                            <select className="status-select" value={order.status?.toLowerCase()} onChange={(e) => handleUpdateStatus(id, isPreorder, e.target.value)}>
                              <option value="" disabled>Đổi trạng thái</option>
                              {isPreorder ? (
                                <>
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="paid">Paid</option>
                                  <option value="converted">Convert to Order</option>
                                  <option value="cancelled">Cancelled</option>
                                </>
                              ) : (
                                <>
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </>
                              )}
                            </select>
                          </div>
                        </td>
                        <td className="col-action">
                          <button onClick={() => handleViewDetails(id, isPreorder)} className="btn-view">👁️ Xem chi tiết</button>
                        </td>
                      </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="order-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="order-modal-content" onClick={e => e.stopPropagation()}>
            <div className="order-modal-header">
              <h3>
                {selectedOrder?.isPreorder ? '🚀 Chi Tiết Pre-Order' : '📦 Chi Tiết Đơn Hàng'}{' '}
                {selectedOrder && `#${selectedOrder.id || selectedOrder.orderId || selectedOrder.preorderId}`}
              </h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="order-modal-body">{renderModalBody()}</div>
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