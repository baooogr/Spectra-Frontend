import React, { useState, useContext } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext"; 
import { GoogleLogin } from "@react-oauth/google"; 

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext); 

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("https://myspectra.runasp.net/api/Auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone
        }),
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setSuccessMsg("Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMsg(data.message || "Đăng ký thất bại!");
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
    try {
      const response = await fetch("https://myspectra.runasp.net/api/Auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        
        login({ 
          token: data.token, 
          fullName: data.fullName 
        });
        navigate("/");
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
    <div style={{ maxWidth: "450px", margin: "60px auto", padding: "30px", border: "1px solid #eaeaea", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Đăng Ký Tài Khoản</h2>
      
      {errorMsg && (
        <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "6px", marginBottom: "15px", textAlign: "center", fontSize: "14px" }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "10px", borderRadius: "6px", marginBottom: "15px", textAlign: "center", fontSize: "14px" }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Họ và Tên:</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Nhập họ và tên" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Nhập email" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Số điện thoại:</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Nhập số điện thoại" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Mật khẩu:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Nhập mật khẩu" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Xác nhận mật khẩu:</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Nhập lại mật khẩu" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ marginTop: "10px", padding: "12px", background: isLoading ? "#666" : "#000", color: "white", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: isLoading ? "not-allowed" : "pointer" }}
        >
          {isLoading ? "Đang xử lý..." : "Đăng Ký"}
        </button>
      </form>

     
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#888' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#eaeaea' }}></div>
        <span style={{ padding: '0 10px', fontSize: '12px' }}>HOẶC</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#eaeaea' }}></div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setErrorMsg("Đăng ký Google thất bại")}
          shape="pill"
          theme="outline"
          text="signup_with" 
        />
      </div>

      <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#666" }}>
        Đã có tài khoản? <Link to="/login" style={{ color: "#000", fontWeight: "bold", textDecoration: "underline" }}>Đăng nhập ngay</Link>
      </div>
    </div>
  );
}