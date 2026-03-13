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

    if (!token) {
      navigate("/login");
      return;
    }

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

  const EXCHANGE_RATE = 26250;

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

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    const map = {
      pending: { text: "Chờ xác nhận", className: "status-pending" },
      confirmed: { text: "Đã xác nhận", className: "status-confirmed" },
      processing: { text: "Đang xử lý", className: "status-processing" },
      shipped: { text: "Đang giao hàng", className: "status-shipped" },
      delivering: { text: "Đang giao hàng", className: "status-shipped" },
      delivered: { text: "Hoàn thành", className: "status-completed" },
      completed: { text: "Hoàn thành", className: "status-completed" },
      cancelled: { text: "Đã huỷ", className: "status-cancelled" },
    };

    const statusInfo = map[s] || {
      text: status || "Không rõ",
      className: "status-default",
    };

    return <span className={`order-status-badge ${statusInfo.className}`}>{statusInfo.text}</span>;
  };

  if (isLoading) {
    return <div className="order-detail-message">⏳ Đang tải chi tiết đơn hàng...</div>;
  }

  if (error || !order) {
    return (
      <div className="order-detail-error-wrap">
        <h2 className="order-detail-error-title">{error || "Không tìm thấy đơn hàng"}</h2>
        <Link to="/orders" className="order-detail-back-link">
          ← Quay lại lịch sử mua hàng
        </Link>
      </div>
    );
  }

  const receiverName = order.user?.fullName || "—";
  const receiverPhone = order.user?.phone || "—";
  const shippingAddress = order.shippingAddress || "—";
  const orderNote = order.note || "Không có";

  const itemsList = order.orderItems?.filter(Boolean) || [];

  return (
    <div className="order-detail-page">
      <Link to="/orders" className="order-detail-top-link">
        ← Lịch sử mua hàng
      </Link>

      <div className="order-detail-card">
        <div className="order-detail-header">
          <div>
            <h2 className="order-detail-title">Chi Tiết Đơn Hàng</h2>
            <p className="order-detail-code">
              Mã đơn: <b>#{order.orderId}</b>
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <div className="order-detail-info-grid">
          <div className="order-detail-info-box">
            <h4 className="order-detail-box-title">Thông tin đơn hàng</h4>
            <p>
              <b>Ngày đặt:</b>{" "}
              {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "—"}
            </p>
            {order.arrivalDate && (
              <p>
                <b>Ngày nhận hàng:</b>{" "}
                {new Date(order.arrivalDate).toLocaleString("vi-VN")}
              </p>
            )}
            <p>
              <b>Ghi chú:</b> {orderNote}
            </p>
          </div>

          <div className="order-detail-info-box order-detail-info-box-green">
            <h4 className="order-detail-box-title green">Thông tin giao hàng</h4>
            <p>
              <b>Người nhận:</b> {receiverName}
            </p>
            <p>
              <b>Số điện thoại:</b> {receiverPhone}
            </p>
            <p>
              <b>Địa chỉ giao hàng:</b> {shippingAddress}
            </p>
          </div>
        </div>

        <h3 className="order-detail-section-title">Sản phẩm đã mua</h3>

        {itemsList.length === 0 ? (
          <p className="order-detail-empty">Không có thông tin sản phẩm.</p>
        ) : (
          <div className="order-detail-items">
            {itemsList.map((item, index) => {
              const frameName = item.frame?.frameName || "Gọng kính";
              const frameColor = item.selectedColor || item.frame?.color || null;
              const qty = item.quantity || 1;
              const prescriptionUrl = item.prescription?.imageUrl || null;

              const lensType = item.lensType?.lensSpecification || null;
              const lensFeatureObj = item.lensFeature || item.feature;
              const lensFeature = lensFeatureObj?.featureSpecification || null;

              const framePrice = item.frame?.basePrice || 0;
              const typePrice = item.lensType?.basePrice || 0;
              const featurePrice = lensFeatureObj?.extraPrice || 0;
              const totalLensPrice = typePrice + featurePrice;

              const unitPrice =
                item.orderPrice || item.unitPrice || item.price || framePrice + totalLensPrice;

              const calculatedFramePrice =
                framePrice > 0 ? framePrice : unitPrice - totalLensPrice;

              return (
                <div key={item.orderItemId || index} className="order-item">
                  <div className="order-item-top">
                    <div className="order-item-main">
                      <p className="order-item-name">
                        {frameName}
                        {frameColor && <span className="order-item-color"> - Màu: {frameColor}</span>}
                      </p>
                      <p className="order-item-qty">
                        Số lượng: <b>x{qty}</b>
                      </p>
                    </div>

                    <div className="order-item-frame-price">
                      {formatPrice(calculatedFramePrice)}
                    </div>
                  </div>

                  {(lensType || lensFeature) && (
                    <div className="order-item-lens-box">
                      <div className="order-item-lens-left">
                        <p className="order-item-lens-text">
                          Tròng kính: {lensType || "Không có"}
                          {lensFeature ? ` — ${lensFeature}` : ""}
                        </p>

                        {prescriptionUrl && (
                          <a
                            href={prescriptionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="order-item-prescription-link"
                          >
                            👁️ Xem Toa thuốc / Đơn kính
                          </a>
                        )}
                      </div>

                      <div className="order-item-lens-price">
                        {totalLensPrice > 0 ? `+ ${formatPrice(totalLensPrice)}` : "Đang cập nhật"}
                      </div>
                    </div>
                  )}

                  <div className="order-item-subtotal">
                    Tạm tính: {formatPrice(unitPrice * qty)}
                  </div>

                  {item.orderItemId && (
                    <div className="order-item-action">
                      <button
                        onClick={() =>
                          navigate(`/complaint?orderItemId=${item.orderItemId}`)
                        }
                        className="complaint-btn"
                      >
                        Khiếu nại sản phẩm
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="order-detail-total-box">
          Tổng cộng:{" "}
          <strong className="order-detail-total-price">
            {formatPrice(order.totalAmount)}
          </strong>
        </div>
      </div>
    </div>
  );
}