import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  // Backend redirect về với các params này
  const responseCode = searchParams.get("vnp_ResponseCode");
  const transactionNo = searchParams.get("vnp_TransactionNo") || searchParams.get("transactionId");
  const amount = searchParams.get("vnp_Amount") || searchParams.get("amount");
  const message = searchParams.get("message"); // Backend có thể gửi thêm "message"
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
  

    // Debug: in ra params để kiểm tra
    console.log("🔵 VNPay Return Params:", {
      responseCode,
      transactionNo,
      amount,
      message,
      paymentId,
      fullUrl: window.location.search,
    });

    // responseCode "00" = thành công (chuẩn VNPay)
    // Một số backend tự custom redirect với params riêng
    if (responseCode === "00") {
      setStatus("success");
    } else if (responseCode) {
      // Có responseCode nhưng không phải "00"
      setStatus("failed");
    } else if (message) {
      
      const isSuccess =
        message.toLowerCase().includes("success") ||
        message.toLowerCase().includes("thành công");
      setStatus(isSuccess ? "success" : "failed");
    } else {
      // Không có params gì hết → lỗi
      setStatus("failed");
    }
  }, [responseCode, message]);

  const formatAmount = (raw) => {
    if (!raw) return "—";
    // VNPay trả amount * 100, backend có thể đã chia rồi
    const num = Number(raw);
    if (num > 1_000_000) {
      // Chưa chia — chia 100 để ra VND thực
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(num / 100);
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        fontFamily: "sans-serif",
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* LOADING */}
      {status === "loading" && (
        <div>
          <div style={{ fontSize: "50px", marginBottom: "16px" }}>⏳</div>
          <h2 style={{ color: "#6b7280" }}>Đang kiểm tra kết quả thanh toán...</h2>
        </div>
      )}

      {/* THÀNH CÔNG */}
      {status === "success" && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            maxWidth: "500px",
            width: "100%",
            margin: "0 auto",
            padding: "40px 30px",
            borderRadius: "16px",
            border: "1px solid #bbf7d0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "64px" }}>✅</div>
          <h2 style={{ color: "#059669", marginTop: "12px", fontSize: "24px" }}>
            Thanh Toán VNPay Thành Công!
          </h2>
          <p style={{ color: "#374151", marginTop: "8px" }}>
            Cảm ơn bạn! Đơn hàng của bạn đã được ghi nhận.
          </p>

          <div
            style={{
              textAlign: "left",
              backgroundColor: "white",
              padding: "16px",
              borderRadius: "10px",
              marginTop: "20px",
              border: "1px solid #d1fae5",
            }}
          >
            {transactionNo && (
              <p style={{ margin: "6px 0", color: "#374151", fontSize: "14px" }}>
                <b>Mã giao dịch:</b> {transactionNo}
              </p>
            )}
            {paymentId && (
              <p style={{ margin: "6px 0", color: "#374151", fontSize: "14px" }}>
                <b>Payment ID:</b> {paymentId}
              </p>
            )}
            {amount && (
              <p style={{ margin: "6px 0", color: "#374151", fontSize: "14px" }}>
                <b>Số tiền:</b> {formatAmount(amount)}
              </p>
            )}
          </div>

          <div
            style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "center" }}
          >
            <Link
              to="/orders"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#059669",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Xem đơn hàng
            </Link>
            <Link
              to="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#111827",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      )}

      {/* THẤT BẠI */}
      {status === "failed" && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            maxWidth: "500px",
            width: "100%",
            margin: "0 auto",
            padding: "40px 30px",
            borderRadius: "16px",
            border: "1px solid #fecaca",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "64px" }}>❌</div>
          <h2 style={{ color: "#dc2626", marginTop: "12px", fontSize: "24px" }}>
            Thanh Toán Thất Bại
          </h2>
          <p style={{ color: "#374151", marginTop: "8px" }}>
            Giao dịch chưa được hoàn tất. Đơn hàng vẫn được lưu — bạn có thể thử thanh toán lại.
          </p>

          {/* Hiển thị lý do thất bại nếu có */}
          {(responseCode || message) && (
            <div
              style={{
                textAlign: "left",
                backgroundColor: "white",
                padding: "12px 16px",
                borderRadius: "8px",
                marginTop: "16px",
                border: "1px solid #fecaca",
              }}
            >
              {responseCode && responseCode !== "00" && (
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                  <b>Mã lỗi VNPay:</b> {responseCode}
                </p>
              )}
              {message && (
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
                  <b>Chi tiết:</b> {decodeURIComponent(message)}
                </p>
              )}
            </div>
          )}

          <div
            style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "center" }}
          >
            <Link
              to="/orders"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#dc2626",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Xem đơn hàng
            </Link>
            <Link
              to="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#6b7280",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}