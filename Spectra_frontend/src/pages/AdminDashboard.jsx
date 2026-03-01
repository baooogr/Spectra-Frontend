import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './AdminDashboard.css'; // IMPORT FILE CSS MỚI

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
    setIsLoading(true); setError("");

    if (startDate || endDate) {
      if (!startDate || !endDate) {
        setError("⚠️ Vui lòng chọn đầy đủ cả 'Từ ngày' và 'Đến ngày'.");
        setIsLoading(false); return; 
      }
      if (new Date(startDate) > new Date(endDate)) {
        setError("⚠️ 'Từ ngày' không được lớn hơn 'Đến ngày'. Vui lòng chọn lại!");
        setIsLoading(false); return; 
      }
    }

    try {
      const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
      if (!token) {
        setError("Bạn chưa đăng nhập hoặc không có quyền Admin!");
        setIsLoading(false); return;
      }

      const dailyParams = new URLSearchParams();
      if (startDate) dailyParams.append("startDate", new Date(startDate).toISOString());
      if (endDate) dailyParams.append("endDate", new Date(endDate).toISOString());
      const dailyQueryString = dailyParams.toString() ? `?${dailyParams.toString()}` : "";

      const popularParams = new URLSearchParams(dailyParams);
      popularParams.append("limit", "10");

      const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

      const [statsRes, dailyRes, monthlyRes, popularRes, orderRes] = await Promise.all([
        fetch(`https://myspectra.runasp.net/api/Dashboard/statistics${dailyQueryString}`, { headers }),
        fetch(`https://myspectra.runasp.net/api/Dashboard/revenue/daily${dailyQueryString}`, { headers }),
        fetch(`https://myspectra.runasp.net/api/Dashboard/revenue/monthly?year=${selectedYear}`, { headers }),
        fetch(`https://myspectra.runasp.net/api/Dashboard/popular-frames?${popularParams.toString()}`, { headers }),
        fetch(`https://myspectra.runasp.net/api/Dashboard/orders/summary`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (dailyRes.ok) {
        const dData = await dailyRes.json();
        setDailyRevenue(dData.map(d => ({ date: new Date(d.date).toLocaleDateString('vi-VN'), revenue: d.revenue })));
      }
      if (monthlyRes.ok) {
        const mData = await monthlyRes.json();
        setMonthlyRevenue(mData.map(m => ({ month: `Tháng ${m.month}`, revenue: m.revenue })));
      }
      if (popularRes.ok) setPopularFrames(await popularRes.json());
      if (orderRes.ok) setOrderSummary(await orderRes.json());
      
    } catch (err) { setError("Không thể kết nối đến máy chủ."); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilter = (e) => { 
    if(e) e.preventDefault(); 
    fetchData(); 
  };

  const formatVND = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="admin-dashboard-container">
      <h2 className="admin-dashboard-title">📊 Tổng Quan Kinh Doanh</h2>

      <div className="dashboard-filters">
        <div className="filter-group">
          <div className="filter-item"><label>Từ ngày:</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div className="filter-item"><label>Đến ngày:</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
        
        <div className="filter-item" style={{ paddingLeft: '15px' }}>
          <label>Năm (Cho BĐ Tháng):</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <button onClick={handleFilter} className="btn-filter">Lọc Dữ Liệu</button>
      </div>

      {error && <div className="dashboard-msg msg-error">❌ {error}</div>}
      {isLoading && <div className="dashboard-msg msg-loading">⏳ Đang tải dữ liệu báo cáo...</div>}

      {!isLoading && !error && stats && (
        <>
          <div className="summary-grid">
            <div className="summary-card"><h3 className="card-title">💵 Doanh Thu</h3><p className="card-value">{formatVND(stats.totalRevenue)}</p></div>
            <div className="summary-card"><h3 className="card-title">📦 Đơn Hàng</h3><p className="card-value">{stats.totalOrders}</p></div>
            <div className="summary-card"><h3 className="card-title">👓 Kính Đã Bán</h3><p className="card-value">{stats.totalFramesSold}</p></div>
            <div className="summary-card"><h3 className="card-title">👥 Khách Mới</h3><p className="card-value">{stats.newCustomers}</p></div>
            <div className="summary-card"><h3 className="card-title">Sản Phẩm</h3><p className="card-value highlight">{stats.totalProducts ?? 0}</p></div>
          </div>

          <div className="dashboard-main-grid">
            {/* CỘT TRÁI - BIỂU ĐỒ LỚN */}
            <div className="main-left-column">
              <div className="chart-card">
                <h3 className="chart-title">📈 Doanh Thu Theo Ngày</h3>
                {dailyRevenue.length > 0 ? (
                  <div className="chart-wrapper">
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
                ) : <p className="empty-data-msg">Không có dữ liệu.</p>}
              </div>

              <div className="chart-card">
                <h3 className="chart-title">📊 Doanh Thu Theo Tháng (Năm {selectedYear})</h3>
                {monthlyRevenue.length > 0 ? (
                  <div className="chart-wrapper">
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
                ) : <p className="empty-data-msg">Không có dữ liệu.</p>}
              </div>
            </div>

            {/* CỘT PHẢI - THÔNG TIN CHI TIẾT */}
            <div className="main-right-column">
              <div className="chart-card">
                <h3 className="chart-title">🔥 Top 10 Bán Chạy</h3>
                {popularFrames.length > 0 ? (
                  <div className="top-list">
                    {popularFrames.map((frame, index) => (
                      <div key={index} className="top-item">
                        <div className={`top-item-index ${index < 3 ? 'top-3' : 'normal'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="top-item-name">{frame.name || frame.frameName || "Tên kính"}</p>
                          <p className="top-item-sold">Đã bán: <span>{frame.soldQuantity || frame.quantity || 0}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="empty-data-msg">Không có dữ liệu.</p>}
              </div>

              <div className="chart-card">
                <h3 className="chart-title">📦 Trạng Thái Đơn Hàng</h3>
                {orderSummary.length > 0 ? (
                  <div className="pie-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={orderSummary} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="status">
                          {orderSummary.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="empty-data-msg">Không có dữ liệu.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}