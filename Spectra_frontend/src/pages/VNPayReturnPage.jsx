import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  const responseCode = searchParams.get("vnp_ResponseCode");
  const transactionNo = searchParams.get("transactionId") || searchParams.get("vnp_TransactionNo");
  const amount = searchParams.get("amount");
  const paymentId = searchParams.get("paymentId");
  const message = searchParams.get("message");

  useEffect(() => {
    console.log("VNPay Return Params:", { responseCode, transactionNo, amount, paymentId });

    if (responseCode === "00") {
      setStatus("success");
    } else {
      setStatus("failed");
    }
  }, [responseCode]);


  const formatAmount = (raw) => {
    if (!raw) return "—";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(raw));
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
          <div style={{ fontSize: "50px", marginBottom: "16px" }}></div>
          <h2 style={{ color: "#6b7280" }}>
            Checking payment status...
          </h2>
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
            Payment Successful!
          </h2>
          <p style={{ color: "#374151", marginTop: "8px" }}>
            Thank you! Your order has been successfully recorded.
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
              <p
                style={{ margin: "6px 0", color: "#374151", fontSize: "14px" }}
              >
                <b>Transaction ID:</b> {transactionNo}
              </p>
            )}
            {paymentId && (
              <p
                style={{ margin: "6px 0", color: "#374151", fontSize: "14px" }}
              >
                <b>Payment ID:</b> {paymentId}
              </p>
            )}
            {amount && (
              <p
                style={{ margin: "6px 0", color: "#374151", fontSize: "14px" }}
              >
                <b>Amount:</b> <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatAmount(amount)}</span>
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              justifyContent: "center",
            }}
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
              View Orders
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
              Back to Home
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
            Payment Failed
          </h2>
          <p style={{ color: "#374151", marginTop: "8px" }}>
            The transaction was not completed. Your order is saved — you can try paying again.
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
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  <b>VNPay Error Code:</b> {responseCode}
                </p>
              )}
              {message && (
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  <b>Details:</b> {decodeURIComponent(message)}
                </p>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              justifyContent: "center",
            }}
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
              View Orders
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
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}