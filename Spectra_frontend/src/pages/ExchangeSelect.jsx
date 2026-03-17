import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import LensSelectionModal from "../components/ui/LensSelectionModal";

const API_COMPLAINTS = "https://myspectra.runasp.net/api/Complaints";
const API_FRAMES = "https://myspectra.runasp.net/api/Frames";

const fmt = (n) => n?.toLocaleString("vi-VN") ?? "—";

export default function ExchangeSelect() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  const [complaint, setComplaint] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected frame & its full details
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [frameDetail, setFrameDetail] = useState(null);
  const [supportedLensTypes, setSupportedLensTypes] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Lens config (filled by the modal)
  const [lensConfig, setLensConfig] = useState(null); // { lensIncluded, finalPrice, lensDetails }
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);

  // Shipping form
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
    fetchUserProfile();
  }, [id, token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    } catch {
      /* ignore */
    }
  };

  const loadData = async () => {
    try {
      const [cRes, fRes] = await Promise.all([
        fetch(`${API_COMPLAINTS}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_FRAMES}?page=1&pageSize=100`),
      ]);

      if (cRes.ok) {
        const c = await cRes.json();
        const status = (c.status || "").toLowerCase();
        const type = (c.requestType || "").toLowerCase();
        if (type !== "exchange") {
          setError("Khiếu nại này không phải loại Đổi hàng.");
        } else if (c.exchangeOrderId) {
          setError("Đơn đổi hàng đã được tạo cho khiếu nại này.");
        } else if (status !== "approved" && status !== "in_progress") {
          setError("Yêu cầu chưa được duyệt. Vui lòng chờ nhân viên xử lý.");
        } else {
          setComplaint(c);
        }
      } else {
        setError("Không thể tải thông tin khiếu nại.");
      }

      if (fRes.ok) {
        const fData = await fRes.json();
        const items = fData.items || fData || [];
        const seen = new Set();
        const unique = items.filter((f) => {
          if (seen.has(f.frameName)) return false;
          seen.add(f.frameName);
          return true;
        });
        setFrames(unique);
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
    setLoading(false);
  };

  // When user clicks a frame in the grid, fetch its full detail
  const handleSelectFrame = async (frame) => {
    setSelectedFrame(frame);
    setSelectedColor(null);
    setLensConfig(null);
    setFrameDetail(null);
    setSupportedLensTypes([]);
    setError("");
    setLoadingDetail(true);

    const frameId = frame.frameId || frame.id;
    try {
      const [detailRes, lensRes] = await Promise.all([
        fetch(`${API_FRAMES}/${frameId}`),
        fetch(`${API_FRAMES}/${frameId}/lens-types`),
      ]);

      if (detailRes.ok) {
        const detail = await detailRes.json();
        setFrameDetail(detail);
        // Auto-select first color
        if (detail.frameColors?.length > 0) {
          setSelectedColor(detail.frameColors[0]);
        }
      }
      if (lensRes.ok) {
        const lensData = await lensRes.json();
        setSupportedLensTypes(lensData.supportedLensTypes || []);
      }
    } catch {
      /* ignore */
    }
    setLoadingDetail(false);
  };

  const handleLensConfirm = (config) => {
    setLensConfig(config);
    setIsLensModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedFrame) {
      setError("Vui lòng chọn sản phẩm thay thế.");
      return;
    }
    if (frameDetail?.frameColors?.length > 0 && !selectedColor) {
      setError("Vui lòng chọn màu sắc.");
      return;
    }
    if (!lensConfig) {
      setError(
        "Vui lòng cấu hình tròng kính (nhấn nút 'Cấu hình tròng kính').",
      );
      return;
    }
    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên người nhận.");
      return;
    }
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!address.trim()) {
      setError("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const frameId = String(
        frameDetail?.id || frameDetail?.frameId || selectedFrame.frameId,
      );
      const item = { frameId, quantity };

      // Color
      const getValidGuid = (val) => {
        if (!val || val === "null" || val === "undefined" || val === "")
          return undefined;
        return String(val);
      };
      const colorId = getValidGuid(
        selectedColor?.color?.id ||
          selectedColor?.color?.colorId ||
          selectedColor?.colorId,
      );
      if (colorId) item.selectedColorId = colorId;

      // Lens
      if (lensConfig?.lensIncluded && lensConfig.lensDetails) {
        const ld = lensConfig.lensDetails;
        const validTypeId = getValidGuid(ld.typeId);
        const validFeatureId = getValidGuid(ld.featureId);
        const validPrescriptionId = getValidGuid(ld.prescriptionId);
        if (validTypeId) item.lensTypeId = validTypeId;
        if (validFeatureId) item.featureId = validFeatureId;
        if (validPrescriptionId) item.prescriptionId = validPrescriptionId;
      }

      const payload = {
        shippingAddress: `[${fullName.trim()} - ${phone.trim()}] ${address.trim()}`,
        items: [item],
      };

      const res = await fetch(`${API_COMPLAINTS}/${id}/create-exchange-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const exchangeTotal = data?.exchangeOrderTotal;
        const origPrice = data?.originalItemPrice;
        let msg = "Đơn hàng thay thế đã được tạo thành công!";
        if (exchangeTotal != null && origPrice != null) {
          const diff = exchangeTotal - origPrice;
          if (diff > 0) {
            msg += `\n\nSản phẩm mới đắt hơn ${fmt(diff)}₫. Bạn cần thanh toán phần chênh lệch.`;
          } else if (diff < 0) {
            msg += `\n\nSản phẩm mới rẻ hơn ${fmt(Math.abs(diff))}₫. Phần chênh lệch sẽ được hoàn lại cho bạn.`;
          } else {
            msg += "\n\nGiá sản phẩm tương đương, không phát sinh chênh lệch.";
          }
        }
        alert(msg);
        navigate(`/complaints/${id}`);
      } else {
        const err = await res.json().catch(() => null);
        setError(
          err?.message ||
            err?.Message ||
            "Tạo đơn đổi hàng thất bại. Vui lòng thử lại.",
        );
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px", fontSize: "16px" }}>
        Đang tải...
      </div>
    );
  if (error && !complaint)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error}</h2>
        <Link to={`/complaints/${id}`} style={{ color: "#3b82f6" }}>
          ← Quay lại chi tiết khiếu nại
        </Link>
      </div>
    );

  const originalItem = complaint?.originalItem;
  const filteredFrames = frames.filter(
    (f) => !search || f.frameName?.toLowerCase().includes(search.toLowerCase()),
  );
  const displayPrice =
    frameDetail?.basePrice || selectedFrame?.basePrice || selectedFrame?.price;

  // Price comparison
  const originalPrice =
    (originalItem?.unitPrice || 0) * (originalItem?.quantity || 1);
  const newTotalPrice = lensConfig ? lensConfig.finalPrice * quantity : null;
  const priceDiff =
    newTotalPrice !== null ? newTotalPrice - originalPrice : null;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Lens modal — reuses the existing LensSelectionModal */}
      <LensSelectionModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        product={
          frameDetail ? { ...frameDetail, basePrice: displayPrice } : null
        }
        supportedLensTypes={supportedLensTypes}
        onConfirmAddToCart={handleLensConfirm}
      />

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
        ← Quay lại chi tiết khiếu nại
      </Link>

      <h2 style={{ margin: "0 0 8px", fontSize: "24px" }}>
        Chọn sản phẩm thay thế
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginTop: 0,
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        Mã khiếu nại: <b>#{String(complaint.requestId).slice(0, 8)}</b>
      </p>

      {/* Original item summary */}
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
            Sản phẩm gốc (trả lại)
          </h4>
          <p style={{ margin: "2px 0", fontSize: "14px" }}>
            <b>{originalItem.frameName}</b> — {fmt(originalItem.unitPrice)}₫ ×{" "}
            {originalItem.quantity || 1}
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
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

      {/* Product grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {filteredFrames.map((f) => {
          const isSelected = selectedFrame?.frameId === f.frameId;
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
                  ✓ Đã chọn
                </span>
              )}
            </div>
          );
        })}
        {filteredFrames.length === 0 && (
          <p
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#9ca3af",
              padding: "40px 0",
            }}
          >
            Không tìm thấy sản phẩm.
          </p>
        )}
      </div>

      {/* Configuration section — shown when a frame is selected */}
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
            Xác nhận đổi hàng
          </h3>

          {loadingDetail ? (
            <p style={{ color: "#6b7280" }}>Đang tải thông tin sản phẩm...</p>
          ) : (
            <>
              {/* Old vs New comparison */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
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
                      SẢN PHẨM CŨ (TRẢ LẠI)
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
                      Tổng đã trả: {fmt(originalPrice)}₫
                    </p>
                  </div>
                )}
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
                    SẢN PHẨM MỚI
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
                    Giá gọng: {fmt(displayPrice)}₫
                  </p>
                </div>
              </div>

              {/* Price difference banner */}
              {priceDiff !== null && originalItem && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 18px",
                    borderRadius: "10px",
                    border: `1px solid ${priceDiff > 0 ? "#fbbf24" : priceDiff < 0 ? "#34d399" : "#93c5fd"}`,
                    backgroundColor:
                      priceDiff > 0
                        ? "#fffbeb"
                        : priceDiff < 0
                          ? "#ecfdf5"
                          : "#eff6ff",
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
                          color:
                            priceDiff > 0
                              ? "#92400e"
                              : priceDiff < 0
                                ? "#065f46"
                                : "#1e40af",
                        }}
                      >
                        {priceDiff > 0
                          ? "⬆ Nâng cấp — Bạn cần trả thêm"
                          : priceDiff < 0
                            ? "⬇ Hạ cấp — Bạn được hoàn lại"
                            : "✓ Giá tương đương"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        Sản phẩm cũ: {fmt(originalPrice)}₫ → Sản phẩm mới:{" "}
                        {fmt(newTotalPrice)}₫
                      </p>
                    </div>
                    {priceDiff !== 0 && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "22px",
                          fontWeight: 800,
                          color: priceDiff > 0 ? "#b45309" : "#059669",
                        }}
                      >
                        {priceDiff > 0 ? "+" : "-"}
                        {fmt(Math.abs(priceDiff))}₫
                      </p>
                    )}
                  </div>
                  {priceDiff > 0 && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color: "#92400e",
                        fontStyle: "italic",
                      }}
                    >
                      Bạn sẽ cần thanh toán phần chênh lệch sau khi đơn đổi hàng
                      được tạo.
                    </p>
                  )}
                  {priceDiff < 0 && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color: "#065f46",
                        fontStyle: "italic",
                      }}
                    >
                      Phần chênh lệch sẽ được hoàn lại cho bạn sau khi nhân viên
                      xử lý.
                    </p>
                  )}
                </div>
              )}

              {/* Color selection */}
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
                    Chọn màu sắc *
                  </label>
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    {frameDetail.frameColors.map((fc) => {
                      const isActive = selectedColor?.colorId === fc.colorId;
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
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              backgroundColor: fc.color?.hexCode || "#ccc",
                              borderRadius: "50%",
                              border: "1px solid #999",
                            }}
                          />
                          <span>{fc.color?.colorName || "N/A"}</span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: stock > 0 ? "#059669" : "#dc2626",
                            }}
                          >
                            ({stock > 0 ? `Còn ${stock}` : "Hết"})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lens configuration button */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  Cấu hình tròng kính *
                </label>
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
                          ? "Gọng + Tròng kính"
                          : "Chỉ gọng kính"}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "13px",
                          color: "#047857",
                        }}
                      >
                        Tổng: ${lensConfig.finalPrice}
                      </p>
                    </div>
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
                      Thay đổi
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
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
                    👓 Cấu hình tròng kính
                  </button>
                )}
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedColor?.stockQuantity || 10}
                  value={quantity}
                  onChange={(e) =>
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

              {/* Shipping info */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Họ tên người nhận *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
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
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Số điện thoại *
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
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Địa chỉ giao hàng *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
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

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    padding: "12px 28px",
                    backgroundColor: submitting ? "#9ca3af" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "15px",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Đang tạo đơn..." : "Xác nhận đổi hàng"}
                </button>
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
                  Huỷ
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
