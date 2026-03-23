import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  // ✏️ SỬA 1: Đổi successMsg → showModal + modalMsg
  const [showModal, setShowModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    // ✏️ SỬA 2a: Bỏ setSuccessMsg, thay bằng setShowModal + setModalMsg
    setShowModal(false);
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://myspectra.runasp.net/api/Auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        login({
          token: data.token,
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        });
        setModalMsg(`Xin chào, ${data.fullName}!`);
        setShowModal(true);
        setTimeout(() => navigate("/"), 2000);
      } else {
        setErrorMsg(data.message || "Sai tài khoản hoặc mật khẩu!");
      }
    } catch (error) {
      setErrorMsg("Không thể kết nối đến Server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setErrorMsg("");
    // ✏️ SỬA 2b: Tương tự cho Google login
    setShowModal(false);
    try {
      const response = await fetch(
        "https://myspectra.runasp.net/api/Auth/google",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: credentialResponse.credential }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        login({
          token: data.token,
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        });
        setModalMsg(`Đăng nhập Google thành công!`);
        setShowModal(true);
        setTimeout(() => navigate("/"), 2000);
      } else {
        setErrorMsg("Xác thực Google thất bại!");
      }
    } catch (error) {
      setErrorMsg("Lỗi kết nối API Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* ✏️ SỬA 3: Thêm Success Modal — xóa dòng successMsg cũ, thay bằng modal này */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.iconCircle}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="18" fill="#22c55e" opacity="0.15" />
                <path
                  d="M10 18.5l5.5 5.5 10-11"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 style={styles.modalTitle}>Đăng nhập thành công!</h3>
            <p style={styles.modalMsg}>{modalMsg}</p>
            <p style={styles.modalSub}>Đang chuyển hướng về trang chủ...</p>
            <div style={styles.progressBar}>
              <div style={styles.progressFill} />
            </div>
          </div>
        </div>
      )}

      <h2 className="auth-title">Đăng Nhập</h2>

      {errorMsg && <div className="auth-msg error">{errorMsg}</div>}

      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Nhập email của bạn"
          />
        </div>
        <div className="form-group">
          <label>Mật khẩu:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Nhập mật khẩu"
          />
        </div>
        <div style={{ textAlign: "right", marginBottom: "15px" }}>
          <Link
            to="/forgot-password"
            style={{
              color: "#3b82f6",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Quên mật khẩu?
          </Link>
        </div>
        <button type="submit" disabled={isLoading} className="btn-submit">
          {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>

      <div className="auth-divider">
        <div className="line"></div>
        <span className="text">HOẶC</span>
        <div className="line"></div>
      </div>

      <div className="auth-google-btn">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setErrorMsg("Đăng nhập Google thất bại")}
          shape="pill"
          theme="outline"
        />
      </div>

      <div className="auth-footer">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="auth-link">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}

// ✏️ SỬA 3 (tiếp): Styles cho modal — tách riêng để không ảnh hưởng Auth.css
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.2s ease",
  },
  modal: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "40px 36px 32px",
    width: "100%",
    maxWidth: "360px",
    textAlign: "center",
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
    animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  iconCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    margin: "0 auto 20px",
    border: "2px solid #bbf7d0",
  },
  modalTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    letterSpacing: "-0.3px",
  },
  modalMsg: {
    margin: "0 0 6px",
    fontSize: "15px",
    color: "#374151",
    fontWeight: "500",
  },
  modalSub: {
    margin: "0 0 24px",
    fontSize: "13px",
    color: "#9ca3af",
  },
  progressBar: {
    height: "4px",
    borderRadius: "99px",
    background: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "100%",
    borderRadius: "99px",
    background: "linear-gradient(90deg, #22c55e, #16a34a)",
    animation: "progress 2s linear forwards",
  },
};

// Inject keyframes một lần duy nhất
if (typeof document !== "undefined" && !document.getElementById("login-modal-keyframes")) {
  const style = document.createElement("style");
  style.id = "login-modal-keyframes";
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
    @keyframes progress { from { transform: translateX(-100%) } to { transform: translateX(0) } }
  `;
  document.head.appendChild(style);
}