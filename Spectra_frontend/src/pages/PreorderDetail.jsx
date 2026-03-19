import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

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
                "https://myspectra.runasp.net/api/Orders/my?page=1&pageSize=100",
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
          setError("Không tìm thấy đơn đặt trước này.");
        } else {
          setError(`Lỗi ${res.status} khi tải chi tiết.`);
        }
      } catch {
        setError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, user, navigate]);

  if (isLoading)

    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
        ⏳ Đang tải chi tiết đơn đặt trước...
      </div>
    );

  if (error || !order)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>
          {error || "Không tìm thấy đơn đặt trước"}
        </h2>
        <Link to="/orders" style={{ color: "#3b82f6" }}>
          ← Quay lại lịch sử mua hàng
        </Link>
      </div>
    );

  // ===== HÀM FORMAT TIỀN: USD + VND =====
  const EXCHANGE_RATE = 25400;
  const formatPrice = (n) => {
    const usd = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n || 0);
    const vnd = new Intl.NumberFormat("vi-VN").format((n || 0) * EXCHANGE_RATE);
    return `${usd} (${vnd} VND)`;
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");


  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    const map = {

      pending: { text: "Chờ xác nhận", color: "#d97706", bg: "#fef3c7" },
      confirmed: { text: "Đã xác nhận", color: "#059669", bg: "#d1fae5" },
      processing: { text: "Đang xử lý", color: "#4338ca", bg: "#ede9fe" },
      // FIX: converted hiển thị "Đang xử lý" (linked order đang processing)
      converted: { text: "Đang xử lý", color: "#4338ca", bg: "#ede9fe" },
      awaiting_payment: {
        text: "Chờ thanh toán",
        color: "#f97316",
        bg: "#fff7ed",
      },
      awaitingpayment: {
        text: "Chờ thanh toán",
        color: "#f97316",
        bg: "#fff7ed",
      },
      paid: { text: "Đã thanh toán", color: "#059669", bg: "#d1fae5" },
      shipped: { text: "Đang giao hàng", color: "#7e22ce", bg: "#f3e8ff" },
      delivered: { text: "Hoàn thành", color: "#059669", bg: "#d1fae5" },
      completed: { text: "Hoàn thành", color: "#059669", bg: "#d1fae5" },
      cancelled: { text: "Đã huỷ", color: "#dc2626", bg: "#fee2e2" },
    };
    const s2 = map[s] || {
      text: status || "Không rõ",
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
        `https://myspectra.runasp.net/api/Orders/${deliveryOrderId}/confirm-delivery`,
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

  const orderNote = order.note || "Không có";

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
        ← Lịch sử mua hàng
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
              Chi Tiết Đơn Đặt Trước
            </h2>
            <p
              style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}
            >
              Mã đơn:{" "}
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
              📦 Bạn đã nhận được đơn hàng chưa?
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
                ✅ Đã nhận
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
                ❌ Chưa nhận
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
                  Nếu bạn chưa nhận được hàng, vui lòng liên hệ tổng đài hỗ trợ:
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
                  Thời gian hỗ trợ: 8:00 – 21:00 hàng ngày
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
              Thông tin đơn đặt trước
            </h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Ngày đặt:</b> {formatDate(order.createdAt || order.orderDate)}
            </p>
            {order.expectedDate && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Dự kiến giao:</b> {formatDate(order.expectedDate)}
              </p>
            )}
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Thanh toán:</b> VNPay (100%)
            </p>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Ghi chú:</b> {orderNote}
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
              Thông tin giao hàng
            </h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Người nhận:</b> {receiverName}
            </p>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Số điện thoại:</b> {receiverPhone}
            </p>
            {receiverEmail !== "—" && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Email:</b> {receiverEmail}
              </p>
            )}
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Địa chỉ giao hàng:</b> {shippingAddress}
            </p>
          </div>
        </div>

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
          Sản phẩm đặt trước
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
            Không có thông tin sản phẩm.
          </p>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {itemsList.map((item, index) => {

              const frameName = item.frame?.frameName || "Gọng kính";
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
                            - Màu: {frameColor}
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
                          Thương hiệu: {brand}
                        </p>
                      )}
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "13px",
                          color: "#374151",
                        }}
                      >
                        Số lượng: <b>x{qty}</b>
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
                      {formatPrice(unitPrice)}
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
                          🔭 Tròng kính: {lensType || "Không có"}
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
                            👁️ Xem Toa thuốc / Đơn kính
                          </a>
                        )}
                      </div>
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
                    Tạm tính: {formatPrice(unitPrice * qty)}
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
          Tổng cộng:{" "}
          <strong style={{ color: "#1e40af", fontSize: "26px" }}>
            {formatPrice(totalAmount)}
          </strong>
        </div>

        {/* Complaint button for delivered preorders */}
        {(displayStatus || "").toLowerCase() === "delivered" && (
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
                Có vấn đề với đơn đặt trước?
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "#78716c",
                }}
              >
                Bạn có thể gửi khiếu nại, trả/đổi hàng hoặc yêu cầu bảo hành.
              </p>
            </div>
            <Link
              to="/complaints/new"
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
              Gửi khiếu nại
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
