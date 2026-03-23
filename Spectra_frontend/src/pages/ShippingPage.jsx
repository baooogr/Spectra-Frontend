import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./ShippingPage.css";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseAddress(shippingAddress) {
  if (!shippingAddress) return { name: "", phone: "", street: "" };
  const matchNew = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\]\s*(.*)$/);
  const matchOld = shippingAddress.match(/^\[(.*?) - (.*?)\]\s*(.*)$/);
  if (matchNew)
    return { name: matchNew[1], phone: matchNew[2], street: matchNew[4] };
  if (matchOld)
    return { name: matchOld[1], phone: matchOld[2], street: matchOld[3] };
  return { name: "", phone: "", street: shippingAddress };
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Chờ xác nhận", color: "#d97706", bg: "#fef3c7" },
    confirmed: { label: "Đã xác nhận", color: "#2563eb", bg: "#dbeafe" },
    processing: { label: "Đang xử lý", color: "#7c3aed", bg: "#ede9fe" },
    shipped: { label: "Đang giao", color: "#0891b2", bg: "#cffafe" },
    delivered: { label: "Đã giao", color: "#059669", bg: "#d1fae5" },
    cancelled: { label: "Đã huỷ", color: "#dc2626", bg: "#fee2e2" },
  };
  const s = map[status?.toLowerCase()] || {
    label: status || "N/A",
    color: "#6b7280",
    bg: "#f3f4f6",
  };
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "13px",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

const CARRIERS = ["J&T Express"];

function getCarrierTrackingUrl(carrier, tracking) {
  if (!carrier || !tracking) return null;
  // J&T Express is the sole shipping carrier
  return `https://jtexpress.vn/vi/tracking?type=track&billcode=${encodeURIComponent(tracking)}`;
}

function ShippingMethodBadge({ method }) {
  const isExpress = method?.toLowerCase() === "express";
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "10px",
        backgroundColor: isExpress ? "#fef3c7" : "#f0f9ff",
        color: isExpress ? "#92400e" : "#1e40af",
        whiteSpace: "nowrap",
      }}
    >
      {isExpress ? "Nhanh" : "Tiêu chuẩn"}
    </span>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ShippingPage() {
  const { user } = useContext(UserContext);
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // "active" | "shipped" | "all"

  // ─── MODAL: Manual tracking ───
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedForManual, setSelectedForManual] = useState(null);
  const [manualForm, setManualForm] = useState({
    trackingNumber: "",
    carrier: "",
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // ─── MODAL: GoShip J&T shipment creation ───
  const [showGoShipModal, setShowGoShipModal] = useState(false);
  const [goShipOrder, setGoShipOrder] = useState(null);
  const [goShipStep, setGoShipStep] = useState(1); // 1=parcel, 2=rates, 3=creating
  const [goShipParcel, setGoShipParcel] = useState({
    weight: 500,
    width: 20,
    height: 10,
    length: 25,
    cod: 0,
  });
  const [goShipRates, setGoShipRates] = useState([]);
  const [goShipSelectedRate, setGoShipSelectedRate] = useState(null);
  const [goShipLoading, setGoShipLoading] = useState(false);
  const [goShipError, setGoShipError] = useState("");

  // GoShip location picker state
  const [gsCities, setGsCities] = useState([]);
  const [gsDistricts, setGsDistricts] = useState([]);
  const [gsWards, setGsWards] = useState([]);
  const [gsSelectedCity, setGsSelectedCity] = useState("");
  const [gsSelectedDistrict, setGsSelectedDistrict] = useState("");
  const [gsSelectedWard, setGsSelectedWard] = useState("");
  const [gsReceiverName, setGsReceiverName] = useState("");
  const [gsReceiverPhone, setGsReceiverPhone] = useState("");
  const [gsReceiverStreet, setGsReceiverStreet] = useState("");
  const [goShipSandbox, setGoShipSandbox] = useState(false);

  // Default warehouse address (HCM) — GoShip numeric IDs
  const WAREHOUSE_ADDRESS = {
    name: "Spectra Glasses Warehouse",
    phone: "0909123456",
    street: "123 Nguyễn Văn Linh",
    ward: "9233",
    district: "700700",
    city: "700000",
  };

  // ─── FETCH ORDERS ─────────────────────────────────────────────────────────

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Orders?page=1&pageSize=100",
        { headers: authHeaders },
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
    else {
      setIsLoading(false);
      setErrorMsg("Bạn chưa đăng nhập hoặc không có quyền.");
    }
  }, [token]);

  // ─── STATUS UPDATE (Delivered) ────────────────────────────────────────────

  const handleMarkDelivered = async (order) => {
    const id = order.orderId || order.id;
    if (
      !window.confirm(
        `Xác nhận đơn #${String(id).substring(0, 8)} đã giao thành công?`,
      )
    )
      return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/Orders/${id}/status`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ status: "delivered" }),
        },
      );
      if (res.ok) {
        alert("Đã cập nhật trạng thái: Đã giao hàng ✓");
        fetchOrders();
      } else {
        const err = await res.json();
        alert("Lỗi: " + (err.message || "Cập nhật thất bại"));
      }
    } catch {
      alert("Lỗi mạng.");
    }
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
        },
      );
      if (!trackRes.ok) {
        const err = await trackRes.json();
        alert(
          "Lỗi: " +
            (err.message || "Cập nhật thất bại. Kiểm tra trạng thái đơn hàng."),
        );
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

  // ─── GOSHIP J&T SHIPMENT CREATION ─────────────────────────────────────────

  const openGoShipModal = (order) => {
    setGoShipOrder(order);
    setGoShipStep(1);
    setGoShipRates([]);
    setGoShipSelectedRate(null);
    setGoShipError("");
    setGoShipParcel({ weight: 500, width: 20, height: 10, length: 25, cod: 0 });
    // Reset location picker
    setGsDistricts([]);
    setGsWards([]);
    setGsSelectedCity("");
    setGsSelectedDistrict("");
    setGsSelectedWard("");
    // Pre-fill receiver info from order
    const addr = parseAddress(order.shippingAddress);
    setGsReceiverName(addr.name || "Khách hàng");
    setGsReceiverPhone(addr.phone || "0900000000");
    setGsReceiverStreet(addr.street || "");
    // Fetch cities + sandbox status
    if (gsCities.length === 0) {
      fetch("https://myspectra.runasp.net/api/Shipping/goship/cities", {
        headers: authHeaders,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setGsCities(data || []))
        .catch(() => {});
      fetch("https://myspectra.runasp.net/api/Shipping/goship/status", {
        headers: authHeaders,
      })
        .then((r) => (r.ok ? r.json() : {}))
        .then((data) => setGoShipSandbox(data.isSandbox === true))
        .catch(() => {});
    }
    setShowGoShipModal(true);
  };

  const handleCityChange = (cityId) => {
    setGsSelectedCity(cityId);
    setGsSelectedDistrict("");
    setGsSelectedWard("");
    setGsDistricts([]);
    setGsWards([]);
    if (!cityId) return;
    fetch(
      `https://myspectra.runasp.net/api/Shipping/goship/cities/${cityId}/districts`,
      { headers: authHeaders },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGsDistricts(data || []))
      .catch(() => {});
  };

  const handleDistrictChange = (districtId) => {
    setGsSelectedDistrict(districtId);
    setGsSelectedWard("");
    setGsWards([]);
    if (!districtId) return;
    fetch(
      `https://myspectra.runasp.net/api/Shipping/goship/districts/${districtId}/wards`,
      { headers: authHeaders },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGsWards(data || []))
      .catch(() => {});
  };

  const buildAddressTo = () => ({
    name: gsReceiverName || "Khách hàng",
    phone: gsReceiverPhone || "0900000000",
    street: gsReceiverStreet || "",
    ward: gsSelectedWard,
    district: gsSelectedDistrict,
    city: gsSelectedCity,
  });

  const handleGoShipGetRates = async () => {
    if (!gsSelectedCity || !gsSelectedDistrict || !gsSelectedWard) {
      setGoShipError("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã.");
      return;
    }
    setGoShipLoading(true);
    setGoShipError("");
    try {
      const addressTo = buildAddressTo();
      const res = await fetch(
        "https://myspectra.runasp.net/api/Shipping/goship/rates",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            addressFrom: WAREHOUSE_ADDRESS,
            addressTo: addressTo,
            parcel: goShipParcel,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const rates = data.data || data.Data || [];
        if (rates.length === 0) {
          setGoShipError(
            "Không tìm thấy tuyến vận chuyển J&T cho địa chỉ này.",
          );
        } else {
          setGoShipRates(rates);
          setGoShipStep(2);
        }
      } else {
        const err = await res.json();
        setGoShipError(err.message || "Không thể lấy giá cước từ GoShip.");
      }
    } catch {
      setGoShipError("Lỗi kết nối GoShip.");
    } finally {
      setGoShipLoading(false);
    }
  };

  const handleGoShipCreateShipment = async () => {
    if (!goShipSelectedRate) return;
    setGoShipLoading(true);
    setGoShipError("");
    setGoShipStep(3);
    try {
      const addressTo = buildAddressTo();
      const orderId = goShipOrder.orderId || goShipOrder.id;
      const res = await fetch(
        "https://myspectra.runasp.net/api/Shipping/goship/shipments",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            rateId: goShipSelectedRate,
            orderId: orderId,
            addressFrom: WAREHOUSE_ADDRESS,
            addressTo: addressTo,
            parcel: goShipParcel,
          }),
        },
      );
      if (res.ok) {
        setShowGoShipModal(false);
        fetchOrders();
      } else {
        const err = await res.json();
        setGoShipError(err.message || "Không thể tạo vận đơn GoShip.");
        setGoShipStep(2);
      }
    } catch {
      setGoShipError("Lỗi kết nối khi tạo vận đơn.");
      setGoShipStep(2);
    } finally {
      setGoShipLoading(false);
    }
  };

  // ─── FILTER LOGIC ─────────────────────────────────────────────────────────

  const filteredOrders = orders.filter((o) => {
    const s = o.status?.toLowerCase();
    if (activeTab === "active") return s === "processing";
    if (activeTab === "shipped") return s === "shipped";
    if (activeTab === "delivered") return s === "delivered";
    return true; // "all"
  });

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const tabStyle = (tab) => ({
    padding: "9px 20px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    borderBottom:
      activeTab === tab ? "3px solid #2563eb" : "3px solid transparent",
    backgroundColor: activeTab === tab ? "white" : "#f3f4f6",
    color: activeTab === tab ? "#1d4ed8" : "#6b7280",
    borderRadius: "6px 6px 0 0",
    transition: "all 0.15s",
  });

  const activeCount = orders.filter(
    (o) => o.status?.toLowerCase() === "processing",
  ).length;
  const shippedCount = orders.filter(
    (o) => o.status?.toLowerCase() === "shipped",
  ).length;
  const deliveredCount = orders.filter(
    (o) => o.status?.toLowerCase() === "delivered",
  ).length;

  return (
    <div className="shipping-page-container">
      <h2 className="shipping-header">Quản Lý Vận Chuyển & Giao Hàng</h2>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {[
          {
            label: "Chờ giao",
            count: activeCount,
            icon: "",
            color: "#7c3aed",
            bg: "#ede9fe",
          },
          {
            label: "Đang giao",
            count: shippedCount,
            icon: "",
            color: "#0891b2",
            bg: "#cffafe",
          },
          {
            label: "Đã giao",
            count: deliveredCount,
            icon: "",
            color: "#059669",
            bg: "#d1fae5",
          },
          {
            label: "Tổng đơn",
            count: orders.length,
            icon: "",
            color: "#6b7280",
            bg: "#f3f4f6",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "16px",
              border: `2px solid ${card.bg}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "4px" }}>
              {card.icon}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: card.color,
              }}
            >
              {card.count}
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 0,
        }}
      >
        <button
          style={tabStyle("active")}
          onClick={() => setActiveTab("active")}
        >
          Chờ giao ({activeCount})
        </button>
        <button
          style={tabStyle("shipped")}
          onClick={() => setActiveTab("shipped")}
        >
          Đang vận chuyển ({shippedCount})
        </button>
        <button
          style={tabStyle("delivered")}
          onClick={() => setActiveTab("delivered")}
        >
          Đã giao ({deliveredCount})
        </button>
        <button style={tabStyle("all")} onClick={() => setActiveTab("all")}>
          Tất cả ({orders.length})
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          overflow: "hidden",
        }}
      >
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
                <th>Địa Chỉ Giao</th>
                <th>Vận Chuyển</th>
                <th>Trạng Thái</th>
                <th>Mã Vận Đơn</th>
                <th>Dự Kiến Giao</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "#9ca3af",
                    }}
                  >
                    Không có đơn nào trong mục này.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const rawId = order.orderId || order.id;
                  const status = order.status?.toLowerCase();
                  const canManual = status === "processing";
                  const canDeliver = status === "shipped";
                  const hasTracking = !!order.trackingNumber;
                  const addr = parseAddress(order.shippingAddress);
                  const trackUrl = getCarrierTrackingUrl(
                    order.shippingCarrier,
                    order.trackingNumber,
                  );

                  return (
                    <tr key={rawId}>
                      {/* Mã đơn */}
                      <td>
                        {order.convertedFromPreorderId ? (
                          <div>
                            <strong
                              style={{
                                fontFamily: "monospace",
                                fontSize: "13px",
                              }}
                            >
                              #
                              {String(order.convertedFromPreorderId).substring(
                                0,
                                8,
                              )}
                            </strong>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#9ca3af",
                                marginTop: "2px",
                              }}
                            >
                              Pre-order
                            </div>
                          </div>
                        ) : (
                          <strong
                            style={{
                              fontFamily: "monospace",
                              fontSize: "13px",
                            }}
                          >
                            #{String(rawId).substring(0, 8)}
                          </strong>
                        )}
                      </td>

                      {/* Khách hàng */}
                      <td>
                        <div style={{ fontWeight: "bold" }}>
                          {addr.name || order.user?.fullName || "Khách hàng"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {addr.phone || order.user?.phone || "—"}
                        </div>
                      </td>

                      {/* Địa chỉ giao */}
                      <td>
                        <div
                          style={{
                            fontSize: "13px",
                            maxWidth: "200px",
                            lineHeight: "1.4",
                          }}
                        >
                          {addr.street || order.shippingAddress || "—"}
                        </div>
                      </td>

                      {/* Phương thức vận chuyển */}
                      <td>
                        <ShippingMethodBadge method={order.shippingMethod} />
                      </td>

                      {/* Trạng thái */}
                      <td>
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Mã vận đơn + hãng ship + tracking link */}
                      <td>
                        {hasTracking ? (
                          <div>
                            {order.shippingCarrier && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  marginBottom: "2px",
                                }}
                              >
                                {order.shippingCarrier}
                              </div>
                            )}
                            <span className="badge-tracking">
                              {order.trackingNumber}
                            </span>
                            {trackUrl && (
                              <div style={{ marginTop: "4px" }}>
                                <a
                                  href={trackUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: "11px",
                                    color: "#2563eb",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                  }}
                                >
                                  Theo dõi
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                            Chưa có
                          </span>
                        )}
                      </td>

                      {/* Dự kiến giao */}
                      <td>
                        {order.estimatedDeliveryDate ? (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#1e40af",
                              fontWeight: 600,
                            }}
                          >
                            {new Date(
                              order.estimatedDeliveryDate,
                            ).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        ) : order.shippedAt ? (
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            ~
                            {new Date(
                              new Date(order.shippedAt).getTime() +
                                (order.shippingMethod === "express" ? 3 : 7) *
                                  86400000,
                            ).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: "13px" }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td>
                        <div className="actions-group">
                          {/* Tạo vận đơn J&T tự động – chỉ khi processing */}
                          {canManual && (
                            <button
                              className="btn-confirm"
                              onClick={() => openGoShipModal(order)}
                              title="Tạo vận đơn J&T Express qua GoShip (lấy mã thật)"
                              style={{ padding: "8px 14px", fontSize: "13px" }}
                            >
                              Tạo vận đơn J&T
                            </button>
                          )}

                          {/* Nhập mã thủ công – chỉ khi processing */}
                          {canManual && (
                            <button
                              className="btn-manual"
                              onClick={() => openManualModal(order)}
                              title="Gán mã vận đơn thủ công → Shipped"
                            >
                              Nhập mã
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
                              Đã giao
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
            <h3 className="modal-title">Nhập Mã Vận Đơn Thủ Công</h3>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginTop: "-10px",
                marginBottom: "16px",
              }}
            >
              Đơn:{" "}
              <b>
                #
                {String(
                  selectedForManual?.orderId || selectedForManual?.id,
                ).substring(0, 8)}
              </b>
              &nbsp;·&nbsp; Trạng thái sẽ chuyển thành <b>Shipped</b>
            </p>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Hãng vận chuyển:</label>
                <select
                  value={manualForm.carrier}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, carrier: e.target.value })
                  }
                  required
                >
                  <option value="">-- Chọn hãng ship --</option>
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mã vận đơn (Tracking Number):</label>
                <input
                  type="text"
                  value={manualForm.trackingNumber}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      trackingNumber: e.target.value,
                    })
                  }
                  required
                  placeholder="VD: GHN123456789"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowManualModal(false)}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={isSubmittingManual}
                >
                  {isSubmittingManual ? "Đang lưu..." : "Xác Nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: GOSHIP J&T SHIPMENT CREATION ══ */}
      {showGoShipModal && goShipOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 className="modal-title">Tạo Vận Đơn J&T Express (GoShip)</h3>

            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginTop: "-10px",
                marginBottom: "16px",
              }}
            >
              Đơn:{" "}
              <b>
                #{String(goShipOrder.orderId || goShipOrder.id).substring(0, 8)}
              </b>
              &nbsp;·&nbsp;Giao đến:{" "}
              <b>{parseAddress(goShipOrder.shippingAddress).street || "N/A"}</b>
            </p>

            {goShipError && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                {goShipError}
              </div>
            )}

            {/* Step 1: Receiver address + Parcel info */}
            {goShipStep === 1 && (
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Địa chỉ người nhận (chọn từ GoShip)
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <div className="form-group">
                    <label>Tên người nhận:</label>
                    <input
                      type="text"
                      value={gsReceiverName}
                      onChange={(e) => setGsReceiverName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại:</label>
                    <input
                      type="text"
                      value={gsReceiverPhone}
                      onChange={(e) => setGsReceiverPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Địa chỉ (số nhà, đường):</label>
                    <input
                      type="text"
                      value={gsReceiverStreet}
                      onChange={(e) => setGsReceiverStreet(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Tỉnh/Thành phố: <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      value={gsSelectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                      }}
                    >
                      <option value="">-- Chọn tỉnh/thành --</option>
                      {gsCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      Quận/Huyện: <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      value={gsSelectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      disabled={!gsSelectedCity}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                      }}
                    >
                      <option value="">-- Chọn quận/huyện --</option>
                      {gsDistricts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      Phường/Xã: <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      value={gsSelectedWard}
                      onChange={(e) => setGsSelectedWard(e.target.value)}
                      disabled={!gsSelectedDistrict}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                      }}
                    >
                      <option value="">-- Chọn phường/xã --</option>
                      {gsWards.map((w) => (
                        <option key={w.id} value={String(w.id)}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Thông tin kiện hàng
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="form-group">
                    <label>Cân nặng (gram):</label>
                    <input
                      type="number"
                      value={goShipParcel.weight}
                      min={1}
                      onChange={(e) =>
                        setGoShipParcel({
                          ...goShipParcel,
                          weight: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>COD (VND):</label>
                    <input
                      type="number"
                      value={goShipParcel.cod}
                      min={0}
                      onChange={(e) =>
                        setGoShipParcel({
                          ...goShipParcel,
                          cod: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Dài (cm):</label>
                    <input
                      type="number"
                      value={goShipParcel.length}
                      min={1}
                      onChange={(e) =>
                        setGoShipParcel({
                          ...goShipParcel,
                          length: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Rộng (cm):</label>
                    <input
                      type="number"
                      value={goShipParcel.width}
                      min={1}
                      onChange={(e) =>
                        setGoShipParcel({
                          ...goShipParcel,
                          width: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Cao (cm):</label>
                    <input
                      type="number"
                      value={goShipParcel.height}
                      min={1}
                      onChange={(e) =>
                        setGoShipParcel({
                          ...goShipParcel,
                          height: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-actions" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowGoShipModal(false)}
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={handleGoShipGetRates}
                    disabled={goShipLoading}
                  >
                    {goShipLoading ? "Đang lấy giá..." : "Lấy giá cước J&T →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select rate */}
            {goShipStep === 2 && (
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Chọn giá cước J&T Express
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {goShipRates.map((rate) => {
                    const rateId = rate.id || rate.Id;
                    const isSelected = goShipSelectedRate === rateId;
                    return (
                      <label
                        key={rateId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          border: isSelected
                            ? "2px solid #2563eb"
                            : "2px solid #e5e7eb",
                          backgroundColor: isSelected ? "#eff6ff" : "#f9fafb",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="radio"
                          name="goshipRate"
                          value={rateId}
                          checked={isSelected}
                          onChange={() => setGoShipSelectedRate(rateId)}
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "#2563eb",
                          }}
                        />
                        {rate.carrier_logo || rate.carrierLogo ? (
                          <img
                            src={rate.carrier_logo || rate.carrierLogo}
                            alt=""
                            style={{
                              width: "40px",
                              height: "24px",
                              objectFit: "contain",
                            }}
                          />
                        ) : null}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                            {rate.carrier_name ||
                              rate.carrierName ||
                              "J&T Express"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {rate.service || rate.Service || "Standard"} ·{" "}
                            {rate.expected || rate.Expected || "3-5 ngày"}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "15px",
                            color: "#059669",
                          }}
                        >
                          {new Intl.NumberFormat("vi-VN").format(
                            rate.total_fee || rate.totalFee || 0,
                          )}
                          đ
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="modal-actions" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setGoShipStep(1)}
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={handleGoShipCreateShipment}
                    disabled={!goShipSelectedRate || goShipLoading}
                  >
                    {goShipLoading ? "Đang tạo..." : "Tạo vận đơn J&T →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Creating... */}
            {goShipStep === 3 && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                <p style={{ fontWeight: 600, color: "#6b7280" }}>
                  Đang tạo vận đơn J&T Express...
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  Vui lòng chờ, hệ thống đang liên hệ GoShip.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
