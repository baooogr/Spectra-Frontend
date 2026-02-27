import { useParams, Link } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import "./OrderDetail.css";

function OrderDetail() {
    const { id } = useParams();
    const { orders } = useOrder();
    const order = orders?.find((o) => String(o.id) === String(id));

    if (!order) {
        return (
            <div className="order-detail-container">
                <h2>Không tìm thấy đơn hàng</h2>
                <Link to="/orders">← Quay lại lịch sử đơn hàng</Link>
            </div>
        );
    }

    return (
        <div className="order-detail-container">
            <h2>Chi tiết đơn hàng</h2>

            <p>
                <b>Order ID:</b> {order.id}
            </p>
            <p>
                <b>Ngày tạo:</b> {order.date}
            </p>
            <p>
                <b>Người nhận:</b> {order.receiver}
            </p>
            <p>
                <b>Số điện thoại:</b> {order.phone}
            </p>
            <p>
                <b>Địa chỉ:</b> {order.address}
            </p>
            <p>
                <b>Trạng thái đơn hàng:</b>{" "}
                <span className={`order-status ${order.status.toLowerCase()}`}>
                    {order.status}
                </span>
            </p>

            <h3 className="section-title">Sản phẩm</h3>

            <div className="order-table-wrapper">
                <table className="order-table">
                    <thead>
                        <tr>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.qty}</td>
                                <td>${item.price}</td>
                                <td>${(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h3 className="order-grand-total">
                Tổng tiền: ${order.total.toFixed(2)}
            </h3>

            <div style={{ marginTop: "24px" }}>
                <Link to="/orders" style={{ color: "#0070c9", fontWeight: 600 }}>
                    ← Quay lại lịch sử đơn hàng
                </Link>
            </div>
        </div>
    );
}

export default OrderDetail;