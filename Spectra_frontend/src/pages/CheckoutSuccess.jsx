import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CheckoutSuccess.css";
import { useExchangeRate } from "../api";
import { formatPrice } from "../utils/validation";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { rate: exchangeRate } = useExchangeRate();

  const complaint = location.state?.complaint;

  const orderId = useMemo(() => {
    return (
      location.state?.orderId ||
      complaint?.id ||
      "OD" + Math.floor(100000 + Math.random() * 900000)
    );
  }, [location.state, complaint]);

  const customer = location.state?.customer;
  const total = location.state?.total; // Giả sử total này đang là USD

  // Use centralized formatter to apply VND rounding policy
  const formatCurrency = (amountInUSD) => {
    if (typeof amountInUSD !== "number") return null;
    return formatPrice(amountInUSD, exchangeRate);

  };

  return (
    <div className="success">
      <div className="success__box">
        <div className="success__icon">✓</div>

        <h1 className="success__title">
          {complaint ? "Gửi khiếu nại thành công!" : "Đặt hàng thành công!"}
        </h1>

        <p className="success__desc">
          {complaint
            ? "Khiếu nại của bạn đã được gửi đến hệ thống. Chúng tôi sẽ kiểm tra và phản hồi sớm nhất."
            : "Cảm ơn bạn đã đặt hàng. Đơn hàng đã được ghi nhận."}
        </p>

        <div className="success__order">
          <span>{complaint ? "Mã khiếu nại:" : "Mã đơn:"}</span>
          <strong>{orderId}</strong>
        </div>

        {!complaint && (customer || total) && (
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
          <button
            className="btn"
            onClick={() =>
              complaint
                ? navigate("/profile", { state: { activeTab: "complaint" } })
                : navigate("/orders")
            }
          >
            {complaint ? "Xem lịch sử khiếu nại" : "Xem đơn hàng"}
          </button>

          <button className="btn btn--ghost" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>

      </div>
    </div>
  );
}
