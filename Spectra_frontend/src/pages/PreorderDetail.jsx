import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function PreorderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) { navigate("/login"); return; }

    const fetchDetail = async () => {
      try {
        const res = await fetch(`https://myspectra.runasp.net/api/Preorders/${id}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();

          // ===== DEBUG: Tìm field địa chỉ trong preorder response =====
          console.log("PREORDER DETAIL - TẤT CẢ FIELDS:");
          const topLevelFields = {};
          Object.entries(data).forEach(([k, v]) => {
            if (typeof v !== "object" || v === null) topLevelFields[k] = v;
          });
          console.table(topLevelFields);
          if (data.user) {
            console.log("👤 user object:", data.user);
          }
          // =============================================================

          setOrder(data);
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
    return <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>Đang tải chi tiết đơn đặt trước...</div>;

  if (error || !order)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error || "Không tìm thấy đơn đặt trước"}</h2>
        <Link to="/orders" style={{ color: "#3b82f6" }}>← Quay lại lịch sử mua hàng</Link>
      </div>
    );

  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n || 0);

  const formatDate = (d) => d ? new Date(d).toLocaleString("vi-VN") : "—";

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    const map = {
      pending:          { text: "Chờ xác nhận",   color: "#d97706", bg: "#fef3c7" },
      confirmed:        { text: "Đã xác nhận",    color: "#059669", bg: "#d1fae5" },
      processing:       { text: "Đang xử lý",     color: "#4338ca", bg: "#ede9fe" },
      awaiting_payment: { text: "Chờ thanh toán", color: "#f97316", bg: "#fff7ed" },
      awaitingpayment:  { text: "Chờ thanh toán", color: "#f97316", bg: "#fff7ed" },
      paid:             { text: "Đã thanh toán",  color: "#059669", bg: "#d1fae5" },
      shipped:          { text: "Đang giao hàng", color: "#7e22ce", bg: "#f3e8ff" },
      delivered:        { text: "Hoàn thành",     color: "#059669", bg: "#d1fae5" },
      completed:        { text: "Hoàn thành",     color: "#059669", bg: "#d1fae5" },
      cancelled:        { text: "Đã huỷ",         color: "#dc2626", bg: "#fee2e2" },
    };
    const s2 = map[s] || { text: status || "Không rõ", color: "#6b7280", bg: "#f3f4f6" };
    return (
      <span style={{ fontWeight: "bold", color: s2.color, backgroundColor: s2.bg, padding: "4px 14px", borderRadius: "20px", fontSize: "14px" }}>
        {s2.text}
      </span>
    );
  };

  const receiverName  = order.user?.fullName || "—";
  const receiverPhone = order.user?.phone    || "—";

  
  const shippingAddress =
    order.shippingAddress  ||
    order.deliveryAddress  ||
    order.address          ||
    order.user?.address    ||
    "—";

  const orderNote = order.note || "Không có";

  const itemsList = (order.preorderItems || order.orderItems || []).filter(Boolean);

  const totalAmount =
    order.totalAmount ||
    order.totalPrice  ||
    itemsList.reduce((sum, item) => sum + (item.orderPrice || item.preorderPrice || item.unitPrice || 0), 0);

  return (
    <div style={{ maxWidth: "860px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <Link to="/orders" style={{ color: "#6b7280", textDecoration: "none", fontSize: "14px", display: "inline-block", marginBottom: "20px" }}>
        ← Lịch sử mua hàng
      </Link>

      <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #dbeafe", paddingBottom: "18px", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ backgroundColor: "#2563eb", color: "white", fontSize: "11px", fontWeight: "bold", padding: "3px 10px", borderRadius: "20px" }}>
              PRE-ORDER
            </span>
            <h2 style={{ margin: "8px 0 0", fontSize: "22px" }}>Chi Tiết Đơn Đặt Trước</h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
              Mã đơn: <b style={{ color: "#1e40af" }}>#{order.preorderId || order.id}</b>
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* 2 cột thông tin */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>

          {/* Thông tin đơn */}
          <div style={{ backgroundColor: "#eff6ff", padding: "18px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
            <h4 style={{ marginTop: 0, marginBottom: "12px", color: "#1e40af", fontSize: "15px", borderBottom: "1px solid #bfdbfe", paddingBottom: "8px" }}>
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
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Địa chỉ giao hàng:</b> {shippingAddress}
            </p>
          </div>
        </div>

        {/* Sản phẩm */}
        <h3 style={{ borderBottom: "1px solid #dbeafe", paddingBottom: "10px", marginBottom: "16px", fontSize: "17px", color: "#1e40af" }}>
          Sản phẩm đặt trước
        </h3>

        {itemsList.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", fontStyle: "italic", padding: "20px 0" }}>
            Không có thông tin sản phẩm.
          </p>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            {itemsList.map((item, index) => {
              const frameName   = item.frame?.frameName || "Gọng kính";
              const frameColor  = item.selectedColor    || item.frame?.color || null;
              const qty         = item.quantity         || 1;
              const unitPrice   = item.orderPrice       || item.preorderPrice || item.unitPrice || 0;
              const brand       = item.frame?.brand     || null;
              const lensType    = item.lensType?.lensSpecification || null;
              const lensFeature = item.feature?.featureSpecification || null;
              const prescriptionUrl = item.prescription?.imageUrl || null;

              return (
                <div key={item.preorderItemId || item.orderItemId || index}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 0", borderBottom: "1px dashed #e0e7ff", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "16px" }}>{frameName}</p>
                    {brand && <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#6b7280" }}>Thương hiệu: {brand}</p>}
                    {frameColor && <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#6b7280" }}>Màu: <b>{frameColor}</b></p>}
                    {(lensType || lensFeature) && (
                      <div style={{ backgroundColor: "#ede9fe", padding: "6px 12px", borderRadius: "6px", border: "1px solid #ddd6fe", margin: "6px 0", display: "inline-block" }}>
                        <p style={{ margin: 0, fontSize: "13px", color: "#4338ca", fontWeight: "500" }}>
                           {lensType}{lensFeature ? ` — ${lensFeature}` : ""}
                        </p>
                      </div>
                    )}
                    <p style={{ margin: "4px 0 0", fontSize: "13px" }}>Số lượng: <b>x{qty}</b></p>
                    {prescriptionUrl && (
                      <a href={prescriptionUrl} target="_blank" rel="noreferrer"
                        style={{ display: "inline-block", marginTop: "6px", fontSize: "13px", color: "#b91c1c", fontWeight: "bold", textDecoration: "underline" }}>
                        Xem Toa thuốc
                      </a>
                    )}
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#2563eb", whiteSpace: "nowrap" }}>
                    {formatUSD(unitPrice)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tổng */}
        <div style={{ textAlign: "right", fontSize: "20px", backgroundColor: "#eff6ff", padding: "16px 20px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
          Tổng cộng:{" "}
          <strong style={{ color: "#1e40af", fontSize: "26px" }}>
            {formatUSD(totalAmount)}
          </strong>
        </div>
      </div>
    </div>
  );
}