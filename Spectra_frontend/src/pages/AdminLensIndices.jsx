import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminLensFeatures.css"; // Reuse same CSS

export default function AdminLensIndices() {
  const { user } = useContext(UserContext);
  const [lensIndices, setLensIndices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialForm = {
    indexValue: 1.5,
    name: "",
    description: "",
    additionalPrice: 0,
    minPrescription: "",
    maxPrescription: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchLensIndices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/LensIndices?page=1&pageSize=100",
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setLensIndices(data.items || data || []);
      } else {
        setLensIndices([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLensIndices();
  }, []);

  const handleOpenModal = (index = null) => {
    if (index) {
      setIsEditing(true);
      setCurrentId(index.lensIndexId || index.id);
      setFormData({
        indexValue: index.indexValue,
        name: index.name || "",
        description: index.description || "",
        additionalPrice: index.additionalPrice || 0,
        minPrescription: index.minPrescription ?? "",
        maxPrescription: index.maxPrescription ?? "",
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      indexValue: Number(formData.indexValue),
      name: formData.name,
      description: formData.description,
      additionalPrice: Number(formData.additionalPrice),
      minPrescription:
        formData.minPrescription !== ""
          ? Number(formData.minPrescription)
          : null,
      maxPrescription:
        formData.maxPrescription !== ""
          ? Number(formData.maxPrescription)
          : null,
    };

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `https://myspectra.runasp.net/api/LensIndices/${currentId}`
      : "https://myspectra.runasp.net/api/LensIndices";

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 201 || res.status === 204) {
        alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
        setShowModal(false);
        fetchLensIndices();
      } else {
        const err = await res.json();
        alert(
          "Lỗi: " +
            (err.message || JSON.stringify(err.errors || "Lỗi không xác định")),
        );
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chiết suất này?")) return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/LensIndices/${id}`,
        { method: "DELETE", headers },
      );
      if (res.ok || res.status === 204) {
        alert("Xóa thành công!");
        fetchLensIndices();
      } else {
        const errorData = await res.json();
        alert("Xóa thất bại: " + (errorData.message || "Đang được sử dụng"));
      }
    } catch (err) {
      alert("Lỗi server");
    }
  };

  return (
    <div className="admin-lens-container">
      <div className="admin-lens-header">
        <h2 className="admin-lens-title">
          Quản Lý Chiết Suất Tròng Kính (Lens Indices)
        </h2>
        <button onClick={() => handleOpenModal()} className="btn-add">
          + Thêm Chiết Suất
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Chiết Suất</th>
              <th>Tên</th>
              <th>Mô tả</th>
              <th>Phụ Phí ($)</th>
              <th>Min Rx</th>
              <th>Max Rx</th>
              <th>Trạng thái</th>
              <th className="col-action">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : lensIndices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  Chưa có chiết suất nào.
                </td>
              </tr>
            ) : (
              lensIndices.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "bold", fontSize: "16px" }}>
                    {item.indexValue}
                  </td>
                  <td>{item.name || "—"}</td>
                  <td
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      maxWidth: "200px",
                    }}
                  >
                    {item.description || "—"}
                  </td>
                  <td className="col-price">+${item.additionalPrice || 0}</td>
                  <td>{item.minPrescription ?? "—"}</td>
                  <td>{item.maxPrescription ?? "—"}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor:
                          item.status === "active" || !item.status
                            ? "#d1fae5"
                            : "#fee2e2",
                        color:
                          item.status === "active" || !item.status
                            ? "#065f46"
                            : "#991b1b",
                      }}
                    >
                      {item.status === "active" || !item.status
                        ? "Hoạt động"
                        : "Ẩn"}
                    </span>
                  </td>
                  <td className="col-action">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="btn-edit"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(item.lensIndexId || item.id)}
                      className="btn-delete"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {isEditing ? "Sửa Chiết Suất" : "Thêm Chiết Suất Mới"}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Giá trị chiết suất (Index Value):</label>
                <select
                  name="indexValue"
                  value={formData.indexValue}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                >
                  <option value={1.5}>1.50 (Tiêu chuẩn)</option>
                  <option value={1.56}>1.56 (Mỏng vừa)</option>
                  <option value={1.6}>1.60 (Mỏng)</option>
                  <option value={1.61}>1.61 (Mỏng)</option>
                  <option value={1.67}>1.67 (Siêu mỏng)</option>
                  <option value={1.74}>1.74 (Cực mỏng)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tên hiển thị:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="VD: Chiết suất 1.67 siêu mỏng"
                />
              </div>
              <div className="form-group">
                <label>Mô tả:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    resize: "vertical",
                  }}
                />
              </div>
              <div className="form-group">
                <label>Phụ phí ($):</label>
                <input
                  type="number"
                  name="additionalPrice"
                  value={formData.additionalPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div className="form-group">
                  <label>Min Prescription (SPH):</label>
                  <input
                    type="number"
                    name="minPrescription"
                    value={formData.minPrescription}
                    onChange={handleChange}
                    step="0.25"
                    placeholder="VD: -8.00"
                  />
                </div>
                <div className="form-group">
                  <label>Max Prescription (SPH):</label>
                  <input
                    type="number"
                    name="maxPrescription"
                    value={formData.maxPrescription}
                    onChange={handleChange}
                    step="0.25"
                    placeholder="VD: +4.00"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-save">
                  Lưu Dữ Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
