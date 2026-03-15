import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./ShippingPage.css";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseAddress(shippingAddress) {
  if (!shippingAddress) return { name: "", phone: "", street: "" };
  const matchNew = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\]\s*(.*)$/);
  const matchOld = shippingAddress.match(/^\[(.*?) - (.*?)\]\s*(.*)$/);
  if (matchNew) return { name: matchNew[1], phone: matchNew[2], street: matchNew[4] };
  if (matchOld) return { name: matchOld[1], phone: matchOld[2], street: matchOld[3] };
  return { name: "", phone: "", street: shippingAddress };
}

function StatusBadge({ status }) {
  const map = {
    pending:    { label: "Chờ xác nhận", color: "#d97706", bg: "#fef3c7" },
    confirmed:  { label: "Đã xác nhận",  color: "#2563eb", bg: "#dbeafe" },
    processing: { label: "Đang xử lý",   color: "#7c3aed", bg: "#ede9fe" },
    shipped:    { label: "Đang giao",    color: "#0891b2", bg: "#cffafe" },
    delivered:  { label: "Đã giao",      color: "#059669", bg: "#d1fae5" },
    cancelled:  { label: "Đã huỷ",      color: "#dc2626", bg: "#fee2e2" },
  };
  const s = map[status?.toLowerCase()] || { label: status || "N/A", color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      backgroundColor: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: "12px",
      fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

const CARRIERS = [
  "Giao Hàng Nhanh",
  "Giao Hàng Tiết Kiệm",
  "J&T Express",
  "VNPost",
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ShippingPage() {
  const { user } = useContext(UserContext);
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const authHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const [orders, setOrders]       = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg]   = useState("");
  const [activeTab, setActiveTab] = useState("active"); // "active" | "shipped" | "all"

  // ─── MODAL: Manual tracking ───
  const [showManualModal, setShowManualModal]       = useState(false);
  const [selectedForManual, setSelectedForManual]   = useState(null);
  const [manualForm, setManualForm]                 = useState({ trackingNumber: "", carrier: "" });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // ─── FETCH ORDERS ─────────────────────────────────────────────────────────

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Orders?page=1&pageSize=100",
        { headers: authHeaders }
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items || data || []);
      } else {
        setErrorMsg("Không thể tải dữ liệu đơn hàng.");
      }
    } catch {
      setErrorMsg("Lỗi kết nối mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
    else { setIsLoading(false); setErrorMsg("Bạn chưa đăng nhập hoặc không có quyền."); }
  }, [token]);

  // ─── STATUS UPDATE (Delivered) ────────────────────────────────────────────

  const handleMarkDelivered = async (order) => {
    const id = order.orderId || order.id;
    if (!window.confirm(`Xác nhận đơn #${String(id).substring(0, 8)} đã giao thành công?`)) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Orders/${id}/status`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ status: "delivered" }),
      });
      if (res.ok) {
        alert("Đã cập nhật trạng thái: Đã giao hàng ✓");
        fetchOrders();
      } else {
        const err = await res.json();
        alert("Lỗi: " + (err.message || "Cập nhật thất bại"));
      }
    } catch { alert("Lỗi mạng."); }
  };

  // ─── MANUAL TRACKING ──────────────────────────────────────────────────────

  const openManualModal = (order) => {
    setSelectedForManual(order);
    setManualForm({
      trackingNumber: order.trackingNumber || "",
      carrier: order.shippingCarrier || "",
    });
    setShowManualModal(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.trackingNumber.trim() || !manualForm.carrier) {
      alert("Vui lòng chọn hãng vận chuyển và điền mã vận đơn.");
      return;
    }
    const id = selectedForManual.orderId || selectedForManual.id;
    setIsSubmittingManual(true);
    try {
      // Bước 1: Gán mã vận đơn + carrier
      const trackRes = await fetch(
        `https://myspectra.runasp.net/api/Shipping/orders/${id}/tracking`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            trackingNumber: manualForm.trackingNumber.trim(),
            carrier: manualForm.carrier,
          }),
        }
      );
      if (!trackRes.ok) {
        const err = await trackRes.json();
        alert("Lỗi: " + (err.message || "Cập nhật thất bại. Kiểm tra trạng thái đơn hàng."));
        return;
      }

      // Bước 2: Đảm bảo status được đổi sang shipped
      // (backend tự đổi khi đơn đang processing, gọi thêm để chắc chắn)
      const trackData = await trackRes.json();
      if (trackData.status?.toLowerCase() !== "shipped") {
        await fetch(`https://myspectra.runasp.net/api/Orders/${id}/status`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ status: "shipped" }),
        });
      }

      alert("Cập nhật mã vận đơn thành công! Trạng thái đơn → Shipped ✓");
      setShowManualModal(false);
      fetchOrders();
    } catch {
      alert("Lỗi mạng.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // ─── FILTER LOGIC ─────────────────────────────────────────────────────────

  const filteredOrders = orders.filter(o => {
    const s = o.status?.toLowerCase();
    if (activeTab === "active")  return s === "processing"; // chỉ processing
    if (activeTab === "shipped") return s === "shipped";
    return true; // "all"
  });

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const tabStyle = (tab) => ({
    padding: "9px 20px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    borderBottom: activeTab === tab ? "3px solid #2563eb" : "3px solid transparent",
    backgroundColor: activeTab === tab ? "white" : "#f3f4f6",
    color: activeTab === tab ? "#1d4ed8" : "#6b7280",
    borderRadius: "6px 6px 0 0",
    transition: "all 0.15s",
  });

  const activeCount  = orders.filter(o => o.status?.toLowerCase() === "processing").length;
  const shippedCount = orders.filter(o => o.status?.toLowerCase() === "shipped").length;

  return (
    <div className="shipping-page-container">
      <h2 className="shipping-header">🚚 Quản Lý Vận Chuyển & Giao Hàng</h2>

      {/* Ghi chú luồng */}
      <div style={{
        backgroundColor: "#eff6ff", border: "1px solid #bfdbfe",
        borderRadius: "8px", padding: "12px 16px", marginBottom: "20px",
        fontSize: "13px", color: "#1e40af", lineHeight: "1.7",
      }}>
        <b>Luồng xử lý:</b>&nbsp;
        <span style={{ color: "#7c3aed" }}>Confirmed</span> → đổi sang{" "}
        <span style={{ color: "#7c3aed" }}>Processing</span> (trong Quản lý Đơn hàng) →&nbsp;
        Nhập mã vận đơn thủ công → status tự chuyển sang{" "}
        <span style={{ color: "#0891b2" }}>Shipped</span> →&nbsp;
        Bấm <b>Đã giao</b> khi khách nhận hàng → <span style={{ color: "#059669" }}>Delivered</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #e5e7eb", marginBottom: 0 }}>
        <button style={tabStyle("active")}  onClick={() => setActiveTab("active")}>
          📦 Chờ giao ({activeCount})
        </button>
        <button style={tabStyle("shipped")} onClick={() => setActiveTab("shipped")}>
          🚚 Đang vận chuyển ({shippedCount})
        </button>
        <button style={tabStyle("all")}     onClick={() => setActiveTab("all")}>
          📋 Tất cả ({orders.length})
        </button>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: "white", border: "1px solid #e5e7eb",
        borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden",
      }}>
        {errorMsg ? (
          <div style={{ color: "#dc2626", padding: "24px" }}>{errorMsg}</div>
        ) : isLoading ? (
          <p style={{ padding: "24px", color: "#6b7280" }}>⏳ Đang tải...</p>
        ) : (
          <table className="shipping-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Trạng Thái</th>
                <th>Mã Vận Đơn</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                    Không có đơn nào trong mục này.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const rawId       = order.orderId || order.id;
                  const status      = order.status?.toLowerCase();
                  const canManual   = status === "processing";
                  const canDeliver  = status === "shipped";
                  const hasTracking = !!order.trackingNumber;

                  return (
                    <tr key={rawId}>
                      {/* Mã đơn */}
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "13px" }}>
                          #{String(rawId).substring(0, 8)}
                        </strong>
                      </td>

                      {/* Khách hàng */}
                      <td>
                        <div style={{ fontWeight: "bold" }}>
                          {order.receiverName || order.customerName || "Khách hàng"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {order.phoneNumber || order.phone || "—"}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td><StatusBadge status={order.status} /></td>

                      {/* Mã vận đơn + hãng ship */}
                      <td>
                        {hasTracking ? (
                          <div>
                            {order.shippingCarrier && (
                              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>
                                {order.shippingCarrier}
                              </div>
                            )}
                            <span className="badge-tracking">
                              {order.trackingNumber}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "13px" }}>Chưa có</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td>
                        <div className="actions-group">
                          {/* Nhập mã thủ công – chỉ khi processing */}
                          {canManual && (
                            <button
                              className="btn-manual"
                              onClick={() => openManualModal(order)}
                              title="Gán mã vận đơn thủ công → Shipped"
                            >
                              ✏️ Nhập mã
                            </button>
                          )}

                          {/* Xác nhận đã giao – chỉ khi shipped */}
                          {canDeliver && (
                            <button
                              className="btn-confirm"
                              onClick={() => handleMarkDelivered(order)}
                              style={{ padding: "8px 14px", fontSize: "13px" }}
                              title="Xác nhận khách đã nhận hàng → Delivered"
                            >
                              ✅ Đã giao
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ MODAL: MANUAL TRACKING ══ */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <h3 className="modal-title">✏️ Nhập Mã Vận Đơn Thủ Công</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "-10px", marginBottom: "16px" }}>
              Đơn: <b>#{String(selectedForManual?.orderId || selectedForManual?.id).substring(0, 8)}</b>
              &nbsp;·&nbsp; Trạng thái sẽ chuyển thành <b>Shipped</b>
            </p>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Hãng vận chuyển:</label>
                <select
                  value={manualForm.carrier}
                  onChange={e => setManualForm({ ...manualForm, carrier: e.target.value })}
                  required
                >
                  <option value="">-- Chọn hãng ship --</option>
                  {CARRIERS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mã vận đơn (Tracking Number):</label>
                <input
                  type="text"
                  value={manualForm.trackingNumber}
                  onChange={e => setManualForm({ ...manualForm, trackingNumber: e.target.value })}
                  required
                  placeholder="VD: GHN123456789"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowManualModal(false)}>
                  Huỷ
                </button>
                <button type="submit" className="btn-confirm" disabled={isSubmittingManual}>
                  {isSubmittingManual ? "Đang lưu..." : "Xác Nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}