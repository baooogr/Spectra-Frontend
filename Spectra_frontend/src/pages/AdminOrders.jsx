// Import React và các hook cần dùng:
// - useState: tạo state cục bộ trong component
// - useEffect: chạy side effect như gọi API sau khi render
// - useContext: lấy dữ liệu từ Context
// - useCallback: ghi nhớ hàm để tránh tạo lại không cần thiết
import React, { useState, useEffect, useContext, useCallback } from "react";

// Import UserContext để lấy thông tin user đang đăng nhập,
// đặc biệt là token dùng để gọi API có xác thực
import { UserContext } from "../context/UserContext";

// Import hàm tiện ích để làm sạch / format địa chỉ,
// vì trong code có trường hợp address chứa dữ liệu cấu trúc đặc biệt
import { getAddressDisplayString } from "../utils/vietnamAddress";

// Import file CSS riêng cho giao diện trang quản lý đơn hàng
import "./AdminOrders.css";

// =============================================================================
// HELPER: Extract customer info from shippingAddress
// CheckoutPage format: "[Name - Phone - Email] Address"
// =============================================================================

// Đây là hàm helper dùng để "bóc tách" thông tin từ chuỗi shippingAddress.
// Vì hệ thống cũ / mới có thể lưu shippingAddress theo nhiều format khác nhau.
// Ví dụ format chuẩn mới là:
//   [Nguyen Van A - 0123456789 - email@gmail.com] 123 Đường ABC
//
// Hàm này trả về object gồm:
// - name
// - phone
// - email
// - address
function parseShippingInfo(shippingAddress) {
  // Nếu shippingAddress không tồn tại (null, undefined, rỗng),
  // trả về object mặc định:
  // - name, phone, email = null
  // - address giữ nguyên shippingAddress
  if (!shippingAddress)
    return { name: null, phone: null, email: null, address: shippingAddress };

  // Regex format mới:
  // [Tên - SĐT - Email] Địa chỉ
  //
  // Giải thích regex:
  // ^                : bắt đầu chuỗi
  // \[(.*?) - ...\]  : lấy nội dung trong []
  // (.*?)            : lấy từng phần name/phone/email
  // (.*)$            : phần còn lại là địa chỉ
  const matchNew = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\] (.*)$/);

  // Regex này có vẻ để xử lý dữ liệu bị lỗi format,
  // ví dụ có dấu ] bị đặt sai vị trí
  const matchError = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*?)] (.*)$/);

  // Regex format cũ:
  // [Tên - SĐT] Địa chỉ
  // Không có email
  const matchOld = shippingAddress.match(/^\[(.*?) - (.*?)\] (.*)$/);

  // Nếu khớp format mới
  if (matchNew)
    return {
      // Phần đầu tiên trong [] là tên
      name: matchNew[1],

      // Phần thứ 2 là số điện thoại
      phone: matchNew[2],

      // Phần thứ 3 là email, trim() để bỏ khoảng trắng đầu/cuối nếu có
      email: matchNew[3].trim(),

      // Phần sau ] là địa chỉ
      address: matchNew[4],
    };

  // Nếu khớp format lỗi
  if (matchError)
    return {
      // Vẫn cố gắng tách tên
      name: matchError[1],

      // Tách số điện thoại
      phone: matchError[2],

      // Tách email (phần regex lỗi vẫn cố lấy)
      email: matchError[3].trim(),

      // Địa chỉ còn lại
      address: matchError[4],
    };

  // Nếu khớp format cũ
  if (matchOld)
    return {
      // Lấy tên
      name: matchOld[1],

      // Lấy phone
      phone: matchOld[2],

      // Format cũ không có email
      email: null,

      // Phần còn lại là địa chỉ
      address: matchOld[3],
    };

  // Nếu không match bất kỳ format nào,
  // coi như không tách được dữ liệu cấu trúc,
  // trả về địa chỉ nguyên bản
  return { name: null, phone: null, email: null, address: shippingAddress };
}

// =============================================================================
// HELPER: Format prescription values
// =============================================================================

// Hàm này dùng để format các chỉ số mắt / toa kính (prescription),
// ví dụ sphere, cylinder...
function fmtRx(val) {
  // Nếu giá trị là null hoặc undefined thì hiển thị dấu "—"
  // để thể hiện "không có dữ liệu"
  if (val === null || val === undefined) return "—";

  // Ép giá trị về số
  const n = Number(val);

  // Nếu số bằng 0 thì hiển thị 0.00
  if (n === 0) return "0.00";

  // Nếu số dương thì thêm dấu "+"
  // ví dụ 1.25 -> +1.25
  // Nếu số âm thì để nguyên dấu âm
  return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

// =============================================================================
// HELPER: Format payment status
// =============================================================================

// Hàm này dùng để map trạng thái thanh toán từ backend
// sang object có:
// - label: text hiển thị
// - color: màu chữ
// - bg: màu nền badge
function formatPaymentStatus(status) {
  // Nếu không có status thì trả về null
  if (!status) return null;

  // Bảng mapping trạng thái thanh toán
  const map = {
    // Chưa thanh toán
    pending: { label: "Pending Payment", color: "#d97706", bg: "#fef3c7" },

    // Đang xử lý thanh toán
    processing: { label: "Processing", color: "#2563eb", bg: "#eff6ff" },

    // Đã thanh toán xong
    completed: { label: "Paid ✓", color: "#15803d", bg: "#f0fdf4" },

    // Thanh toán thất bại
    failed: { label: "Failed", color: "#dc2626", bg: "#fee2e2" },

    // Bị hủy
    cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },

    // Đã hoàn tiền
    refunded: { label: "Refunded", color: "#7e22ce", bg: "#faf5ff" },
  };

  // Trả về object tương ứng với status (chuyển về lowercase để tránh lỗi hoa/thường)
  // Nếu không có trong map thì trả object mặc định
  return (
    map[status.toLowerCase()] || {
      label: status,
      color: "#374151",
      bg: "#f3f4f6",
    }
  );
}

// Style dùng chung cho <th> trong bảng prescription
const thStyle = {
  // padding bên trong ô
  padding: "5px 8px",

  // căn giữa nội dung
  textAlign: "center",

  // chữ đậm
  fontWeight: "bold",

  // màu chữ nâu đậm
  color: "#78350f",

  // viền vàng nhạt
  border: "1px solid #fde68a",
};

// Style dùng chung cho <td> trong bảng prescription
const tdStyle = {
  // khoảng cách trong ô
  padding: "5px 8px",

  // căn giữa nội dung
  textAlign: "center",

  // viền đồng bộ với th
  border: "1px solid #fde68a",
};

// =============================================================================
// COMPONENT: PrescriptionCard (collapsible, lazy-fetch)
// =============================================================================

// Component này dùng để hiển thị toa kính / prescription đi kèm item.
// Có 2 điểm quan trọng:
// 1) Có thể collapse / expand
// 2) Lazy-fetch: chỉ gọi API lấy prescription khi người dùng mở chi tiết
//
// Props:
// - prescription: dữ liệu toa kính đã có sẵn trong item (nếu có)
// - prescriptionId: id toa kính để gọi API nếu cần
// - headers: headers có Authorization token
function PrescriptionCard({ prescription, prescriptionId, headers }) {
  // rxData chứa dữ liệu prescription thực tế để hiển thị.
  // Nếu prop prescription đã có dữ liệu sẵn thì dùng luôn,
  // không cần gọi API nữa.
  const [rxData, setRxData] = useState(prescription || null);

  // State loading để biết đang fetch prescription hay không
  const [isLoading, setIsLoading] = useState(false);

  // State mở / đóng thẻ prescription
  const [isExpanded, setIsExpanded] = useState(false);

  // State đánh dấu fetch bị lỗi
  const [fetchError, setFetchError] = useState(false);

  // Dùng useCallback để React ghi nhớ hàm handleExpand,
  // tránh tạo lại hàm không cần thiết ở mỗi lần render
  const handleExpand = useCallback(async () => {
    // Nếu đang mở rồi, bấm lần nữa thì đóng lại
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // Nếu đang đóng, bấm vào thì mở ra
    setIsExpanded(true);

    // Nếu đã có rxData rồi thì không cần gọi API nữa
    if (rxData) return;

    // Nếu không có prescriptionId thì không thể fetch
    if (!prescriptionId) return;

    // Bắt đầu loading
    setIsLoading(true);

    // Reset trạng thái lỗi
    setFetchError(false);

    try {
      // Gọi API lấy chi tiết prescription theo ID
      // API: Prescriptions/{prescriptionId}
      const res = await fetch(
        `https://myspectra.runasp.net/api/Prescriptions/${prescriptionId}`,
        { headers },
      );

      // Nếu API trả về thành công
      if (res.ok) {
        // Parse JSON và lưu vào state
        setRxData(await res.json());
      } else {
        // Nếu response không ok thì đánh dấu lỗi
        setFetchError(true);
      }
    } catch {
      // Nếu fetch lỗi mạng / lỗi runtime
      setFetchError(true);
    } finally {
      // Dù thành công hay lỗi cũng tắt loading
      setIsLoading(false);
    }
  }, [isExpanded, rxData, prescriptionId, headers]);

  // Nếu không có dữ liệu prescription sẵn
  // và cũng không có prescriptionId để fetch,
  // thì không render gì cả
  if (!prescription && !prescriptionId) return null;

  // JSX render component
  return (
    <div
      style={{
        // tạo khoảng cách phía trên
        marginTop: "8px",

        // viền vàng
        border: "1px solid #fbbf24",

        // bo góc
        borderRadius: "8px",

        // nền vàng nhạt
        backgroundColor: "#fffbeb",

        // ẩn phần tràn ra ngoài bo góc
        overflow: "hidden",
      }}
    >
      <button
        // Khi bấm thì mở/đóng card
        onClick={handleExpand}
        style={{
          // nút chiếm toàn bộ chiều ngang
          width: "100%",

          // dùng flex để canh 2 bên
          display: "flex",

          // canh giữa theo chiều dọc
          alignItems: "center",

          // đẩy nội dung ra 2 đầu
          justifyContent: "space-between",

          // padding trong nút
          padding: "8px 12px",

          // bỏ nền mặc định của button
          background: "none",

          // bỏ border mặc định
          border: "none",

          // con trỏ hình bàn tay
          cursor: "pointer",

          // cỡ chữ
          fontSize: "13px",

          // chữ đậm
          fontWeight: "bold",

          // màu chữ nâu
          color: "#92400e",
        }}
      >
        {/* Bên trái là tiêu đề */}
        <span>Attached Prescription</span>

        {/* Bên phải là trạng thái đang mở hay đóng */}
        <span style={{ fontSize: "11px", color: "#b45309" }}>
          {isExpanded ? "▲ Collapse" : "▼ View Details"}
        </span>
      </button>

      {/* Chỉ hiển thị phần nội dung khi isExpanded = true */}
      {isExpanded && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid #fde68a" }}>
          {/* Nếu đang loading thì hiện dòng Loading... */}
          {isLoading && (
            <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
              Loading...
            </p>
          )}

          {/* Nếu fetch lỗi thì báo lỗi */}
          {fetchError && (
            <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>
              Cannot load prescription. It might have been deleted.
            </p>
          )}

          {/* Nếu có dữ liệu rxData và không loading thì hiển thị chi tiết */}
          {rxData && !isLoading && (
            <>
              {/* Nếu có tên bác sĩ hoặc phòng khám thì hiển thị */}
              {(rxData.doctorName || rxData.clinicName) && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#78350f",
                    margin: "0 0 8px 0",
                  }}
                >
                  {/* Hiển thị doctor và clinic, nếu thiếu thì thay bằng "—" */}
                  <b>Doctor:</b> {rxData.doctorName || "—"} &nbsp;|&nbsp;{" "}
                  <b>Clinic:</b> {rxData.clinicName || "—"}
                </p>
              )}

              {/* Bảng hiển thị thông số toa kính */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                  marginBottom: "6px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#fde68a" }}>
                    <th style={thStyle}>Eye</th>
                    <th style={thStyle}>SPH (Sphere)</th>
                    <th style={thStyle}>CYL (Cylinder)</th>
                    <th style={thStyle}>AXIS</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Dòng cho mắt phải OD */}
                  <tr>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#dc2626",
                      }}
                    >
                      Right Eye (OD)
                    </td>

                    {/* sphereRight */}
                    <td style={tdStyle}>{fmtRx(rxData.sphereRight)}</td>

                    {/* cylinderRight */}
                    <td style={tdStyle}>{fmtRx(rxData.cylinderRight)}</td>

                    {/* axisRight, nếu null thì hiện "—" */}
                    <td style={tdStyle}>{rxData.axisRight ?? "—"}°</td>
                  </tr>

                  {/* Dòng cho mắt trái OS */}
                  <tr style={{ backgroundColor: "#fef9c3" }}>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#2563eb",
                      }}
                    >
                      Left Eye (OS)
                    </td>

                    {/* sphereLeft */}
                    <td style={tdStyle}>{fmtRx(rxData.sphereLeft)}</td>

                    {/* cylinderLeft */}
                    <td style={tdStyle}>{fmtRx(rxData.cylinderLeft)}</td>

                    {/* axisLeft */}
                    <td style={tdStyle}>{rxData.axisLeft ?? "—"}°</td>
                  </tr>
                </tbody>
              </table>

              {/* Khối thông tin phụ như PD và Expiration */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  fontSize: "12px",
                  color: "#78350f",
                }}
              >
                {/* Nếu có pupillaryDistance thì hiển thị PD */}
                {rxData.pupillaryDistance != null && (
                  <span>
                    <b>PD:</b> {rxData.pupillaryDistance} mm
                  </span>
                )}

                {/* Nếu có expirationDate thì hiển thị ngày hết hạn */}
                {rxData.expirationDate && (
                  <span>
                    <b>Expiration:</b>{" "}
                    {new Date(rxData.expirationDate).toLocaleDateString(
                      "en-US",
                    )}

                    {/* Nếu toa đã hết hạn thì hiện badge Expired */}
                    {rxData.isExpired && (
                      <span
                        style={{
                          marginLeft: "6px",
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          fontSize: "11px",
                        }}
                      >
                        Expired
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Ghi chú mô tả nguồn dữ liệu prescription */}
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "#a16207",
                  fontStyle: "italic",
                  borderTop: "1px dashed #fde68a",
                  paddingTop: "6px",
                  marginBottom: 0,
                }}
              >
                This is the numerical data entered by the customer during checkout. The API currently does not support uploading prescription scans.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENT: PaymentInfoBlock
// =============================================================================

// Component này chuyên hiển thị thông tin thanh toán của đơn hàng.
// Nó nhận paymentList là mảng các lần thanh toán liên quan tới đơn.
function PaymentInfoBlock({ paymentList }) {
  // Định nghĩa sẵn giao diện cho COD
  const COD = {
    // Label hiển thị
    label: "Cash on Delivery (COD)",

    // icon đang để trống
    icon: "",

    // màu chữ xanh lá
    color: "#15803d",

    // nền xanh lá nhạt
    bg: "#f0fdf4",
  };

  // Nếu không có paymentList hoặc mảng rỗng,
  // mặc định coi là COD
  if (!paymentList || paymentList.length === 0) {
    return (
      <p style={{ margin: "4px 0", fontSize: "14px" }}>
        <b>Method:</b>{" "}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: COD.bg,
            color: COD.color,
            padding: "2px 10px",
            borderRadius: "20px",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {COD.icon} {COD.label}
        </span>
      </p>
    );
  }

  // Chọn payment mới nhất / đáng tin nhất để hiển thị:
  // ưu tiên payment nào completed,
  // nếu không có thì lấy phần tử đầu tiên
  const latest =
    paymentList.find((p) => p.paymentStatus === "completed") || paymentList[0];

  // Kiểm tra xem phương thức thanh toán có phải VNPay không
  const isVNPay = latest.paymentMethod?.toLowerCase() === "vnpay";

  // Nếu là VNPay thì dùng style VNPay, không thì dùng COD
  const method = isVNPay
    ? { label: "VNPay", icon: "", color: "#1d4ed8", bg: "#eff6ff" }
    : COD;

  // Format payment status thành badge hiển thị
  const pStatus = formatPaymentStatus(latest.paymentStatus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Hiển thị payment method */}
      {method && (
        <p style={{ margin: 0, fontSize: "14px" }}>
          <b>Method:</b>{" "}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: method.bg,
              color: method.color,
              padding: "2px 10px",
              borderRadius: "20px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {method.icon} {method.label}
          </span>
        </p>
      )}

      {/* Hiển thị payment status */}
      {pStatus && (
        <p style={{ margin: 0, fontSize: "14px" }}>
          <b>Payment Status:</b>{" "}
          <span
            style={{
              display: "inline-block",
              backgroundColor: pStatus.bg,
              color: pStatus.color,
              padding: "2px 10px",
              borderRadius: "20px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {pStatus.label}
          </span>
        </p>
      )}

      {/* Nếu có thời điểm thanh toán thì hiển thị */}
      {latest.paidAt && (
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
          <b>Paid at:</b>{" "}
          {new Date(latest.paidAt).toLocaleString("en-US")}
        </p>
      )}

      {/* Nếu có nhiều bản ghi thanh toán thì hiển thị số lượng */}
      {paymentList.length > 1 && (
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            color: "#9ca3af",
            fontStyle: "italic",
          }}
        >
          ({paymentList.length} payment(s) recorded)
        </p>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENT: PreorderAmountCell
// =============================================================================

// Component này dùng riêng cho ô "Total Amount" của preorder.
// Lý do tồn tại:
// - Có trường hợp preorder trong danh sách không có totalAmount / totalPrice
// - Khi đó component sẽ tự fetch API payment của preorder để lấy amount
function PreorderAmountCell({ order, headers, formatUSD }) {
  // Lấy raw total từ order
  const rawTotal = order.totalAmount || order.totalPrice || 0;

  // State amount để lưu số tiền thực sự sẽ hiển thị
  const [amount, setAmount] = useState(rawTotal);

  useEffect(() => {
    // Nếu rawTotal > 0 nghĩa là đã có sẵn tiền, không cần gọi API nữa
    if (rawTotal > 0) return;

    // Lấy id preorder
    const id = order.id || order.preorderId;

    // Nếu không có id thì không thể fetch
    if (!id) return;

    // Biến cờ để tránh setState khi component unmount
    let cancelled = false;

    // Gọi API lấy payment của preorder
    // API: Payments/preorder/{id}
    fetch(`https://myspectra.runasp.net/api/Payments/preorder/${id}`, {
      headers,
    })
      // Nếu response ok thì parse json, ngược lại trả về null
      .then((r) => (r.ok ? r.json() : null))

      // Xử lý dữ liệu trả về
      .then((data) => {
        // Nếu component đã bị huỷ hoặc không có data thì dừng
        if (cancelled || !data) return;

        // Nếu backend trả object thì bọc thành mảng cho đồng nhất
        const list = Array.isArray(data) ? data : [data];

        // Ưu tiên payment đã completed, nếu không có thì lấy phần tử đầu
        const paid =
          list.find((p) => p.paymentStatus === "completed") || list[0];

        // Nếu có amount thì cập nhật state
        if (paid?.amount) setAmount(paid.amount);
      })

      // Bắt lỗi nhưng không làm gì để tránh văng UI
      .catch(() => {});

    // Cleanup function của useEffect
    return () => {
      // Đánh dấu đã huỷ để tránh setState sau unmount
      cancelled = true;
    };
  }, [order, rawTotal]);

  return (
    <span>
      {/* Nếu amount > 0 thì format USD */}
      {amount > 0 ? (
        formatUSD(amount)
      ) : (
        // Không có thì hiển thị dấu —
        <span style={{ color: "#9ca3af" }}>—</span>
      )}
    </span>
  );
}

// =============================================================================
// MAIN COMPONENT: AdminOrders
// =============================================================================

// Đây là component chính của file.
// Nó chịu trách nhiệm:
// - load danh sách orders / preorders
// - render tab
// - render table
// - xem chi tiết đơn
// - cập nhật trạng thái đơn
// - hiển thị modal
export default function AdminOrders() {
  // Lấy user từ UserContext
  const { user } = useContext(UserContext);

  // State chứa danh sách regular orders
  const [orders, setOrders] = useState([]);

  // State chứa danh sách preorders
  const [preorders, setPreorders] = useState([]);

  // State loading dữ liệu bảng chính
  const [isLoading, setIsLoading] = useState(true);

  // Tab đang active: "orders" hoặc "preorders"
  const [activeTab, setActiveTab] = useState("orders");

  // Đơn hàng đang được chọn để xem chi tiết
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Danh sách payment của đơn đang xem chi tiết
  const [paymentList, setPaymentList] = useState([]);

  // Modal đang mở hay không
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loading riêng cho phần detail modal
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Trang hiện tại cho phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // Số phần tử mỗi trang
  const PAGE_SIZE = 5;

  // Lấy token:
  // ưu tiên user trong context,
  // nếu chưa có thì fallback đọc từ localStorage
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  // Headers dùng chung cho các API gọi có auth
  const headers = {
    // Dữ liệu gửi đi là JSON
    "Content-Type": "application/json",

    // Token Bearer để backend xác thực
    Authorization: `Bearer ${token}`,
  };

  // ---------------------------------------------------------------------------
  // fetchOrdersData
  // ---------------------------------------------------------------------------

  // Hàm load dữ liệu danh sách orders và preorders cùng lúc
  const fetchOrdersData = async () => {
    // Bật loading
    setIsLoading(true);

    try {
      // Gọi song song 2 API để tối ưu thời gian:
      // 1) OrdersV2
      // 2) Preorders
      const [ordersRes, preordersRes] = await Promise.all([
        fetch("https://myspectra.runasp.net/api/OrdersV2?page=1&pageSize=100", {
          headers,
        }),
        fetch(
          "https://myspectra.runasp.net/api/Preorders?page=1&pageSize=100",
          { headers },
        ),
      ]);

      // Nếu API orders thành công
      if (ordersRes.ok) {
        // Parse JSON
        const d = await ordersRes.json();

        // Một số backend trả { items: [...] }, số khác trả trực tiếp [...]
        // nên code fallback cả 2
        setOrders(d.items || d || []);
      }

      // Nếu API preorders thành công
      if (preordersRes.ok) {
        // Parse JSON
        const d = await preordersRes.json();

        // Tương tự như orders
        setPreorders(d.items || d || []);
      }
    } catch (err) {
      // Log lỗi mạng ra console cho dev debug
      console.error("Network error:", err);
    } finally {
      // Dù lỗi hay thành công cũng tắt loading
      setIsLoading(false);
    }
  };

  // useEffect chạy đúng 1 lần sau lần render đầu tiên
  // để load dữ liệu trang khi component mount
  useEffect(() => {
    fetchOrdersData();
  }, []);

  // ---------------------------------------------------------------------------
  // handleViewDetails
  // ---------------------------------------------------------------------------

  // Hàm xem chi tiết đơn hàng / preorder
  // id: id của đơn
  // isPreorder: true nếu là preorder, false nếu là order thường
  const handleViewDetails = async (id, isPreorder) => {
    // Mở modal
    setIsModalOpen(true);

    // Bật loading detail
    setIsLoadingDetail(true);

    // Reset selectedOrder trước để tránh hiển thị dữ liệu cũ
    setSelectedOrder(null);

    // Reset paymentList
    setPaymentList([]);

    // Xác định endpoint lấy chi tiết đơn
    const orderEndpoint = isPreorder ? `Preorders/${id}` : `Orders/${id}`;

    // Xác định endpoint lấy payment
    const paymentEndpoint = isPreorder
      ? `Payments/preorder/${id}`
      : `Payments/order/${id}`;

    try {
      // Gọi song song:
      // - API chi tiết order/preorder
      // - API payment tương ứng
      const [orderRes, paymentRes] = await Promise.all([
        fetch(`https://myspectra.runasp.net/api/${orderEndpoint}`, { headers }),
        fetch(`https://myspectra.runasp.net/api/${paymentEndpoint}`, {
          headers,
        }),
      ]);

      // Nếu API order/preorder ok
      if (orderRes.ok) {
        // Lưu selectedOrder, đồng thời gắn thêm cờ isPreorder
        setSelectedOrder({ ...(await orderRes.json()), isPreorder });
      } else {
        // Nếu không load được chi tiết đơn thì báo lỗi và đóng modal
        alert("Cannot load order details!");
        setIsModalOpen(false);
        return;
      }

      // Nếu payment API ok
      if (paymentRes.ok) {
        // Parse payment data
        const pData = await paymentRes.json();

        // Backend có thể trả về object hoặc mảng,
        // nên chuẩn hoá thành mảng
        setPaymentList(Array.isArray(pData) ? pData : pData ? [pData] : []);
      }
    } catch {
      // Lỗi mạng
      alert("Connection error when loading details.");
      setIsModalOpen(false);
    } finally {
      // Tắt loading detail
      setIsLoadingDetail(false);
    }
  };

  // ---------------------------------------------------------------------------
  // handleUpdateStatus
  // ---------------------------------------------------------------------------

  // Hàm cập nhật trạng thái đơn hàng
  // id: id đơn
  // isPreorder: có phải preorder không
  // newStatus: trạng thái mới muốn đổi sang
  const handleUpdateStatus = async (id, isPreorder, newStatus) => {
    // Hỏi xác nhận trước khi đổi trạng thái
    if (
      !window.confirm(
        `Are you sure you want to change the status to "${newStatus}"?`,
      )
    )
      return;

    // Trường hợp đặc biệt:
    // preorder đổi sang "converted"
    // nghĩa là chuyển preorder thành order thật
    if (isPreorder && newStatus === "converted") {
      try {
        // Step 1: Lấy địa chỉ giao hàng
        // Ưu tiên lấy từ state preorders hiện có trước
        // để khỏi gọi API detail lại
        let addr =
          preorders.find((p) => (p.id || p.preorderId) === id)
            ?.shippingAddress || "";

        // Nếu trong list không có addr thì fetch detail preorder để lấy
        if (!addr) {
          const detailRes = await fetch(
            `https://myspectra.runasp.net/api/Preorders/${id}`,
            { headers },
          );

          if (detailRes.ok) {
            const detail = await detailRes.json();

            // fallback giữa shippingAddress và address
            addr = detail?.shippingAddress || detail?.address || "";
          }
        }

        // Nếu vẫn không có địa chỉ thì không thể convert
        if (!addr) {
          alert(
            "Shipping address not found in pre-order. Please check again.",
          );
          return;
        }

        // Xác nhận lại một lần nữa với địa chỉ thực tế
        if (
          !window.confirm(
            `Confirm change to Processing?\nShipping address: ${addr}`,
          )
        )
          return;

        // Step 2: Gọi API convert preorder -> order
        // API: Preorders/{id}/convert
        const convertRes = await fetch(
          `https://myspectra.runasp.net/api/Preorders/${id}/convert`,
          {
            // method POST để tạo order mới từ preorder
            method: "POST",

            // headers có auth + content-type
            headers,

            // body gửi shippingAddress cho backend
            body: JSON.stringify({ shippingAddress: addr }),
          },
        );

        // Nếu convert không thành công
        if (!convertRes.ok) {
          // Parse lỗi backend
          const err = await convertRes.json();

          // Hiện lỗi chi tiết cho người dùng
          alert(
            "Conversion error: " +
              (err.message ||
                "Please check order status (must be Paid or Confirmed)"),
          );
          return;
        }

        // Nếu convert thành công, backend trả về newOrder
        const newOrder = await convertRes.json();

        // Step 3: Sau khi convert xong, đổi trạng thái order mới thành processing
        // để hiện trong ShippingPage
        const newOrderId = newOrder.orderId || newOrder.id;

        if (newOrderId) {
          await fetch(
            `https://myspectra.runasp.net/api/OrdersV2/${newOrderId}/status`,
            {
              // đổi status qua API update status của order
              method: "PUT",
              headers,
              body: JSON.stringify({ status: "processing" }),
            },
          );
        }

        // Log debug ra console
        console.log(
          "Converted order:",
          newOrderId,
          "← from preorder:",
          newOrder.convertedFromPreorderId,
        );

        // Thông báo thành công
        alert(
          "Conversion successful! Order has been created and moved to Processing → visible in Shipping Management.",
        );

        // Reload lại toàn bộ danh sách
        fetchOrdersData();

        // Nếu modal đang mở thì đóng luôn
        if (isModalOpen) setIsModalOpen(false);
      } catch {
        // Lỗi mạng
        alert("Network error!");
      }

      // return để kết thúc nhánh xử lý convert
      return;
    }

    // Nếu không phải case convert đặc biệt,
    // thì update status bình thường
    const endpoint = isPreorder
      ? `Preorders/${id}/status`
      : `Orders/${id}/status`;

    try {
      // Gọi API update status
      const res = await fetch(`https://myspectra.runasp.net/api/${endpoint}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      // Nếu update thành công
      if (res.ok) {
        // Báo thành công
        alert("Status updated successfully!");

        // Reload lại list
        fetchOrdersData();

        // Nếu đơn đang mở trong modal chính là đơn vừa update,
        // thì cập nhật selectedOrder ngay để UI modal đồng bộ
        if (
          selectedOrder &&
          (selectedOrder.id ||
            selectedOrder.orderId ||
            selectedOrder.preorderId) === id
        )
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      } else {
        // Nếu update lỗi thì parse lỗi backend và alert
        const err = await res.json();
        alert("Update error: " + (err.message || res.status));
      }
    } catch {
      // Lỗi mạng
      alert("Network error!");
    }
  };

  // ---------------------------------------------------------------------------
  // getStatusBadge
  // ---------------------------------------------------------------------------

  // Hàm chuyển status của order/preorder thành badge màu
  const getStatusBadge = (status) => {
    // Chuyển lowercase để so sánh ổn định
    const s = status?.toLowerCase() || "";

    // Từng trạng thái trả về 1 span có class CSS riêng
    if (s === "pending")
      return <span className="status-badge status-pending">Pending</span>;

    if (s === "confirmed")
      return <span className="status-badge status-confirmed">Confirmed</span>;

    if (s === "paid")
      return <span className="status-badge status-paid">Paid</span>;

    if (s === "processing")
      return <span className="status-badge status-processing">Processing</span>;

    // Với preorder, status "converted" được hiển thị giống processing
    if (s === "converted")
      return <span className="status-badge status-processing">Processing</span>;

    if (s === "shipped")
      return <span className="status-badge status-shipped">Shipped</span>;

    if (s === "delivered")
      return <span className="status-badge status-delivered">Delivered</span>;

    if (s === "cancelled")
      return <span className="status-badge status-cancelled">Cancelled</span>;

    // Nếu là trạng thái lạ chưa được định nghĩa
    return (
      <span
        className="status-badge"
        style={{ background: "#eee", color: "#333" }}
      >
        {status || "Unknown"}
      </span>
    );
  };

  // Hàm format tiền USD
  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);

  // displayList là danh sách đang hiển thị theo tab hiện tại
  // - nếu activeTab = "orders" thì lấy orders
  // - nếu activeTab = "preorders" thì lấy preorders
  // Sau đó copy bằng .slice() và sort giảm dần theo ngày mới nhất
  const displayList = (activeTab === "orders" ? orders : preorders)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.orderDate || b.createdAt || 0) -
        new Date(a.orderDate || a.createdAt || 0),
    );

  // ---------------------------------------------------------------------------
  // RENDER MODAL BODY
  // ---------------------------------------------------------------------------

  // Hàm này render nội dung bên trong modal chi tiết
  const renderModalBody = () => {
    // Nếu đang loading detail
    if (isLoadingDetail)
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading details...
        </div>
      );

    // Nếu không có selectedOrder
    if (!selectedOrder)
      return (
        <div style={{ textAlign: "center", color: "red" }}>
          Cannot load details.
        </div>
      );

    // Khai báo các biến để hiển thị thông tin khách hàng
    let displayName, displayPhone, displayEmail, displayAddress;

    // Nếu là preorder
    if (selectedOrder.isPreorder) {
      // Tên ưu tiên:
      // receiverName -> customerName -> user.fullName -> "N/A"
      displayName =
        selectedOrder.receiverName ||
        selectedOrder.customerName ||
        selectedOrder.user?.fullName ||
        "N/A";

      // SĐT ưu tiên:
      // phoneNumber -> phone -> user.phone -> "N/A"
      displayPhone =
        selectedOrder.phoneNumber ||
        selectedOrder.phone ||
        selectedOrder.user?.phone ||
        "N/A";

      // Email nếu có
      displayEmail = selectedOrder.email || selectedOrder.user?.email || null;

      // Địa chỉ
      displayAddress =
        selectedOrder.shippingAddress || selectedOrder.address || "N/A";
    } else {
      // Nếu là order thường thì shippingAddress có thể chứa dữ liệu cấu trúc
      // nên parse ra trước
      const parsed = parseShippingInfo(selectedOrder.shippingAddress);

      // Ưu tiên dữ liệu parsed, fallback user
      displayName = parsed.name || selectedOrder.user?.fullName || "N/A";
      displayPhone = parsed.phone || selectedOrder.user?.phone || "N/A";
      displayEmail = parsed.email || selectedOrder.user?.email || null;
      displayAddress = parsed.address || "N/A";
    }

    // Loại bỏ dữ liệu cấu trúc kiểu ||| ra khỏi address để hiển thị sạch
    displayAddress = getAddressDisplayString(displayAddress);

    // Chuẩn hoá danh sách item:
    // - preorder có thể nằm ở preorderItems/items/orderItems
    // - order có thể nằm ở orderItems/items/orderDetails
    const itemsList = selectedOrder.isPreorder
      ? selectedOrder.preorderItems ||
        selectedOrder.items ||
        selectedOrder.orderItems ||
        []
      : selectedOrder.orderItems ||
        selectedOrder.items ||
        selectedOrder.orderDetails ||
        [];

    return (
      <>
        {/* Lưới 2 card thông tin */}
        <div className="info-grid">
          {/* Card thông tin khách hàng */}
          <div className="info-card">
            <h4>Customer Information</h4>

            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Full Name:</b> {displayName}
            </p>

            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Phone:</b> {displayPhone}
            </p>

            {/* Chỉ hiện email nếu có */}
            {displayEmail && (
              <p style={{ margin: "6px 0", fontSize: "14px" }}>
                <b>Email:</b> {displayEmail}
              </p>
            )}

            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Address:</b> {displayAddress}
            </p>

            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Note:</b> {selectedOrder.note || "None"}
            </p>
          </div>

          {/* Card thông tin đơn hàng */}
          <div className="info-card">
            <h4>Order Information</h4>

            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Order Date:</b>{" "}
              {new Date(
                selectedOrder.orderDate || selectedOrder.createdAt,
              ).toLocaleString("en-US")}
            </p>

            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <b>Order Status:</b> {getStatusBadge(selectedOrder.status)}
            </p>

            {/* Nếu là preorder và có expectedDate thì hiển thị */}
            {selectedOrder.isPreorder && selectedOrder.expectedDate && (
              <p
                style={{ margin: "6px 0", fontSize: "14px", color: "#2563eb" }}
              >
                <b>Expected Date:</b>{" "}
                {new Date(selectedOrder.expectedDate).toLocaleString("en-US")}
              </p>
            )}

            {/* Khối payment */}
            <div
              style={{
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#374151",
                }}
              >
                Payment:
              </p>

              {/* Component hiển thị thông tin thanh toán */}
              <PaymentInfoBlock paymentList={paymentList} />
            </div>
          </div>
        </div>

        {/* Tiêu đề danh sách sản phẩm */}
        <h4>Purchased Items</h4>

        {/* Nếu không có item nào */}
        {itemsList.length === 0 ? (
          <p
            style={{
              color: "#9ca3af",
              fontStyle: "italic",
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            No item information.
          </p>
        ) : (
          // Nếu có item thì render danh sách
          <div className="item-list">
            {itemsList.map((item, idx) => {
              // Lấy tên gọng kính / sản phẩm
              // ưu tiên frame.frameName -> frameName -> productName -> fallback
              const frameName =
                item.frame?.frameName ||
                item.frameName ||
                item.productName ||
                "Glasses frame";

              // Lấy đơn giá item theo nhiều field có thể có
              const unitPrice =
                item.orderPrice ||
                item.preorderPrice ||
                item.campaignPrice ||
                item.unitPrice ||
                item.price ||
                0;

              // Tên lens type nếu có
              const lensType =
                item.lensType?.lensSpecification || item.lensTypeName || null;

              // Lấy object lensFeature
              const lensFeatureObj = item.lensFeature || item.feature;

              // Lấy text lens feature
              const lensFeature =
                lensFeatureObj?.featureSpecification ||
                item.lensFeatureName ||
                null;

              // Lens có bắt buộc prescription không
              const requiresRx = item.lensType?.requiresPrescription || false;

              // Prescription nhúng sẵn trong item nếu có
              const embeddedRx = item.prescription || null;

              // prescriptionId nếu có
              const prescriptionId =
                item.prescriptionId || embeddedRx?.prescriptionId || null;

              return (
                <div
                  key={item.orderItemId || item.preorderItemId || idx}
                  className="item-row"
                >
                  <div className="item-details">
                    {/* Tên sản phẩm */}
                    <p className="item-name">{frameName}</p>

                    {/* Meta số lượng + giá */}
                    <p className="item-meta">
                      Qty: <b>{item.quantity || 1}</b> | Price:{" "}
                      <b>{formatUSD(unitPrice)}</b>
                    </p>

                    {/* Nếu có lensType hoặc lensFeature thì hiển thị thông tin lens */}
                    {lensType || lensFeature ? (
                      <p
                        className="item-meta"
                        style={{ color: "#4338ca", marginTop: "4px" }}
                      >
                        {/* Hiển thị lens type */}
                        Lens: {lensType || "Not selected"}

                        {/* Nếu có lens feature thì nối thêm */}
                        {lensFeature ? ` – ${lensFeature}` : ""}

                        {/* Nếu lens bắt buộc prescription thì gắn badge */}
                        {requiresRx && (
                          <span
                            style={{
                              marginLeft: "8px",
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                            }}
                          >
                            Prescription required
                          </span>
                        )}
                      </p>
                    ) : (
                      // Nếu không có lens => chỉ là frame
                      <p
                        className="item-meta"
                        style={{
                          color: "#92400e",
                          marginTop: "4px",
                          fontWeight: "600",
                        }}
                      >
                        🔧 Frame only (No lenses included)
                      </p>
                    )}

                    {/* Nếu có prescriptionId hoặc prescription nhúng sẵn thì render card prescription */}
                    {(prescriptionId || embeddedRx) && (
                      <PrescriptionCard
                        prescription={embeddedRx}
                        prescriptionId={prescriptionId}
                        headers={headers}
                      />
                    )}

                    {/* Nếu lens bắt buộc toa nhưng không có dữ liệu toa thì cảnh báo */}
                    {requiresRx && !prescriptionId && !embeddedRx && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#dc2626",
                          marginTop: "6px",
                          fontStyle: "italic",
                        }}
                      >
                        This lens requires a prescription but no prescription data was found.
                      </p>
                    )}
                  </div>

                  {/* Thành tiền của item = đơn giá * số lượng */}
                  <div className="item-price">
                    {formatUSD(unitPrice * (item.quantity || 1))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER MAIN
  // ---------------------------------------------------------------------------

  // Giao diện chính của trang
  return (
    <div className="admin-orders-container">
      {/* Header trang */}
      <div className="admin-orders-header">
        <h2 className="admin-orders-title">Order Management</h2>

        {/* Nút refresh để gọi lại API */}
        <button className="btn-view" onClick={fetchOrdersData}>
          Refresh
        </button>
      </div>

      {/* Tabs chuyển giữa regular orders và preorders */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => {
            // Chuyển sang tab orders
            setActiveTab("orders");

            // Reset về trang 1
            setCurrentPage(1);
          }}
        >
          Regular Orders ({orders.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "preorders" ? "active" : ""}`}
          onClick={() => {
            // Chuyển sang tab preorders
            setActiveTab("preorders");

            // Reset về trang 1
            setCurrentPage(1);
          }}
        >
          Pre-orders ({preorders.length})
        </button>
      </div>

      {/* Khối chứa bảng */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              {/* Cột ID đơn */}
              <th>Order ID</th>

              {/* Cột khách hàng */}
              <th>Customer</th>

              {/* Cột ngày đặt */}
              <th>Order Date</th>

              {/* Cột tổng tiền */}
              <th>Total Amount</th>

              {/* Cột trạng thái */}
              <th>Status</th>

              {/* Cột thao tác */}
              <th className="col-action">Action</th>
            </tr>
          </thead>

          <tbody>
            {/* Nếu đang loading bảng chính */}
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  ⏳ Loading data...
                </td>
              </tr>
            ) : displayList.length === 0 ? (
              // Nếu không loading nhưng không có dữ liệu
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No orders found in this section.
                </td>
              </tr>
            ) : (
              // Nếu có dữ liệu:
              // 1) cắt theo trang hiện tại
              // 2) map thành từng dòng
              displayList
                .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                .map((order, index) => {
                  // Lấy id thống nhất
                  const id = order.id || order.orderId || order.preorderId;

                  // Xác định đang ở tab preorder hay không
                  const isPreorder = activeTab === "preorders";

                  // Parse shipping info nếu có
                  const shippingInfo = parseShippingInfo(order.shippingAddress);

                  // Tên khách hàng ưu tiên nhiều nguồn
                  const customerName =
                    order.user?.fullName ||
                    order.receiverName ||
                    order.customerName ||
                    shippingInfo.name ||
                    "Guest Customer";

                  // SĐT khách hàng ưu tiên nhiều nguồn
                  const customerPhone =
                    order.user?.phone ||
                    order.phoneNumber ||
                    order.phone ||
                    shippingInfo.phone ||
                    "—";

                  return (
                    <tr key={index}>
                      {/* Cột ID */}
                      <td className="col-id">#{id}</td>

                      {/* Cột customer */}
                      <td>
                        <strong>{customerName}</strong>
                        <br />
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {customerPhone}
                        </span>
                      </td>

                      {/* Cột ngày đặt */}
                      <td className="col-date">
                        {new Date(
                          order.orderDate || order.createdAt,
                        ).toLocaleString("en-US")}
                      </td>

                      {/* Cột tổng tiền */}
                      <td className="col-price">
                        {isPreorder ? (
                          // Nếu là preorder dùng component riêng vì có thể phải fetch payment để lấy amount
                          <PreorderAmountCell
                            order={order}
                            headers={headers}
                            formatUSD={formatUSD}
                          />
                        ) : (
                          // Nếu là order thường thì lấy totalAmount hoặc totalPrice
                          formatUSD(order.totalAmount || order.totalPrice)
                        )}
                      </td>

                      {/* Cột trạng thái + select đổi trạng thái */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                          }}
                        >
                          {/* Badge trạng thái hiện tại */}
                          {getStatusBadge(order.status)}

                          {/* Select đổi trạng thái */}
                          <select
                            className="status-select"
                            value=""
                            onChange={(e) =>
                              handleUpdateStatus(id, isPreorder, e.target.value)
                            }
                          >
                            {/* option placeholder */}
                            <option value="" disabled>
                              Change status
                            </option>

                            {/* Nếu là preorder thì rule chuyển trạng thái khác */}
                            {isPreorder
                              ? (() => {
                                  // Trạng thái hiện tại
                                  const s = (order.status || "").toLowerCase();

                                  // Sơ đồ chuyển trạng thái cho preorder
                                  const preorderTransitions = {
                                    // pending -> confirmed/cancelled
                                    pending: ["confirmed", "cancelled"],

                                    // confirmed -> paid/cancelled
                                    confirmed: ["paid", "cancelled"],

                                    // paid -> converted/cancelled
                                    paid: ["converted", "cancelled"],

                                    // converted không chuyển tiếp
                                    converted: [],

                                    // cancelled không chuyển tiếp
                                    cancelled: [],
                                  };

                                  // Lấy danh sách trạng thái được phép
                                  const allowed = preorderTransitions[s] || [];

                                  // Render option
                                  return allowed.map((st) => (
                                    <option key={st} value={st}>
                                      {st === "converted"
                                        ? "Processing"
                                        : st.charAt(0).toUpperCase() +
                                          st.slice(1)}
                                    </option>
                                  ));
                                })()
                              : (() => {
                                  // Nếu là order thường
                                  const s = (order.status || "").toLowerCase();

                                  // Sơ đồ chuyển trạng thái của order
                                  const orderTransitions = {
                                    // pending -> confirmed/cancelled
                                    pending: ["confirmed", "cancelled"],

                                    // confirmed -> processing/cancelled
                                    confirmed: ["processing", "cancelled"],

                                    // processing -> shipped/cancelled
                                    processing: [ "cancelled"],

                                    // shipped -> delivered
                                    shipped: ["delivered"],

                                    // delivered hết luồng
                                    delivered: [],

                                    // cancelled hết luồng
                                    cancelled: [],
                                  };

                                  // Danh sách trạng thái cho phép
                                  const allowed = orderTransitions[s] || [];

                                  // Render option
                                  return allowed.map((st) => (
                                    <option key={st} value={st}>
                                      {st.charAt(0).toUpperCase() + st.slice(1)}
                                    </option>
                                  ));
                                })()}
                          </select>
                        </div>
                      </td>

                      {/* Cột action */}
                      <td className="col-action">
                        <button
                          onClick={() => handleViewDetails(id, isPreorder)}
                          className="btn-view"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {(() => {
          // Tính tổng số trang
          const totalPages = Math.ceil(displayList.length / PAGE_SIZE);

          // Chỉ render phân trang nếu có hơn 1 trang
          return totalPages > 1 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "16px",
                paddingBottom: "8px",
              }}
            >
              {/* Nút Prev */}
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  background: currentPage <= 1 ? "#f3f4f6" : "#fff",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                ← Prev
              </button>

              {/* Text hiển thị trang hiện tại */}
              <span style={{ fontWeight: "bold", color: "#374151" }}>
                Page {currentPage} of {totalPages}
              </span>

              {/* Nút Next */}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  background: currentPage >= totalPages ? "#f3f4f6" : "#fff",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                Next →
              </button>
            </div>
          ) : null;
        })()}
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && (
        <div
          className="order-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="order-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="order-modal-header">
              <h3>
                {/* Tiêu đề modal khác nhau giữa preorder và order */}
                {selectedOrder?.isPreorder
                  ? "Pre-Order Details"
                  : "Order Details"}{" "}
                {/* Hiển thị mã đơn nếu có selectedOrder */}
                {selectedOrder &&
                  `#${selectedOrder.id || selectedOrder.orderId || selectedOrder.preorderId}`}
              </h3>

              {/* Nút đóng modal */}
              <button
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            {/* Body modal */}
            <div className="order-modal-body">{renderModalBody()}</div>

            {/* Footer modal hiển thị tổng bill */}
            <div className="modal-footer">
              <span>Total Bill:</span>

              <span className="total-price">
                {selectedOrder
                  ? (() => {
                      // Ưu tiên totalAmount hoặc totalPrice từ selectedOrder
                      const t =
                        selectedOrder.totalAmount || selectedOrder.totalPrice;

                      // Nếu có sẵn thì format luôn
                      if (t) return formatUSD(t);

                      // Nếu không có sẵn total, tự tính từ item list
                      const iList = selectedOrder.isPreorder
                        ? selectedOrder.preorderItems ||
                          selectedOrder.items ||
                          selectedOrder.orderItems ||
                          []
                        : selectedOrder.orderItems ||
                          selectedOrder.items ||
                          selectedOrder.orderDetails ||
                          [];

                      // Dùng reduce để cộng tổng
                      const calc = iList.reduce((s, it) => {
                        // Lấy đơn giá từ nhiều field có thể có
                        const p =
                          it.orderPrice ||
                          it.preorderPrice ||
                          it.campaignPrice ||
                          it.unitPrice ||
                          it.price ||
                          0;

                        // Cộng dồn số lượng * đơn giá
                        return s + p * (it.quantity || 1);
                      }, 0);

                      // Format tiền USD
                      return formatUSD(calc);
                    })()
                  : "$0.00"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}