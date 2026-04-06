import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useExchangeRate } from "../api";
import { getAddressDisplayString } from "../utils/vietnamAddress";
import DeliveryMap from "../components/DeliveryMap";
import "./OrderDetail.css";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [showNotReceivedInfo, setShowNotReceivedInfo] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { rate: exchangeRate } = useExchangeRate();

  // ⚡ Đã tạo hàm format riêng để chỉ hiển thị USD
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

    const fetchOrderDetail = async () => {
      try {
        const res = await fetch(
          `https://myspectra.runasp.net/api/OrdersV2/${id}`,
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
          // Check if delivery has been confirmed (backend or localStorage)
          if (
            data.deliveryConfirmedAt ||
            localStorage.getItem(`delivery_confirmed_${id}`) === "true"
          ) {
            setDeliveryConfirmed(true);
          }
        } else if (res.status === 404) {
          setError("Order not found.");
        } else {
          setError(`Error ${res.status} when loading order details.`);
        }
      } catch {
        setError("Connection error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id, user, navigate]);

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
        Loading order details...
      </div>
    );

  if (error || !order)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>
          {error || "Order not found"}
        </h2>
        <Link to="/orders" style={{ color: "#3b82f6" }}>
          ← Back to order history
        </Link>
      </div>
    );

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    const map = {
      pending: { text: "Pending", color: "#d97706", bg: "#fef3c7" },
      confirmed: { text: "Confirmed", color: "#059669", bg: "#d1fae5" },
      processing: { text: "Processing", color: "#4338ca", bg: "#ede9fe" },
      shipped: { text: "Delivering", color: "#7e22ce", bg: "#f3e8ff" },
      delivering: { text: "Delivering", color: "#7e22ce", bg: "#f3e8ff" },
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

  // Bóc tách thông tin người nhận từ shippingAddress
  let receiverName = order.user?.fullName || "—";
  let receiverPhone = order.user?.phone || "—";
  let receiverEmail = order.user?.email || "—";
  let shippingAddress = order.shippingAddress || "—";
  const orderNote = order.note || "None";

  const matchNew = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\] (.*)$/);
  const matchError = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*?)] (.*)$/);
  const matchOld = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*)$/);

  if (matchNew) {
    receiverName = matchNew[1];
    receiverPhone = matchNew[2];
    receiverEmail = matchNew[3];
    shippingAddress = matchNew[4];
  } else if (matchError) {
    receiverName = matchError[1];
    receiverPhone = matchError[2];
    receiverEmail = matchError[3].trim();
    shippingAddress = matchError[4];
  } else if (matchOld) {
    receiverName = matchOld[1];
    receiverPhone = matchOld[2];
    shippingAddress = matchOld[3];
  }

  // Strip |||structured data from address for clean display
  shippingAddress = getAddressDisplayString(shippingAddress);

  const itemsList = order.items || order.orderItems || [];

  // Thông tin vận chuyển — được gán sau khi staff nhập mã hoặc dùng Ahamove
  const trackingNumber = order.trackingNumber || null;
  const shippingCarrier = order.shippingCarrier || null;
  const shippedAt = order.shippedAt || null;
  const hasTracking = !!trackingNumber;

  const isDelivered = (order.status || "").toLowerCase() === "delivered";

  const handleConfirmDelivery = async () => {
    const token =
      user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/OrdersV2/${id}/confirm-delivery`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        localStorage.setItem(`delivery_confirmed_${id}`, "true");
        setDeliveryConfirmed(true);
        setShowNotReceivedInfo(false);
      }
    } catch {
      // Still mark locally so the user isn't stuck
      localStorage.setItem(`delivery_confirmed_${id}`, "true");
      setDeliveryConfirmed(true);
    }
  };

  const handleCancelOrder = async () => {
    const token =
      user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) return;

    setIsCancelling(true);
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/OrdersV2/${id}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        setOrder((prev) => ({ ...prev, status: "cancelled" }));
        setShowCancelConfirm(false);
        alert("Order cancelled successfully!");
      } else {
        const data = await res.json();
        alert(data.message || "Could not cancel the order. Please try again.");
      }
    } catch {
      alert("Connection error. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const isPending = (order?.status || "").toLowerCase() === "pending";

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #f3f4f6",
            paddingBottom: "18px",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>Order Details</h2>
            <p
              style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}
            >
              Order ID: <b style={{ color: "#111827" }}>#{order.orderId}</b>
            </p>
            {order.convertedFromPreorderId && (
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#1d4ed8",
                  fontSize: "13px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#dbeafe",
                    color: "#1e3a8a",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginRight: "6px",
                  }}
                >
                  From Pre-order
                </span>
                #{String(order.convertedFromPreorderId).slice(0, 8)}
              </p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {getStatusBadge(order.status)}
            {isPending && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCancelling}
                style={{
                  padding: "6px 16px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: isCancelling ? "not-allowed" : "pointer",
                  opacity: isCancelling ? 0.6 : 1,
                }}
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
          </div>
        </div>

        {/* ── XÁC NHẬN HUỶ ĐƠN HÀNG — hiển thị khi bấm nút huỷ ── */}
        {showCancelConfirm && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "2px solid #dc2626",
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
                color: "#991b1b",
              }}
            >
              Are you sure you want to cancel this order?
            </p>
            <p
              style={{ margin: "0 0 14px", fontSize: "14px", color: "#7f1d1d" }}
            >
              Once cancelled, you will need to place a new order if you wish to purchase these items.
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
                onClick={handleCancelOrder}
                disabled={isCancelling}
                style={{
                  padding: "10px 28px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: isCancelling ? "not-allowed" : "pointer",
                  opacity: isCancelling ? 0.6 : 1,
                }}
              >
                {isCancelling ? "Processing..." : "Confirm Cancellation"}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                style={{
                  padding: "10px 28px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                No, keep order
              </button>
            </div>
          </div>
        )}

        {/* ── XÁC NHẬN NHẬN HÀNG — hiển thị khi đơn delivered và chưa confirm ── */}
        {isDelivered && !deliveryConfirmed && (
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
              Have you received your order?
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
                Received
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
                Not Received
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
                  1900-0091
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

        {/* 2 cột thông tin */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* Thông tin đơn hàng */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "18px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#374151",
                fontSize: "15px",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              Order Information
            </h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Order Date:</b>{" "}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString("en-US")
                : "—"}
            </p>
            {order.arrivalDate && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Received Date:</b>{" "}
                {new Date(order.arrivalDate).toLocaleString("en-US")}
              </p>
            )}
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

        {/* ── TRACKING TIMELINE — Lộ trình vận chuyển ── */}
        {(() => {
          const status = (order.status || "").toLowerCase();
          const isCancelled = status === "cancelled";
          if (isCancelled) return null; // Don't show timeline for cancelled orders

          // ── Carrier tracking URL mapping ──
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

          // ── Determine step completion based on order fields ──
          const statusOrder = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
          ];
          const statusIdx = statusOrder.indexOf(status);

          const createdAt = order.createdAt ? new Date(order.createdAt) : null;
          const shipped = order.shippedAt ? new Date(order.shippedAt) : null;
          const delivered = order.deliveredAt || order.arrivalDate;
          const deliveredDate = delivered ? new Date(delivered) : null;
          const confirmedAt = order.deliveryConfirmedAt
            ? new Date(order.deliveryConfirmedAt)
            : null;
          const estimated = order.estimatedDeliveryDate
            ? new Date(order.estimatedDeliveryDate)
            : null;

          // Simulate intermediate shipping timestamps
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
              icon: "",
              label: "Order Placed",
              desc: "Waiting for store confirmation",
              time: createdAt,
              done: statusIdx >= 0,
              active: statusIdx === 0,
            },
            {
              icon: "",
              label: "Confirmed",
              desc: "Store has confirmed the order",
              time: createdAt
                ? new Date(createdAt.getTime() + 2 * 3600000)
                : null,
              done: statusIdx >= 1,
              active: statusIdx === 1,
            },
            {
              icon: "",
              label: "Preparing",
              desc: "Items are being packed and prepared for shipping",
              time: null,
              done: statusIdx >= 2,
              active: statusIdx === 2,
            },
            {
              icon: "",
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
              tracking: true,
            },
            {
              icon: "",
              label: "In Transit",
              desc: "On the way to your address",
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
              icon: "",
              label: "Out for Delivery",
              desc: "Driver is on the way to deliver your package",
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
              icon: "",
              label: "Delivered",
              desc: confirmedAt
                ? "Receiver has confirmed delivery"
                : "Package has been delivered",
              time: deliveredDate,
              done: statusIdx >= 4,
              active: statusIdx === 4 && !confirmedAt,
            },
          ];

          // Add delivery confirmed step if applicable
          if (confirmedAt || statusIdx >= 4) {
            steps.push({
              icon: "",
              label: "Delivery Confirmed",
              desc: "You have confirmed receiving the order",
              time: confirmedAt,
              done: !!confirmedAt,
              active: false,
            });
          }

          const trackingUrl = getCarrierTrackingUrl(
            shippingCarrier,
            trackingNumber,
          );

          const formatTime = (d) =>
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

              {/* Tracking link */}
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

              {/* Delivery Map — live tracking simulation */}
              {hasTracking && statusIdx >= 3 && (
                <DeliveryMap
                  customerAddress={shippingAddress}
                  shippedAt={order.shippedAt}
                  estimatedDate={order.estimatedDeliveryDate}
                  deliveredAt={order.deliveredAt || order.arrivalDate}
                  carrier={shippingCarrier}
                  status={order.status}
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
                      {/* Vertical line */}
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
                      {/* Dot */}
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
                      {/* Content */}
                      <div style={{ minHeight: "32px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>{step.icon}</span>
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
                              {formatTime(step.time)}
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
              {order.shippingMethod && (
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
                    {order.shippingMethod === "express"
                      ? "Express Delivery"
                      : "Standard Delivery"}
                  </span>
                  {order.shippingFee !== null &&
                    order.shippingFee !== undefined && (
                      <span>
                        Shipping Fee:{" "}
                        {order.shippingFee === 0
                          ? "Free"
                          : `$${order.shippingFee}`}
                      </span>
                    )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Danh sách sản phẩm */}
        <h3
          style={{
            borderBottom: "1px solid #f3f4f6",
            paddingBottom: "10px",
            marginBottom: "16px",
            fontSize: "17px",
          }}
        >
          Purchased Items
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
            No product information available.
          </p>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {itemsList.map((item, index) => {
              const frameName = item.frame?.frameName || "Eyeglass Frame";
              const frameColor =
                item.selectedColor || item.frame?.color || null;
              const qty = item.quantity || 1;
              const prescriptionUrl = item.prescription?.imageUrl || null;
              const prescription = item.prescription || null;
              const lensType = item.lensType?.lensSpecification || null;
              const lensFeatureObj = item.lensFeature || item.feature;
              const lensFeature = lensFeatureObj?.featureSpecification || null;
              const framePrice = item.frame?.basePrice || 0;
              const typePrice = item.lensType?.basePrice || 0;
              const featurePrice = lensFeatureObj?.extraPrice || 0;
              const totalLensPrice = typePrice + featurePrice;
              const unitPrice =
                item.orderPrice ||
                item.unitPrice ||
                item.price ||
                framePrice + totalLensPrice;
              const calculatedFramePrice =
                framePrice > 0 ? framePrice : unitPrice - totalLensPrice;

              return (
                <div
                  key={item.orderItemId || index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px 0",
                    borderBottom: "1px dashed #e5e7eb",
                    gap: "12px",
                  }}
                >
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
                        {frameName}{" "}
                        {frameColor && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              fontWeight: "normal",
                            }}
                          >
                            - Color: {frameColor}
                          </span>
                        )}
                      </p>
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
                        color: "#111827",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(calculatedFramePrice)}
                    </div>
                  </div>

                  {lensType || lensFeature ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        backgroundColor: "#f8fafc",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#334155",
                            fontWeight: "500",
                          }}
                        >
                          Lens: {lensType || "None"}
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
                              color: "#0284c7",
                              fontWeight: "bold",
                              textDecoration: "underline",
                            }}
                          >
                            View Prescription
                          </a>
                        )}
                      </div>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "14px",
                          color: "#475569",
                          whiteSpace: "nowrap",
                          textAlign: "right",
                        }}
                      >
                        {totalLensPrice > 0
                          ? `+ ${formatCurrency(totalLensPrice)}`
                          : "Updating"}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        backgroundColor: "#fefce8",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #fde68a",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>🔧</span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#92400e",
                          fontWeight: "600",
                        }}
                      >
                        Frame only (No lenses included)
                      </span>
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

                  <div
                    style={{
                      textAlign: "right",
                      marginTop: "4px",
                      fontSize: "14px",
                      color: "#059669",
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

        {/* Tổng cộng */}
        <div
          style={{
            textAlign: "right",
            fontSize: "20px",
            backgroundColor: "#f0fdf4",
            padding: "16px 20px",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
          }}
        >
          Total Payment:{" "}
          <strong style={{ color: "#111827", fontSize: "26px" }}>
            {formatCurrency(order.totalAmount)}
          </strong>
        </div>

        {/* Complaint button for delivered orders - only within 7 days of delivery */}
        {(() => {
          const isOrderDelivered =
            (order.status || "").toLowerCase() === "delivered";
          if (!isOrderDelivered || !deliveryConfirmed) return null;

          const deliveredDate =
            order.deliveredAt || order.deliveryConfirmedAt || order.arrivalDate;
          if (deliveredDate) {
            const deliveredTime = new Date(deliveredDate).getTime();
            const now = Date.now();
            const daysSinceDelivery =
              (now - deliveredTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDelivery > 7) {
              return (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                    The return/exchange period (7 days from delivery) has expired.
                  </p>
                </div>
              );
            }
          }

          const firstItemId =
            itemsList.length > 0
              ? itemsList[0].orderItemId || itemsList[0].OrderItemId
              : "";

          return (
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
                  Issue with your order?
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
                to={
                  firstItemId
                    ? `/complaints/new?orderItemId=${firstItemId}`
                    : "/complaints/new"
                }
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
          );
        })()}
      </div>
    </div>
  );
}