import "./OrderHistory.css";
import { Link } from "react-router-dom";

const orders = [
  {
    id: "OD001",
    date: "2025-02-10",
    status: "Completed",
    total: 45.85,
    items: [
      { name: "Graphite Point Guard Glasses", qty: 1, price: 15.95 },
      { name: "Classic Frame Black", qty: 2, price: 14.95 }
    ]
  },
  {
    id: "OD002",
    date: "2025-02-15",
    status: "Pending",
    total: 29.95,
    items: [
      { name: "Metal Square Glasses", qty: 1, price: 29.95 }
    ]
  }
];

function OrderHistory() {
  return (
    <div className="order-container">
      <h2>Order History</h2>

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <div>
              <p><b>Order ID:</b> {order.id}</p>
              <p className="order-date">{order.date}</p>
            </div>

            <span className={`order-status ${order.status.toLowerCase()}`}>
              {order.status}
            </span>
          </div>

          <div className="order-items">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <span>{item.name}</span>
                <span>x{item.qty}</span>
                <span>${item.price}</span>
              </div>
            ))}
          </div>

          <div className="order-footer">
            <p className="order-total">
              Total: <b>${order.total}</b>
            </p>
            <Link to={`/orders/${order.id}`} className="view-btn">
              View details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderHistory;