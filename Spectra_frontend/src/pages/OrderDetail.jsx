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
    if (!token) { navigate("/login"); return; }

    const fetchOrderDetail = async () => {
      try {
        const res = await fetch(`https://myspectra.runasp.net/api/Orders/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else if (res.status === 404) {
          setError("Không tìm thấy đơn hàng này.");
        } else {
          setError(`Lỗi ${res.status} khi tải chi tiết đơn hàng.`);
        }
      } catch {
        setError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id, user, navigate]);

  if (isLoading)
    return <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>⏳ Đang tải chi tiết đơn hàng...</div>;

  if (error || !order)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error || "Không tìm thấy đơn hàng"}</h2>
        <Link to="/orders" style={{ color: "#3b82f6" }}>← Quay lại lịch sử mua hàng</Link>
      </div>
    );

  const EXCHANGE_RATE = 25400;
  const formatPrice = (n) => {
    const usd = new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(n || 0);
    const vnd = new Intl.NumberFormat("vi-VN").format((n || 0) * EXCHANGE_RATE);
    return `${usd}(${vnd} VND)`;
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    const map = {
      pending:    { text: "Chờ xác nhận",   color: "#d97706", bg: "#fef3c7" },
      confirmed:  { text: "Đã xác nhận",    color: "#059669", bg: "#d1fae5" },
      processing: { text: "Đang xử lý",     color: "#4338ca", bg: "#ede9fe" },
      shipped:    { text: "Đang giao hàng", color: "#7e22ce", bg: "#f3e8ff" },
      delivering: { text: "Đang giao hàng", color: "#7e22ce", bg: "#f3e8ff" },
      delivered:  { text: "Hoàn thành",     color: "#059669", bg: "#d1fae5" },
      completed:  { text: "Hoàn thành",     color: "#059669", bg: "#d1fae5" },
      cancelled:  { text: "Đã huỷ",         color: "#dc2626", bg: "#fee2e2" },
    };
    const s2 = map[s] || { text: status || "Không rõ", color: "#6b7280", bg: "#f3f4f6" };
    return (
      <span style={{ fontWeight: "bold", color: s2.color, backgroundColor: s2.bg, padding: "4px 14px", borderRadius: "20px", fontSize: "14px" }}>
        {s2.text}
      </span>
    );
  };

  // Bóc tách thông tin người nhận từ shippingAddress
  let receiverName    = (order.user?.fullName || "—");
  let receiverPhone   = order.user?.phone     || "—";
  let receiverEmail   = order.user?.email     || "—";
  let shippingAddress = order.shippingAddress || "—";
  const orderNote     = order.note            || "Không có";

  const matchNew   = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\] (.*)$/);
  const matchError = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*?)] (.*)$/);
  const matchOld   = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*)$/);

  if (matchNew) {
    receiverName = matchNew[1]; receiverPhone = matchNew[2];
    receiverEmail = matchNew[3]; shippingAddress = matchNew[4];
  } else if (matchError) {
    receiverName = matchError[1]; receiverPhone = matchError[2];
    receiverEmail = matchError[3].trim(); shippingAddress = matchError[4];
  } else if (matchOld) {
    receiverName = matchOld[1]; receiverPhone = matchOld[2];
    shippingAddress = matchOld[3];
  }

  const itemsList = order.items || order.orderItems || [];

  // Thông tin vận chuyển — được gán sau khi staff nhập mã hoặc dùng GoShip
  const trackingNumber  = order.trackingNumber  || null;
  const shippingCarrier = order.shippingCarrier || null;
  const shippedAt       = order.shippedAt       || null;
  const hasTracking     = !!trackingNumber;

  return (
    <div style={{ maxWidth: "860px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <Link to="/orders" style={{ color: "#6b7280", textDecoration: "none", fontSize: "14px", display: "inline-block", marginBottom: "20px" }}>
        ← Lịch sử mua hàng
      </Link>

      <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #f3f4f6", paddingBottom: "18px", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>Chi Tiết Đơn Hàng</h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
              Mã đơn: <b style={{ color: "#111827" }}>#{order.orderId}</b>
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* 2 cột thông tin */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

          {/* Thông tin đơn hàng */}
          <div style={{ backgroundColor: "#f9fafb", padding: "18px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
            <h4 style={{ marginTop: 0, marginBottom: "12px", color: "#374151", fontSize: "15px", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>
              Thông tin đơn hàng
            </h4>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Ngày đặt:</b>{" "}
              {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "—"}
            </p>
            {order.arrivalDate && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Ngày nhận hàng:</b> {new Date(order.arrivalDate).toLocaleString("vi-VN")}
              </p>
            )}
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Ghi chú:</b> {orderNote}
            </p>
          </div>

          {/* Thông tin giao hàng */}
          <div style={{ backgroundColor: "#f0fdf4", padding: "18px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
            <h4 style={{ marginTop: 0, marginBottom: "12px", color: "#374151", fontSize: "15px", borderBottom: "1px solid #bbf7d0", paddingBottom: "8px" }}>
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

        {/* ── MÃ VẬN ĐƠN — hiển thị khi đơn đã được gán tracking ── */}
        {hasTracking && (
          <div style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "16px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}>
            <span style={{ fontSize: "24px", lineHeight: 1 }}>🚚</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#1e40af" }}>
                Thông tin vận chuyển
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {shippingCarrier && (
                  <p style={{ margin: 0, fontSize: "14px", color: "#1e3a8a" }}>
                    <b>Hãng vận chuyển:</b>{" "}
                    <span style={{ fontWeight: "bold" }}>{shippingCarrier}</span>
                  </p>
                )}
                <p style={{ margin: 0, fontSize: "14px", color: "#1e3a8a" }}>
                  <b>Mã vận đơn:</b>{" "}
                  <span style={{
                    fontFamily: "monospace",
                    fontSize: "15px",
                    fontWeight: "bold",
                    backgroundColor: "#dbeafe",
                    padding: "2px 10px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                  }}>
                    {trackingNumber}
                  </span>
                </p>
                {shippedAt && (
                  <p style={{ margin: 0, fontSize: "14px", color: "#1e3a8a" }}>
                    <b>Ngày gửi:</b> {new Date(shippedAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
                Dùng mã vận đơn để tra cứu trạng thái giao hàng trên trang của hãng vận chuyển.
              </p>
            </div>
          </div>
        )}

        {/* Danh sách sản phẩm */}
        <h3 style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "10px", marginBottom: "16px", fontSize: "17px" }}>
          Sản phẩm đã mua
        </h3>

        {itemsList.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", fontStyle: "italic", padding: "20px 0" }}>
            Không có thông tin sản phẩm.
          </p>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {itemsList.map((item, index) => {
              const frameName      = item.frame?.frameName || "Gọng kính";
              const frameColor     = item.selectedColor    || item.frame?.color || null;
              const qty            = item.quantity         || 1;
              const prescriptionUrl = item.prescription?.imageUrl || null;
              const lensType       = item.lensType?.lensSpecification || null;
              const lensFeatureObj = item.lensFeature || item.feature;
              const lensFeature    = lensFeatureObj?.featureSpecification || null;
              const framePrice     = item.frame?.basePrice || 0;
              const typePrice      = item.lensType?.basePrice || 0;
              const featurePrice   = lensFeatureObj?.extraPrice || 0;
              const totalLensPrice = typePrice + featurePrice;
              const unitPrice      = item.orderPrice || item.unitPrice || item.price || (framePrice + totalLensPrice);
              const calculatedFramePrice = framePrice > 0 ? framePrice : (unitPrice - totalLensPrice);

              return (
                <div
                  key={item.orderItemId || index}
                  style={{ display: "flex", flexDirection: "column", padding: "16px 0", borderBottom: "1px dashed #e5e7eb", gap: "12px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "16px" }}>
                        {frameName}{" "}
                        {frameColor && <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "normal" }}>- Màu: {frameColor}</span>}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#374151" }}>
                        Số lượng: <b>x{qty}</b>
                      </p>
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: "15px", color: "#111827", whiteSpace: "nowrap", textAlign: "right" }}>
                      {formatPrice(calculatedFramePrice)}
                    </div>
                  </div>

                  {(lensType || lensFeature) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", backgroundColor: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#334155", fontWeight: "500" }}>
                          Tròng kính: {lensType || "Không có"}{lensFeature ? ` — ${lensFeature}` : ""}
                        </p>
                        {prescriptionUrl && (
                          <a href={prescriptionUrl} target="_blank" rel="noreferrer"
                            style={{ display: "inline-block", marginTop: "6px", fontSize: "13px", color: "#0284c7", fontWeight: "bold", textDecoration: "underline" }}>
                            👁️ Xem Toa thuốc / Đơn kính
                          </a>
                        )}
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: "#475569", whiteSpace: "nowrap", textAlign: "right" }}>
                        {totalLensPrice > 0 ? `+ ${formatPrice(totalLensPrice)}` : "Đang cập nhật"}
                      </div>
                    </div>
                  )}

                  <div style={{ textAlign: "right", marginTop: "4px", fontSize: "14px", color: "#059669", fontWeight: "bold" }}>
                    Tạm tính: {formatPrice(unitPrice * qty)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tổng cộng */}
        <div style={{ textAlign: "right", fontSize: "20px", backgroundColor: "#f0fdf4", padding: "16px 20px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
          Tổng cộng:{" "}
          <strong style={{ color: "#111827", fontSize: "26px" }}>
            {formatPrice(order.totalAmount)}
          </strong>
        </div>

      </div>
    </div>
  );
}