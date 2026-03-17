import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminOrders.css";

// =============================================================================
// HELPER: Bóc tách thông tin khách hàng từ shippingAddress
// CheckoutPage nhét theo format: "[Tên - SĐT - Email] Địa chỉ"
// =============================================================================
function parseShippingInfo(shippingAddress) {
  if (!shippingAddress)
    return { name: null, phone: null, email: null, address: shippingAddress };
  const matchNew = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\] (.*)$/);
  const matchError = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*?)] (.*)$/);
  const matchOld = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*)$/);
  if (matchNew)
    return {
      name: matchNew[1],
      phone: matchNew[2],
      email: matchNew[3].trim(),
      address: matchNew[4],
    };
  if (matchError)
    return {
      name: matchError[1],
      phone: matchError[2],
      email: matchError[3].trim(),
      address: matchError[4],
    };
  if (matchOld)
    return {
      name: matchOld[1],
      phone: matchOld[2],
      email: null,
      address: matchOld[3],
    };
  return { name: null, phone: null, email: null, address: shippingAddress };
}

// =============================================================================
// HELPER: Format số liệu đơn kính
// =============================================================================
function fmtRx(val) {
  if (val === null || val === undefined) return "—";
  const n = Number(val);
  if (n === 0) return "0.00";
  return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

// =============================================================================
// HELPER: Format phương thức thanh toán
// =============================================================================
function formatPaymentMethod(method) {
  if (method && method.toLowerCase() === "vnpay") {
    return { label: "VNPay", icon: "💳", color: "#1d4ed8", bg: "#eff6ff" };
  }
  return {
    label: "Tiền mặt (COD)",
    icon: "💵",
    color: "#15803d",
    bg: "#f0fdf4",
  };
}

// =============================================================================
// HELPER: Format trạng thái thanh toán
// =============================================================================
function formatPaymentStatus(status) {
  if (!status) return null;
  const map = {
    pending: { label: "Chờ thanh toán", color: "#d97706", bg: "#fef3c7" },
    processing: { label: "Đang xử lý", color: "#2563eb", bg: "#eff6ff" },
    completed: { label: "Đã thanh toán ✓", color: "#15803d", bg: "#f0fdf4" },
    failed: { label: "Thất bại", color: "#dc2626", bg: "#fee2e2" },
    cancelled: { label: "Đã huỷ", color: "#6b7280", bg: "#f3f4f6" },
    refunded: { label: "Đã hoàn tiền", color: "#7e22ce", bg: "#faf5ff" },
  };
  return (
    map[status.toLowerCase()] || {
      label: status,
      color: "#374151",
      bg: "#f3f4f6",
    }
  );
}

const thStyle = {
  padding: "5px 8px",
  textAlign: "center",
  fontWeight: "bold",
  color: "#78350f",
  border: "1px solid #fde68a",
};
const tdStyle = {
  padding: "5px 8px",
  textAlign: "center",
  border: "1px solid #fde68a",
};

// =============================================================================
// COMPONENT: PrescriptionCard (collapsible, lazy-fetch)
// =============================================================================
function PrescriptionCard({ prescription, prescriptionId, headers }) {
  const [rxData, setRxData] = useState(prescription || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);
    if (rxData) return;
    if (!prescriptionId) return;
    setIsLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/Prescriptions/${prescriptionId}`,
        { headers },
      );
      if (res.ok) {
        setRxData(await res.json());
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isExpanded, rxData, prescriptionId, headers]);

  if (!prescription && !prescriptionId) return null;

  return (
    <div
      style={{
        marginTop: "8px",
        border: "1px solid #fbbf24",
        borderRadius: "8px",
        backgroundColor: "#fffbeb",
        overflow: "hidden",
      }}
    >
      <button
        onClick={handleExpand}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "bold",
          color: "#92400e",
        }}
      >
        <span>📋 Đơn kính đính kèm</span>
        <span style={{ fontSize: "11px", color: "#b45309" }}>
          {isExpanded ? "▲ Thu gọn" : "▼ Xem chi tiết"}
        </span>
      </button>
      {isExpanded && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid #fde68a" }}>
          {isLoading && (
            <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
              ⏳ Đang tải...
            </p>
          )}
          {fetchError && (
            <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>
              ❌ Không thể tải đơn kính. Có thể đơn đã bị xóa.
            </p>
          )}
          {rxData && !isLoading && (
            <>
              {(rxData.doctorName || rxData.clinicName) && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#78350f",
                    margin: "0 0 8px 0",
                  }}
                >
                  <b>Bác sĩ:</b> {rxData.doctorName || "—"} &nbsp;|&nbsp;{" "}
                  <b>Phòng khám:</b> {rxData.clinicName || "—"}
                </p>
              )}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                  marginBottom: "6px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#fde68a" }}>
                    <th style={thStyle}>Mắt</th>
                    <th style={thStyle}>SPH (độ cầu)</th>
                    <th style={thStyle}>CYL (loạn)</th>
                    <th style={thStyle}>AXIS (trục)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#dc2626",
                      }}
                    >
                      Mắt Phải (OD)
                    </td>
                    <td style={tdStyle}>{fmtRx(rxData.sphereRight)}</td>
                    <td style={tdStyle}>{fmtRx(rxData.cylinderRight)}</td>
                    <td style={tdStyle}>{rxData.axisRight ?? "—"}°</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fef9c3" }}>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#2563eb",
                      }}
                    >
                      Mắt Trái (OS)
                    </td>
                    <td style={tdStyle}>{fmtRx(rxData.sphereLeft)}</td>
                    <td style={tdStyle}>{fmtRx(rxData.cylinderLeft)}</td>
                    <td style={tdStyle}>{rxData.axisLeft ?? "—"}°</td>
                  </tr>
                </tbody>
              </table>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  fontSize: "12px",
                  color: "#78350f",
                }}
              >
                {rxData.pupillaryDistance != null && (
                  <span>
                    <b>PD:</b> {rxData.pupillaryDistance} mm
                  </span>
                )}
                {rxData.expirationDate && (
                  <span>
                    <b>Hết hạn:</b>{" "}
                    {new Date(rxData.expirationDate).toLocaleDateString(
                      "vi-VN",
                    )}
                    {rxData.isExpired && (
                      <span
                        style={{
                          marginLeft: "6px",
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          fontSize: "11px",
                        }}
                      >
                        Đã hết hạn
                      </span>
                    )}
                  </span>
                )}
              </div>
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "#a16207",
                  fontStyle: "italic",
                  borderTop: "1px dashed #fde68a",
                  paddingTop: "6px",
                  marginBottom: 0,
                }}
              >
                Đây là dữ liệu số khách nhập khi đặt hàng. API hiện chưa hỗ trợ
                upload ảnh scan toa thuốc.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENT: PaymentInfoBlock
// =============================================================================
function PaymentInfoBlock({ paymentList }) {
  const COD = {
    label: "Tiền mặt (COD)",
    icon: "💵",
    color: "#15803d",
    bg: "#f0fdf4",
  };

  if (!paymentList || paymentList.length === 0) {
    return (
      <p style={{ margin: "4px 0", fontSize: "14px" }}>
        <b>Phương thức:</b>{" "}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: COD.bg,
            color: COD.color,
            padding: "2px 10px",
            borderRadius: "20px",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {COD.icon} {COD.label}
        </span>
      </p>
    );
  }

  const latest =
    paymentList.find((p) => p.paymentStatus === "completed") || paymentList[0];
  const isVNPay = latest.paymentMethod?.toLowerCase() === "vnpay";
  const method = isVNPay
    ? { label: "VNPay", icon: "💳", color: "#1d4ed8", bg: "#eff6ff" }
    : COD;
  const pStatus = formatPaymentStatus(latest.paymentStatus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {method && (
        <p style={{ margin: 0, fontSize: "14px" }}>
          <b>Phương thức:</b>{" "}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: method.bg,
              color: method.color,
              padding: "2px 10px",
              borderRadius: "20px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {method.icon} {method.label}
          </span>
        </p>
      )}
      {pStatus && (
        <p style={{ margin: 0, fontSize: "14px" }}>
          <b>Trạng thái TT:</b>{" "}
          <span
            style={{
              display: "inline-block",
              backgroundColor: pStatus.bg,
              color: pStatus.color,
              padding: "2px 10px",
              borderRadius: "20px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {pStatus.label}
          </span>
        </p>
      )}
      {latest.paidAt && (
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
          <b>Thanh toán lúc:</b>{" "}
          {new Date(latest.paidAt).toLocaleString("vi-VN")}
        </p>
      )}
      {paymentList.length > 1 && (
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            color: "#9ca3af",
            fontStyle: "italic",
          }}
        >
          ({paymentList.length} lần thanh toán được ghi nhận)
        </p>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENT: PreorderAmountCell
// =============================================================================
function PreorderAmountCell({ order, headers, formatUSD }) {
  const rawTotal = order.totalAmount || order.totalPrice || 0;
  const [amount, setAmount] = useState(rawTotal);

  useEffect(() => {
    if (rawTotal > 0) return;
    const id = order.id || order.preorderId;
    if (!id) return;
    let cancelled = false;
    fetch(`https://myspectra.runasp.net/api/Payments/preorder/${id}`, {
      headers,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list = Array.isArray(data) ? data : [data];
        const paid =
          list.find((p) => p.paymentStatus === "completed") || list[0];
        if (paid?.amount) setAmount(paid.amount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [order, rawTotal]);

  return (
    <span>
      {amount > 0 ? (
        formatUSD(amount)
      ) : (
        <span style={{ color: "#9ca3af" }}>—</span>
      )}
    </span>
  );
}

// =============================================================================
// MAIN COMPONENT: AdminOrders
// =============================================================================
export default function AdminOrders() {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [preorders, setPreorders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentList, setPaymentList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ---------------------------------------------------------------------------
  const fetchOrdersData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, preordersRes] = await Promise.all([
        fetch("https://myspectra.runasp.net/api/Orders?page=1&pageSize=100", {
          headers,
        }),
        fetch(
          "https://myspectra.runasp.net/api/Preorders?page=1&pageSize=100",
          { headers },
        ),
      ]);
      if (ordersRes.ok) {
        const d = await ordersRes.json();
        setOrders(d.items || d || []);
      }
      if (preordersRes.ok) {
        const d = await preordersRes.json();
        setPreorders(d.items || d || []);
      }
    } catch (err) {
      console.error("Lỗi mạng:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  // ---------------------------------------------------------------------------
  // handleViewDetails
  // ---------------------------------------------------------------------------
  const handleViewDetails = async (id, isPreorder) => {
    setIsModalOpen(true);
    setIsLoadingDetail(true);
    setSelectedOrder(null);
    setPaymentList([]);

    const orderEndpoint = isPreorder ? `Preorders/${id}` : `Orders/${id}`;
    const paymentEndpoint = isPreorder
      ? `Payments/preorder/${id}`
      : `Payments/order/${id}`;

    try {
      const [orderRes, paymentRes] = await Promise.all([
        fetch(`https://myspectra.runasp.net/api/${orderEndpoint}`, { headers }),
        fetch(`https://myspectra.runasp.net/api/${paymentEndpoint}`, {
          headers,
        }),
      ]);

      if (orderRes.ok) {
        setSelectedOrder({ ...(await orderRes.json()), isPreorder });
      } else {
        alert("Không thể tải chi tiết đơn hàng!");
        setIsModalOpen(false);
        return;
      }

      if (paymentRes.ok) {
        const pData = await paymentRes.json();
        setPaymentList(Array.isArray(pData) ? pData : pData ? [pData] : []);
      }
    } catch {
      alert("Lỗi kết nối khi tải chi tiết.");
      setIsModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ---------------------------------------------------------------------------
  // handleUpdateStatus
  // ---------------------------------------------------------------------------
  const handleUpdateStatus = async (id, isPreorder, newStatus) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn đổi trạng thái thành "${newStatus}"?`,
      )
    )
      return;

    if (isPreorder && newStatus === "converted") {
      try {
        // Bước 1: Lấy địa chỉ — ưu tiên từ list state, fallback fetch detail
        let addr =
          preorders.find((p) => (p.id || p.preorderId) === id)
            ?.shippingAddress || "";

        if (!addr) {
          const detailRes = await fetch(
            `https://myspectra.runasp.net/api/Preorders/${id}`,
            { headers },
          );
          if (detailRes.ok) {
            const detail = await detailRes.json();
            addr = detail?.shippingAddress || detail?.address || "";
          }
        }

        if (!addr) {
          alert(
            "Không tìm thấy địa chỉ giao hàng trong đơn pre-order. Vui lòng kiểm tra lại.",
          );
          return;
        }

        if (
          !window.confirm(
            `Xác nhận chuyển sang Processing?\nĐịa chỉ giao hàng: ${addr}`,
          )
        )
          return;

        // Bước 2: Convert preorder → tạo Order mới (status: pending)
        const convertRes = await fetch(
          `https://myspectra.runasp.net/api/Preorders/${id}/convert`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ shippingAddress: addr }),
          },
        );

        if (!convertRes.ok) {
          const err = await convertRes.json();
          alert(
            "Lỗi chuyển đổi: " +
              (err.message ||
                "Kiểm tra lại trạng thái đơn (cần Paid hoặc Confirmed)"),
          );
          return;
        }

        const newOrder = await convertRes.json();

        // Bước 3: Đổi sang processing để hiện trong ShippingPage
        // (Convert trả về status "confirmed", ShippingPage chỉ hiện "processing")
        const newOrderId = newOrder.orderId || newOrder.id;
        if (newOrderId) {
          await fetch(
            `https://myspectra.runasp.net/api/Orders/${newOrderId}/status`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({ status: "processing" }),
            },
          );
        }

        // Log để debug — xác nhận convertedFromPreorderId khớp với preorder gốc
        console.log(
          "Converted order:",
          newOrderId,
          "← from preorder:",
          newOrder.convertedFromPreorderId,
        );

        alert(
          "Chuyển đổi thành công! Đơn hàng đã được tạo và chuyển sang Processing → có thể thấy trong Quản lý Vận chuyển.",
        );
        fetchOrdersData();
        if (isModalOpen) setIsModalOpen(false);
      } catch {
        alert("Lỗi mạng!");
      }
      return;
    }

    const endpoint = isPreorder
      ? `Preorders/${id}/status`
      : `Orders/${id}/status`;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/${endpoint}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        alert("Cập nhật trạng thái thành công!");
        fetchOrdersData();
        if (
          selectedOrder &&
          (selectedOrder.id ||
            selectedOrder.orderId ||
            selectedOrder.preorderId) === id
        )
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      } else {
        const err = await res.json();
        alert("Lỗi cập nhật: " + (err.message || res.status));
      }
    } catch {
      alert("Lỗi mạng!");
    }
  };

  // ---------------------------------------------------------------------------
  // getStatusBadge — 'converted' hiển thị badge "Processing"
  // ---------------------------------------------------------------------------
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending")
      return <span className="status-badge status-pending">Pending</span>;
    if (s === "confirmed")
      return <span className="status-badge status-confirmed">Confirmed</span>;
    if (s === "paid")
      return <span className="status-badge status-paid">Paid</span>;
    if (s === "processing")
      return <span className="status-badge status-processing">Processing</span>;
    if (s === "converted")
      return <span className="status-badge status-processing">Processing</span>;
    if (s === "shipped")
      return <span className="status-badge status-shipped">Shipped</span>;
    if (s === "delivered")
      return <span className="status-badge status-delivered">Delivered</span>;
    if (s === "cancelled")
      return <span className="status-badge status-cancelled">Cancelled</span>;
    return (
      <span
        className="status-badge"
        style={{ background: "#eee", color: "#333" }}
      >
        {status || "Chưa rõ"}
      </span>
    );
  };

  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);
  const displayList = activeTab === "orders" ? orders : preorders;

  // ---------------------------------------------------------------------------
  // RENDER MODAL BODY
  // ---------------------------------------------------------------------------
  const renderModalBody = () => {
    if (isLoadingDetail)
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          ⏳ Đang tải thông tin chi tiết...
        </div>
      );
    if (!selectedOrder)
      return (
        <div style={{ textAlign: "center", color: "red" }}>
          Không thể tải thông tin.
        </div>
      );

    let displayName, displayPhone, displayEmail, displayAddress;
    if (selectedOrder.isPreorder) {
      displayName =
        selectedOrder.receiverName ||
        selectedOrder.customerName ||
        selectedOrder.user?.fullName ||
        "N/A";
      displayPhone =
        selectedOrder.phoneNumber ||
        selectedOrder.phone ||
        selectedOrder.user?.phone ||
        "N/A";
      displayEmail = selectedOrder.email || selectedOrder.user?.email || null;
      displayAddress =
        selectedOrder.shippingAddress || selectedOrder.address || "N/A";
    } else {
      const parsed = parseShippingInfo(selectedOrder.shippingAddress);
      displayName = parsed.name || selectedOrder.user?.fullName || "N/A";
      displayPhone = parsed.phone || selectedOrder.user?.phone || "N/A";
      displayEmail = parsed.email || selectedOrder.user?.email || null;
      displayAddress = parsed.address || "N/A";
    }

    const itemsList = selectedOrder.isPreorder
      ? selectedOrder.preorderItems ||
        selectedOrder.items ||
        selectedOrder.orderItems ||
        []
      : selectedOrder.orderItems ||
        selectedOrder.items ||
        selectedOrder.orderDetails ||
        [];

    return (
      <>
        <div className="info-grid">
          <div className="info-card">
            <h4>Thông tin khách hàng</h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Họ Tên:</b> {displayName}
            </p>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>SĐT:</b> {displayPhone}
            </p>
            {displayEmail && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Email:</b> {displayEmail}
              </p>
            )}
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Địa chỉ:</b> {displayAddress}
            </p>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Ghi chú:</b> {selectedOrder.note || "Không có"}
            </p>
          </div>

          <div className="info-card">
            <h4>Thông tin đơn</h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Ngày đặt:</b>{" "}
              {new Date(
                selectedOrder.orderDate || selectedOrder.createdAt,
              ).toLocaleString("vi-VN")}
            </p>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Trạng thái đơn:</b> {getStatusBadge(selectedOrder.status)}
            </p>
            {selectedOrder.isPreorder && selectedOrder.expectedDate && (
              <p
                style={{ margin: "6px 0", fontSize: "14px", color: "#2563eb" }}
              >
                <b>Ngày mong muốn:</b>{" "}
                {new Date(selectedOrder.expectedDate).toLocaleString("vi-VN")}
              </p>
            )}
            <div
              style={{
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#374151",
                }}
              >
                💰 Thanh toán:
              </p>
              <PaymentInfoBlock paymentList={paymentList} />
            </div>
          </div>
        </div>

        <h4>Sản phẩm đã mua</h4>
        {itemsList.length === 0 ? (
          <p
            style={{
              color: "#9ca3af",
              fontStyle: "italic",
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            Không có thông tin sản phẩm.
          </p>
        ) : (
          <div className="item-list">
            {itemsList.map((item, idx) => {
              const frameName =
                item.frame?.frameName ||
                item.frameName ||
                item.productName ||
                "Gọng kính";
              const unitPrice =
                item.orderPrice ||
                item.preorderPrice ||
                item.campaignPrice ||
                item.unitPrice ||
                item.price ||
                0;
              const lensType =
                item.lensType?.lensSpecification || item.lensTypeName || null;
              const lensFeatureObj = item.lensFeature || item.feature;
              const lensFeature =
                lensFeatureObj?.featureSpecification ||
                item.lensFeatureName ||
                null;
              const requiresRx = item.lensType?.requiresPrescription || false;
              const embeddedRx = item.prescription || null;
              const prescriptionId =
                item.prescriptionId || embeddedRx?.prescriptionId || null;

              return (
                <div
                  key={item.orderItemId || item.preorderItemId || idx}
                  className="item-row"
                >
                  <div className="item-details">
                    <p className="item-name">{frameName}</p>
                    <p className="item-meta">
                      SL: <b>{item.quantity || 1}</b> | Giá:{" "}
                      <b>{formatUSD(unitPrice)}</b>
                    </p>
                    {(lensType || lensFeature) && (
                      <p
                        className="item-meta"
                        style={{ color: "#4338ca", marginTop: "4px" }}
                      >
                        Tròng: {lensType || "Không chọn"}
                        {lensFeature ? ` – ${lensFeature}` : ""}
                        {requiresRx && (
                          <span
                            style={{
                              marginLeft: "8px",
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                            }}
                          >
                            Cần đơn kính
                          </span>
                        )}
                      </p>
                    )}
                    {(prescriptionId || embeddedRx) && (
                      <PrescriptionCard
                        prescription={embeddedRx}
                        prescriptionId={prescriptionId}
                        headers={headers}
                      />
                    )}
                    {requiresRx && !prescriptionId && !embeddedRx && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#dc2626",
                          marginTop: "6px",
                          fontStyle: "italic",
                        }}
                      >
                        Tròng này yêu cầu đơn kính nhưng không tìm thấy dữ liệu
                        đơn kính.
                      </p>
                    )}
                  </div>
                  <div className="item-price">
                    {formatUSD(unitPrice * (item.quantity || 1))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER MAIN
  // ---------------------------------------------------------------------------
  return (
    <div className="admin-orders-container">
      <div className="admin-orders-header">
        <h2 className="admin-orders-title">Quản Lý Đơn Hàng</h2>
        <button className="btn-view" onClick={fetchOrdersData}>
          🔄 Làm mới
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Đơn Hàng Thường ({orders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "preorders" ? "active" : ""}`}
          onClick={() => setActiveTab("preorders")}
        >
          Đơn Đặt Trước (Pre-order) ({preorders.length})
        </button>
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
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  ⏳ Đang tải dữ liệu...
                </td>
              </tr>
            ) : displayList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Chưa có đơn hàng nào trong mục này.
                </td>
              </tr>
            ) : (
              displayList.map((order, index) => {
                const id = order.id || order.orderId || order.preorderId;
                const isPreorder = activeTab === "preorders";
                const shippingInfo = parseShippingInfo(order.shippingAddress);
                const customerName =
                  order.user?.fullName ||
                  order.receiverName ||
                  order.customerName ||
                  shippingInfo.name ||
                  "Khách Vãng Lai";
                const customerPhone =
                  order.user?.phone ||
                  order.phoneNumber ||
                  order.phone ||
                  shippingInfo.phone ||
                  "—";

                return (
                  <tr key={index}>
                    <td className="col-id">#{id}</td>
                    <td>
                      <strong>{customerName}</strong>
                      <br />
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {customerPhone}
                      </span>
                    </td>
                    <td className="col-date">
                      {new Date(
                        order.orderDate || order.createdAt,
                      ).toLocaleString("vi-VN")}
                    </td>
                    <td className="col-price">
                      {isPreorder ? (
                        <PreorderAmountCell
                          order={order}
                          headers={headers}
                          formatUSD={formatUSD}
                        />
                      ) : (
                        formatUSD(order.totalAmount || order.totalPrice)
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                      >
                        {getStatusBadge(order.status)}
                        <select
                          className="status-select"
                          value={order.status?.toLowerCase()}
                          onChange={(e) =>
                            handleUpdateStatus(id, isPreorder, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Đổi trạng thái
                          </option>
                          {isPreorder ? (
                            <>
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="paid">Paid</option>
                              <option value="converted">Processing</option>
                              <option value="cancelled">Cancelled</option>
                            </>
                          ) : (
                            <>
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="cancelled">Cancelled</option>
                            </>
                          )}
                        </select>
                      </div>
                    </td>
                    <td className="col-action">
                      <button
                        onClick={() => handleViewDetails(id, isPreorder)}
                        className="btn-view"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && (
        <div
          className="order-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="order-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-modal-header">
              <h3>
                {selectedOrder?.isPreorder
                  ? "Chi Tiết Pre-Order"
                  : "Chi Tiết Đơn Hàng"}{" "}
                {selectedOrder &&
                  `#${selectedOrder.id || selectedOrder.orderId || selectedOrder.preorderId}`}
              </h3>
              <button
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="order-modal-body">{renderModalBody()}</div>
            <div className="modal-footer">
              <span>Tổng hóa đơn:</span>
              <span className="total-price">
                {selectedOrder
                  ? (() => {
                      const t =
                        selectedOrder.totalAmount || selectedOrder.totalPrice;
                      if (t) return formatUSD(t);
                      const iList = selectedOrder.isPreorder
                        ? selectedOrder.preorderItems ||
                          selectedOrder.items ||
                          selectedOrder.orderItems ||
                          []
                        : selectedOrder.orderItems ||
                          selectedOrder.items ||
                          selectedOrder.orderDetails ||
                          [];
                      const calc = iList.reduce((s, it) => {
                        const p =
                          it.orderPrice ||
                          it.preorderPrice ||
                          it.campaignPrice ||
                          it.unitPrice ||
                          it.price ||
                          0;
                        return s + p * (it.quantity || 1);
                      }, 0);
                      return formatUSD(calc);
                    })()
                  : "$0.00"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
