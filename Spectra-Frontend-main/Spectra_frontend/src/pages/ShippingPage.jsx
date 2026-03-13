import React, { useState, useEffect } from "react";
import "./ShippingPage.css";

export default function ShippingPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  let token = "";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      token = JSON.parse(userStr).token;
    }
  } catch (error) {
    console.error("Lỗi đọc token:", error);
  }

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Orders?page=1&pageSize=50", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("👉 Dữ liệu API:", data);
        
        if (data && Array.isArray(data.items)) {
          setOrders(data.items);
        } else if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      } else {
        setErrorMsg(`Không thể tải dữ liệu. Lỗi máy chủ: ${res.status}`);
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối mạng: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setIsLoading(false);
      setErrorMsg("Bạn chưa đăng nhập hoặc không có quyền truy cập!");
    }
  }, [token]);

  const handleUpdateTracking = async (orderId) => {
    const trackingNum = prompt("Nhập mã vận đơn (Tracking Number) mới:");
    if (!trackingNum) return;

    const carrierName = prompt("Nhập đơn vị vận chuyển (VD: VNPost, GHN...):") || "VNPost";

    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Shipping/orders/${orderId}/tracking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ trackingNumber: trackingNum, carrier: carrierName })
      });

      if (res.ok) {
        alert("Cập nhật thành công!");
        fetchOrders(); 
      } else {
        alert("Có lỗi xảy ra khi cập nhật!");
      }
    } catch (err) {
      alert("Lỗi kết nối mạng.");
    }
  };

  if (errorMsg) {
    return (
      <div className="shipping-page-container" style={{ textAlign: "center", paddingTop: "50px" }}>
        <h2 style={{ color: "red" }}>❌ {errorMsg}</h2>
      </div>
    );
  }

  return (
    <div className="shipping-page-container">
      <h2 className="shipping-header">Quản lý Vận chuyển & Mã vận đơn</h2>
      
      {isLoading ? <p>⏳ Đang tải dữ liệu...</p> : (
        <table className="shipping-table">
          <thead>
            <tr>
              <th>Mã Đơn Hàng</th>
              <th>Khách Hàng</th>
              <th>Trạng Thái</th>
              <th>Mã Vận Đơn</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                  Chưa có đơn hàng nào trong hệ thống.
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const rawId = order.orderId || order.id || `UNKNOWN-${index}`;
                const displayId = String(rawId).substring(0, 8);

                return (
                  <tr key={rawId}>
                    <td><strong>#{displayId}</strong></td>
                    <td>{order.fullName || order.customerName || "Khách hàng"}</td>
                    <td>
                       <span style={{ fontWeight: "bold", textTransform: "capitalize", color: order.status === "shipped" ? "green" : "inherit" }}>
                          {order.status || "N/A"}
                       </span>
                    </td>
                    <td>
                      <span className={order.trackingNumber ? "badge-tracking" : ""}>
                        {order.trackingNumber || "Chưa có"}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-update-tracking"
                        onClick={() => handleUpdateTracking(rawId)}
                      >
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}