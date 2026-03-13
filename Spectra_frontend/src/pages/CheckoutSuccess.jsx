import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CheckoutSuccess.css";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const orderId = useMemo(() => {
    return (
      location.state?.orderId ||
      "OD" + Math.floor(100000 + Math.random() * 900000)
    );
  }, [location.state]);

  const customer = location.state?.customer;

  const total = location.state?.total; // Giả sử total này đang là USD

  // Hàm chuyển đổi tỷ giá và format ra định dạng "$100 (2.625.000 ₫)"
  const formatCurrency = (amountInUSD) => {
    if (typeof amountInUSD !== "number") return null;

    const EXCHANGE_RATE = 26250; 
    
    // 1. Format USD: bỏ phần thập phân .00 nếu là số chẵn
    const formattedUSD = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUSD);

    // 2. Format VND: Chỉ lấy phần số (để có dấu chấm 4.593.750), không dùng style "currency" để tránh bị dính ký hiệu ₫
    const amountInVND = amountInUSD * EXCHANGE_RATE;
    const formattedVND = new Intl.NumberFormat("vi-VN").format(amountInVND);

    // 3. Ghép chuỗi: Ép sát ngoặc đơn vào USD và thêm chữ VND
    return `${formattedUSD}(${formattedVND} VND)`;
  };

  return (
    <div className="success">
      <div className="success__box">
        <div className="success__icon">✓</div>

        <h1 className="success__title">Đặt hàng thành công!</h1>
        <p className="success__desc">
          Cảm ơn bạn đã đặt hàng. Đơn hàng đã được ghi nhận.
        </p>

        <div className="success__order">
          <span>Mã đơn:</span>
          <strong>{orderId}</strong>
        </div>

        {(customer || total) && (
          <div className="success__info">
            {customer?.fullName && (
              <div className="info-row">
                <span>Khách hàng</span>
                <span>{customer.fullName}</span>
              </div>
            )}

            {customer?.phone && (
              <div className="info-row">
                <span>Số điện thoại</span>
                <span>{customer.phone}</span>
              </div>
            )}

            {customer?.address && (
              <div className="info-row">
                <span>Địa chỉ</span>
                <span className="info-row__right">{customer.address}</span>
              </div>
            )}

            {/* Đã sửa dòng này để gọi hàm formatCurrency mới */}
            {typeof total === "number" && (
              <div className="info-row info-row--total">
                <span>Tổng tiền</span>
                <span>{formatCurrency(total)}</span>
              </div>
            )}
          </div>
        )}

        <div className="success__actions">
          <button className="btn" onClick={() => navigate("/orders")}>
            Xem đơn hàng
          </button>
          <button className="btn btn--ghost" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>

      </div>
    </div>
  );
}