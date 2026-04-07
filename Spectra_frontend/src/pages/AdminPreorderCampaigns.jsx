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
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

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
    const frameStatus = frame.status?.toLowerCase();
    if (frameStatus === "inactive") {
      alert(
        '⚠️ This frame is currently disabled. Please reactivate it in the "Frames Management" tab before adding it to a Pre-order campaign.',
      );
      return;
    }
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
      alert("You must select at least 1 out-of-stock product for this campaign!");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert("Error: Start date must be BEFORE end date!");
      return;
    }
    if (
      new Date(formData.endDate) >= new Date(formData.estimatedDeliveryDate)
    ) {
      alert("Error: Campaign end date must be BEFORE estimated delivery date!");
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
        alert("Pre-order campaign created successfully!");
        setIsModalOpen(false);
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert("Failed to create: " + (err.message || res.status));
      }
    } catch (err) {
      alert("Server connection error.");
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
        alert("Campaign updated successfully!");
        setIsEditModalOpen(false);
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert("Failed to update: " + (err.message || res.status));
      }
    } catch (err) {
      alert("Server connection error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER DỪNG SỚM ---
  const handleEndCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to END this campaign early?"))
      return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/PreorderCampaigns/${id}/end`,
        { method: "PATCH", headers },
      );
      if (res.ok) {
        alert("Campaign ended successfully!");
        fetchCampaigns();
      } else {
        alert("Failed to end campaign.");
      }
    } catch (err) {
      alert("Network connection error.");
    }
  };

  // Compute effective status for each campaign
  const getCampStatus = (camp) => {
    const now = new Date();
    const startDt = new Date(camp.startDate);
    const endDt = new Date(camp.endDate);
    let s = (camp.status || "").toLowerCase();
    if (now >= startDt && now <= endDt && s === "upcoming") s = "active";
    else if (now > endDt && s !== "ended") s = "ended";
    const isEnded =
      s === "ended" || s === "closed" || camp.currentSlots >= camp.maxSlots;
    return isEnded ? "ended" : s;
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    if (statusFilter === "all") return true;
    const s = getCampStatus(camp);
    if (statusFilter === "running") return s === "active" || s === "upcoming";
    if (statusFilter === "ended") return s === "ended";
    return true;
  });
  const totalPages = Math.ceil(filteredCampaigns.length / PAGE_SIZE);
  const pagedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h2 className="admin-products-title">
          Pre-order Campaign Management
        </h2>
        <button onClick={handleOpenModal} className="btn-add">
          + Create New Campaign
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {[
          { key: "all", label: "All" },
          { key: "running", label: "Running" },
          { key: "ended", label: "Ended" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setCurrentPage(1);
            }}
            style={{
              padding: "6px 16px",
              border:
                statusFilter === tab.key
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
              borderRadius: "6px",
              background: statusFilter === tab.key ? "#eff6ff" : "#fff",
              color: statusFilter === tab.key ? "#2563eb" : "#374151",
              fontWeight: statusFilter === tab.key ? "bold" : "normal",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Duration</th>
              <th>Est. Delivery Date</th>
              <th>Slots</th>
              <th>Status</th>
              <th className="col-action" style={{ minWidth: "200px" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="col-action">
                  Loading data...
                </td>
              </tr>
            ) : pagedCampaigns.length === 0 ? (
              <tr>
                <td colSpan="6" className="col-action">
                  No campaigns found.
                </td>
              </tr>
            ) : (
              pagedCampaigns.map((camp) => {
                const startDt = new Date(camp.startDate);
                const endDt = new Date(camp.endDate);
                const currentStatus = getCampStatus(camp);
                const isEnded = currentStatus === "ended";
                const canEndEarly = !isEnded;

                return (
                  <tr key={camp.campaignId || camp.id}>
                    <td className="col-name">
                      <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                        {camp.campaignName}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        Includes {camp.frames?.length || 0} products
                      </div>
                    </td>
                    <td style={{ fontSize: "14px", lineHeight: "1.5" }}>
                      <span style={{ color: "#047857" }}>
                        Start: {startDt.toLocaleDateString("en-US")}{" "}
                        {startDt.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>{" "}
                      <br />
                      <span style={{ color: "#be123c" }}>
                        End: {endDt.toLocaleDateString("en-US")}{" "}
                        {endDt.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      {new Date(camp.estimatedDeliveryDate).toLocaleDateString(
                        "en-US",
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
                          Ended
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
                          Upcoming
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
                          Running
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
                        flexWrap: "nowrap",
                        justifyContent: "center",
                        alignItems: "center",
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
                        Edit
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
                          }}
                        >
                          Force End
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              padding: "16px 0",
            }}
          >
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
              ← Previous
            </button>
            <span style={{ fontWeight: "bold", color: "#374151" }}>
              Page {currentPage} / {totalPages}
            </span>
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
        )}
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
              Create Pre-order Campaign
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
                    Campaign Name (*)
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
                    placeholder="e.g. Limited Summer Sunglasses Sale 2026..."
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
                    Total Slots (*)
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
                    Start Date (*)
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
                    End Date (*)
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
                    Estimated Delivery Date (*)
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
                  Select Products (Out of Stock)
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    margin: "0 0 15px 0",
                  }}
                >
                  Check products to include in this Pre-order campaign.
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
                      No out-of-stock products available for a campaign right now.
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
                              Current price:{" "}
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
                                  Pre-order Price ($)
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
                                  Max Qty/Order
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
                  Cancel
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
                  {isSubmitting ? "Processing..." : "Launch Campaign"}
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
              Update Campaign
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
                    Campaign Name (*)
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
                    Campaign Description
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
                      Max Slots
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
                      Delivery Date
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
                  *Note: Start/end dates and product list cannot be changed after creation to ensure order integrity.
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
                  Cancel
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
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}