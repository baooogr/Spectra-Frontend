// Import React và các hook cần dùng
// useState: tạo state để lưu dữ liệu thay đổi theo thời gian
// useEffect: chạy side effect như gọi API, reset dữ liệu...
// useContext: lấy dữ liệu từ Context toàn cục
import React, { useState, useEffect, useContext } from "react";

// Import hook của react-router-dom
// useNavigate: điều hướng trang bằng code
// useSearchParams: đọc query string trên URL, ví dụ ?orderItemId=123
import { useNavigate, useSearchParams } from "react-router-dom";

// Import UserContext để lấy thông tin user đang đăng nhập
import { UserContext } from "../context/UserContext";

// File CSS đang bị comment lại, nghĩa là hiện tại component này chủ yếu đang dùng inline style
// import "./MyComplaints.css";


// Hằng số chứa base URL của backend API
// Tất cả endpoint phía dưới sẽ nối từ URL này
// Đây là API server của hệ thống
const API_BASE = "https://myspectra.runasp.net/api";


// Danh sách loại yêu cầu mà user có thể chọn
// Hiện tại business chỉ cho hiện "exchange"
// Các loại khác đang bị comment lại theo quyết định nghiệp vụ
const requestTypes = [
  // Only showing exchange for now — other types hidden per business decision
  // { value: "complaint", label: "Complaint (Light feedback)" },
  // { value: "return", label: "Return" },
  { value: "exchange", label: "Exchange" },
  // { value: "refund", label: "Refund" },
  // { value: "warranty", label: "Warranty" },
];


// Object chứa danh sách lý do có sẵn theo từng loại yêu cầu
// Ví dụ:
// - nếu là return thì có các lý do riêng cho return
// - nếu là exchange thì có các lý do riêng cho exchange
// Mục đích:
// - chuẩn hóa lý do
// - tránh người dùng nhập lung tung
// - dễ thống kê ở backend/admin
const COMPLAINT_REASONS = {
  return: [
    "The product color is not as expected",
    "The product does not suit the face",
    "Frame size is not suitable",
    "Lens prescription is incorrect",
    "Product is defective / damaged upon arrival",
    "Received the wrong product",
    "Changed mind about the purchase",
  ],
  exchange: [
    "Received the wrong product color",
    "Received the wrong frame size",
    "Product has a manufacturing defect",
    "Want to exchange for another model",
    "Lens is scratched upon arrival",
    "Received the wrong lens type",
  ],
  refund: [
    "Product does not match the description",
    "Product is severely damaged",
    "Returned the product but have not received a refund",
    "Incorrect charge applied",
    "Order was delivered too late",
  ],
  warranty: [
    "Frame is broken/cracked during warranty period",
    "Lens coating is peeling off",
    "Frame hinge is loose/damaged",
    "Frame paint is peeling",
    "Screw is loose/missing",
  ],
  complaint: [
    "Product quality is not as expected",
    "Service attitude is not good",
    "Delivery is delayed",
    "Packaging is not careful",
    "Product information on the website is inaccurate",
    "Other (please specify below)",
  ],
};


// Export component mặc định
// Đây là component form tạo complaint/exchange request
export default function ComplaintForm() {
  // Lấy user từ UserContext
  // user có thể chứa token, thông tin tài khoản...
  const { user } = useContext(UserContext);

  // Hook điều hướng trang
  // Dùng để chuyển sang /login, /complaints, hoặc trang chi tiết complaint
  const navigate = useNavigate();

  // Lấy search params từ URL
  // Ví dụ URL có thể là /complaints/new?orderItemId=abc123
  const [searchParams] = useSearchParams();

  // Lấy orderItemId từ query string nếu có
  // Nếu không có thì dùng chuỗi rỗng
  // Mục đích: nếu user bấm từ một sản phẩm cụ thể sang form complaint,
  // thì sản phẩm đó sẽ được chọn sẵn
  const preselectedOrderItemId = searchParams.get("orderItemId") || "";


  // State lưu danh sách đơn hàng lấy từ API
  const [orders, setOrders] = useState([]);

  // State lưu order item đang được chọn trong form
  // Mặc định lấy theo orderItemId trên URL nếu có
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(
    preselectedOrderItemId,
  );

  // State lưu loại yêu cầu
  // Hiện đang default là "exchange"
  const [requestType, setRequestType] = useState("exchange");

  // State lưu lý do đã chọn từ dropdown
  const [selectedReason, setSelectedReason] = useState("");

  // State lưu phần mô tả thêm do user gõ vào textarea
  const [reason, setReason] = useState("");

  // State lưu link chứng cứ nếu user dán URL ngoài
  const [mediaUrl, setMediaUrl] = useState("");

  // State lưu thông báo lỗi để hiển thị ra UI
  const [error, setError] = useState("");

  // State đánh dấu đang submit form
  // Dùng để disable nút submit và đổi text thành "Submitting..."
  const [submitting, setSubmitting] = useState(false);

  // State đánh dấu đang load dữ liệu ban đầu
  // Dùng để hiện Loading...
  const [loading, setLoading] = useState(true);

  // State đánh dấu đang upload ảnh
  const [uploadingImage, setUploadingImage] = useState(false);

  // State lưu danh sách URL ảnh đã upload thành công lên server
  const [uploadedImages, setUploadedImages] = useState([]);


  // Lấy token đăng nhập
  // Ưu tiên lấy từ user trong Context
  // Nếu Context chưa có thì fallback sang localStorage
  // Cách viết này giúp app vẫn hoạt động nếu reload trang mà Context chưa khởi tạo xong
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;


  // useEffect này dùng để reset lại selectedReason mỗi khi requestType thay đổi
  // Ví dụ:
  // - trước đó user chọn requestType = exchange và reason = "Received the wrong product color"
  // - sau đó đổi sang refund
  // => phải xóa selectedReason cũ đi để tránh lệch dữ liệu
  useEffect(() => {
    setSelectedReason("");
  }, [requestType]);


  // useEffect này dùng để gọi API lấy danh sách đơn hàng khi component mount
  // hoặc khi token / navigate thay đổi
  useEffect(() => {
    // Nếu không có token nghĩa là user chưa đăng nhập
    // Chuyển user về trang login luôn
    if (!token) {
      navigate("/login");
      return;
    }

    // Hàm async để gọi API lấy đơn hàng
    const fetchOrders = async () => {
      try {
        // GỌI API:
        // GET /Orders/my?page=1&pageSize=100
        // Mục đích: lấy danh sách đơn hàng của user hiện tại
        const res = await fetch(`${API_BASE}/Orders/my?page=1&pageSize=100`, {
          headers: {
            // Báo backend biết body/content trao đổi là JSON
            "Content-Type": "application/json",

            // Gửi Bearer token để backend xác thực user
            Authorization: `Bearer ${token}`,
          },
        });

        // Nếu gọi thành công
        if (res.ok) {
          // Parse JSON trả về
          const data = await res.json();

          // Backend có thể trả về data.items hoặc data.Items
          // Code này đang xử lý cả 2 kiểu đặt tên để tránh lỗi do backend không thống nhất casing
          const allOrders = data.items || data.Items || [];

          // Chỉ giữ lại các đơn hàng đã giao thành công
          // Vì complaint/exchange chỉ áp dụng cho hàng đã giao
          const delivered = allOrders.filter(
            (o) => (o.status || o.Status || "").toLowerCase() === "delivered",
          );

          // Cập nhật state orders
          setOrders(delivered);
        }
      } catch {
        // Nếu lỗi mạng hoặc lỗi fetch thì bỏ qua, không crash app
        // Tuy nhiên nhược điểm là user sẽ không biết lỗi cụ thể
        /* ignore */
      }

      // Dù thành công hay thất bại thì cũng tắt loading
      setLoading(false);
    };

    // Gọi hàm fetchOrders
    fetchOrders();
  }, [token, navigate]);


  // Hàm xử lý upload ảnh khi user chọn file
  const handleImageUpload = async (e) => {
    // Chuyển FileList thành mảng để dễ loop
    const files = Array.from(e.target.files);

    // Nếu không chọn file nào thì dừng
    if (files.length === 0) return;

    // Bật trạng thái uploading
    setUploadingImage(true);

    // Mảng tạm để chứa các URL ảnh upload thành công
    const newUrls = [];

    // Duyệt từng file để upload lần lượt
    for (const file of files) {
      // Tạo FormData để gửi file theo kiểu multipart/form-data
      const formData = new FormData();

      // Thêm file vào formData với key là "file"
      // Backend sẽ đọc file từ field này
      formData.append("file", file);

      try {
        // GỌI API:
        // POST /Complaints/upload-image
        // Mục đích: upload ảnh chứng cứ lên server
        const res = await fetch(`${API_BASE}/Complaints/upload-image`, {
          method: "POST",

          // Chỉ gửi Authorization header
          // KHÔNG set Content-Type thủ công
          // Vì khi dùng FormData, browser sẽ tự set boundary phù hợp
          headers: { Authorization: `Bearer ${token}` },

          // Body là formData chứa file
          body: formData,
        });

        // Nếu upload thành công
        if (res.ok) {
          // Parse dữ liệu trả về
          const data = await res.json();

          // Nếu backend trả ra data.url thì thêm vào mảng URL mới
          if (data.url) newUrls.push(data.url);
        }
      } catch {
        // Nếu một file upload lỗi thì bỏ qua file đó
        // Không làm hỏng toàn bộ quá trình upload các file còn lại
        /* ignore individual failures */
      }
    }

    // Nếu có ít nhất 1 URL upload thành công
    if (newUrls.length > 0) {
      // Nối thêm vào danh sách uploadedImages hiện tại
      setUploadedImages((prev) => [...prev, ...newUrls]);
    }

    // Tắt trạng thái uploading
    setUploadingImage(false);

    // Reset input file
    // Mục đích: cho phép user chọn lại cùng một file ở lần sau mà onChange vẫn chạy
    e.target.value = null;
  };


  // Hàm xóa một ảnh đã upload khỏi danh sách preview
  // index là vị trí ảnh trong mảng uploadedImages
  const handleRemoveImage = (index) => {
    // Tạo mảng mới, giữ lại mọi ảnh trừ ảnh có index cần xóa
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };


  // Hàm submit form complaint/exchange
  const handleSubmit = async (e) => {
    // Chặn hành vi reload trang mặc định của form
    e.preventDefault();

    // Xóa lỗi cũ trước khi validate lại
    setError("");

    // Validate: phải chọn sản phẩm
    if (!selectedOrderItemId) {
      setError("Please select the product to complain about.");
      return;
    }

    // Validate: phải có lý do
    // Ít nhất phải chọn selectedReason hoặc nhập reason text
    if (!reason.trim() && !selectedReason) {
      setError("Please select or enter a reason.");
      return;
    }

    // Validate: phải có ít nhất 1 ảnh hoặc 1 link
    const hasImages = uploadedImages.length > 0;
    const hasLink = mediaUrl.trim().length > 0;

    if (!hasImages && !hasLink) {
      setError(
        "Please upload at least 1 image or enter a proof link so staff can verify the issue.",
      );
      return;
    }

    // Bật trạng thái đang submit
    setSubmitting(true);

    try {
      // Gom toàn bộ URL ảnh đã upload
      const allUrls = [...uploadedImages];

      // Nếu user có nhập link ngoài thì thêm link đó vào cuối mảng
      if (mediaUrl.trim()) allUrls.push(mediaUrl.trim());

      // Nối tất cả URL thành 1 chuỗi, ngăn cách bằng dấu phẩy
      // Backend đang nhận mediaUrl dạng string, không phải array
      const combinedMediaUrl = allUrls.length > 0 ? allUrls.join(",") : null;

      // Tạo lý do cuối cùng để gửi lên backend
      // Logic:
      // - nếu có selectedReason và có thêm text detail => "selectedReason - detail"
      // - nếu chỉ có selectedReason => dùng selectedReason
      // - nếu không chọn dropdown mà chỉ nhập text => dùng text
      const finalReason = selectedReason
        ? reason.trim()
          ? `${selectedReason} - ${reason.trim()}`
          : selectedReason
        : reason.trim();

      // GỌI API:
      // POST /Complaints
      // Mục đích: tạo complaint/exchange request mới
      const res = await fetch(`${API_BASE}/Complaints`, {
        method: "POST",
        headers: {
          // Gửi JSON
          "Content-Type": "application/json",

          // Token xác thực user
          Authorization: `Bearer ${token}`,
        },

        // Body gửi lên backend
        body: JSON.stringify({
          // ID của sản phẩm trong đơn mà user đang khiếu nại
          orderItemId: selectedOrderItemId,

          // Loại yêu cầu, hiện tại chủ yếu là exchange
          requestType,

          // Lý do cuối cùng đã ghép
          reason: finalReason,

          // Chuỗi URL bằng chứng
          mediaUrl: combinedMediaUrl,
        }),
      });

      // Nếu tạo thành công
      if (res.ok || res.status === 201) {
        // Parse response
        const data = await res.json();

        // Điều hướng sang trang chi tiết complaint vừa tạo
        // Backend có thể trả requestId hoặc RequestId
        navigate(`/complaints/${data.requestId || data.RequestId}`);
      } else {
        // Nếu backend trả lỗi
        const err = await res.json();

        // Hiển thị message lỗi từ backend nếu có
        setError(err.message || err.Message || "Unable to create complaint.");
      }
    } catch {
      // Nếu lỗi mạng / fetch lỗi
      setError("Connection error. Please try again.");
    }

    // Tắt trạng thái submitting
    setSubmitting(false);
  };


  // Nếu đang loading thì render màn hình loading luôn
  // return sớm để chưa render form khi dữ liệu chưa sẵn sàng
  if (loading) return <div className="mc-loading">Loading...</div>;


  // Flatten toàn bộ order items từ các delivered orders
  // Ý nghĩa:
  // - orders là mảng đơn hàng
  // - mỗi order có nhiều item
  // => cần "trải phẳng" toàn bộ item ra thành 1 mảng để đưa vào dropdown chọn sản phẩm
  //
  // Ngoài ra còn xử lý:
  // - đánh dấu item đến từ preorder chuyển đổi
  // - chỉ lấy các item còn trong thời hạn 7 ngày kể từ ngày giao hàng
  const orderItems = orders.flatMap((o) => {
    // Lấy danh sách item trong order
    // Hỗ trợ nhiều kiểu đặt tên field từ backend
    const items = o.items || o.orderItems || o.OrderItems || [];

    // Kiểm tra xem đơn hàng này có được convert từ preorder không
    const isFromPreorder = !!(
      o.convertedFromPreorderId || o.ConvertedFromPreorderId
    );

    // Lấy preorderId nếu có
    const preorderId =
      o.convertedFromPreorderId || o.ConvertedFromPreorderId || null;

    // Lấy ngày giao hàng / xác nhận giao hàng
    // Tùy backend có thể dùng deliveredAt, deliveryConfirmedAt hoặc arrivalDate
    const deliveredDate =
      o.deliveredAt || o.deliveryConfirmedAt || o.arrivalDate;

    // Nếu có ngày giao hàng thì kiểm tra hạn 7 ngày
    if (deliveredDate) {
      // Tính số ngày từ lúc giao đến hiện tại
      const daysSince =
        (Date.now() - new Date(deliveredDate).getTime()) /
        (1000 * 60 * 60 * 24);

      // Nếu quá 7 ngày thì loại bỏ toàn bộ item của order này
      if (daysSince > 7) return [];
    }

    // Nếu hợp lệ thì map từng item ra object mới
    // và gắn thêm một số thông tin của order vào từng item
    return items.map((item) => ({
      // Giữ toàn bộ dữ liệu gốc của item
      ...item,

      // Gắn orderId vào item để sau này biết item thuộc đơn nào
      orderId: o.orderId || o.OrderId,

      // Gắn ngày order vào item
      orderDate: o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate,

      // Gắn cờ preorder
      isFromPreorder,

      // Gắn preorderId nếu có
      preorderId,
    }));
  });


  // Nếu URL có preselectedOrderItemId thì tìm item tương ứng trong danh sách orderItems
  // để biết nó thuộc order nào
  const preselectedItem = preselectedOrderItemId
    ? orderItems.find(
        (item) =>
          (item.orderItemId || item.OrderItemId) === preselectedOrderItemId,
      )
    : null;

  // Nếu đã preselect 1 item:
  // chỉ hiển thị các item cùng order với item đó
  // Điều này giúp user chỉ thao tác trong phạm vi đơn hàng đã chọn trước
  //
  // Nếu không có preselect:
  // hiển thị toàn bộ item hợp lệ
  const filteredOrderItems = preselectedItem
    ? orderItems.filter((item) => item.orderId === preselectedItem.orderId)
    : orderItems;


  // Phần render giao diện
  return (
    // Khung bao ngoài của form
    <div
      style={{
        maxWidth: "700px",          // chiều rộng tối đa 700px
        margin: "40px auto",        // căn giữa ngang, cách trên dưới 40px
        padding: "20px",            // khoảng cách bên trong
        fontFamily: "sans-serif",   // font chữ
      }}
    >
      {/* Tiêu đề chính của form */}
      <h2 style={{ marginBottom: "8px" }}>Exchange Request</h2>

      {/* Mô tả ngắn bên dưới tiêu đề */}
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
        {preselectedItem
          ? "Exchange the product from the selected order."
          : "Select a product from a delivered order and describe your issue."}
      </p>

      {/* Form chính */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fff",                  // nền trắng
          padding: "30px",                          // padding trong form
          borderRadius: "12px",                     // bo góc
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)", // đổ bóng nhẹ
        }}
      >
        {/* =========================
            KHU VỰC CHỌN SẢN PHẨM
           ========================= */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",      // label chiếm nguyên dòng
              fontWeight: "600",     // đậm
              marginBottom: "6px",   // cách dưới
              fontSize: "14px",      // cỡ chữ
            }}
          >
            Product to complain about <span style={{ color: "#dc2626" }}>*</span>
          </label>

          {/* Nếu không có item nào hợp lệ để khiếu nại */}
          {filteredOrderItems.length === 0 ? (
            <p
              style={{
                color: "#d97706",            // màu cam cảnh báo
                fontSize: "14px",
                backgroundColor: "#fef3c7",  // nền vàng nhạt
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              You do not have any delivered orders within the complaint period (7
              days).
            </p>
          ) : (
            // Nếu có item thì render select dropdown
            <select
              value={selectedOrderItemId}
              onChange={(e) => setSelectedOrderItemId(e.target.value)}
              disabled={Boolean(preselectedOrderItemId)} // nếu đã preselect thì khóa select
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                backgroundColor: preselectedOrderItemId ? "#f3f4f6" : "#fff",
              }}
            >
              {/* Option mặc định */}
              <option value="">-- Select product --</option>

              {/* Duyệt từng item để tạo option */}
              {filteredOrderItems.map((item) => {
                // Lấy item ID, hỗ trợ nhiều kiểu casing
                const itemId = item.orderItemId || item.OrderItemId;

                // Lấy tên sản phẩm
                const name =
                  item.frameName || item.productName || item.name || "Product";

                // Lấy màu sản phẩm nếu có
                const color = item.colorName || item.color || "";

                // Tạo label của order/preorder
                const orderLabel =
                  item.isFromPreorder && item.preorderId
                    ? `Preorder #${String(item.preorderId).slice(0, 8)}`
                    : `Order #${String(item.orderId).slice(0, 8)}`;

                // Render option cho item
                return (
                  <option key={itemId} value={itemId}>
                    {name} {color ? `(${color})` : ""} — {orderLabel}
                  </option>
                );
              })}
            </select>
          )}
        </div>


        {/* =========================
            KHU VỰC CHỌN LOẠI YÊU CẦU
           ========================= */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Request Type <span style={{ color: "#dc2626" }}>*</span>
          </label>

          {/* Danh sách button request type */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {requestTypes.map((t) => (
              <button
                key={t.value}                 // key cho React
                type="button"                 // rất quan trọng: không cho submit form
                onClick={() => setRequestType(t.value)} // click để chọn loại request
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border:
                    requestType === t.value
                      ? "2px solid #3b82f6"   // nếu đang active thì viền xanh đậm
                      : "1px solid #d1d5db",  // nếu không active thì viền xám
                  backgroundColor: requestType === t.value ? "#dbeafe" : "#fff",
                  color: requestType === t.value ? "#1d4ed8" : "#374151",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: requestType === t.value ? "600" : "400",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>


        {/* =========================
            KHU VỰC CHỌN LÝ DO
           ========================= */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Reason <span style={{ color: "#dc2626" }}>*</span>
          </label>

          {/* Nếu requestType có tồn tại và có danh sách lý do tương ứng */}
          {requestType && COMPLAINT_REASONS[requestType] ? (
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "10px",
                backgroundColor: "#fff",
              }}
            >
              {/* Option mặc định */}
              <option value="">-- Select reason --</option>

              {/* Duyệt danh sách lý do theo requestType */}
              {COMPLAINT_REASONS[requestType].map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            // Nếu chưa có requestType hợp lệ thì hiện nhắc nhở
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              Please select a request type first
            </p>
          )}

          {/* Textarea để user nhập chi tiết bổ sung */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Add more details (optional)..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              resize: "vertical",         // cho phép kéo cao thấp theo chiều dọc
              boxSizing: "border-box",
            }}
          />
        </div>


        {/* =========================
            KHU VỰC UPLOAD ẢNH / LINK
           ========================= */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Images / Proof Link{" "}
            <span style={{ color: "#dc2626" }}>*</span>
          </label>

          {/* Khối upload file */}
          <div
            style={{
              border: "2px dashed #d1d5db",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              marginBottom: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            {/* Mô tả cho user biết có thể upload ảnh trực tiếp */}
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                margin: "0 0 8px 0",
              }}
            >
              Upload images directly from your device (maximum 10MB per image)
            </p>

            {/* Input file để chọn nhiều ảnh */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp" // chỉ cho các định dạng ảnh này
              multiple                                           // cho phép chọn nhiều file
              onChange={handleImageUpload}                       // xử lý upload
              disabled={uploadingImage}                          // đang upload thì khóa
              style={{ fontSize: "13px" }}
            />

            {/* Nếu đang upload thì hiện text trạng thái */}
            {uploadingImage && (
              <p
                style={{ fontSize: "13px", color: "#3b82f6", marginTop: "8px" }}
              >
                Uploading images...
              </p>
            )}
          </div>


          {/* Preview danh sách ảnh đã upload */}
          {uploadedImages.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              {/* Duyệt từng URL ảnh */}
              {uploadedImages.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",     // để nút xóa đặt absolute theo khung này
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  {/* Ảnh preview */}
                  <img
                    src={url}
                    alt={`Upload ${idx + 1}`}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover", // ảnh lấp đầy khung mà vẫn giữ tỷ lệ
                      display: "block",
                    }}
                  />

                  {/* Nút xóa ảnh khỏi danh sách */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      fontSize: "12px",
                      lineHeight: "20px",
                      textAlign: "center",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}


          {/* Text hướng dẫn nhập link ngoài */}
          <p
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            Or enter an external image/video link:
          </p>

          {/* Input nhập link bằng chứng ngoài */}
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>


        {/* =========================
            KHU VỰC HIỂN THỊ LỖI
           ========================= */}
        {error && (
          <div
            style={{
              color: "#dc2626",
              backgroundColor: "#fee2e2",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}


        {/* =========================
            NHÓM NÚT HÀNH ĐỘNG
           ========================= */}
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Nút submit form */}
          <button
            type="submit"
            disabled={submitting || orderItems.length === 0} // disable khi đang submit hoặc không có item nào
            style={{
              padding: "12px 24px",
              backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {/* Text nút đổi theo trạng thái submitting */}
            {submitting ? "Submitting..." : "Submit Complaint"}
          </button>

          {/* Nút hủy */}
          <button
            type="button"
            onClick={() => navigate("/profile")} // quay về trang danh sách complaints
            style={{
              padding: "12px 24px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}