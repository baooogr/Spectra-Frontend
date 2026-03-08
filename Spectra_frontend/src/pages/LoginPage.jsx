import React, { useState, useContext } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css"; // IMPORT CSS VÀO ĐÂY

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg(""); setIsLoading(true);
    try {
      const response = await fetch("https://myspectra.runasp.net/api/Auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        login({ token: data.token, fullName: data.fullName });
        setSuccessMsg(`Đăng nhập thành công! Xin chào ${data.fullName}`);
        setTimeout(() => navigate("/"), 2000);
      } else { setErrorMsg(data.message || "Sai tài khoản hoặc mật khẩu!"); }
    } catch (error) { setErrorMsg("Không thể kết nối đến Server."); } 
    finally { setIsLoading(false); }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true); setErrorMsg(""); setSuccessMsg(""); 
    try {
      const response = await fetch("https://myspectra.runasp.net/api/Auth/google", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok) {
        login({ token: data.token, fullName: data.fullName });
        setSuccessMsg(`Đăng nhập Google thành công!`);
        setTimeout(() => navigate("/"), 2000);
      } else { setErrorMsg("Xác thực Google thất bại!"); }
    } catch (error) { setErrorMsg("Lỗi kết nối API Google."); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Đăng Nhập</h2>
      
      {errorMsg && <div className="auth-msg error">{errorMsg}</div>}
      {successMsg && <div className="auth-msg success">{successMsg}</div>}

      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Nhập email của bạn" />
        </div>
        <div className="form-group">
          <label>Mật khẩu:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Nhập mật khẩu" />
        </div>
        <button type="submit" disabled={isLoading} className="btn-submit"> 
          {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>
      
      <div className="auth-divider">
        <div className="line"></div><span className="text">HOẶC</span><div className="line"></div>
      </div>

      <div className="auth-google-btn">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg("Đăng nhập Google thất bại")} shape="pill" theme="outline" />
      </div>

      <div className="auth-footer">
        Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký ngay</Link>
      </div>
    </div>
  );
}