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

  // Use centralized formatter to apply VND rounding policy
  const formatCurrency = (amountInUSD) => {
    if (typeof amountInUSD !== "number") return null;
    // Chỉ hiển thị định dạng USD
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountInUSD);
  };

  return (
    <div className="success">
      <div className="success__box">
        <div className="success__icon">✓</div>

        <h1 className="success__title">Order Successful!</h1>
        <p className="success__desc">
          Thank you for your order. Your order has been successfully recorded.
        </p>

        <div className="success__order">
          <span>Order ID:</span>
          <strong>{orderId}</strong>
        </div>

        {(customer || total) && (
          <div className="success__info">
            {customer?.fullName && (
              <div className="info-row">
                <span>Customer</span>
                <span>{customer.fullName}</span>
              </div>
            )}

            {customer?.phone && (
              <div className="info-row">
                <span>Phone Number</span>
                <span>{customer.phone}</span>
              </div>
            )}

            {customer?.address && (
              <div className="info-row">
                <span>Address</span>
                <span className="info-row__right">{customer.address}</span>
              </div>
            )}

            {/* Đã sửa dòng này để gọi hàm formatCurrency mới */}
            {typeof total === "number" && (
              <div className="info-row info-row--total">
                <span>Total Amount</span>
                <span>{formatCurrency(total)}</span>
              </div>
            )}
          </div>
        )}

        <div className="success__actions">
          <button className="btn" onClick={() => navigate("/orders")}>
            View Orders
          </button>
          <button className="btn btn--ghost" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}