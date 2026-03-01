import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';

export default function AdminProducts() {
  const { user } = useContext(UserContext);
  const [frames, setFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form mặc định khi thêm mới
  const initialForm = {
    frameName: "", brand: "", color: "", material: "", shape: "", size: "",
    lensWidth: 0, bridgeWidth: 0, frameWidth: 0, templeLength: 0,
    basePrice: 0, stockQuantity: 0, reorderLevel: 0, status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);

  // State cho việc Upload Ảnh
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  // 1. API Lấy danh sách Kính
  const fetchFrames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Frames?page=1&pageSize=100", { headers });
      if (res.ok) {
        const data = await res.json();
        // BE có thể trả về mảng trực tiếp hoặc bọc trong thuộc tính items
        setFrames(data.items || data || []); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFrames(); }, []);

  // Mở Form Thêm hoặc Sửa
  const handleOpenModal = (frame = null) => {
    if (frame) {
      setIsEditing(true);
      setCurrentId(frame.id || frame.frameId);
      setFormData(frame);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData(initialForm);
    }
    setSelectedFiles([]);
    setUploadMsg("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  // 2. API Thêm mới / Cập nhật Kính
  const handleSave = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing 
      ? `https://myspectra.runasp.net/api/Frames/${currentId}` 
      : "https://myspectra.runasp.net/api/Frames";
    
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (res.ok || res.status === 201 || res.status === 204) {
        alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
        setShowModal(false);
        fetchFrames(); // Tải lại bảng
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.message || 'Không thể lưu'}`);
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  // 3. API Xóa Kính
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa kính này?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`, { method: "DELETE", headers });
      if (res.ok || res.status === 204) {
        alert("Xóa thành công!");
        fetchFrames();
      } else alert("Xóa thất bại!");
    } catch (err) {
      alert("Lỗi server");
    }
  };

  // 4. API Upload Ảnh lên Cloudinary
  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return alert("Chưa chọn ảnh!");
    setUploadMsg("⏳ Đang tải ảnh...");
    const formUpload = new FormData();
    selectedFiles.forEach(file => formUpload.append("files", file));

    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/upload-multiple/${currentId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formUpload
      });
      if (res.ok) {
        setUploadMsg("✅ Tải ảnh thành công!");
        setSelectedFiles([]);
      } else {
        setUploadMsg("❌ Tải ảnh thất bại!");
      }
    } catch (err) {
      setUploadMsg("❌ Lỗi server!");
    }
  };

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#111827" }}>👓 Quản Lý Kính (Frames)</h2>
        <button onClick={() => handleOpenModal()} style={{ padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          + Thêm Kính Mới
        </button>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <tr>
              <th style={{ padding: "15px", color: "#374151" }}>Tên Kính</th>
              <th style={{ padding: "15px", color: "#374151" }}>Thương Hiệu</th>
              <th style={{ padding: "15px", color: "#374151" }}>Chất Liệu</th>
              <th style={{ padding: "15px", color: "#374151" }}>Giá ($)</th>
              <th style={{ padding: "15px", color: "#374151" }}>Tồn Kho</th>
              <th style={{ padding: "15px", color: "#374151", textAlign: "center" }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ padding: "20px", textAlign: "center" }}>⏳ Đang tải dữ liệu...</td></tr>
            ) : frames.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: "20px", textAlign: "center" }}>Không có sản phẩm nào.</td></tr>
            ) : (
              frames.map((frame, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "15px", fontWeight: "500" }}>{frame.frameName}</td>
                  <td style={{ padding: "15px", color: "#6b7280" }}>{frame.brand}</td>
                  <td style={{ padding: "15px", color: "#6b7280" }}>{frame.material}</td>
                  <td style={{ padding: "15px", color: "#10b981", fontWeight: "bold" }}>${frame.basePrice}</td>
                  <td style={{ padding: "15px" }}>{frame.stockQuantity}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <button onClick={() => handleOpenModal(frame)} style={{ padding: "6px 12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "10px" }}>Sửa & Up Ảnh</button>
                    <button onClick={() => handleDelete(frame.id || frame.frameId)} style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM THÊM / SỬA */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              {isEditing ? "✏️ Sửa Thông Tin Kính" : "✨ Thêm Kính Mới"}
            </h3>
            
            <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div><label style={labelStyle}>Tên Kính:</label><input type="text" name="frameName" value={formData.frameName} onChange={handleChange} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Thương Hiệu:</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Màu Sắc:</label><input type="text" name="color" value={formData.color} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Chất Liệu:</label><input type="text" name="material" value={formData.material} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Hình Dáng (Shape):</label><input type="text" name="shape" value={formData.shape} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Kích Cỡ (Size):</label><input type="text" name="size" value={formData.size} onChange={handleChange} style={inputStyle} /></div>
              
              <div><label style={labelStyle}>Giá Cơ Bản ($):</label><input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Tồn Kho:</label><input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required style={inputStyle} /></div>
              
              <div><label style={labelStyle}>Độ rộng tròng (Lens Width):</label><input type="number" name="lensWidth" value={formData.lensWidth} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Cầu kính (Bridge Width):</label><input type="number" name="bridgeWidth" value={formData.bridgeWidth} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Càng kính (Temple Length):</label><input type="number" name="templeLength" value={formData.templeLength} onChange={handleChange} style={inputStyle} /></div>
              
              <div style={{ gridColumn: "span 2", display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 20px", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>Hủy</button>
                <button type="submit" style={{ padding: "10px 20px", background: "#111827", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Lưu Thông Tin</button>
              </div>
            </form>

            {/* CHỈ HIỆN UPLOAD ẢNH KHI ĐANG Ở CHẾ ĐỘ SỬA (Đã có ID) */}
            {isEditing && (
              <div style={{ borderTop: "2px dashed #eee", paddingTop: "20px", marginTop: "20px", backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 15px 0" }}>🖼️ Upload Ảnh Cho Kính Này</h4>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input type="file" multiple accept="image/*" onChange={(e) => setSelectedFiles(Array.from(e.target.files))} style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "6px", backgroundColor: "white" }} />
                  <button onClick={handleUploadImages} type="button" style={{ padding: "10px 20px", backgroundColor: "#000", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Tải Ảnh Lên Cloudinary</button>
                </div>
                {uploadMsg && <p style={{ margin: "10px 0 0 0", fontSize: "14px", color: uploadMsg.includes('✅') ? '#15803d' : '#b91c1c' }}>{uploadMsg}</p>}
              </div>
            )}
            
            {!isEditing && (
              <div style={{ borderTop: "2px dashed #eee", paddingTop: "15px", marginTop: "15px", fontSize: "14px", color: "#666", textAlign: "center" }}>
                💡 Vui lòng "Lưu Thông Tin" để tạo sản phẩm trước. Sau đó bấm "Sửa" để có thể tải ảnh lên.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box", marginTop: "5px" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "bold", color: "#4b5563" };