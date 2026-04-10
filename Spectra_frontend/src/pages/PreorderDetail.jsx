import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useExchangeRate } from "../api";
import DeliveryMap from "../components/DeliveryMap";

export default function PreorderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [order, setOrder] = useState(null);
  const [linkedOrder, setLinkedOrder] = useState(null); // Order liên kết nếu đã convert
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [showNotReceivedInfo, setShowNotReceivedInfo] = useState(false);
  const { rate: exchangeRate } = useExchangeRate();

  // ⚡ Tạo hàm format riêng để chỉ hiển thị USD
  const formatCurrency = (amount) => {
    let val = Number(amount) || 0;
    // Nếu số tiền > 10.000, khả năng cao là VND -> chia tỷ giá để ra USD
    if (val > 10000) {
      val = val / (exchangeRate || 25400);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  useEffect(() => {
    const token =
      user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `https://myspectra.runasp.net/api/Preorders/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setOrder(data);

          // FIX: Nếu preorder đã convert → fetch Orders/my để lấy status thật của order liên kết
          if (data.status?.toLowerCase() === "converted") {
            try {
              const ordersRes = await fetch(
                "https://myspectra.runasp.net/api/OrdersV2/my?page=1&pageSize=100",
                { headers: { Authorization: `Bearer ${token}` } },
              );
              if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                const list = ordersData.items || ordersData || [];
                const linked = list.find(
                  (o) =>
                    o.convertedFromPreorderId === (data.id || data.preorderId),
                );
                if (linked) {
                  setLinkedOrder(linked);
                  // Check delivery confirmation from backend or localStorage
                  if (
                    linked.deliveryConfirmedAt ||
                    localStorage.getItem(
                      `delivery_confirmed_${linked.orderId}`,
                    ) === "true"
                  ) {
                    setDeliveryConfirmed(true);
                  }
                }
              }
            } catch {
              // Không cần xử lý lỗi, chỉ là fallback hiển thị
            }
          }
        } else if (res.status === 404) {
          setError("Pre-order not found.");
        } else {
          setError(`Error ${res.status} while loading details.`);
        }
      } catch {
        setError("Connection error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, user, navigate]);

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
        ⏳ Loading pre-order details...
      </div>
    );

  if (error || !order)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>
          {error || "Pre-order not found"}
        </h2>
        <Link to="/orders" style={{ color: "#3b82f6" }}>
          ← Back to order history
        </Link>
      </div>
    );

  const formatDate = (d) => (d ? new Date(d).toLocaleString("en-US") : "—");

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    const map = {
      pending: { text: "Pending", color: "#d97706", bg: "#fef3c7" },
      confirmed: { text: "Confirmed", color: "#059669", bg: "#d1fae5" },
      processing: { text: "Processing", color: "#4338ca", bg: "#ede9fe" },
      // FIX: converted hiển thị "Đang xử lý" (linked order đang processing)
      converted: { text: "Processing", color: "#4338ca", bg: "#ede9fe" },
      awaiting_payment: {
        text: "Awaiting Payment",
        color: "#f97316",
        bg: "#fff7ed",
      },
      awaitingpayment: {
        text: "Awaiting Payment",
        color: "#f97316",
        bg: "#fff7ed",
      },
      paid: { text: "Paid", color: "#059669", bg: "#d1fae5" },
      shipped: { text: "Delivering", color: "#7e22ce", bg: "#f3e8ff" },
      delivered: { text: "Completed", color: "#059669", bg: "#d1fae5" },
      completed: { text: "Completed", color: "#059669", bg: "#d1fae5" },
      cancelled: { text: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
    };
    const s2 = map[s] || {
      text: status || "Unknown",
      color: "#6b7280",
      bg: "#f3f4f6",
    };
    return (
      <span
        style={{
          fontWeight: "bold",
          color: s2.color,
          backgroundColor: s2.bg,
          padding: "4px 14px",
          borderRadius: "20px",
          fontSize: "14px",
        }}
      >
        {s2.text}
      </span>
    );
  };

  // FIX: Dùng status của linked order nếu preorder đã convert
  const displayStatus = linkedOrder ? linkedOrder.status : order.status;

  const isDelivered = (displayStatus || "").toLowerCase() === "delivered";
  const deliveryOrderId = linkedOrder?.orderId;

  const handleConfirmDelivery = async () => {
    if (!deliveryOrderId) return;
    const token =
      user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/OrdersV2/${deliveryOrderId}/confirm-delivery`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        localStorage.setItem(`delivery_confirmed_${deliveryOrderId}`, "true");
        setDeliveryConfirmed(true);
        setShowNotReceivedInfo(false);
      }
    } catch {
      localStorage.setItem(`delivery_confirmed_${deliveryOrderId}`, "true");
      setDeliveryConfirmed(true);
    }
  };

  // ===== BÓC TÁCH THÔNG TIN NGƯỜI NHẬN =====
  let receiverName = order.user?.fullName || "—";
  let receiverPhone = order.user?.phone || "—";
  let receiverEmail = order.user?.email || "—";
  let shippingAddress =
    order.shippingAddress ||
    order.deliveryAddress ||
    order.address ||
    order.user?.address ||
    "—";

  const matchNew = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\] (.*)$/);
  const matchError = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*?)] (.*)$/);
  const matchOld = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*)$/);

  if (matchNew) {
    if (receiverName === "—") receiverName = matchNew[1];
    if (receiverPhone === "—") receiverPhone = matchNew[2];
    if (receiverEmail === "—") receiverEmail = matchNew[3];
    shippingAddress = matchNew[4];
  } else if (matchError) {
    if (receiverName === "—") receiverName = matchError[1];
    if (receiverPhone === "—") receiverPhone = matchError[2];
    if (receiverEmail === "—") receiverEmail = matchError[3].trim();
    shippingAddress = matchError[4];
  } else if (matchOld) {
    if (receiverName === "—") receiverName = matchOld[1];
    if (receiverPhone === "—") receiverPhone = matchOld[2];
    shippingAddress = matchOld[3];
  }

  const orderNote = order.note || "None";

  // ===== DANH SÁCH SẢN PHẨM =====
  const itemsList = (
    order.preorderItems ||
    order.orderItems ||
    order.items ||
    []
  ).filter(Boolean);

  const totalAmount =
    order.totalAmount ||
    order.totalPrice ||
    itemsList.reduce(
      (sum, item) =>
        sum +
        (item.orderPrice || item.preorderPrice || item.unitPrice || 0) *
        (item.quantity || 1),
      0,
    );

  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <Link
        to="/orders"
        style={{
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "14px",
          display: "inline-block",
          marginBottom: "20px",
        }}
      >
        ← Order History
      </Link>

      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {/* ===== HEADER ===== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #dbeafe",
            paddingBottom: "18px",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <span
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                fontSize: "11px",
                fontWeight: "bold",
                padding: "3px 10px",
                borderRadius: "20px",
                letterSpacing: "0.5px",
              }}
            >
              🚀 PRE-ORDER
            </span>
            <h2 style={{ margin: "8px 0 0", fontSize: "22px" }}>
              Pre-order Details
            </h2>
            <p
              style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}
            >
              Code:{" "}
              <b style={{ color: "#1e40af" }}>
                #{order.preorderId || order.id}
              </b>
            </p>
          </div>
          {/* FIX: dùng displayStatus thay vì order.status */}
          {getStatusBadge(displayStatus)}
        </div>

        {/* ── XÁC NHẬN NHẬN HÀNG — hiển thị khi đơn delivered và chưa confirm ── */}
        {isDelivered && !deliveryConfirmed && deliveryOrderId && (
          <div
            style={{
              backgroundColor: "#eff6ff",
              border: "2px solid #3b82f6",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: "0 0 14px",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#1e40af",
              }}
            >
              📦 Have you received your order?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleConfirmDelivery}
                style={{
                  padding: "10px 28px",
                  backgroundColor: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ✅ Received
              </button>
              <button
                onClick={() => setShowNotReceivedInfo(true)}
                style={{
                  padding: "10px 28px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ❌ Not Received
              </button>
            </div>

            {showNotReceivedInfo && (
              <div
                style={{
                  marginTop: "16px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: "#991b1b" }}>
                  If you haven't received your package, please contact support:
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#dc2626",
                  }}
                >
                  📞 1900-0091
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "#78716c",
                  }}
                >
                  Support hours: 8:00 AM – 9:00 PM daily
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===== 2 CỘT THÔNG TIN ===== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Thông tin đơn đặt trước */}
          <div
            style={{
              backgroundColor: "#eff6ff",
              padding: "18px",
              borderRadius: "10px",
              border: "1px solid #bfdbfe",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#1e40af",
                fontSize: "15px",
                borderBottom: "1px solid #bfdbfe",
                paddingBottom: "8px",
              }}
            >
              Order Information
            </h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Order Date:</b> {formatDate(order.createdAt || order.orderDate)}
            </p>
            {order.expectedDate && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Est. Delivery:</b> {formatDate(order.expectedDate)}
              </p>
            )}
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Payment:</b> VNPay (100% Upfront)
            </p>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Notes:</b> {orderNote}
            </p>
          </div>

          {/* Thông tin giao hàng */}
          <div
            style={{
              backgroundColor: "#f0fdf4",
              padding: "18px",
              borderRadius: "10px",
              border: "1px solid #bbf7d0",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#374151",
                fontSize: "15px",
                borderBottom: "1px solid #bbf7d0",
                paddingBottom: "8px",
              }}
            >
              Shipping Information
            </h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Receiver:</b> {receiverName}
            </p>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Phone:</b> {receiverPhone}
            </p>
            {receiverEmail !== "—" && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Email:</b> {receiverEmail}
              </p>
            )}
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Address:</b> {shippingAddress}
            </p>
          </div>
        </div>

        {/* ===== LO TRINH DON HANG — Tracking Timeline (only when converted with linked order) ===== */}
        {(() => {
          if (!linkedOrder) return null;
          const status = (linkedOrder.status || "").toLowerCase();
          const isCancelled = status === "cancelled";
          if (isCancelled) return null;

          const trackingNumber = linkedOrder.trackingNumber || null;
          const shippingCarrier = linkedOrder.shippingCarrier || null;
          const hasTracking = !!trackingNumber;

          const getCarrierTrackingUrl = (carrier, tracking) => {
            if (!carrier || !tracking) return null;
            const c = carrier.toLowerCase();
            if (c.includes("giao hàng nhanh") || c.includes("ghn"))
              return `https://donhang.ghn.vn/?order_code=${encodeURIComponent(tracking)}`;
            if (c.includes("tiết kiệm") || c.includes("ghtk"))
              return `https://i.ghtk.vn/${encodeURIComponent(tracking)}`;
            if (c.includes("j&t") || c.includes("jt"))
              return `https://jtexpress.vn/vi/tracking?type=track&billcode=${encodeURIComponent(tracking)}`;
            if (c.includes("vnpost") || c.includes("vn post"))
              return `https://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=${encodeURIComponent(tracking)}`;
            return null;
          };

          const statusOrder = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
          ];
          const statusIdx = statusOrder.indexOf(status);

          const createdAt = linkedOrder.createdAt
            ? new Date(linkedOrder.createdAt)
            : order.createdAt
              ? new Date(order.createdAt)
              : null;
          const shipped = linkedOrder.shippedAt
            ? new Date(linkedOrder.shippedAt)
            : null;
          const delivered = linkedOrder.deliveredAt || linkedOrder.arrivalDate;
          const deliveredDate = delivered ? new Date(delivered) : null;
          const confirmedAt = linkedOrder.deliveryConfirmedAt
            ? new Date(linkedOrder.deliveryConfirmedAt)
            : null;
          const estimated = linkedOrder.estimatedDeliveryDate
            ? new Date(linkedOrder.estimatedDeliveryDate)
            : null;

          const now = new Date();
          let inTransitTime = null;
          let outForDeliveryTime = null;

          if (shipped) {
            const endRef =
              deliveredDate ||
              estimated ||
              new Date(shipped.getTime() + 7 * 86400000);
            const window = endRef.getTime() - shipped.getTime();
            inTransitTime = new Date(shipped.getTime() + window * 0.3);
            outForDeliveryTime = new Date(shipped.getTime() + window * 0.75);
          }

          const steps = [
            {
              label: "Order Placed",
              desc: "Pre-order has been successfully converted to order",
              time: createdAt,
              done: statusIdx >= 0,
              active: statusIdx === 0,
            },
            {
              label: "Confirmed",
              desc: "Store has confirmed your order",
              time: createdAt
                ? new Date(createdAt.getTime() + 2 * 3600000)
                : null,
              done: statusIdx >= 1,
              active: statusIdx === 1,
            },
            {
              label: "Preparing Items",
              desc: "Items are being packed and prepared for shipping",
              time: null,
              done: statusIdx >= 2,
              active: statusIdx === 2,
            },
            {
              label: shipped
                ? `Handed over to ${shippingCarrier || "carrier"}`
                : "Waiting for carrier pickup",
              desc: hasTracking
                ? `Tracking number: ${trackingNumber}`
                : "Order will be handed over to the shipping provider",
              time: shipped,
              done: statusIdx >= 3,
              active:
                statusIdx === 3 && (!inTransitTime || now < inTransitTime),
            },
            {
              label: "In Transit",
              desc: "Package is on the way to your address",
              time:
                inTransitTime && now >= inTransitTime ? inTransitTime : null,
              done:
                statusIdx >= 4 ||
                (statusIdx >= 3 && inTransitTime && now >= inTransitTime),
              active:
                statusIdx === 3 &&
                inTransitTime &&
                now >= inTransitTime &&
                (!outForDeliveryTime || now < outForDeliveryTime),
            },
            {
              label: "Out for Delivery",
              desc: "Shipper is delivering the package to you",
              time:
                outForDeliveryTime && now >= outForDeliveryTime
                  ? outForDeliveryTime
                  : null,
              done:
                statusIdx >= 4 ||
                (statusIdx >= 3 &&
                  outForDeliveryTime &&
                  now >= outForDeliveryTime),
              active:
                statusIdx === 3 &&
                outForDeliveryTime &&
                now >= outForDeliveryTime,
            },
            {
              label: "Delivered",
              desc: confirmedAt
                ? "Receiver has confirmed delivery"
                : "Package has been successfully delivered",
              time: deliveredDate,
              done: statusIdx >= 4,
              active: statusIdx === 4 && !confirmedAt,
            },
          ];

          if (confirmedAt || statusIdx >= 4) {
            steps.push({
              label: "Delivery Confirmed",
              desc: "You have confirmed receiving the package",
              time: confirmedAt,
              done: !!confirmedAt,
              active: false,
            });
          }

          const trackingUrl = getCarrierTrackingUrl(
            shippingCarrier,
            trackingNumber,
          );

          const fmtTime = (d) =>
            d
              ? new Date(d).toLocaleString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
              : null;

          return (
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "17px", color: "#1e293b" }}>
                  Delivery Timeline
                </h4>
                {estimated && statusIdx < 4 && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#92400e",
                      backgroundColor: "#fefce8",
                      border: "1px solid #fde68a",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontWeight: 600,
                    }}
                  >
                    Expected:{" "}
                    {new Date(estimated).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Carrier tracking link */}
              {hasTracking && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                    padding: "12px 16px",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    {shippingCarrier && (
                      <span style={{ fontSize: "14px", color: "#1e3a8a" }}>
                        <b>{shippingCarrier}</b>
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "14px",
                        fontWeight: "bold",
                        backgroundColor: "#dbeafe",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        color: "#1e40af",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {trackingNumber}
                    </span>
                  </div>
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "#fff",
                        backgroundColor: "#2563eb",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Track on {shippingCarrier || "website"}
                    </a>
                  )}
                </div>
              )}

              {/* Delivery Map — live tracking */}
              {hasTracking && statusIdx >= 3 && (
                <DeliveryMap
                  customerAddress={shippingAddress}
                  shippedAt={linkedOrder.shippedAt}
                  estimatedDate={linkedOrder.estimatedDeliveryDate}
                  deliveredAt={
                    linkedOrder.deliveredAt || linkedOrder.arrivalDate
                  }
                  carrier={shippingCarrier}
                  status={linkedOrder.status}
                />
              )}

              {/* Timeline stepper */}
              <div style={{ position: "relative", paddingLeft: "36px" }}>
                {steps.map((step, i) => {
                  const isLast = i === steps.length - 1;
                  const dotColor = step.done
                    ? "#059669"
                    : step.active
                      ? "#2563eb"
                      : "#d1d5db";
                  const lineColor =
                    step.done && !isLast ? "#059669" : "#e5e7eb";

                  return (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        paddingBottom: isLast ? 0 : "24px",
                      }}
                    >
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            left: "-24px",
                            top: "20px",
                            width: "3px",
                            height: "calc(100% - 8px)",
                            backgroundColor: lineColor,
                            borderRadius: "2px",
                          }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          left: "-32px",
                          top: "2px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          border: `3px solid ${step.active ? "#93c5fd" : dotColor}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: step.active
                            ? "0 0 0 4px rgba(59,130,246,0.2)"
                            : "none",
                          animation: step.active ? "pulse 2s infinite" : "none",
                        }}
                      />
                      <div style={{ minHeight: "32px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "bold",
                              fontSize: "14px",
                              color: step.done
                                ? "#065f46"
                                : step.active
                                  ? "#1e40af"
                                  : "#9ca3af",
                            }}
                          >
                            {step.label}
                          </span>
                          {step.time && (step.done || step.active) && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginLeft: "auto",
                              }}
                            >
                              {fmtTime(step.time)}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "13px",
                            color:
                              step.done || step.active ? "#6b7280" : "#d1d5db",
                          }}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shipping method info */}
              {linkedOrder.shippingMethod && (
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    gap: "16px",
                    fontSize: "13px",
                    color: "#64748b",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    {linkedOrder.shippingMethod === "express"
                      ? "Express Delivery"
                      : "Standard Delivery"}
                  </span>
                  {linkedOrder.shippingFee !== null &&
                    linkedOrder.shippingFee !== undefined && (
                      <span>
                        Shipping Fee:{" "}
                        {linkedOrder.shippingFee === 0
                          ? "Free"
                          : `$${linkedOrder.shippingFee}`}
                      </span>
                    )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ===== DANH SÁCH SẢN PHẨM ===== */}
        <h3
          style={{
            borderBottom: "1px solid #dbeafe",
            paddingBottom: "10px",
            marginBottom: "16px",
            fontSize: "17px",
            color: "#1e40af",
          }}
        >
          Pre-order Items
        </h3>

        {itemsList.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontStyle: "italic",
              padding: "20px 0",
            }}
          >
            No product information found.
          </p>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {itemsList.map((item, index) => {
              const frameName = item.frame?.frameName || "Eyeglass frame";
              const frameColor =
                item.selectedColor || item.frame?.color || null;
              const qty = item.quantity || 1;
              const unitPrice =
                item.orderPrice || item.preorderPrice || item.unitPrice || 0;

              const brand =
                (typeof item.frame?.brand === "string"
                  ? item.frame.brand
                  : item.frame?.brand?.brandName) || null;

              const lensType = item.lensType?.lensSpecification || null;
              const lensFeatureObj = item.lensFeature || item.feature;
              const lensFeature = lensFeatureObj?.featureSpecification || null;
              const prescriptionUrl = item.prescription?.imageUrl || null;
              const prescription = item.prescription || null;

              return (
                <div
                  key={item.preorderItemId || item.orderItemId || index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px 0",
                    borderBottom: "1px dashed #e0e7ff",
                    gap: "10px",
                  }}
                >
                  {/* HÀNG 1: TÊN GỌNG + MÀU + SỐ LƯỢNG + ĐƠN GIÁ */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontWeight: "bold",
                          fontSize: "16px",
                        }}
                      >
                        {frameName}
                        {frameColor && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              fontWeight: "normal",
                            }}
                          >
                            {" "}
                            - Color: {frameColor}
                          </span>
                        )}
                      </p>
                      {brand && (
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          Brand: {brand}
                        </p>
                      )}
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "13px",
                          color: "#374151",
                        }}
                      >
                        Quantity: <b>x{qty}</b>
                      </p>
                    </div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "15px",
                        color: "#1e40af",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(unitPrice)}
                    </div>
                  </div>

                  {/* HÀNG 2: THÔNG TIN TRÒNG KÍNH */}
                  {(lensType || lensFeature) && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        backgroundColor: "#ede9fe",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #ddd6fe",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#4338ca",
                            fontWeight: "500",
                          }}
                        >
                          🔭 Lens type: {lensType || "None"}
                          {lensFeature ? ` — ${lensFeature}` : ""}
                        </p>
                        {prescriptionUrl && (
                          <a
                            href={prescriptionUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: "6px",
                              fontSize: "13px",
                              color: "#b91c1c",
                              fontWeight: "bold",
                              textDecoration: "underline",
                            }}
                          >
                            👁️ View Prescription
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription details */}
                  {prescription &&
                    (prescription.sphereLeft != null ||
                      prescription.sphereRight != null ||
                      prescription.pupillaryDistance != null) && (
                      <div
                        style={{
                          backgroundColor: "#faf5ff",
                          padding: "12px 14px",
                          borderRadius: "6px",
                          border: "1px solid #e9d5ff",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#7c3aed",
                          }}
                        >
                          Prescription Details
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "4px 16px",
                            fontSize: "13px",
                            color: "#374151",
                          }}
                        >
                          <div>
                            <b>Right Eye (OD):</b>
                          </div>
                          <div>
                            <b>Left Eye (OS):</b>
                          </div>
                          <div>
                            SPH: {prescription.sphereRight ?? "—"} | CYL:{" "}
                            {prescription.cylinderRight ?? "—"} | Axis:{" "}
                            {prescription.axisRight ?? "—"}
                          </div>
                          <div>
                            SPH: {prescription.sphereLeft ?? "—"} | CYL:{" "}
                            {prescription.cylinderLeft ?? "—"} | Axis:{" "}
                            {prescription.axisLeft ?? "—"}
                          </div>
                        </div>
                        {prescription.pupillaryDistance != null && (
                          <p
                            style={{
                              margin: "6px 0 0",
                              fontSize: "13px",
                              color: "#374151",
                            }}
                          >
                            <b>PD (Pupillary Distance):</b>{" "}
                            {prescription.pupillaryDistance} mm
                          </p>
                        )}
                        {(prescription.doctorName ||
                          prescription.clinicName) && (
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              {prescription.doctorName &&
                                `Dr. ${prescription.doctorName}`}
                              {prescription.doctorName &&
                                prescription.clinicName &&
                                " — "}
                              {prescription.clinicName}
                            </p>
                          )}
                        {prescription.expirationDate && (
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: "12px",
                              color:
                                new Date(prescription.expirationDate) <
                                  new Date()
                                  ? "#dc2626"
                                  : "#6b7280",
                            }}
                          >
                            Expiration Date:{" "}
                            {new Date(
                              prescription.expirationDate,
                            ).toLocaleDateString("en-US")}
                            {new Date(prescription.expirationDate) <
                              new Date() && " (Expired)"}
                          </p>
                        )}
                      </div>
                    )}

                  {/* HÀNG 3: TẠM TÍNH */}
                  <div
                    style={{
                      textAlign: "right",
                      marginTop: "4px",
                      fontSize: "14px",
                      color: "#1d4ed8",
                      fontWeight: "bold",
                    }}
                  >
                    Subtotal: {formatCurrency(unitPrice * qty)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== TỔNG CỘNG ===== */}
        <div
          style={{
            textAlign: "right",
            fontSize: "20px",
            backgroundColor: "#eff6ff",
            padding: "16px 20px",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          }}
        >
          Total Payment:{" "}
          <strong style={{ color: "#1e40af", fontSize: "26px" }}>
            {formatCurrency(totalAmount)}
          </strong>
        </div>

        {/* Complaint button for delivered preorders */}
        {(displayStatus || "").toLowerCase() === "delivered" &&
          deliveryConfirmed && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                backgroundColor: "#fff7ed",
                borderRadius: "10px",
                border: "1px solid #fed7aa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: "600",
                    fontSize: "15px",
                    color: "#9a3412",
                  }}
                >
                  Issue with your pre-order?
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "#78716c",
                  }}
                >
                  You can request an exchange (within 7 days of receiving).
                </p>
              </div>
              <Link
                to={(() => {
                  const linkedItems =
                    linkedOrder?.items || linkedOrder?.orderItems || [];
                  const firstItemId =
                    linkedItems.length > 0
                      ? linkedItems[0].orderItemId || linkedItems[0].OrderItemId
                      : "";
                  return firstItemId
                    ? `/complaints/new?orderItemId=${firstItemId}`
                    : "/complaints/new";
                })()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f97316",
                  color: "#fff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Request Exchange
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}