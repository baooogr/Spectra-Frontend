import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token.trim()) {
      setError("Token đặt lại mật khẩu không hợp lệ");
      return;
    }

    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token.trim(),
            newPassword: newPassword,
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(
          data.message ||
            "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.",
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "Có lỗi xảy ra. Token có thể đã hết hạn.");
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
          Đặt lại mật khẩu
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
            fontSize: "14px",
          }}
        >
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>

        <form onSubmit={handleSubmit}>
          {!searchParams.get("token") && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Token đặt lại mật khẩu
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Nhập token từ email"
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
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
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

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
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
              <p style={{ margin: "8px 0 0", fontSize: "12px" }}>
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !!message}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: isLoading || message ? "#9ca3af" : "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: isLoading || message ? "not-allowed" : "pointer",
              marginBottom: "20px",
            }}
          >
            {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
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
