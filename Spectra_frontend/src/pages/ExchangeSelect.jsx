// Import React và các hook cần dùng
// - useState: tạo state trong component
// - useEffect: chạy side effect khi component mount / state thay đổi
// - useContext: lấy dữ liệu từ Context API
import React, { useState, useEffect, useContext } from "react";

// Import các hook / component từ react-router-dom
// - useParams: lấy param trên URL, ở đây là id complaint
// - Link: điều hướng bằng thẻ link trong React Router
// - useNavigate: chuyển trang bằng code
import { useParams, Link, useNavigate } from "react-router-dom";

// Import UserContext để lấy thông tin user đang đăng nhập
import { UserContext } from "../context/UserContext";

// Import modal chọn/cấu hình lens (tròng kính)
// Component này được tái sử dụng để user cấu hình kính cho gọng mới
import LensSelectionModal from "../components/ui/LensSelectionModal";


// ==========================
// KHAI BÁO CÁC API ENDPOINT
// ==========================

// API complaints
// Đây là API backend dùng để:
// - lấy chi tiết complaint
// - tạo exchange order từ complaint
const API_COMPLAINTS = "https://myspectra.runasp.net/api/Complaints";

// API frames
// Đây là API backend dùng để:
// - lấy danh sách gọng kính
// - lấy chi tiết 1 gọng kính
// - lấy các loại lens hỗ trợ cho gọng kính đó
const API_FRAMES = "https://myspectra.runasp.net/api/Frames";


// Hàm format số theo kiểu Việt Nam
// Ví dụ: 1000000 -> "1.000.000"
// Nếu n không tồn tại thì trả về "—"
const fmt = (n) => n?.toLocaleString("vi-VN") ?? "—";


// Export component mặc định của file
export default function ExchangeSelect() {
  // Lấy id từ URL
  // Ví dụ route là /complaints/:id/exchange thì id ở đây chính là complaint id
  const { id } = useParams();

  // Lấy user từ UserContext
  // Thường context này được set sau khi user đăng nhập
  const { user } = useContext(UserContext);

  // Hook điều hướng trang
  const navigate = useNavigate();

  // Lấy token đăng nhập
  // Ưu tiên lấy từ user trong Context
  // Nếu context chưa có thì fallback sang localStorage
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;


  // ==========================
  // CÁC STATE CHÍNH CỦA TRANG
  // ==========================

  // complaint hiện tại (chi tiết khiếu nại / yêu cầu đổi)
  const [complaint, setComplaint] = useState(null);

  // danh sách gọng kính để user chọn đổi sang
  const [frames, setFrames] = useState([]);

  // trạng thái loading chung của trang lúc mới vào
  const [loading, setLoading] = useState(true);


  // ==========================
  // STATE LIÊN QUAN ĐẾN FRAME
  // ==========================

  // gọng mà user đang chọn trên grid
  const [selectedFrame, setSelectedFrame] = useState(null);

  // chi tiết đầy đủ của gọng đang chọn
  // vì list frame có thể chỉ là dữ liệu rút gọn
  const [frameDetail, setFrameDetail] = useState(null);

  // danh sách lens types mà gọng này hỗ trợ
  const [supportedLensTypes, setSupportedLensTypes] = useState([]);

  // màu user đang chọn cho gọng
  const [selectedColor, setSelectedColor] = useState(null);

  // loading riêng cho phần tải chi tiết frame
  const [loadingDetail, setLoadingDetail] = useState(false);


  // ==========================
  // STATE LIÊN QUAN ĐẾN LENS
  // ==========================

  // lensConfig sẽ được trả về từ modal cấu hình lens
  // Ví dụ object có dạng:
  // {
  //   lensIncluded: true/false,
  //   finalPrice: ...,
  //   lensDetails: {
  //     typeId,
  //     featureId,
  //     prescriptionId
  //   }
  // }
  const [lensConfig, setLensConfig] = useState(null);

  // trạng thái mở / đóng modal cấu hình lens
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);


  // ==========================
  // STATE FORM GIAO HÀNG
  // ==========================

  // số lượng sản phẩm muốn đổi
  const [quantity, setQuantity] = useState(1);

  // địa chỉ giao hàng
  const [address, setAddress] = useState("");

  // họ tên người nhận
  const [fullName, setFullName] = useState("");

  // số điện thoại người nhận
  const [phone, setPhone] = useState("");

  // trạng thái đang submit form tạo đơn đổi
  const [submitting, setSubmitting] = useState(false);

  // message lỗi để hiển thị lên UI
  const [error, setError] = useState("");

  // keyword tìm kiếm frame
  const [search, setSearch] = useState("");


  // ==========================================================
  // useEffect chạy khi component mount hoặc khi id / token thay đổi
  // ==========================================================
  useEffect(() => {
    // Nếu chưa có token => chưa đăng nhập => chuyển về trang login
    if (!token) {
      navigate("/login");
      return;
    }

    // Tải dữ liệu complaint + danh sách frame
    loadData();

    // Tải profile user để autofill tên, sđt, địa chỉ
    fetchUserProfile();
  }, [id, token]);
  // id đổi -> tải lại complaint mới
  // token đổi -> tải lại dữ liệu theo user mới


  // ==========================================
  // HÀM LẤY PROFILE USER ĐANG ĐĂNG NHẬP
  // ==========================================
  const fetchUserProfile = async () => {
    try {
      // Gọi API lấy profile của user hiện tại
      // API: GET /api/Users/me
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Nếu gọi thành công
      if (res.ok) {
        // Parse JSON response
        const data = await res.json();

        // Gán dữ liệu vào form để user không cần nhập lại
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    } catch {
      // Nếu lỗi mạng / lỗi bất kỳ thì bỏ qua, không chặn trang
      /* ignore */
    }
  };


  // ==========================================
  // HÀM TẢI DỮ LIỆU BAN ĐẦU CHO TRANG
  // - complaint detail
  // - danh sách frame
  // ==========================================
  const loadData = async () => {
    try {
      // Gọi song song 2 API để tiết kiệm thời gian
      const [cRes, fRes] = await Promise.all([
        // API lấy chi tiết complaint theo id
        fetch(`${API_COMPLAINTS}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),

        // API lấy danh sách frames
        // page=1&pageSize=100 nghĩa là lấy 100 item đầu tiên
        fetch(`${API_FRAMES}?page=1&pageSize=100`),
      ]);

      // ==========================
      // XỬ LÝ KẾT QUẢ COMPLAINT
      // ==========================
      if (cRes.ok) {
        // Parse complaint JSON
        const c = await cRes.json();

        // Chuẩn hóa status về chữ thường để dễ so sánh
        const status = (c.status || "").toLowerCase();

        // Chuẩn hóa requestType về chữ thường
        const type = (c.requestType || "").toLowerCase();

        // Nếu complaint không phải loại exchange thì chặn luôn
        if (type !== "exchange") {
          setError("This complaint is not an Exchange type.");

        // Nếu complaint đã có exchangeOrderId rồi thì nghĩa là đơn đổi đã được tạo
        } else if (c.exchangeOrderId) {
          setError("An exchange order has already been created for this complaint.");

        // Chỉ cho phép khi complaint đã được duyệt
        // Ở đây cho phép 2 trạng thái:
        // - approved
        // - in_progress
        } else if (status !== "approved" && status !== "in_progress") {
          setError("The request has not been approved yet. Please wait for staff to process it.");

        // Nếu mọi điều kiện đều hợp lệ thì lưu complaint vào state
        } else {
          setComplaint(c);
        }
      } else {
        // Nếu API complaint trả về lỗi
        setError("Unable to load complaint information.");
      }

      // ==========================
      // XỬ LÝ KẾT QUẢ FRAME LIST
      // ==========================
      if (fRes.ok) {
        // Parse JSON
        const fData = await fRes.json();

        // Có backend trả về dạng { items: [...] }
        // Có backend trả về trực tiếp [...]
        // Nên code này xử lý cả 2 trường hợp
        const items = fData.items || fData || [];

        // Tạo Set để loại trùng tên frame
        const seen = new Set();

        // Lọc ra danh sách frame unique theo frameName
        const unique = items.filter((f) => {
          // Nếu đã gặp tên frame này rồi thì bỏ qua
          if (seen.has(f.frameName)) return false;

          // Nếu chưa gặp thì thêm vào Set
          seen.add(f.frameName);
          return true;
        });

        // Lưu danh sách đã lọc vào state
        setFrames(unique);
      }
    } catch {
      // Nếu có lỗi mạng / server / fetch
      setError("Connection error. Please try again.");
    }

    // Dù thành công hay thất bại cũng tắt loading chung
    setLoading(false);
  };


  // ==================================================
  // HÀM XỬ LÝ KHI USER CHỌN 1 FRAME TRÊN GRID
  // - reset lựa chọn cũ
  // - gọi API lấy chi tiết frame
  // - gọi API lấy lens types hỗ trợ
  // ==================================================
  const handleSelectFrame = async (frame) => {
    // Lưu frame user vừa click
    setSelectedFrame(frame);

    // Reset màu cũ vì frame mới có thể có màu khác
    setSelectedColor(null);

    // Reset lens config cũ vì frame mới cần cấu hình lại
    setLensConfig(null);

    // Xóa frame detail cũ
    setFrameDetail(null);

    // Xóa lens type cũ
    setSupportedLensTypes([]);

    // Xóa lỗi cũ
    setError("");

    // Bật loading detail
    setLoadingDetail(true);

    // Lấy id của frame
    // Có chỗ backend dùng frameId, có chỗ dùng id
    const frameId = frame.frameId || frame.id;

    try {
      // Gọi song song:
      // 1. API lấy chi tiết frame
      // 2. API lấy lens types hỗ trợ
      const [detailRes, lensRes] = await Promise.all([
        fetch(`${API_FRAMES}/${frameId}`),
        fetch(`${API_FRAMES}/${frameId}/lens-types`),
      ]);

      // Nếu lấy chi tiết frame thành công
      if (detailRes.ok) {
        const detail = await detailRes.json();

        // Lưu chi tiết frame
        setFrameDetail(detail);

        // Nếu frame có danh sách màu thì auto chọn màu đầu tiên
        if (detail.frameColors?.length > 0) {
          setSelectedColor(detail.frameColors[0]);
        }
      }

      // Nếu lấy lens types thành công
      if (lensRes.ok) {
        const lensData = await lensRes.json();

        // supportedLensTypes là field backend trả về
        setSupportedLensTypes(lensData.supportedLensTypes || []);
      }
    } catch {
      // Nếu lỗi thì bỏ qua
      /* ignore */
    }

    // Tắt loading detail sau khi fetch xong
    setLoadingDetail(false);
  };


  // ==========================================
  // HÀM NHẬN KẾT QUẢ TỪ MODAL CẤU HÌNH LENS
  // ==========================================
  const handleLensConfirm = (config) => {
    // Lưu cấu hình lens user đã chọn
    setLensConfig(config);

    // Đóng modal lại
    setIsLensModalOpen(false);
  };


  // ==========================================
  // HÀM SUBMIT TẠO EXCHANGE ORDER
  // ==========================================
  const handleSubmit = async () => {
    // Validate: chưa chọn frame mới
    if (!selectedFrame) {
      setError("Please select a replacement product.");
      return;
    }

    // Nếu frame có màu mà user chưa chọn màu
    if (frameDetail?.frameColors?.length > 0 && !selectedColor) {
      setError("Please select a color.");
      return;
    }

    // Bắt buộc phải cấu hình lens trước khi submit
    if (!lensConfig) {
      setError(
        "Please configure the lenses (click the 'Configure Lenses' button).",
      );
      return;
    }

    // Validate tên người nhận
    if (!fullName.trim()) {
      setError("Please enter the recipient's full name.");
      return;
    }

    // Validate số điện thoại
    if (!phone.trim()) {
      setError("Please enter the phone number.");
      return;
    }

    // Validate địa chỉ
    if (!address.trim()) {
      setError("Please enter the shipping address.");
      return;
    }

    // Bật trạng thái submitting để disable nút / đổi text nút
    setSubmitting(true);

    // Xóa lỗi cũ
    setError("");

    try {
      // Lấy frameId chuẩn từ frameDetail hoặc selectedFrame
      // String(...) để đảm bảo gửi lên backend dạng string
      const frameId = String(
        frameDetail?.id || frameDetail?.frameId || selectedFrame.frameId,
      );

      // Tạo item cơ bản gửi lên payload
      const item = { frameId, quantity };

      // ==========================================
      // HÀM KIỂM TRA GIÁ TRỊ GUID HỢP LỆ
      // ==========================================
      const getValidGuid = (val) => {
        // Nếu không có giá trị hoặc giá trị rỗng / null / undefined dạng string
        // thì trả về undefined để không đính vào payload
        if (!val || val === "null" || val === "undefined" || val === "")
          return undefined;

        // Nếu hợp lệ thì ép thành string
        return String(val);
      };

      // ==========================================
      // THÊM selectedColorId vào item nếu có
      // ==========================================
      const colorId = getValidGuid(
        selectedColor?.color?.id ||
          selectedColor?.color?.colorId ||
          selectedColor?.colorId,
      );

      // Chỉ gắn selectedColorId nếu colorId hợp lệ
      if (colorId) item.selectedColorId = colorId;

      // ==========================================
      // THÊM THÔNG TIN LENS VÀO item nếu user chọn lens
      // ==========================================
      if (lensConfig?.lensIncluded && lensConfig.lensDetails) {
        // Lấy object lensDetails cho ngắn gọn
        const ld = lensConfig.lensDetails;

        // Kiểm tra từng id hợp lệ
        const validTypeId = getValidGuid(ld.typeId);
        const validFeatureId = getValidGuid(ld.featureId);
        const validPrescriptionId = getValidGuid(ld.prescriptionId);

        // Nếu có thì thêm vào item
        if (validTypeId) item.lensTypeId = validTypeId;
        if (validFeatureId) item.featureId = validFeatureId;
        if (validPrescriptionId) item.prescriptionId = validPrescriptionId;
      }

      // ==========================================
      // TẠO PAYLOAD GỬI LÊN BACKEND
      // ==========================================
      const payload = {
        // Gộp tên + số điện thoại + địa chỉ thành 1 chuỗi shippingAddress
        // Ví dụ: [Nguyen Van A - 0901234567] 123 ABC Street
        shippingAddress: `[${fullName.trim()} - ${phone.trim()}] ${address.trim()}`,

        // Backend nhận danh sách items
        items: [item],
      };

      // ==========================================
      // GỌI API TẠO EXCHANGE ORDER
      // API: POST /api/Complaints/{id}/create-exchange-order
      // ==========================================
      const res = await fetch(`${API_COMPLAINTS}/${id}/create-exchange-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Nếu tạo đơn thành công
      if (res.ok) {
        // Parse JSON, nếu parse lỗi thì trả về null
        const data = await res.json().catch(() => null);

        // Tổng tiền đơn đổi
        const exchangeTotal = data?.exchangeOrderTotal;

        // Giá sản phẩm gốc
        const origPrice = data?.originalItemPrice;

        // Message thành công mặc định
        let msg = "Replacement order has been created successfully!";

        // Nếu backend có trả về 2 giá trị để so sánh
        if (exchangeTotal != null && origPrice != null) {
          // Tính chênh lệch giá
          const diff = exchangeTotal - origPrice;

          // Nếu sản phẩm mới đắt hơn
          if (diff > 0) {
            msg += `\n\nThe new product is more expensive by ${fmt(diff)}₫. You need to pay the difference.`;

          // Nếu sản phẩm mới rẻ hơn
          } else if (diff < 0) {
            msg += `\n\nThe new product is cheaper by ${fmt(Math.abs(diff))}₫. The difference will be refunded to you.`;

          // Nếu bằng giá
          } else {
            msg += "\n\nThe product prices are equivalent, so there is no price difference.";
          }
        }

        // Hiển thị thông báo
        alert(msg);

        // Chuyển về trang complaint detail
        navigate(`/complaints/${id}`);
      } else {
        // Nếu backend trả về lỗi
        const err = await res.json().catch(() => null);

        // Ưu tiên đọc message từ backend
        setError(
          err?.message ||
            err?.Message ||
            "Failed to create exchange order. Please try again.",
        );
      }
    } catch {
      // Nếu lỗi mạng / fetch lỗi
      setError("Connection error. Please try again.");
    }

    // Tắt trạng thái submitting
    setSubmitting(false);
  };


  // ==========================================
  // CÁC NHÁNH RENDER SỚM
  // ==========================================

  // Nếu đang loading toàn trang
  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px", fontSize: "16px" }}>
        Loading...
      </div>
    );

  // Nếu có lỗi và chưa có complaint hợp lệ
  // tức là trang không thể tiếp tục dùng được
  if (error && !complaint)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error}</h2>
        <Link to={`/complaints/${id}`} style={{ color: "#3b82f6" }}>
          ← Back to complaint details
        </Link>
      </div>
    );


  // ==========================================
  // BIẾN PHỤC VỤ HIỂN THỊ / TÍNH TOÁN
  // ==========================================

  // Lấy item gốc từ complaint
  const originalItem = complaint?.originalItem;

  // Lọc danh sách frame theo text search
  const filteredFrames = frames.filter(
    (f) => !search || f.frameName?.toLowerCase().includes(search.toLowerCase()),
  );

  // Chi phí cộng thêm của màu đang chọn
  const colorExtraCost = selectedColor?.colorExtraCost || 0;

  // Giá hiển thị của frame mới
  // ưu tiên:
  // - frameDetail.basePrice
  // - selectedFrame.basePrice
  // - selectedFrame.price
  // rồi cộng thêm tiền màu
  const displayPrice =
    (frameDetail?.basePrice ||
      selectedFrame?.basePrice ||
      selectedFrame?.price ||
      0) + colorExtraCost;

  // ==========================================
  // SO SÁNH GIÁ CŨ VÀ GIÁ MỚI
  // ==========================================

  // Tổng giá sản phẩm gốc = đơn giá * số lượng
  const originalPrice =
    (originalItem?.unitPrice || 0) * (originalItem?.quantity || 1);

  // Tổng giá sản phẩm mới
  // chỉ tính khi đã có lensConfig
  const newTotalPrice = lensConfig ? lensConfig.finalPrice * quantity : null;

  // Chênh lệch giá mới - giá cũ
  const priceDiff =
    newTotalPrice !== null ? newTotalPrice - originalPrice : null;


  // ==========================================
  // PHẦN GIAO DIỆN JSX CHÍNH
  // ==========================================
  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      {/* 
        Modal cấu hình lens
        - isOpen: modal có đang mở hay không
        - onClose: đóng modal
        - product: truyền thông tin frame đang chọn cho modal
        - supportedLensTypes: danh sách lens hỗ trợ
        - onConfirmAddToCart: callback khi user xác nhận cấu hình lens
      */}
      <LensSelectionModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        product={
          frameDetail ? { ...frameDetail, basePrice: displayPrice } : null
        }
        supportedLensTypes={supportedLensTypes}
        onConfirmAddToCart={handleLensConfirm}
      />

      {/* Link quay lại complaint detail */}
      <Link
        to={`/complaints/${id}`}
        style={{
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "14px",
          display: "inline-block",
          marginBottom: "20px",
        }}
      >
        ← Back to complaint details
      </Link>

      {/* Tiêu đề trang */}
      <h2 style={{ margin: "0 0 8px", fontSize: "24px" }}>
        Select Replacement Product
      </h2>

      {/* Hiển thị complaint code ngắn gọn */}
      <p
        style={{
          color: "#6b7280",
          marginTop: 0,
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        Complaint Code: <b>#{String(complaint.requestId).slice(0, 8)}</b>
      </p>

      {/* ==========================
          TÓM TẮT SẢN PHẨM GỐC
          ========================== */}
      {originalItem && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#faf5ff",
            borderRadius: "10px",
            border: "1px solid #e9d5ff",
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: "8px",
              color: "#7c3aed",
              fontSize: "14px",
            }}
          >
            Original Product (to be returned)
          </h4>

          {/* Tên sản phẩm gốc + đơn giá + số lượng */}
          <p style={{ margin: "2px 0", fontSize: "14px" }}>
            <b>{originalItem.frameName}</b> — {fmt(originalItem.unitPrice)}₫ ×{" "}
            {originalItem.quantity || 1}
          </p>
        </div>
      )}

      {/* ==========================
          Ô TÌM KIẾM SẢN PHẨM
          ========================== */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ==========================
          GRID HIỂN THỊ DANH SÁCH FRAME
          ========================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {filteredFrames.map((f) => {
          // Kiểm tra frame này có đang được chọn không
          const isSelected = selectedFrame?.frameId === f.frameId;

          // Lấy ảnh từ nhiều nguồn field khác nhau để tránh backend không đồng nhất
          const imgUrl =
            f.frameMedia?.[0]?.mediaUrl || f.media?.[0]?.mediaUrl || f.imageUrl;

          return (
            <div
              key={f.frameId}
              onClick={() => handleSelectFrame(f)}
              style={{
                cursor: "pointer",
                border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px",
                backgroundColor: isSelected ? "#eff6ff" : "#fff",
                transition: "all 0.15s",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(37,99,235,0.15)"
                  : "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {/* Nếu có ảnh thì hiển thị ảnh */}
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={f.frameName}
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                />
              )}

              {/* Tên frame */}
              <p
                style={{
                  margin: "0 0 4px",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#111827",
                }}
              >
                {f.frameName}
              </p>

              {/* Giá frame */}
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#059669",
                  fontWeight: 600,
                }}
              >
                ${f.basePrice || f.price}
              </p>

              {/* Nếu item này đang được chọn thì hiển thị badge */}
              {isSelected && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#2563eb",
                    fontWeight: 700,
                  }}
                >
                  ✓ Selected
                </span>
              )}
            </div>
          );
        })}

        {/* Nếu sau khi filter mà không còn frame nào */}
        {filteredFrames.length === 0 && (
          <p
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#9ca3af",
              padding: "40px 0",
            }}
          >
            No products found.
          </p>
        )}
      </div>

      {/* ==========================
          PHẦN CẤU HÌNH CHỈ HIỆN KHI ĐÃ CHỌN FRAME
          ========================== */}
      {selectedFrame && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
            Confirm Exchange
          </h3>

          {/* Nếu đang tải chi tiết frame */}
          {loadingDetail ? (
            <p style={{ color: "#6b7280" }}>Loading product information...</p>
          ) : (
            <>
              {/* ==========================
                  SO SÁNH SẢN PHẨM CŨ VÀ MỚI
                  ========================== */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {/* Box sản phẩm cũ */}
                {originalItem && (
                  <div
                    style={{
                      padding: "14px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#dc2626",
                      }}
                    >
                      OLD PRODUCT (RETURNED)
                    </p>
                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {originalItem.frameName}
                    </p>
                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      Total paid: {fmt(originalPrice)}₫
                    </p>
                  </div>
                )}

                {/* Box sản phẩm mới */}
                <div
                  style={{
                    padding: "14px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2563eb",
                    }}
                  >
                    NEW PRODUCT
                  </p>
                  <p
                    style={{
                      margin: "2px 0",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {selectedFrame.frameName}
                  </p>
                  <p
                    style={{
                      margin: "2px 0",
                      fontSize: "14px",
                      color: "#059669",
                    }}
                  >
                    Frame price: {fmt(displayPrice)}₫
                  </p>
                </div>
              </div>

              {/* ==========================
                  BANNER CHÊNH LỆCH GIÁ
                  Ở ĐÂY LOGIC ĐANG CHỈ CHO ĐỔI KHI GIÁ BẰNG NHAU
                  ========================== */}
              {priceDiff !== null && originalItem && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 18px",
                    borderRadius: "10px",
                    border: `1px solid ${priceDiff === 0 ? "#93c5fd" : "#fca5a5"}`,
                    backgroundColor: priceDiff === 0 ? "#eff6ff" : "#fef2f2",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontWeight: 700,
                          fontSize: "15px",
                          color: priceDiff === 0 ? "#1e40af" : "#991b1b",
                        }}
                      >
                        {priceDiff === 0
                          ? "✓ Equivalent price — Exchange allowed"
                          : "✗ Price not equivalent — Exchange not allowed"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        Old product: {fmt(originalPrice)}₫ → New product:{" "}
                        {fmt(newTotalPrice)}₫
                      </p>
                    </div>

                    {/* Nếu không bằng giá thì hiện số chênh */}
                    {priceDiff !== 0 && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "22px",
                          fontWeight: 800,
                          color: "#dc2626",
                        }}
                      >
                        {priceDiff > 0 ? "+" : "-"}
                        {fmt(Math.abs(priceDiff))}₫
                      </p>
                    )}
                  </div>

                  {/* Message nhắc user phải chọn sản phẩm tương đương giá */}
                  {priceDiff !== 0 && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color: "#991b1b",
                        fontStyle: "italic",
                      }}
                    >
                      You can only exchange for a product with an equivalent
                      price. Please choose another product or change the lens
                      configuration.
                    </p>
                  )}
                </div>
              )}

              {/* ==========================
                  CHỌN MÀU CHO FRAME
                  ========================== */}
              {frameDetail?.frameColors?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    Select Color *
                  </label>

                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    {frameDetail.frameColors.map((fc) => {
                      // Kiểm tra màu này có đang được chọn không
                      const isActive = selectedColor?.colorId === fc.colorId;

                      // Lấy tồn kho màu này
                      const stock = fc.stockQuantity || 0;

                      return (
                        <button
                          key={fc.colorId}
                          onClick={() => setSelectedColor(fc)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: stock > 0 ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: isActive
                              ? "2px solid #2563eb"
                              : "1px solid #d1d5db",
                            backgroundColor: isActive
                              ? "#eff6ff"
                              : stock > 0
                                ? "#fff"
                                : "#f3f4f6",
                            opacity: stock > 0 ? 1 : 0.5,
                          }}
                          disabled={stock <= 0}
                        >
                          {/* Chấm tròn hiển thị màu */}
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              backgroundColor: fc.color?.hexCode || "#ccc",
                              borderRadius: "50%",
                              border: "1px solid #999",
                            }}
                          />

                          {/* Tên màu */}
                          <span>{fc.color?.colorName || "N/A"}</span>

                          {/* Trạng thái tồn kho */}
                          <span
                            style={{
                              fontSize: "11px",
                              color: stock > 0 ? "#059669" : "#dc2626",
                            }}
                          >
                            ({stock > 0 ? `${stock} left` : "Out of stock"})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==========================
                  PHẦN CẤU HÌNH LENS
                  ========================== */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  Lens Configuration *
                </label>

                {/* Nếu đã cấu hình lens rồi */}
                {lensConfig ? (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "#d1fae5",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#065f46",
                          fontWeight: 600,
                        }}
                      >
                        ✅{" "}
                        {lensConfig.lensIncluded
                          ? "Frame + Lenses"
                          : "Frame Only"}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "13px",
                          color: "#047857",
                        }}
                      >
                        Total: ${lensConfig.finalPrice}
                      </p>
                    </div>

                    {/* Nút đổi cấu hình lens */}
                    <button
                      onClick={() => setIsLensModalOpen(true)}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: "#fff",
                        border: "1px solid #059669",
                        borderRadius: "6px",
                        color: "#059669",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  // Nếu chưa cấu hình lens thì hiện nút để mở modal
                  <button
                    onClick={() => {
                      // Nếu chưa có frameDetail thì không mở
                      if (!frameDetail) return;

                      setIsLensModalOpen(true);
                    }}
                    disabled={!frameDetail}
                    style={{
                      padding: "10px 22px",
                      backgroundColor: frameDetail ? "#111827" : "#9ca3af",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: frameDetail ? "pointer" : "not-allowed",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    👓 Configure Lenses
                  </button>
                )}
              </div>

              {/* ==========================
                  SỐ LƯỢNG
                  ========================== */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  max={selectedColor?.stockQuantity || 10}
                  value={quantity}
                  onChange={(e) =>
                    // parseInt để đổi string -> number
                    // Math.max(1, ...) để không cho nhỏ hơn 1
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  style={{
                    width: "80px",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* ==========================
                  THÔNG TIN NGƯỜI NHẬN
                  ========================== */}

              {/* Họ tên */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyen Van A"
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

              {/* Số điện thoại */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
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

              {/* Địa chỉ */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Shipping Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 ABC Street, District 1, HCMC"
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

              {/* Nếu có lỗi thì hiện khối báo lỗi */}
              {error && (
                <div
                  style={{
                    color: "#dc2626",
                    backgroundColor: "#fee2e2",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              {/* ==========================
                  NÚT HÀNH ĐỘNG
                  ========================== */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleSubmit}
                  disabled={
                    // Disable khi đang submit
                    // hoặc khi có priceDiff nhưng khác 0
                    submitting || (priceDiff !== null && priceDiff !== 0)
                  }
                  style={{
                    padding: "12px 28px",
                    backgroundColor:
                      submitting || (priceDiff !== null && priceDiff !== 0)
                        ? "#9ca3af"
                        : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "15px",
                    cursor:
                      submitting || (priceDiff !== null && priceDiff !== 0)
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {submitting ? "Creating order..." : "Confirm Exchange"}
                </button>

                {/* Nút hủy -> quay lại complaint detail */}
                <Link
                  to={`/complaints/${id}`}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Cancel
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}