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
      setError("Invalid password reset token!");
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("The password must have at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The verification password does not match.");
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
            "Password reset successful! You can log in with your new password.",
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "An error occurred. The token may have expired.");
      }
    } catch (err) {
      setError("Connection error. Please check your internet connection and try again.");
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
          Reset password
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
            fontSize: "14px",
          }}
        >
          Enter a new password for your account.
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
                Password reset token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Import token from email"
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
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a new password (at least 6 characters)"
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
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password."
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
                Redirecting to login page...
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
            {isLoading ? "Processing..." : "Reset password"}
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
            ← Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
