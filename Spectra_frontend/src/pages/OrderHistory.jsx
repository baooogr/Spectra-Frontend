import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useExchangeRate } from "../api";
import "./OrderHistory.css";

export default function OrderHistory() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [preorders, setPreorders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "orders" | "preorders"

  const { rate: exchangeRate } = useExchangeRate();

  // ⚡ Cập nhật hàm format để chỉ hiện USD và xử lý tỷ giá nếu là số VND
  const formatCurrency = (amount) => {
    let val = Number(amount) || 0;
    // Nếu số tiền > 10.000, khả năng cao là VND -> chia tỷ giá để ra USD
    if (val > 10000) {
      val = val / (exchangeRate || 25400);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  useEffect(() => {
    const token =
      user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAll = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Gọi song song cả 2 API
        const [ordersRes, preordersRes] = await Promise.all([
          fetch(
            "https://myspectra.runasp.net/api/OrdersV2/my?page=1&pageSize=100",
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          ),
          fetch("https://myspectra.runasp.net/api/Preorders/my", {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const items = data.items || (Array.isArray(data) ? data : []);
          setOrders(items);
        } else {
          console.warn("Orders API error:", ordersRes.status);
        }

        if (preordersRes.ok) {
          const data = await preordersRes.json();
          setPreorders(data.items || data || []);
        } else if (preordersRes.status !== 404) {
          console.warn("Preorders API error:", preordersRes.status);
        }
      } catch (err) {
        setError("Connection error. Could not load order history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [user, navigate]);

  const translateStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return { text: "Pending", color: "#f59e0b" };
    if (s === "processing") return { text: "Processing", color: "#3b82f6" };
    if (s === "shipped" || s === "delivering")
      return { text: "Shipping", color: "#8b5cf6" };
    if (s === "delivered" || s === "completed")
      return { text: "Success", color: "#10b981" };
    if (s === "cancelled") return { text: "Cancelled", color: "#ef4444" };
    if (s === "awaiting_payment" || s === "awaitingpayment")
      return { text: "Awaiting Payment", color: "#f97316" };
    if (s === "confirmed") return { text: "Confirmed", color: "#059669" };
    if (s === "paid") return { text: "Paid", color: "#059669" };
    if (s === "converted") return { text: "Processing", color: "#3b82f6" };
    return { text: status || "Unknown", color: "gray" };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US");
  };

  // Sắp xếp theo ngày mới nhất
  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.orderDate || b.createdAt || 0) -
      new Date(a.orderDate || a.createdAt || 0),
  );
  const sortedPreorders = [...preorders].sort(
    (a, b) =>
      new Date(b.createdAt || b.orderDate || 0) -
      new Date(a.createdAt || a.orderDate || 0),
  );

  const tabStyle = (tab) => ({
    padding: "10px 24px",
    borderRadius: "8px 8px 0 0",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    backgroundColor: activeTab === tab ? "white" : "#f3f4f6",
    color: activeTab === tab ? "#111827" : "#6b7280",
    borderBottom:
      activeTab === tab ? "3px solid #2563eb" : "3px solid transparent",
    transition: "all 0.2s",
  });

  // ===== RENDER CARD ĐƠN THƯỜNG (GIỮ NGUYÊN - KHÔNG ĐỘNG VÀO) =====
  const OrderCard = ({ order }) => {
    const statusObj = translateStatus(order.status);
    const itemsList =
      order.orderDetails || order.orderItems || order.items || [];
    const totalQty =
      order.totalQuantity ||
      order.totalItems ||
      itemsList.reduce(
        (sum, item) => sum + (item.quantity || item.qty || 1),
        0,
      );

    return (
      <div
        style={{
          marginBottom: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px",
          backgroundColor: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #f3f4f6",
            paddingBottom: "12px",
            marginBottom: "12px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              <b>Order Code:</b> #{order.id || order.orderId}
            </p>
            {order.convertedFromPreorderId && (
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "12px",
                  color: "#1d4ed8",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#bfdbfe",
                    color: "#1e3a8a",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginRight: "6px",
                  }}
                >
                  Converted from Pre-order
                </span>
                #{String(order.convertedFromPreorderId).slice(0, 8)}
              </p>
            )}
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
              Order Date: {formatDate(order.orderDate || order.createdAt)}
            </p>
          </div>
          <span
            style={{
              fontWeight: "bold",
              color: statusObj.color,
              backgroundColor: `${statusObj.color}18`,
              padding: "5px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              alignSelf: "flex-start",
            }}
          >
            {statusObj.text}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <p style={{ margin: "0 0 4px 0" }}>
              Total Amount:{" "}
              <strong style={{ color: "#111827", fontSize: "18px" }}>
                {formatCurrency(order.totalAmount || order.totalPrice || 0)}
              </strong>
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              Qty: <b>{totalQty}</b>
            </p>
          </div>
          <Link
            to={`/orders/${order.id || order.orderId}`}
            style={{
              padding: "8px 18px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              textDecoration: "none",
              color: "#111827",
              fontWeight: "500",
              fontSize: "14px",
              backgroundColor: "#f9fafb",
            }}
          >
            Details →
          </Link>
        </div>
      </div>
    );
  };

  // ===== RENDER CARD ĐƠN PRE-ORDER (ĐÃ SỬA) =====
  const PreorderCard = ({ order }) => {
    // Nếu preorder đã convert → tìm Order liên kết để lấy status thật
    const linkedOrder =
      order.status?.toLowerCase() === "converted"
        ? orders.find(
          (o) => o.convertedFromPreorderId === (order.id || order.preorderId),
        )
        : null;
    const displayStatus = linkedOrder ? linkedOrder.status : order.status;
    const statusObj = translateStatus(displayStatus);

    // Lấy danh sách items — hỗ trợ nhiều field name BE có thể trả về
    const itemsList = (
      order.preorderItems ||
      order.preorderDetails ||
      order.orderItems ||
      order.items ||
      []
    ).filter(Boolean);

    const totalQty = itemsList.reduce(
      (sum, item) => sum + (item.quantity || item.qty || 1),
      0,
    );

    // Tổng tiền: ưu tiên từ data, fallback tính từ items
    const [finalAmount, setFinalAmount] = useState(
      order.totalAmount ||
      order.totalPrice ||
      itemsList.reduce((sum, item) => {
        const price =
          item.unitPrice || item.orderPrice || item.preorderPrice || 0;
        const qty = item.quantity || item.qty || 1;
        return sum + price * qty;
      }, 0),
    );

    // Nếu vẫn = 0 thì gọi Payment API để lấy số tiền đã thanh toán (fallback)
    useEffect(() => {
      if (finalAmount > 0) return;
      const fetchPaymentAmount = async () => {
        try {
          const token =
            user?.token || JSON.parse(localStorage.getItem("user"))?.token;
          const preId = order.id || order.preorderId;
          const res = await fetch(
            `https://myspectra.runasp.net/api/Payments/preorder/${preId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data[0]?.amount) {
              setFinalAmount(data[0].amount);
            } else if (data?.amount) {
              setFinalAmount(data.amount);
            }
          }
        } catch (err) {
          console.error("Payment info error:", err);
        }
      };
      fetchPaymentAmount();
    }, [order, finalAmount]);

    return (
      <div
        style={{
          marginBottom: "16px",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          padding: "20px",
          backgroundColor: "#eff6ff",
          boxShadow: "0 1px 4px rgba(37,99,235,0.08)",
        }}
      >
        {/* Badge PRE-ORDER */}
        <div style={{ marginBottom: "10px" }}>
          <span
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              fontSize: "11px",
              fontWeight: "bold",
              padding: "3px 10px",
              borderRadius: "20px",
              letterSpacing: "0.5px",
            }}
          >
            PRE-ORDER
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #dbeafe",
            paddingBottom: "12px",
            marginBottom: "12px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                color: "#1e40af",
              }}
            >
              <b>Pre-order Code:</b> #{order.id || order.preorderId}
            </p>
            {linkedOrder && (
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "12px",
                  color: "#1d4ed8",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#dbeafe",
                    color: "#1e3a8a",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontWeight: "600",
                    fontSize: "11px",
                    marginRight: "6px",
                  }}
                >
                  Converted to Standard Order
                </span>
                #{String(linkedOrder.orderId || linkedOrder.id).slice(0, 8)}
              </p>
            )}
            <p
              style={{
                margin: 0,
                fontWeight: "bold",
                fontSize: "14px",
                color: "#1e3a8a",
              }}
            >
              Date: {formatDate(order.createdAt || order.orderDate)}
            </p>
            {order.expectedDate && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "13px",
                  color: "#1d4ed8",
                }}
              >
                Est. Delivery: {formatDate(order.expectedDate)}
              </p>
            )}
          </div>
          <span
            style={{
              fontWeight: "bold",
              color: statusObj.color,
              backgroundColor: `${statusObj.color}18`,
              padding: "5px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              alignSelf: "flex-start",
            }}
          >
            {statusObj.text}
          </span>
        </div>

        {/* Danh sách tên sản phẩm (nếu BE trả về items trong list) */}
        {itemsList.length > 0 && (
          <div
            style={{
              borderBottom: "1px solid #dbeafe",
              paddingBottom: "10px",
              marginBottom: "12px",
            }}
          >
            {itemsList.slice(0, 3).map((item, idx) => {
              const frameName =
                item.frame?.frameName || item.frameName || "Eyeglass frame";
              const qty = item.quantity || item.qty || 1;
              const hasLens = !!(
                item.lensType ||
                item.lensTypeId ||
                item.lensTypeName
              );
              return (
                <p
                  key={item.preorderItemId || item.orderItemId || idx}
                  style={{
                    margin: "3px 0",
                    fontSize: "14px",
                    color: "#1e3a8a",
                  }}
                >
                  • {frameName} <span style={{ color: "#1e40af" }}>x{qty}</span>
                  {!hasLens && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "12px",
                        color: "#92400e",
                        fontWeight: "600",
                      }}
                    >
                      (Frame only)
                    </span>
                  )}
                </p>
              );
            })}
            {itemsList.length > 3 && (
              <p
                style={{ margin: "3px 0", fontSize: "13px", color: "#6b7280" }}
              >
                ...and {itemsList.length - 3} other items
              </p>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <p style={{ margin: "0 0 4px 0" }}>
              Total:{" "}
              <strong style={{ color: "#1e40af", fontSize: "18px" }}>
                {formatCurrency(finalAmount || 0)}
              </strong>
            </p>
            {totalQty > 0 && (
              <p style={{ margin: 0, fontSize: "13px", color: "#1e40af" }}>
                Items: <b>{totalQty}</b>
              </p>
            )}
          </div>

          <Link
            to={`/preorders/${order.id || order.preorderId}`}
            style={{
              padding: "8px 18px",
              border: "1px solid #93c5fd",
              borderRadius: "6px",
              textDecoration: "none",
              color: "#1e40af",
              fontWeight: "500",
              fontSize: "14px",
              backgroundColor: "white",
              cursor: "pointer",
              display: "inline-block",
            }}
          >
            Details →
          </Link>
        </div>
      </div>
    );
  };

  const totalCount = orders.length + preorders.length;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <h2 style={{ marginBottom: "6px" }}>Order History</h2>
      <p style={{ color: "#6b7280", marginBottom: "24px", fontSize: "14px" }}>
        Total: <b>{totalCount}</b> orders ({orders.length} standard +{" "}
        {preorders.length} pre-order)
      </p>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "0",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <button style={tabStyle("all")} onClick={() => setActiveTab("all")}>
          All ({totalCount})
        </button>
        <button
          style={tabStyle("orders")}
          onClick={() => setActiveTab("orders")}
        >
          Standard ({orders.length})
        </button>
        <button
          style={tabStyle("preorders")}
          onClick={() => setActiveTab("preorders")}
        >
          Pre-order ({preorders.length})
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          padding: "24px",
          marginBottom: "40px",
        }}
      >
        {isLoading && (
          <p
            style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}
          >
            Loading...
          </p>
        )}

        {error && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fee2e2",
              borderRadius: "8px",
              color: "#b91c1c",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && totalCount === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#6b7280" }}>You don't have any orders yet.</p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                marginTop: "12px",
                padding: "10px 24px",
                background: "#111827",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
              }}
            >
              Start Shopping
            </Link>
          </div>
        )}

        {!isLoading && (
          <>
            {/* TAB: TẤT CẢ — Gộp và sắp xếp theo ngày mới nhất */}
            {activeTab === "all" && (
              <>
                {[
                  ...sortedOrders.map((o) => ({ ...o, _type: "order" })),
                  ...sortedPreorders.map((o) => ({ ...o, _type: "preorder" })),
                ]
                  .sort(
                    (a, b) =>
                      new Date(b.orderDate || b.createdAt || 0) -
                      new Date(a.orderDate || a.createdAt || 0),
                  )
                  .map((item) =>
                    item._type === "preorder" ? (
                      <PreorderCard
                        key={`pre-${item.id || item.preorderId}`}
                        order={item}
                      />
                    ) : (
                      <OrderCard
                        key={`ord-${item.id || item.orderId}`}
                        order={item}
                      />
                    ),
                  )}
              </>
            )}

            {/* TAB: ĐƠN THƯỜNG */}
            {activeTab === "orders" && (
              <>
                {sortedOrders.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#6b7280",
                      padding: "30px 0",
                    }}
                  >
                    No standard orders found.
                  </p>
                ) : (
                  sortedOrders.map((order) => (
                    <OrderCard key={order.id || order.orderId} order={order} />
                  ))
                )}
              </>
            )}

            {/* TAB: ĐẶT TRƯỚC */}
            {activeTab === "preorders" && (
              <>
                {sortedPreorders.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#6b7280",
                      padding: "30px 0",
                    }}
                  >
                    No pre-orders found.
                  </p>
                ) : (
                  sortedPreorders.map((order) => (
                    <PreorderCard
                      key={order.id || order.preorderId}
                      order={order}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}