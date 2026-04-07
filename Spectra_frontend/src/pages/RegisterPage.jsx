import React, { useState, useContext } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext"; 
import { GoogleLogin } from "@react-oauth/google"; 
import "./Auth.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext); 
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    
    if (formData.password !== formData.confirmPassword) { 
      setErrorMsg("The verification password does not match.!"); 
      return; 
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("https://myspectra.runasp.net/api/Auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password, 
          fullName: formData.fullName, 
          phone: formData.phone 
        }),
      });
      const data = await response.json();
      
      if (response.ok || response.status === 201) {
        // ⚡ TỰ ĐỘNG ĐĂNG NHẬP SAU KHI ĐĂNG KÝ THÀNH CÔNG
        login({ 
          token: data.token, 
          userId: data.userId, 
          email: data.email, 
          fullName: data.fullName, 
          role: data.role 
        });
        setSuccessMsg("Registration successful! Redirecting...");
        setTimeout(() => navigate("/"), 2000);
      } else { 
        setErrorMsg(data.message || "Registration failed!"); 
      }
    } catch (error) { 
      setErrorMsg("Unable to connect to the server."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true); setErrorMsg("");
    try {
      const response = await fetch("https://myspectra.runasp.net/api/Auth/google", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok) {
        // ⚡ ĐĂNG NHẬP GOOGLE TỪ TRANG ĐĂNG KÝ
        login({ 
          token: data.token, 
          userId: data.userId, 
          email: data.email, 
          fullName: data.fullName, 
          role: data.role 
        });
        navigate("/");
      } else { 
        setErrorMsg("Google authentication failed!"); 
      }
    } catch (error) { 
      setErrorMsg("Google API connection error."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="auth-container register-container">
      <h2 className="auth-title">Register an Account</h2>
      
      {errorMsg && <div className="auth-msg error">{errorMsg}</div>}
      {successMsg && <div className="auth-msg success">{successMsg}</div>}

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label>Full name:</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Nhập họ và tên" />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Nhập email" />
        </div>
        <div className="form-group">
          <label>Phone number:</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Nhập số điện thoại" />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Nhập mật khẩu" />
        </div>
        <div className="form-group">
          <label>Confirm password:</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Nhập lại mật khẩu" />
        </div>

        <button type="submit" disabled={isLoading} className="btn-submit">
          {isLoading ? "Processing..." : "Register"}
        </button>
      </form>

      <div className="auth-divider">
        <div className="line"></div><span className="text">OR</span><div className="line"></div>
      </div>

      <div className="auth-google-btn">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg("Đăng ký Google thất bại")} shape="pill" theme="outline" text="signup_with" />
      </div>

      <div className="auth-footer">
        Already have an account? <Link to="/login" className="auth-link">Login</Link>
      </div>
    </div>
  );
}