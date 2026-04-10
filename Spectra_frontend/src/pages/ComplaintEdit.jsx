// Import React và các hook cần dùng:
// - useState: tạo state trong function component
// - useEffect: chạy side effect (ví dụ gọi API khi component mount)
// - useContext: lấy dữ liệu từ Context
import React, { useState, useEffect, useContext } from "react";

// Import hook từ react-router-dom:
// - useParams: lấy params trên URL, ở đây là id complaint
// - useNavigate: điều hướng trang bằng code
import { useParams, useNavigate } from "react-router-dom";

// Import UserContext để lấy thông tin user đang đăng nhập
import { UserContext } from "../context/UserContext";

// Hằng số API gốc dùng cho complaint
// Đây là endpoint backend để lấy / sửa complaint
const API = "https://myspectra.runasp.net/api/Complaints";

// Danh sách các loại request hiển thị thành nút bấm cho user chọn
// value: giá trị gửi lên backend
// label: chữ hiển thị ra giao diện
const requestTypes = [
  { value: "complaint", label: "Complaint" },
  { value: "return", label: "Return" },
  { value: "exchange", label: "Exchange" },
  { value: "refund", label: "Refund" },
  { value: "warranty", label: "Warranty" },
];

// Object lưu sẵn danh sách reason theo từng loại request
// Ví dụ: nếu requestType = "return" thì dropdown sẽ hiện các lý do thuộc return
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

// Export component mặc định tên là ComplaintEdit
export default function ComplaintEdit() {
  // Lấy id từ URL
  // Ví dụ URL là /complaints/edit/123 thì id có thể là 123
  const { id } = useParams();

  // Lấy user từ UserContext
  // user thường chứa token và các thông tin đăng nhập
  const { user } = useContext(UserContext);

  // Hook navigate để chuyển trang
  const navigate = useNavigate();

  // State lưu loại request đang chọn
  // Ví dụ: complaint / return / exchange / refund / warranty
  const [requestType, setRequestType] = useState("");

  // State lưu reason đã chọn từ dropdown
  const [selectedReason, setSelectedReason] = useState("");

  // State lưu phần user tự nhập thêm vào textarea
  // Ví dụ chi tiết bổ sung cho lý do
  const [reason, setReason] = useState("");

  // State lưu link ảnh/video minh chứng
  const [mediaUrl, setMediaUrl] = useState("");

  // State loading để biết đang tải dữ liệu từ server hay chưa
  const [loading, setLoading] = useState(true);

  // State error để hiển thị lỗi cho user
  const [error, setError] = useState("");

  // State submitting để biết form đang gửi hay chưa
  // Dùng để disable nút submit và đổi chữ "Saving..."
  const [submitting, setSubmitting] = useState(false);

  // Lấy token theo thứ tự ưu tiên:
  // 1. user?.token từ context
  // 2. nếu context chưa có thì thử lấy user từ localStorage rồi đọc token
  //
  // Dấu ?. là optional chaining:
  // - Nếu user tồn tại thì lấy token
  // - Nếu không tồn tại thì trả về undefined thay vì báo lỗi
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  // useEffect dùng để chạy khi component mount
  // hoặc khi id / token / navigate thay đổi
  useEffect(() => {
    // Nếu không có token => chưa đăng nhập => chuyển về trang login
    if (!token) {
      navigate("/login");
      return;
    }

    // Hàm async để gọi API lấy dữ liệu complaint hiện tại
    const fetchComplaint = async () => {
      try {
        // Gọi GET tới API /Complaints/{id}
        const res = await fetch(`${API}/${id}`, {
          headers: {
            // Báo backend rằng mình gửi/nhận JSON
            "Content-Type": "application/json",

            // Gửi access token để backend xác thực người dùng
            Authorization: `Bearer ${token}`,
          },
        });

        // Nếu response thành công (status 200-299)
        if (res.ok) {
          // Convert response từ JSON sang object JavaScript
          const data = await res.json();

          // Kiểm tra xem complaint này có được phép sửa hay không
          // Backend có thể trả canModify hoặc CanModify
          // Viết như vậy để tương thích nhiều kiểu đặt tên field
          if (!(data.canModify || data.CanModify)) {
            // Nếu không được sửa thì điều hướng về trang chi tiết complaint
            navigate(`/complaints/${id}`);
            return;
          }

          // Lấy requestType từ dữ liệu backend
          // Hỗ trợ cả camelCase và PascalCase
          const incomingType = data.requestType || data.RequestType || "";

          // Lấy reason từ backend
          const incomingReason = data.reason || data.Reason || "";

          // Lấy mediaUrl từ backend
          const incomingMediaUrl = data.mediaUrl || data.MediaUrl || "";

          // Đổ requestType lên state để giao diện hiển thị đúng loại đang chọn
          setRequestType(incomingType);

          // Đổ mediaUrl lên state để input hiện sẵn link cũ
          setMediaUrl(incomingMediaUrl);

          // Tìm trong danh sách lý do có reason nào match với reason backend gửi lên không
          //
          // Ví dụ backend trả về:
          // "Product is defective / damaged upon arrival - broken temple"
          //
          // thì phần selectedReason sẽ là:
          // "Product is defective / damaged upon arrival"
          //
          // và phần reason thêm sẽ là:
          // "broken temple"
          const matchedReason = (COMPLAINT_REASONS[incomingType] || []).find(
            (r) =>
              incomingReason === r || incomingReason.startsWith(`${r} - `),
          );

          // Nếu tìm được reason nằm trong danh sách có sẵn
          if (matchedReason) {
            // Set dropdown = reason chuẩn
            setSelectedReason(matchedReason);

            // Nếu incomingReason đúng y nguyên matchedReason
            // thì nghĩa là user không nhập thêm chi tiết
            // => textarea để rỗng
            //
            // Nếu incomingReason = matchedReason + " - " + gì đó
            // => cắt phần matchedReason ra, chỉ giữ phần user gõ thêm cho textarea
            setReason(
              incomingReason === matchedReason
                ? ""
                : incomingReason.replace(`${matchedReason} - `, ""),
            );
          } else {
            // Nếu reason từ backend không trùng với danh sách mẫu
            // thì coi như user nhập reason tự do hoàn toàn
            setSelectedReason("");
            setReason(incomingReason);
          }
        } else {
          // Nếu API trả lỗi (ví dụ 404, 500...)
          setError("Unable to load data.");
        }
      } catch {
        // Nếu lỗi mạng hoặc fetch bị lỗi
        setError("Connection error.");
      }

      // Dù thành công hay thất bại thì cũng dừng loading
      setLoading(false);
    };

    // Gọi hàm lấy complaint
    fetchComplaint();
  }, [id, token, navigate]); 
  // Dependency array:
  // - Khi id thay đổi => fetch complaint mới
  // - Khi token thay đổi => fetch lại
  // - navigate đưa vào để tránh warning của React hooks

  // Hàm xử lý submit form
  const handleSubmit = async (e) => {
    // Chặn hành vi submit mặc định của form (reload trang)
    e.preventDefault();

    // Xóa lỗi cũ trước khi validate mới
    setError("");

    // Validate:
    // Nếu user không chọn reason trong dropdown
    // và cũng không nhập reason tự do
    // => báo lỗi
    if (!selectedReason && !reason.trim()) {
      setError("Please select or enter a reason.");
      return;
    }

    // Validate:
    // mediaUrl là bắt buộc, nếu rỗng thì báo lỗi
    if (!mediaUrl.trim()) {
      setError(
        "Please enter an image/video proof link so staff can verify the issue.",
      );
      return;
    }

    // Gom reason cuối cùng để gửi lên backend
    //
    // Trường hợp 1:
    // Có selectedReason, có nhập thêm chi tiết:
    // => "Selected reason - text thêm"
    //
    // Trường hợp 2:
    // Có selectedReason, không nhập thêm:
    // => chỉ gửi selectedReason
    //
    // Trường hợp 3:
    // Không chọn selectedReason, chỉ nhập tay:
    // => gửi reason.trim()
    const finalReason = selectedReason
      ? reason.trim()
        ? `${selectedReason} - ${reason.trim()}`
        : selectedReason
      : reason.trim();

    // Bật trạng thái đang submit
    setSubmitting(true);

    try {
      // Gọi API PUT để cập nhật complaint theo id
      const res = await fetch(`${API}/${id}`, {
        method: "PUT", // PUT = cập nhật dữ liệu
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        // Dữ liệu gửi lên backend ở dạng JSON string
        body: JSON.stringify({
          // Nếu requestType rỗng thì gửi undefined
          // để tránh gửi chuỗi rỗng không cần thiết
          requestType: requestType || undefined,

          // finalReason là lý do cuối cùng sau khi ghép dropdown + textarea
          reason: finalReason || undefined,

          // trim() bỏ khoảng trắng đầu/cuối
          // nếu rỗng thì gửi undefined
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });

      // Nếu update thành công
      if (res.ok) {
        // Điều hướng về lại trang chi tiết complaint
        navigate(`/complaints/${id}`);
      } else {
        // Nếu backend trả lỗi
        // thử đọc message lỗi từ JSON
        const err = await res.json();

        // Hỗ trợ cả err.message và err.Message
        setError(err.message || err.Message || "Update failed.");
      }
    } catch {
      // Nếu lỗi mạng / fetch lỗi
      setError("Connection error.");
    }

    // Tắt trạng thái submitting
    setSubmitting(false);
  };

  // Nếu đang loading thì render giao diện Loading... và return luôn
  // Nghĩa là phần form phía dưới chưa được render
  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
        Loading...
      </div>
    );

  // Nếu không loading thì render giao diện chính của trang
  return (
    <div
      style={{
        // Giới hạn chiều rộng tối đa của khối form
        maxWidth: "700px",

        // Căn giữa theo chiều ngang, cách trên dưới 40px
        margin: "40px auto",

        // Padding bên trong khối ngoài cùng
        padding: "20px",

        // Font chữ chung cho component
        fontFamily: "sans-serif",
      }}
    >
      {/* Tiêu đề trang */}
      <h2 style={{ marginBottom: "24px" }}>Edit Complaint</h2>

      {/* Form chính */}
      <form
        onSubmit={handleSubmit} // Khi submit thì gọi handleSubmit
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {/* Khối chọn Request Type */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Request Type
          </label>

          {/* Vùng chứa các nút loại request */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {/* Lặp qua mảng requestTypes để tạo từng button */}
            {requestTypes.map((t) => (
              <button
                key={t.value} // key giúp React tối ưu render danh sách
                type="button" // type="button" để không làm submit form
                onClick={() => {
                  // Khi bấm 1 loại request:
                  // 1. đổi requestType
                  setRequestType(t.value);

                  // 2. reset selectedReason vì reason cũ có thể không hợp loại mới
                  setSelectedReason("");

                  // 3. reset textarea chi tiết
                  setReason("");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",

                  // Nếu nút đang được chọn => viền xanh dày hơn
                  // nếu không => viền xám bình thường
                  border:
                    requestType === t.value
                      ? "2px solid #3b82f6"
                      : "1px solid #d1d5db",

                  // Nền xanh nhạt khi active, trắng khi không active
                  backgroundColor: requestType === t.value ? "#dbeafe" : "#fff",

                  // Màu chữ xanh khi active, xám đậm khi bình thường
                  color: requestType === t.value ? "#1d4ed8" : "#374151",

                  // Con trỏ chuột dạng nút bấm
                  cursor: "pointer",

                  // Cỡ chữ
                  fontSize: "13px",

                  // Active thì chữ đậm hơn
                  fontWeight: requestType === t.value ? "600" : "400",
                }}
              >
                {/* Hiển thị tên loại request */}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Khối Reason */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            {/* Dấu * màu đỏ để báo trường bắt buộc */}
            Reason <span style={{ color: "#dc2626" }}>*</span>
          </label>

          {/* 
            Nếu đã chọn requestType và có danh sách reason tương ứng 
            => render dropdown select
            Ngược lại => render dòng nhắc chọn request type trước
          */}
          {requestType && COMPLAINT_REASONS[requestType] ? (
            <select
              value={selectedReason} // giá trị select hiện tại
              onChange={(e) => setSelectedReason(e.target.value)} // cập nhật khi user chọn option
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

              {/* Render các option theo requestType đang chọn */}
              {COMPLAINT_REASONS[requestType].map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
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

          {/* Textarea để user nhập thêm chi tiết reason */}
          <textarea
            value={reason} // gắn với state reason
            onChange={(e) => setReason(e.target.value)} // cập nhật state khi gõ
            rows={4} // chiều cao mặc định 4 dòng
            placeholder="Add more details (optional)..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              resize: "vertical", // chỉ cho kéo dãn theo chiều dọc
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Khối nhập link ảnh/video minh chứng */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Image/Video Link <span style={{ color: "#dc2626" }}>*</span>
          </label>

          <input
            value={mediaUrl} // giá trị input lấy từ state
            onChange={(e) => setMediaUrl(e.target.value)} // cập nhật state khi user nhập
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

        {/* Nếu có lỗi thì hiển thị khối báo lỗi */}
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
            {/* Nội dung lỗi */}
            {error}
          </div>
        )}

        {/* Khối 2 nút dưới cùng */}
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Nút submit */}
          <button
            type="submit"
            disabled={submitting} // đang gửi thì khóa nút
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",

              // Nếu đang submit thì không cho cảm giác click
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {/* Đổi text nút theo trạng thái */}
            {submitting ? "Saving..." : "Update"}
          </button>

          {/* Nút hủy */}
          <button
            type="button" // để không submit form
            onClick={() => navigate(`/complaints/${id}`)} // quay về trang chi tiết
            style={{
              padding: "12px 24px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
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