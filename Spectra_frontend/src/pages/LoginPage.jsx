import React, { useState, useContext } from "react"; 
import { Link, useNavigate } from "react-router-dom"; 
import { UserContext } from "../context/UserContext"; 
import { GoogleLogin } from "@react-oauth/google"; 

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(UserContext); 

 
  const handleLogin = async (e) => {
    e.preventDefault(); 
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("https://myspectra.runasp.net/api/Auth/login", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password }), 
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Đăng nhập thành công! Xin chào ${data.fullName}`);
        
        login({ 
          token: data.token, 
          fullName: data.fullName 
        }); 
        
        navigate("/"); 
      } else {
        setErrorMsg(data.message || "Sai tài khoản hoặc mật khẩu!");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      setErrorMsg("Không thể kết nối đến Server. Vui lòng kiểm tra lại Backend.");
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
        setErrorMsg("Xác thực Google thất bại từ máy chủ!");
      }
    } catch (error) {
      setErrorMsg("Lỗi kết nối API Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "30px", border: "1px solid #eaeaea", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Đăng Nhập</h2>
      
      {errorMsg && (
        <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "6px", marginBottom: "15px", textAlign: "center", fontSize: "14px" }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="Nhập email của bạn"
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>Mật khẩu:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Nhập mật khẩu"
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            marginTop: "10px", padding: "12px", background: isLoading ? "#666" : "#000", color: "white", 
            fontWeight: "bold", border: "none", borderRadius: "6px", cursor: isLoading ? "not-allowed" : "pointer" 
          }}
        >
          {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>
      
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#888' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#eaeaea' }}></div>
        <span style={{ padding: '0 10px', fontSize: '12px' }}>HOẶC</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#eaeaea' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess} 
          onError={() => setErrorMsg("Đăng nhập Google thất bại")}
          shape="pill"
          theme="outline"
        />
      </div>

      <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#666" }}>
        Chưa có tài khoản? <Link to="/register" style={{ color: "#000", fontWeight: "bold", textDecoration: "underline" }}>Đăng ký ngay</Link>
      </div>

    </div>
  );
}