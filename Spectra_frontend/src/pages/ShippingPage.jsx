import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./ShippingPage.css";

export default function ShippingPage() {
  const { user } = useContext(UserContext);
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ================= STATES CHO MODAL MANUAL TRACKING =================
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedOrderForManual, setSelectedOrderForManual] = useState(null);
  const [manualForm, setManualForm] = useState({ trackingNumber: "", carrier: "VNPost" });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // ================= STATES CHO MODAL GOSHIP =================
  const [showGoShipModal, setShowGoShipModal] = useState(false);
  const [selectedOrderForGoShip, setSelectedOrderForGoShip] = useState(null);
  const [goShipForm, setGoShipForm] = useState({
    toName: "", toPhone: "", toStreet: "", toWard: "", toDistrict: "", toCity: "",
    cod: 0, weight: 500, width: 20, height: 10, length: 15
  });
  const [rates, setRates] = useState([]);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);

  // Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Orders?page=1&pageSize=50", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items || data || []);
      } else {
        setErrorMsg("Không thể tải dữ liệu đơn hàng.");
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
    else { setIsLoading(false); setErrorMsg("Bạn chưa đăng nhập hoặc không có quyền."); }
  }, [token]);

  // ================= LOGIC MANUAL TRACKING =================
  const openManualModal = (order) => {
    setSelectedOrderForManual(order);
    setManualForm({ trackingNumber: order.trackingNumber || "", carrier: order.shippingCarrier || "VNPost" });
    setShowManualModal(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Shipping/orders/${selectedOrderForManual.id || selectedOrderForManual.orderId}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ trackingNumber: manualForm.trackingNumber, carrier: manualForm.carrier })
      });
      if (res.ok) {
        alert("Cập nhật mã vận đơn thủ công thành công!");
        setShowManualModal(false);
        fetchOrders();
      } else {
        const err = await res.json();
        alert("Lỗi: " + (err.message || "Cập nhật thất bại"));
      }
    } catch (err) { alert("Lỗi mạng."); } 
    finally { setIsSubmittingManual(false); }
  };

  // ================= LOGIC GOSHIP =================
  const openGoShipModal = (order) => {
    // Bóc tách thông tin thô từ chuỗi address của đơn hàng
    let name = order.fullName || order.customerName || order.receiverName || "Khách hàng";
    let phone = order.phoneNumber || order.phone || "";
    let street = order.shippingAddress || "";
    
    const matchOld = street.match(/^\[(.*?) - (.*?)\]\s*(.*)$/);
    const matchNew = street.match(/^\[(.*?) - (.*?) - (.*?)\]\s*(.*)$/);

    if (matchNew) { name = matchNew[1]; phone = matchNew[2]; street = matchNew[4]; }
    else if (matchOld) { name = matchOld[1]; phone = matchOld[2]; street = matchOld[3]; }

    setGoShipForm({
      toName: name, toPhone: phone, toStreet: street,
      toWard: "", toDistrict: "", toCity: "Hồ Chí Minh",
      cod: order.paymentMethod === 'COD' ? (order.totalAmount || order.totalPrice || 0) * 25400 : 0, 
      weight: 500, width: 20, height: 10, length: 15
    });
    
    setSelectedOrderForGoShip(order);
    setRates([]);
    setSelectedRateId("");
    setShowGoShipModal(true);
  };

  const handleFetchRates = async () => {
    if (!goShipForm.toWard || !goShipForm.toDistrict || !goShipForm.toCity) {
      alert("Vui lòng điền đủ Phường/Xã, Quận/Huyện, Tỉnh/Thành phố!");
      return;
    }
    setIsFetchingRates(true);
    try {
      const payload = {
        addressFrom: {
          name: "Spectra Store", phone: "0901234567", street: "123 Nguyễn Huệ", ward: "Phường Bến Nghé", district: "Quận 1", city: "Hồ Chí Minh"
        },
        addressTo: {
          name: goShipForm.toName, phone: goShipForm.toPhone, street: goShipForm.toStreet, ward: goShipForm.toWard, district: goShipForm.toDistrict, city: goShipForm.toCity
        },
        parcel: {
          cod: Number(goShipForm.cod), weight: Number(goShipForm.weight), width: Number(goShipForm.width), height: Number(goShipForm.height), length: Number(goShipForm.length), metadata: ""
        }
      };

      const res = await fetch("https://myspectra.runasp.net/api/Shipping/goship/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setRates(data.data || []);
      } else {
        alert("Lỗi khi lấy giá cước từ GoShip!");
      }
    } catch (err) { alert("Lỗi kết nối mạng."); } 
    finally { setIsFetchingRates(false); }
  };

  const handleCreateShipment = async () => {
    if (!selectedRateId) { alert("Bạn chưa chọn hãng vận chuyển!"); return; }
    setIsCreatingShipment(true);
    try {
      const payload = {
        rateId: selectedRateId,
        orderId: selectedOrderForGoShip.id || selectedOrderForGoShip.orderId,
        addressFrom: { name: "Spectra Store", phone: "0901234567", street: "123 Nguyễn Huệ", ward: "Phường Bến Nghé", district: "Quận 1", city: "Hồ Chí Minh" },
        addressTo: { name: goShipForm.toName, phone: goShipForm.toPhone, street: goShipForm.toStreet, ward: goShipForm.toWard, district: goShipForm.toDistrict, city: goShipForm.toCity },
        parcel: { cod: Number(goShipForm.cod), weight: Number(goShipForm.weight), width: Number(goShipForm.width), height: Number(goShipForm.height), length: Number(goShipForm.length), metadata: "" }
      };

      const res = await fetch("https://myspectra.runasp.net/api/Shipping/goship/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Tạo đơn giao hàng tự động thành công! Trạng thái đơn đã đổi sang Shipped.");
        setShowGoShipModal(false);
        fetchOrders();
      } else {
        const err = await res.json();
        alert("Lỗi tạo đơn: " + (err.message || "Kiểm tra lại dữ liệu GoShip"));
      }
    } catch (err) { alert("Lỗi kết nối mạng."); } 
    finally { setIsCreatingShipment(false); }
  };

  return (
    <div className="shipping-page-container">
      <h2 className="shipping-header"> Quản lý Vận chuyển & Giao hàng</h2>

      {errorMsg ? ( <div style={{ color: "red", padding: "20px" }}>{errorMsg}</div> ) : isLoading ? ( <p> Đang tải dữ liệu...</p> ) : (
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
            {orders.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>Chưa có đơn hàng nào.</td></tr>
            ) : (
              orders.map((order) => {
                const rawId = order.orderId || order.id;
                return (
                  <tr key={rawId}>
                    <td><strong>#{String(rawId).substring(0, 8)}</strong></td>
                    <td>
                      <div style={{fontWeight: 'bold'}}>{order.fullName || order.customerName || order.receiverName || "Khách hàng"}</div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>{order.phoneNumber || order.phone}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "bold", textTransform: "capitalize", color: order.status === "shipped" || order.status === "delivered" ? "#059669" : "#d97706" }}>
                        {order.status || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className={order.trackingNumber ? "badge-tracking" : ""}>
                        {order.trackingNumber ? `${order.shippingCarrier || 'N/A'} - ${order.trackingNumber}` : "Chưa có"}
                      </span>
                    </td>
                    <td>
                      <div className="actions-group">
                        <button className="btn-manual" onClick={() => openManualModal(order)} title="Gán mã bằng tay">Nhập mã</button>
                        <button className="btn-goship" onClick={() => openGoShipModal(order)} title="Tạo vận đơn tự động qua GoShip">GoShip</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {/* ================= MODAL MANUAL TRACKING ================= */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '450px'}}>
            <h3 className="modal-title">Cập Nhật Mã Vận Đơn Thủ Công</h3>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Hãng vận chuyển (Carrier):</label>
                <input type="text" value={manualForm.carrier} onChange={e => setManualForm({...manualForm, carrier: e.target.value})} required placeholder="VD: Giao Hàng Nhanh, Viettel Post" />
              </div>
              <div className="form-group">
                <label>Mã vận đơn (Tracking Number):</label>
                <input type="text" value={manualForm.trackingNumber} onChange={e => setManualForm({...manualForm, trackingNumber: e.target.value})} required placeholder="Nhập mã vận đơn từ hãng" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowManualModal(false)}>Hủy</button>
                <button type="submit" className="btn-confirm" disabled={isSubmittingManual}>
                  {isSubmittingManual ? "Đang lưu..." : "Xác Nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL GOSHIP TẠO ĐƠN ================= */}
      {showGoShipModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title"> Lên Đơn Tự Động (GoShip)</h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>1. Thông tin Khách Hàng</h4>
              <div className="grid-2">
                <div className="form-group"><label>Người nhận:</label><input type="text" value={goShipForm.toName} onChange={e => setGoShipForm({...goShipForm, toName: e.target.value})} /></div>
                <div className="form-group"><label>SĐT:</label><input type="text" value={goShipForm.toPhone} onChange={e => setGoShipForm({...goShipForm, toPhone: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Số nhà / Tên đường:</label><input type="text" value={goShipForm.toStreet} onChange={e => setGoShipForm({...goShipForm, toStreet: e.target.value})} /></div>
              
              <div className="grid-2">
                <div className="form-group"><label>Phường/Xã (Ward):</label><input type="text" value={goShipForm.toWard} onChange={e => setGoShipForm({...goShipForm, toWard: e.target.value})} placeholder="VD: Phường 1" required /></div>
                <div className="form-group"><label>Quận/Huyện (District):</label><input type="text" value={goShipForm.toDistrict} onChange={e => setGoShipForm({...goShipForm, toDistrict: e.target.value})} placeholder="VD: Quận 3" required /></div>
              </div>
              <div className="form-group"><label>Tỉnh/Thành Phố (City):</label><input type="text" value={goShipForm.toCity} onChange={e => setGoShipForm({...goShipForm, toCity: e.target.value})} required /></div>

              <h4 style={{ marginBottom: '10px', fontSize: '15px', marginTop: '20px' }}>2. Thông tin Kiện Hàng</h4>
              <div className="grid-2">
                <div className="form-group"><label>Tiền thu hộ COD (VNĐ):</label><input type="number" value={goShipForm.cod} onChange={e => setGoShipForm({...goShipForm, cod: e.target.value})} /></div>
                <div className="form-group"><label>Cân nặng (gram):</label><input type="number" value={goShipForm.weight} onChange={e => setGoShipForm({...goShipForm, weight: e.target.value})} /></div>
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                 <div className="form-group" style={{flex: 1}}><label>Dài (cm):</label><input type="number" value={goShipForm.length} onChange={e => setGoShipForm({...goShipForm, length: e.target.value})} /></div>
                 <div className="form-group" style={{flex: 1}}><label>Rộng (cm):</label><input type="number" value={goShipForm.width} onChange={e => setGoShipForm({...goShipForm, width: e.target.value})} /></div>
                 <div className="form-group" style={{flex: 1}}><label>Cao (cm):</label><input type="number" value={goShipForm.height} onChange={e => setGoShipForm({...goShipForm, height: e.target.value})} /></div>
              </div>

              {rates.length > 0 && (
                <>
                  <h4 style={{ marginBottom: '10px', fontSize: '15px', marginTop: '20px', color: '#059669' }}>3. Chọn Hãng Vận Chuyển</h4>
                  <div className="rate-list">
                    {rates.map(rate => (
                      <div key={rate.id} className={`rate-card ${selectedRateId === rate.id ? 'active' : ''}`} onClick={() => setSelectedRateId(rate.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input type="radio" checked={selectedRateId === rate.id} readOnly />
                          <div>
                            <div className="rate-carrier">{rate.carrier_name} - {rate.service}</div>
                            <div style={{fontSize: '12px', color: '#6b7280'}}>Dự kiến: {rate.expected}</div>
                          </div>
                        </div>
                        <div className="rate-price">{new Intl.NumberFormat("vi-VN").format(rate.total_fee_after_discount || rate.total_fee)} VNĐ</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowGoShipModal(false)}>Hủy bỏ</button>
              
              {rates.length === 0 ? (
                <button type="button" className="btn-confirm" onClick={handleFetchRates} disabled={isFetchingRates}>
                  {isFetchingRates ? "Đang lấy giá..." : "Lấy Giá Cước GoShip"}
                </button>
              ) : (
                <button type="button" className="btn-confirm" onClick={handleCreateShipment} disabled={!selectedRateId || isCreatingShipment} style={{ backgroundColor: '#059669' }}>
                  {isCreatingShipment ? "Đang đẩy đơn..." : "Xác Nhận Tạo Đơn Giao Hàng"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}