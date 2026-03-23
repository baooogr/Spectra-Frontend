import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState(null); // For development mode

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetToken(null);

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(
          data.message ||
            "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
        );
        // In development mode, the API returns the token directly
        if (data.token) {
          setResetToken(data.token);
        }
      } else {
        setError(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng kiểm tra đường truyền và thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="auth-container"
      style={{ maxWidth: "450px", margin: "60px auto", padding: "20px" }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
          Quên mật khẩu
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
            fontSize: "14px",
          }}
        >
          Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@email.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#d1fae5",
                color: "#059669",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          {/* Development mode: Show reset link */}
          {resetToken && (
            <div
              style={{
                padding: "16px",
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                Chế độ phát triển:
              </p>
              <p style={{ margin: "0 0 8px" }}>
                Token đặt lại mật khẩu của bạn:
              </p>
              <code
                style={{
                  display: "block",
                  backgroundColor: "#fff",
                  padding: "8px",
                  borderRadius: "4px",
                  wordBreak: "break-all",
                  fontSize: "11px",
                }}
              >
                {resetToken}
              </code>
              <Link
                to={`/reset-password?token=${resetToken}`}
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  padding: "8px 16px",
                  backgroundColor: "#1d4ed8",
                  color: "white",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
              >
                Đặt lại mật khẩu ngay →
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: isLoading ? "#9ca3af" : "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginBottom: "20px",
            }}
          >
            {isLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
          </button>
        </form>

        <div style={{ textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
