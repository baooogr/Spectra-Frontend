import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CheckoutSuccess.css";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const complaint = location.state?.complaint;

  const orderId = useMemo(() => {
    return (
      location.state?.orderId ||
      complaint?.id ||
      "OD" + Math.floor(100000 + Math.random() * 900000)
    );
  }, [location.state, complaint]);

  const customer = location.state?.customer || complaint?.customer;
  const total = location.state?.total;

  const complaintReason =
    complaint?.content ||
    complaint?.description ||
    complaint?.reason ||
    location.state?.content;

  const complaintType =
    complaint?.requestTypeLabel ||
    complaint?.requestType ||
    location.state?.requestType;

  const complaintDate =
    complaint?.createdAt || location.state?.createdAt;

  const formatCurrency = (amountInUSD) => {
    if (typeof amountInUSD !== "number") return null;

    const EXCHANGE_RATE = 26250;

    const formattedUSD = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUSD);

    const amountInVND = amountInUSD * EXCHANGE_RATE;
    const formattedVND = new Intl.NumberFormat("vi-VN").format(amountInVND);

    return `${formattedUSD}(${formattedVND} VND)`;
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

            {typeof total === "number" && (
              <div className="info-row info-row--total">
                <span>Tổng tiền</span>
                <span>{formatCurrency(total)}</span>
              </div>
            )}
          </div>
        )}

        {complaint && (
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

            {customer?.email && (
              <div className="info-row">
                <span>Email</span>
                <span className="info-row__right">{customer.email}</span>
              </div>
            )}

            {complaintType && (
              <div className="info-row">
                <span>Loại khiếu nại</span>
                <span>{complaintType}</span>
              </div>
            )}

            <div className="info-row">
              <span>Trạng thái</span>
              <span>{complaint?.status || "Pending"}</span>
            </div>

            {complaintDate && (
              <div className="info-row">
                <span>Ngày gửi</span>
                <span>{new Date(complaintDate).toLocaleString("vi-VN")}</span>
              </div>
            )}

            {complaint?.orderItemId && (
              <div className="info-row">
                <span>Order Item ID</span>
                <span className="info-row__right">{complaint.orderItemId}</span>
              </div>
            )}

            {complaintReason && (
              <div className="info-row">
                <span>Nội dung</span>
                <span className="info-row__right">{complaintReason}</span>
              </div>
            )}

            {complaint?.mediaUrl && (
              <div className="info-row">
                <span>Media URL</span>
                <span className="info-row__right">{complaint.mediaUrl}</span>
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