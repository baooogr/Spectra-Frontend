import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDashboard() {
  const { user } = useContext(UserContext);
  
  const [stats, setStats] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [popularFrames, setPopularFrames] = useState([]);
  const [orderSummary, setOrderSummary] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  const fetchData = async () => {
    setIsLoading(true);
    setError("");

  
    if (startDate || endDate) {
      
      if (!startDate || !endDate) {
        setError("⚠️ Vui lòng chọn đầy đủ cả 'Từ ngày' và 'Đến ngày' (hoặc để trống cả hai nếu muốn xem tất cả).");
        setIsLoading(false);
        return; 
      }

      
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        setError("⚠️ 'Từ ngày' không được lớn hơn 'Đến ngày'. Vui lòng chọn lại!");
        setIsLoading(false);
        return; 
      }
    }

    
    try {
      const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
      if (!token) {
        setError("Bạn chưa đăng nhập hoặc không có quyền Admin!");
        setIsLoading(false);
        return;
      }

      const dailyParams = new URLSearchParams();
      if (startDate) dailyParams.append("startDate", new Date(startDate).toISOString());
      if (endDate) dailyParams.append("endDate", new Date(endDate).toISOString());
      const dailyQueryString = dailyParams.toString() ? `?${dailyParams.toString()}` : "";

      const popularParams = new URLSearchParams(dailyParams);
      popularParams.append("limit", "10");

      const statsUrl = `https://myspectra.runasp.net/api/Dashboard/statistics${dailyQueryString}`;
      const dailyUrl = `https://myspectra.runasp.net/api/Dashboard/revenue/daily${dailyQueryString}`;
      const monthlyUrl = `https://myspectra.runasp.net/api/Dashboard/revenue/monthly?year=${selectedYear}`;
      const popularUrl = `https://myspectra.runasp.net/api/Dashboard/popular-frames?${popularParams.toString()}`;
      const orderSummaryUrl = `https://myspectra.runasp.net/api/Dashboard/orders/summary`; 

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const [statsRes, dailyRes, monthlyRes, popularRes, orderRes] = await Promise.all([
        fetch(statsUrl, { method: "GET", headers }),
        fetch(dailyUrl, { method: "GET", headers }),
        fetch(monthlyUrl, { method: "GET", headers }),
        fetch(popularUrl, { method: "GET", headers }),
        fetch(orderSummaryUrl, { method: "GET", headers }) 
      ]);

      if (statsRes.ok && dailyRes.ok && monthlyRes.ok && popularRes.ok && orderRes.ok) {
        setStats(await statsRes.json());
        setDailyRevenue(await dailyRes.json());
        setMonthlyRevenue(await monthlyRes.json());
        setPopularFrames(await popularRes.json());
        setOrderSummary(await orderRes.json()); 
      } else if (statsRes.status === 401 || statsRes.status === 403) {
        setError("Bạn không có quyền truy cập trang quản trị này (Lỗi 401/403).");
      } else {
        setError("Lỗi lấy dữ liệu từ máy chủ. Có thể một trong các API bị lỗi.");
      }
    } catch (err) {
      setError("Lỗi kết nối đến Backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchData();
  };

  const formatVND = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div style={{ paddingBottom: "40px" }}>
      <h2 style={{ marginBottom: "20px", color: "#111827" }}>📊 Thống Kê Tổng Quan</h2>
      
      <form onSubmit={handleFilter} style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end", backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", gap: "15px", paddingRight: "20px", borderRight: "2px solid #e5e7eb" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#4b5563" }}>Từ ngày:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#4b5563" }}>Đến ngày:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#4b5563" }}>Năm (Cho biểu đồ tháng):</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: "9px", borderRadius: "4px", border: "1px solid #d1d5db", width: "120px" }}>
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
        </div>
        <button type="submit" style={{ padding: "9px 20px", backgroundColor: "#111827", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", height: "36px" }}>
          Lọc Dữ Liệu
        </button>
      </form>

      {isLoading && <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>⏳ Đang tải toàn bộ dữ liệu...</div>}
      {error && <div style={{ padding: "15px", color: "#b91c1c", backgroundColor: "#fee2e2", borderRadius: "8px", marginBottom: "20px" }}>{error}</div>}

      {!isLoading && !error && stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Tổng Doanh Thu</h3>
              <p style={{ ...cardValueStyle, color: "#10b981" }}>{stats.totalRevenue ? stats.totalRevenue.toLocaleString() : "0"} đ</p>
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Tổng Đơn Hàng</h3>
              <p style={{ ...cardValueStyle, color: "#3b82f6" }}>{stats.totalOrders ?? 0}</p>
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Tổng Khách Hàng</h3>
              <p style={{ ...cardValueStyle, color: "#f59e0b" }}>{stats.totalUsers ?? 0}</p>
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Số Sản Phẩm</h3>
              <p style={{ ...cardValueStyle, color: "#8b5cf6" }}>{stats.totalProducts ?? 0}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
              <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>📈 Doanh Thu Theo Ngày</h3>
                <div style={{ width: "100%", height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 12}} /> 
                      <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{fontSize: 12}} />
                      <Tooltip formatter={(value) => formatVND(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>📊 Doanh Thu Theo Tháng (Năm {selectedYear})</h3>
                <div style={{ width: "100%", height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{fontSize: 12}} />
                      <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{fontSize: 12}} />
                      <Tooltip formatter={(value) => formatVND(value)} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                      <Legend />
                      <Bar dataKey="revenue" name={`Doanh thu ${selectedYear}`} fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flex: 1 }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>🔥 Top 10 Bán Chạy</h3>
                {popularFrames.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {popularFrames.map((frame, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "28px", height: "28px", backgroundColor: index < 3 ? "#fef08a" : "#f3f4f6", color: index < 3 ? "#ca8a04" : "#6b7280", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                            {index + 1}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: "600", color: "#374151", fontSize: "14px" }}>{frame.name || frame.frameName || "Tên kính"}</p>
                            <p style={{ margin: 0, color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>Đã bán: <span style={{ fontWeight: "bold", color: "#10b981" }}>{frame.soldQuantity || frame.quantity || 0}</span></p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>Không có dữ liệu.</p>
                )}
              </div>

              <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flex: 1 }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>📦 Trạng Thái Đơn Hàng</h3>
                {orderSummary.length > 0 ? (
                  <div style={{ width: "100%", height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={orderSummary} 
                          cx="50%" cy="50%" 
                          innerRadius={60} 
                          outerRadius={80} 
                          paddingAngle={5} 
                          dataKey="count" 
                          nameKey="status"
                        >
                          {orderSummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>Không có dữ liệu đơn hàng.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle = { backgroundColor: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "5px solid #111827", display: "flex", flexDirection: "column", justifyContent: "center" };
const cardTitleStyle = { margin: 0, color: "#6b7280", fontSize: "14px", textTransform: "uppercase" };
const cardValueStyle = { fontSize: "28px", fontWeight: "bold", margin: "10px 0 0 0" };