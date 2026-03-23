import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "../components/layout/AdminLayout.css";
import "./AdminProducts.css";

export default function AdminPreorderCampaigns() {
  const { user } = useContext(UserContext);
  const [campaigns, setCampaigns] = useState([]);
  const [outOfStockFrames, setOutOfStockFrames] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE CHO CREATE ---
  const initialForm = {
    campaignName: "",
    startDate: "",
    endDate: "",
    maxSlots: 100,
    estimatedDeliveryDate: "",
    frames: [],
  };
  const [formData, setFormData] = useState(initialForm);

  // --- STATE CHO EDIT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    campaignName: "",
    maxSlots: 100,
    estimatedDeliveryDate: "",
  });

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/PreorderCampaigns?page=1&pageSize=100",
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.items || data || []);
      }
    } catch (err) {
      console.error("Lỗi fetch campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOutOfStockFrames = async () => {
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Frames/inventory/out-of-stock",
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        // Lấy tất cả hàng out-of-stock từ BE gửi về, không dùng bộ lọc frontend nữa
        setOutOfStockFrames(data.items || data || []);
      }
    } catch (err) {
      console.error("Lỗi fetch out of stock frames:", err);
    }
  };

  useEffect(() => {
    if (token) fetchCampaigns();
  }, [token]);

  // --- HANDLER TẠO MỚI ---
  const handleOpenModal = () => {
    setFormData(initialForm);
    fetchOutOfStockFrames();
    setIsModalOpen(true);
  };

  const handleToggleFrame = (frame) => {
    const isSelected = formData.frames.some(
      (f) => f.frameId === (frame.id || frame.frameId),
    );
    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        frames: prev.frames.filter(
          (f) => f.frameId !== (frame.id || frame.frameId),
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        frames: [
          ...prev.frames,
          {
            frameId: frame.id || frame.frameId,
            frameName: frame.frameName,
            basePrice: frame.basePrice,
            maxQuantityPerOrder: 2,
          },
        ],
      }));
    }
  };

  const handleFrameConfigChange = (frameId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      frames: prev.frames.map((f) =>
        f.frameId === frameId ? { ...f, [field]: Number(value) } : f,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.frames.length === 0) {
      alert(
        "Bạn phải chọn ít nhất 1 sản phẩm hết hàng để đưa vào chiến dịch này!",
      );
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert("Lỗi: Ngày bắt đầu phải TRƯỚC ngày kết thúc!");
      return;
    }

    setIsSubmitting(true);
    const formatDt = (dt) => (dt.length === 16 ? dt + ":00" : dt);

    const payload = {
      campaignName: formData.campaignName,
      startDate: formatDt(formData.startDate),
      endDate: formatDt(formData.endDate),
      maxSlots: Number(formData.maxSlots),
      estimatedDeliveryDate: formatDt(formData.estimatedDeliveryDate),
      frames: formData.frames.map((f) => ({
        frameId: f.frameId,
        campaignPrice: f.basePrice,
        maxQuantityPerOrder: f.maxQuantityPerOrder,
      })),
    };

    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/PreorderCampaigns",
        { method: "POST", headers, body: JSON.stringify(payload) },
      );
      if (res.ok || res.status === 201) {
        alert("Tạo chiến dịch Pre-order thành công!");
        setIsModalOpen(false);
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert("Lỗi khi tạo: " + (err.message || res.status));
      }
    } catch (err) {
      alert("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER SỬA (EDIT) ---
  const handleEditClick = (camp) => {
    setCurrentEditId(camp.campaignId || camp.id);
    let estDate = camp.estimatedDeliveryDate || "";
    // Cắt bớt phần giây (nếu có) để nhét vừa vào thẻ input type="datetime-local"
    if (estDate.length > 16) estDate = estDate.substring(0, 16);

    setEditFormData({
      campaignName: camp.campaignName || "",
      maxSlots: camp.maxSlots || 100,
      estimatedDeliveryDate: estDate,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formatDt = (dt) => (dt.length === 16 ? dt + ":00" : dt);

    const payload = {
      campaignName: editFormData.campaignName,
      maxSlots: Number(editFormData.maxSlots),
      estimatedDeliveryDate: formatDt(editFormData.estimatedDeliveryDate),
    };

    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/PreorderCampaigns/${currentEditId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (res.ok || res.status === 200 || res.status === 204) {
        alert("Cập nhật thông tin chiến dịch thành công!");
        setIsEditModalOpen(false);
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert("Lỗi khi cập nhật: " + (err.message || res.status));
      }
    } catch (err) {
      alert("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER DỪNG SỚM ---
  const handleEndCampaign = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn KẾT THÚC SỚM chiến dịch này?"))
      return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/PreorderCampaigns/${id}/end`,
        { method: "PATCH", headers },
      );
      if (res.ok) {
        alert("Đã ép kết thúc chiến dịch!");
        fetchCampaigns();
      } else {
        alert("Lỗi khi kết thúc chiến dịch.");
      }
    } catch (err) {
      alert("Lỗi kết nối mạng.");
    }
  };

  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h2 className="admin-products-title">
          Quản Lý Chiến Dịch Đặt Trước (Pre-order)
        </h2>
        <button onClick={handleOpenModal} className="btn-add">
          + Tạo Chiến Dịch Mới
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên Chiến Dịch</th>
              <th>Thời gian chạy</th>
              <th>Ngày giao (Dự kiến)</th>
              <th>Số Suất (Slots)</th>
              <th>Trạng thái</th>
              <th className="col-action" style={{ minWidth: "200px" }}>
                Hành Động
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="col-action">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan="6" className="col-action">
                  Chưa có chiến dịch nào được tìm thấy.
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => {
                // FRONTEND ÉP LẠI TRẠNG THÁI GÁNH LỖI CHO BACKEND
                const now = new Date();
                const startDt = new Date(camp.startDate);
                const endDt = new Date(camp.endDate);
                let currentStatus = (camp.status || "").toLowerCase();

                if (
                  now >= startDt &&
                  now <= endDt &&
                  currentStatus === "upcoming"
                ) {
                  currentStatus = "active";
                } else if (now > endDt && currentStatus !== "ended") {
                  currentStatus = "ended";
                }

                const isEnded =
                  currentStatus === "ended" ||
                  currentStatus === "closed" ||
                  camp.currentSlots >= camp.maxSlots;
                const canEndEarly = !isEnded;

                return (
                  <tr key={camp.campaignId || camp.id}>
                    <td className="col-name">
                      <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                        {camp.campaignName}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        Gồm {camp.frames?.length || 0} sản phẩm
                      </div>
                    </td>
                    <td style={{ fontSize: "14px", lineHeight: "1.5" }}>
                      <span style={{ color: "#047857" }}>
                        Bắt đầu: {startDt.toLocaleDateString("vi-VN")}{" "}
                        {startDt.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>{" "}
                      <br />
                      <span style={{ color: "#be123c" }}>
                        Kết thúc: {endDt.toLocaleDateString("vi-VN")}{" "}
                        {endDt.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      {new Date(camp.estimatedDeliveryDate).toLocaleDateString(
                        "vi-VN",
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "15px",
                          color:
                            camp.currentSlots >= camp.maxSlots
                              ? "red"
                              : "#10b981",
                        }}
                      >
                        {camp.currentSlots || 0} / {camp.maxSlots}
                      </span>
                    </td>
                    <td>
                      {isEnded ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          Đã kết thúc
                        </span>
                      ) : currentStatus === "upcoming" ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            background: "#fef3c7",
                            color: "#92400e",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          Chưa bắt đầu
                        </span>
                      ) : currentStatus === "active" ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            background: "#d1fae5",
                            color: "#065f46",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          Đang chạy
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: "4px 8px",
                            background: "#f3f4f6",
                            color: "#4b5563",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          {currentStatus}
                        </span>
                      )}
                    </td>
                    <td
                      className="col-action"
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => handleEditClick(camp)}
                        style={{
                          padding: "6px 12px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      >
                        Sửa
                      </button>
                      {canEndEarly && (
                        <button
                          onClick={() =>
                            handleEndCampaign(camp.campaignId || camp.id)
                          }
                          style={{
                            padding: "6px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px",
                            width: "100%",
                          }}
                        >
                          Dừng Khẩn Cấp
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL TẠO MỚI CHIẾN DỊCH --- */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              width: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                borderBottom: "2px solid #f3f4f6",
                paddingBottom: "15px",
              }}
            >
              Tạo Chiến Dịch Kích Cầu (Pre-order)
            </h2>
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "5px",
                    }}
                  >
                    Tên Chiến Dịch (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.campaignName}
                    onChange={(e) =>
                      setFormData({ ...formData, campaignName: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                    }}
                    placeholder="VD: Mở bán giới hạn Kính Râm Hè 2026..."
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "5px",
                    }}
                  >
                    Tổng Số Suất Cho Phép (*)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxSlots}
                    onChange={(e) =>
                      setFormData({ ...formData, maxSlots: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#047857",
                    }}
                  >
                    Ngày Bắt Đầu Mở Bán (*)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #047857",
                      backgroundColor: "#f0fdf4",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#be123c",
                    }}
                  >
                    Ngày Kết Thúc (*)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #be123c",
                      backgroundColor: "#fff1f2",
                    }}
                  />
                </div>
                <div style={{ gridColumn: "1 / span 2" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#2563eb",
                    }}
                  >
                    Ngày Dự Kiến Giao Hàng (*)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.estimatedDeliveryDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDeliveryDate: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "2px dashed #2563eb",
                      backgroundColor: "#eff6ff",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  borderTop: "2px solid #f3f4f6",
                  paddingTop: "20px",
                  marginBottom: "25px",
                }}
              >
                <h3 style={{ margin: "0 0 10px 0" }}>
                  Chọn Sản Phẩm (Kho Đang Báo Hết Hàng)
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    margin: "0 0 15px 0",
                  }}
                >
                  Tích chọn sản phẩm để đưa vào đợt Pre-order.
                </p>
                <div
                  style={{
                    maxHeight: "250px",
                    overflowY: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  {outOfStockFrames.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontWeight: "bold",
                      }}
                    >
                      Không có sản phẩm nào hết hàng để chạy chiến dịch lúc này.
                    </div>
                  ) : (
                    outOfStockFrames.map((frame) => {
                      const isChecked = formData.frames.some(
                        (f) => f.frameId === (frame.id || frame.frameId),
                      );
                      const frameConfig = formData.frames.find(
                        (f) => f.frameId === (frame.id || frame.frameId),
                      );
                      return (
                        <div
                          key={frame.id || frame.frameId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                            padding: "15px",
                            borderBottom: "1px solid #e5e7eb",
                            backgroundColor: isChecked
                              ? "#eff6ff"
                              : "transparent",
                            transition: "0.2s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFrame(frame)}
                            style={{
                              transform: "scale(1.5)",
                              cursor: "pointer",
                              marginLeft: "5px",
                            }}
                          />
                          <div style={{ flex: 1, marginLeft: "10px" }}>
                            <strong style={{ fontSize: "15px" }}>
                              {frame.frameName}
                            </strong>{" "}
                            <br />
                            <span
                              style={{ fontSize: "13px", color: "#6b7280" }}
                            >
                              Giá đang bán:{" "}
                              <strong
                                style={{ textDecoration: "line-through" }}
                              >
                                ${frame.basePrice}
                              </strong>
                            </span>
                          </div>
                          {isChecked && (
                            <div style={{ display: "flex", gap: "15px" }}>
                              <div>
                                <label
                                  style={{
                                    fontSize: "11px",
                                    display: "block",
                                    fontWeight: "bold",
                                    color: "#059669",
                                  }}
                                >
                                  Giá KM Pre-order ($)
                                </label>
                              </div>
                              <div>
                                <label
                                  style={{
                                    fontSize: "11px",
                                    display: "block",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Giới hạn Mua/Đơn
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={frameConfig?.maxQuantityPerOrder || 2}
                                  onChange={(e) =>
                                    handleFrameConfigChange(
                                      frame.id || frame.frameId,
                                      "maxQuantityPerOrder",
                                      e.target.value,
                                    )
                                  }
                                  style={{
                                    width: "100px",
                                    padding: "8px",
                                    borderRadius: "4px",
                                    border: "1px solid #ccc",
                                    outline: "none",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "15px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "12px 25px",
                    backgroundColor: "#f3f4f6",
                    color: "#111827",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "12px 25px",
                    backgroundColor: "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "14px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {isSubmitting ? "Đang xử lý..." : "Chạy Chiến Dịch Ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL SỬA CHIẾN DỊCH --- */}
      {isEditModalOpen && (
        <div
          className="modal-overlay"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              width: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                borderBottom: "2px solid #f3f4f6",
                paddingBottom: "15px",
              }}
            >
              Cập Nhật Chiến Dịch
            </h2>
            <form onSubmit={handleEditSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "5px",
                    }}
                  >
                    Tên Chiến Dịch (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.campaignName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        campaignName: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "5px",
                    }}
                  >
                    Mô tả chiến dịch
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      minHeight: "60px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        marginBottom: "5px",
                      }}
                    >
                      Số Suất (Max Slots)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editFormData.maxSlots}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          maxSlots: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#2563eb",
                      }}
                    >
                      Ngày Giao Hàng
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editFormData.estimatedDeliveryDate}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          estimatedDeliveryDate: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #2563eb",
                        backgroundColor: "#eff6ff",
                      }}
                    />
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#ef4444",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  *Lưu ý: Không thể sửa ngày bắt đầu/kết thúc và danh sách sản
                  phẩm sau khi đã tạo để đảm bảo logic đơn hàng của hệ thống.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "15px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f3f4f6",
                    color: "#111827",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
