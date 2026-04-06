import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminProducts.css";

export default function AdminProducts() {
  const { user } = useContext(UserContext);

  const [allFrames, setAllFrames] = useState([]);
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  const [shapes, setShapes] = useState([]);

  const [lensTypes, setLensTypes] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [frameImages, setFrameImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const PAGE_SIZE = 10;

  // FIX: state chọn màu khi upload ảnh
  const [uploadColorId, setUploadColorId] = useState("");

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandForm, setBrandForm] = useState({ brandId: "", brandName: "" });

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    materialId: "",
    materialName: "",
  });

  const [showColorModal, setShowColorModal] = useState(false);
  const [colorForm, setColorForm] = useState({
    colorId: "",
    colorName: "",
    hexCode: "#000000",
  });

  const [showShapeModal, setShowShapeModal] = useState(false);
  const [shapeForm, setShapeForm] = useState({ shapeId: "", shapeName: "" });

  const initialForm = {
    frameName: "",
    brandId: "",
    materialId: "",
    shapeId: "",
    size: "",
    lensWidth: "",
    bridgeWidth: "",
    frameWidth: "",
    templeLength: "",
    basePrice: 0,
    reorderLevel: 5,
    colorVariants: [],
    minRx: "",
    maxRx: "",
    minPd: "",
    maxPd: "",
    supportedLensTypeIds: [],
  };
  const [formData, setFormData] = useState(initialForm);
  const sizeOptions = ["Small", "Medium", "Large"];

  const getToken = () => {
    if (user?.token) return user.token;
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser && storedUser.token) return storedUser.token;
    } catch (e) {}
    return localStorage.getItem("token");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([

        fetchFrames(),
        fetchBrands(),
        fetchMaterials(),
        fetchColors(),
        fetchShapes(),
        fetchLensTypes(),

      ]);
    } catch (error) {
      console.error("Lỗi khi fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= FETCH DATA ================= */
  const fetchFrames = async () => {
    try {

      const token = getToken();
      const response = await fetch(
        "https://myspectra.runasp.net/api/Frames/all?page=1&pageSize=100",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.ok) {
        const data = await response.json();

        setAllFrames(data.items || data || []);
      } else if (response.status === 401 || response.status === 403) {
        const fallback = await fetch(
          "https://myspectra.runasp.net/api/Frames?page=1&pageSize=100",
        );
        if (fallback.ok) {
          const fallbackData = await fallback.json();
          setAllFrames(fallbackData.items || fallbackData || []);
        }
      }
    } catch (error) {
      console.error("Lỗi fetch Kính", error);
    }
  };
  const fetchBrands = async () => {
    const res = await fetch("https://myspectra.runasp.net/api/Brands");
    if (res.ok) setBrands(await res.json());
  };
  const fetchMaterials = async () => {
    const res = await fetch("https://myspectra.runasp.net/api/Materials");
    if (res.ok) setMaterials(await res.json());
  };

  const fetchColors = async () => {
    const res = await fetch("https://myspectra.runasp.net/api/Colors");
    if (res.ok) setColors(await res.json());
  };
  const fetchShapes = async () => {
    const res = await fetch("https://myspectra.runasp.net/api/Shapes");
    if (res.ok) setShapes(await res.json());
  };
  const fetchLensTypes = async () => {
    const res = await fetch(
      "https://myspectra.runasp.net/api/LensTypes?pageSize=50",
    );
    if (res.ok) {
      const data = await res.json();
      setLensTypes(data.items || data || []);
    }
  };

  /* ================= LOGIC THUỘC TÍNH ================= */

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.brandName.trim()) return;
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ brandName: brandForm.brandName }),
      });
      if (res.ok) {
        fetchBrands();
        setBrandForm({ brandId: "", brandName: "" });
      } else alert("Failed to add brand!");
    } catch (error) {
      alert("Connection error");
    }
  };
  const handleDeleteBrand = async (id) => {
    if (!window.confirm("Delete this brand?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Brands/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchBrands();
      else alert("Cannot delete: glasses are using this brand.");
    } catch (error) {
      alert("Connection error");
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.materialName.trim()) return;
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ materialName: materialForm.materialName }),
      });
      if (res.ok) {
        fetchMaterials();
        setMaterialForm({ materialId: "", materialName: "" });
      } else alert("Failed to add material!");
    } catch (error) {
      alert("Connection error");
    }
  };
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/Materials/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (res.ok) fetchMaterials();
      else alert("Cannot delete: glasses are using this material.");
    } catch (error) {
      alert("Connection error");
    }
  };

  const handleAddColor = async (e) => {
    e.preventDefault();
    if (!colorForm.colorName.trim()) return;
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Colors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          colorName: colorForm.colorName,
          hexCode: colorForm.hexCode,
        }),
      });
      if (res.ok) {
        fetchColors();
        setColorForm({ colorId: "", colorName: "", hexCode: "#000000" });
      } else alert("Failed to add color!");
    } catch (error) {
      alert("Connection error");
    }
  };
  const handleDeleteColor = async (id) => {
    if (!window.confirm("Delete this color?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Colors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchColors();
      else alert("Cannot delete: glasses are using this color.");
    } catch (error) {
      alert("Connection error");
    }
  };

  const handleAddShape = async (e) => {
    e.preventDefault();
    if (!shapeForm.shapeName.trim()) return;
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Shapes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ shapeName: shapeForm.shapeName }),
      });
      if (res.ok) {
        fetchShapes();
        setShapeForm({ shapeId: "", shapeName: "" });
      } else alert("Failed to add shape!");
    } catch (error) {
      alert("Connection error");
    }
  };
  const handleDeleteShape = async (id) => {
    if (!window.confirm("Delete this shape?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Shapes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchShapes();
      else alert("Cannot delete: glasses are using this shape.");
    } catch (error) {
      alert("Connection error");
    }
  };

  /* ================= LOGIC FORM KÍNH ================= */

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "number" ? (value === "" ? "" : parseFloat(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (fieldErrors[name])
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleColorCheckboxChange = (colorId, isChecked) => {
    setFormData((prev) => {
      if (isChecked) {
        return {
          ...prev,
          colorVariants: [
            ...prev.colorVariants,
            { colorId, stockQuantity: 0, colorExtraCost: 0 },
          ],
        };
      } else {
        return {
          ...prev,
          colorVariants: prev.colorVariants.filter(
            (v) => v.colorId !== colorId,
          ),
        };
      }
    });
  };

  const handleColorStockQuantityChange = (colorId, quantity) => {
    setFormData((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.map((v) =>
        v.colorId === colorId ? { ...v, stockQuantity: Number(quantity) } : v,
      ),
    }));
  };

  const handleColorExtraCostChange = (colorId, cost) => {
    setFormData((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.map((v) =>
        v.colorId === colorId ? { ...v, colorExtraCost: Number(cost) } : v,
      ),
    }));
  };

  const handleLensTypeCheckboxChange = (lensTypeId, isChecked) => {
    setFormData((prev) => {
      const currentIds = prev.supportedLensTypeIds || [];
      if (isChecked) {
        return { ...prev, supportedLensTypeIds: [...currentIds, lensTypeId] };
      } else {
        return {
          ...prev,
          supportedLensTypeIds: currentIds.filter((id) => id !== lensTypeId),
        };
      }
    });
  };

  const openAddModal = () => {
    setFormData(initialForm);
    setFrameImages([]);
    setCurrentId(null);
    setIsEditing(false);
    setShowModal(true);
    setFieldErrors({});
    setUploadColorId("");
  };

  const openEditModal = async (frame) => {
    const targetId = frame.frameId || frame.id;

    setFormData({
      frameName: frame.frameName || "",
      brandId: frame.brand?.brandId || "",
      materialId: frame.material?.materialId || "",
      shapeId: frame.shape?.shapeId || frame.shapeId || "",
      size: frame.size || "",
      lensWidth: frame.lensWidth || "",
      bridgeWidth: frame.bridgeWidth || "",
      frameWidth: frame.frameWidth || "",
      templeLength: frame.templeLength || "",
      basePrice: frame.basePrice || 0,
      reorderLevel: frame.reorderLevel || 5,
      colorVariants:
        frame.frameColors?.map((fc) => ({
          colorId: fc.colorId || fc.color?.colorId,
          stockQuantity: fc.stockQuantity || 0,
          colorExtraCost: fc.colorExtraCost || 0,
        })) || [],
      minRx:
        frame.minRx !== null && frame.minRx !== undefined ? frame.minRx : "",
      maxRx:
        frame.maxRx !== null && frame.maxRx !== undefined ? frame.maxRx : "",
      minPd:
        frame.minPd !== null && frame.minPd !== undefined ? frame.minPd : "",
      maxPd:
        frame.maxPd !== null && frame.maxPd !== undefined ? frame.maxPd : "",
      supportedLensTypeIds: [],
    });

    setFrameImages(frame.frameMedia || []);
    setCurrentId(targetId);
    setIsEditing(true);
    setShowModal(true);
    setFieldErrors({});
    // FIX: reset uploadColorId, mặc định chọn màu đầu tiên nếu có
    const firstColorId =
      frame.frameColors?.[0]?.colorId ||
      frame.frameColors?.[0]?.color?.colorId ||
      "";
    setUploadColorId(firstColorId);

    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/Frames/${targetId}/lens-types`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.supportedLensTypes) {
          const existingIds = data.supportedLensTypes.map(
            (lt) => lt.id || lt.lensTypeId,
          );
          setFormData((prev) => ({
            ...prev,
            supportedLensTypeIds: existingIds,
          }));
        }
      }
    } catch (e) {
      console.error("Lỗi khi fetch lens types:", e);
    }
  };

  /* ================= QUẢN LÝ ẢNH ================= */

  // FIX: Upload ảnh có gắn colorId
  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("file", file);
    setIsUploading(true);
    try {

      // Thêm colorId vào query param nếu có chọn màu
      const colorParam = uploadColorId ? `?colorId=${uploadColorId}` : "";
      const res = await fetch(
        `https://myspectra.runasp.net/api/FrameMedia/upload/${currentId}${colorParam}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: uploadData,
        },
      );
      if (res.ok) {
        const newMedia = await res.json();
        setFrameImages((prev) => [...prev, newMedia]);
        fetchFrames();
        alert(
          "Image uploaded successfully!" +
            (uploadColorId ? " (Linked to selected color)" : " (General image)"),
        );
      } else {
        alert("Upload failed, please check backend");
      }
    } catch (error) {
      alert("Connection error");
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleDeleteImage = async (mediaId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/FrameMedia/${mediaId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (res.ok || res.status === 204) {
        setFrameImages((prev) =>
          prev.filter((img) => img.id !== mediaId && img.mediaId !== mediaId),
        );
        fetchFrames();
      } else {
        alert("Cannot delete image!");
      }
    } catch (error) {
      alert("Connection error.");
    }
  };

  // Nhóm ảnh theo màu để hiển thị rõ ràng
  const groupImagesByColor = () => {
    const groups = {};
    frameImages.forEach((img) => {
      const key = img.colorId || "__no_color__";
      if (!groups[key]) groups[key] = [];
      groups[key].push(img);
    });
    return groups;
  };

  /* ================= GỬI DỮ LIỆU LÊN BACKEND ================= */
  const handleSaveFrame = async (e) => {
    e.preventDefault();

    let errors = {};
    if (!formData.frameName) errors.frameName = "Please enter frame name";
    if (!formData.brandId) errors.brandId = "Please select a brand";
    if (!formData.materialId) errors.materialId = "Please select a material";
    if (!formData.shapeId) errors.shapeId = "Please select a shape";
    if (!formData.size) errors.size = "Please select a size";

    const lw = Number(formData.lensWidth || 0);
    const bw = Number(formData.bridgeWidth || 0);
    const tl = Number(formData.templeLength || 0);
    const fw = Number(formData.frameWidth || 0);
    if (lw <= 0) errors.lensWidth = "Lens width must be > 0";
    if (bw <= 0) errors.bridgeWidth = "Bridge width must be > 0";
    else if (lw > 0 && bw >= lw)
      errors.bridgeWidth = "Bridge width must be less than lens width";
    if (tl <= 0) errors.templeLength = "Temple length must be > 0";
    if (fw <= 0) errors.frameWidth = "Frame width must be > 0";
    else if (lw > 0 && fw <= lw)
      errors.frameWidth = "Total frame width must be greater than lens width";

    const minR = parseFloat(formData.minRx);
    const maxR = parseFloat(formData.maxRx);
    if (!isNaN(minR) && !isNaN(maxR) && minR > maxR) {

      errors.rxRange = "Min Rx cannot be greater than Max Rx";

    }

    const minP = parseInt(formData.minPd);
    const maxP = parseInt(formData.maxPd);
    if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) {

      errors.pdRange = "Min PD cannot be greater than Max PD";

    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = document.querySelector(".modal-content");
      if (firstError) firstError.scrollTo(0, 0);
      return;
    }

    const url = isEditing
      ? `https://myspectra.runasp.net/api/Frames/${currentId}`
      : "https://myspectra.runasp.net/api/Frames";
    const method = isEditing ? "PUT" : "POST";
    const payloadData = { ...formData, stockQuantity: 0 };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payloadData),
      });

      if (response.ok) {
        const savedFrame = await response.json();
        fetchFrames();
        if (!isEditing && savedFrame?.frameId) {
          setCurrentId(savedFrame.frameId);
          setIsEditing(true);
          setFrameImages(savedFrame.frameMedia || []);
          const firstColorId =
            savedFrame.frameColors?.[0]?.colorId ||
            savedFrame.frameColors?.[0]?.color?.colorId ||
            "";
          setUploadColorId(firstColorId);
          alert("Frame added successfully! You can upload images now.");
        } else {
          setShowModal(false);
          alert("Frame updated successfully!");
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Backend error: ${errData.message || "Please check your data"}`);
      }

    } catch (error) {
      alert(`Connection error: ${error.message}`);
    }

  };

  const handleDeleteFrame = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to hide/disable this frame? It will no longer appear on the homepage but can be restored.",
      )
    )
      return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchFrames();
        alert("Frame disabled successfully!");
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || "Cannot disable this frame");
      }
    } catch (error) {
      alert(`Connection error: ${error.message}`);
    }
  };

  const handleReactivateFrame = async (id) => {
    if (!window.confirm("Are you sure you want to reactivate this frame?"))
      return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: "available" }),
      });
      if (res.ok) {
        fetchFrames();
        alert("Frame reactivated successfully!");
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || "Cannot reactivate this frame");
      }
    } catch (error) {
      alert(`Connection error: ${error.message}`);
    }
  };

  const errorStyle = {
    color: "#ef4444",
    fontSize: "13px",
    marginTop: "4px",
    display: "block",
    fontWeight: "bold",
  };
  const toggleRow = (frameId) =>
    setExpandedRows((prev) => ({ ...prev, [frameId]: !prev[frameId] }));

  // Lấy danh sách màu của frame đang edit (để hiển thị trong dropdown upload)
  const currentFrameColors = formData.colorVariants
    .map((v) => colors.find((c) => c.colorId === v.colorId))
    .filter(Boolean);

  const filteredFrames = allFrames
    .slice()
    .reverse()
    .filter((f) => {
      if (statusFilter === "inactive")
        return f.status?.toLowerCase() === "inactive";
      if (statusFilter === "active")
        return f.status?.toLowerCase() !== "inactive";
      return true;
    });
  const totalPages = Math.ceil(filteredFrames.length / PAGE_SIZE);
  const pagedFrames = filteredFrames.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /* ================= RENDER GIAO DIỆN ================= */
  return (
    <div className="admin-products-container">
      <div
        className="admin-products-header"
        style={{ display: "flex", gap: "10px", alignItems: "center" }}
      >
        <h2 className="admin-products-title" style={{ marginRight: "auto" }}>
          Frames Management
        </h2>
        <button
          className="btn-edit"
          style={{ padding: "8px" }}
          onClick={() => setShowBrandModal(true)}
        >
          Brands
        </button>
        <button
          className="btn-edit"
          style={{ padding: "8px" }}
          onClick={() => setShowMaterialModal(true)}
        >
          Materials
        </button>
        <button
          className="btn-edit"
          style={{ padding: "8px" }}
          onClick={() => setShowColorModal(true)}
        >
          Colors
        </button>
        <button
          className="btn-edit"
          style={{ padding: "8px" }}
          onClick={() => setShowShapeModal(true)}
        >
          Shapes
        </button>
        <button className="btn-add" onClick={openAddModal}>
          + Add New Frame
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "inactive", label: "Hidden" },
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
              backgroundColor: statusFilter === tab.key ? "#eff6ff" : "#fff",
              color: statusFilter === tab.key ? "#1d4ed8" : "#6b7280",
              fontWeight: statusFilter === tab.key ? "bold" : "normal",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {tab.label} (
            {tab.key === "all"
              ? allFrames.length
              : allFrames.filter((f) =>
                  tab.key === "inactive"
                    ? f.status?.toLowerCase() === "inactive"
                    : f.status?.toLowerCase() !== "inactive",
                ).length}
            )
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Frame Name</th>
              <th>Brand</th>
              <th>Material</th>
              <th>Base Price ($)</th>
              <th>Total Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedFrames.length > 0 ? (
              pagedFrames.map((frame) => {
                const isExpanded = expandedRows[frame.frameId || frame.id];
                const totalStock = frame.stockQuantity || 0;

                return (
                  <React.Fragment key={frame.frameId || frame.id}>
                    <tr
                      style={{
                        backgroundColor: isExpanded ? "#eff6ff" : "#fff",
                      }}
                    >
                      <td
                        style={{ fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => toggleRow(frame.frameId || frame.id)}
                      >
                        <button
                          style={{
                            marginRight: "10px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            transition: "0.2s",
                            transform: isExpanded
                              ? "rotate(90deg)"
                              : "rotate(0)",
                          }}
                        >
                          ▶
                        </button>
                        {frame.frameName}
                        {frame.status?.toLowerCase() === "inactive" && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#fff",
                              backgroundColor: "#ef4444",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              marginLeft: "6px",
                              fontWeight: "bold",
                            }}
                          >
                            Hidden
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginLeft: "5px",
                            fontWeight: "normal",
                          }}
                        >
                          ({frame.frameColors?.length || 0} colors)
                        </span>
                      </td>
                      <td>{frame.brand?.brandName || "N/A"}</td>
                      <td>{frame.material?.materialName || "N/A"}</td>
                      <td style={{ fontWeight: "bold", color: "#000" }}>
                        ${frame.basePrice}
                      </td>
                      <td>
                        <strong
                          style={{
                            color:
                              totalStock <= frame.reorderLevel
                                ? "#ef4444"
                                : "#10b981",
                          }}
                        >
                          {totalStock}
                        </strong>
                      </td>
                      <td className="col-action">
                        <button
                          onClick={() => openEditModal(frame)}
                          className="btn-edit"
                          style={{ padding: "6px 12px" }}
                        >
                          Edit Details & Images
                        </button>
                        {frame.status?.toLowerCase() === "inactive" ? (
                          <button
                            onClick={() =>
                              handleReactivateFrame(frame.frameId || frame.id)
                            }
                            className="btn-edit"
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#059669",
                              color: "#fff",
                            }}
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleDeleteFrame(frame.frameId || frame.id)
                            }
                            className="btn-delete"
                            style={{ padding: "6px 12px" }}
                          >
                            Disable
                          </button>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <td colSpan="6" style={{ padding: "15px 40px" }}>
                          <strong
                            style={{
                              display: "block",
                              marginBottom: "10px",
                              color: "#374151",
                            }}
                          >
                            Color variants:
                          </strong>
                          <div
                            style={{
                              display: "flex",
                              gap: "20px",
                              flexWrap: "wrap",
                            }}
                          >
                            {frame.frameColors?.length > 0 ? (
                              frame.frameColors.map((fc) => (
                                <div
                                  key={fc.colorId || fc.color?.colorId}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    backgroundColor: "#fff",
                                    borderRadius: "6px",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      backgroundColor:
                                        fc.color?.hexCode || "#ccc",
                                      borderRadius: "50%",
                                      border: "1px solid #d1d5db",
                                    }}
                                  ></span>
                                  <span>{fc.color?.colorName || "Color"}</span>
                                  <span
                                    style={{
                                      color: "#6b7280",
                                      marginLeft: "5px",
                                    }}
                                  >
                                    | Stock:{" "}
                                    <strong style={{ color: "#111" }}>
                                      {fc.stockQuantity || 0}
                                    </strong>
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span
                                style={{
                                  color: "#6b7280",
                                  fontStyle: "italic",
                                }}
                              >
                                No color variants configured.
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No data available.
                </td>
              </tr>
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

      {/* ================= MODAL QUẢN LÝ KÍNH ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxHeight: "90vh",
              overflowY: "auto",
              width: "800px",
              maxWidth: "95%",
            }}
          >
            <h3>{isEditing ? "Edit Frame" : "Add New Frame"}</h3>
            <form onSubmit={handleSaveFrame} className="admin-form" noValidate>
              <h4
                style={{
                  color: "#111827",
                  borderBottom: "2px solid #e5e7eb",
                  paddingBottom: "8px",
                  marginBottom: "15px",
                }}
              >
                1. Basic Information
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Frame Name:</label>
                  <input
                    type="text"
                    name="frameName"
                    value={formData.frameName}
                    onChange={handleInputChange}
                  />
                  {fieldErrors.frameName && (
                    <span style={errorStyle}>{fieldErrors.frameName}</span>
                  )}
                </div>
                <div className="form-group">

                  <label>Brand:</label>

                  <select
                    name="brandId"
                    value={formData.brandId}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((b) => (
                      <option key={b.brandId || b.id} value={b.brandId || b.id}>
                        {b.brandName}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.brandId && (
                    <span style={errorStyle}>{fieldErrors.brandId}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Material:</label>
                  <select
                    name="materialId"
                    value={formData.materialId}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">-- Select Material --</option>
                    {materials.map((m) => (
                      <option
                        key={m.materialId || m.id}
                        value={m.materialId || m.id}
                      >
                        {m.materialName}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.materialId && (
                    <span style={errorStyle}>{fieldErrors.materialId}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Shape:</label>
                  <select
                    name="shapeId"
                    value={formData.shapeId}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">-- Select Shape --</option>
                    {shapes.map((s) => (
                      <option key={s.shapeId || s.id} value={s.shapeId || s.id}>
                        {s.shapeName}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.shapeId && (
                    <span style={errorStyle}>{fieldErrors.shapeId}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Base Price ($):</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Low stock warning level:</label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <h4
                style={{
                  color: "#111827",
                  borderBottom: "2px solid #e5e7eb",
                  paddingBottom: "8px",
                  marginTop: "25px",
                  marginBottom: "15px",
                }}
              >
                2. Dimensions
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Size:</label>
                  <select
                    name="size"
                    value={
                      sizeOptions.find(
                        (s) =>
                          s.toLowerCase() ===
                          (formData.size || "").toLowerCase(),
                      ) || ""
                    }
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">-- Select Size --</option>
                    {sizeOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.size && (
                    <span style={errorStyle}>{fieldErrors.size}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Lens Width (mm):</label>
                  <input
                    type="number"
                    name="lensWidth"
                    value={formData.lensWidth}
                    onChange={handleInputChange}
                    min="0"
                  />
                  {fieldErrors.lensWidth && (
                    <span style={errorStyle}>{fieldErrors.lensWidth}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Bridge Width (mm):</label>
                  <input
                    type="number"
                    name="bridgeWidth"
                    value={formData.bridgeWidth}
                    onChange={handleInputChange}
                    min="0"
                  />
                  {fieldErrors.bridgeWidth && (
                    <span style={errorStyle}>{fieldErrors.bridgeWidth}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Temple Length (mm):</label>
                  <input
                    type="number"
                    name="templeLength"
                    value={formData.templeLength}
                    onChange={handleInputChange}
                    min="0"
                  />
                  {fieldErrors.templeLength && (
                    <span style={errorStyle}>{fieldErrors.templeLength}</span>
                  )}
                </div>
                <div
                  className="form-group"
                  style={{ gridColumn: "1 / span 2" }}
                >
                  <label>Total Frame Width (mm):</label>
                  <input
                    type="number"
                    name="frameWidth"
                    value={formData.frameWidth}
                    onChange={handleInputChange}
                    min="0"
                  />
                  {fieldErrors.frameWidth && (
                    <span style={errorStyle}>{fieldErrors.frameWidth}</span>
                  )}
                </div>
              </div>

              <h4
                style={{
                  color: "#111827",
                  borderBottom: "2px solid #e5e7eb",
                  paddingBottom: "8px",
                  marginTop: "25px",
                  marginBottom: "15px",
                }}
              >
                3. Medical & Technical (Rx, PD & Lens Types)
              </h4>
              <div
                className="form-group"
                style={{
                  background: "#f8fafc",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "15px",
                }}
              >
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "10px",
                    display: "block",
                  }}
                >
                  Supported Prescription Range (RX)
                </label>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", color: "#4b5563" }}>
                      Min RX:
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      name="minRx"
                      value={formData.minRx}
                      onChange={handleInputChange}
                      placeholder="-6.0"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", color: "#4b5563" }}>
                      Max RX:
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      name="maxRx"
                      value={formData.maxRx}
                      onChange={handleInputChange}
                      placeholder="6.0"
                    />
                  </div>

                </div>
                {fieldErrors.rxRange && (
                  <span style={errorStyle}>{fieldErrors.rxRange}</span>
                )}

                <label
                  style={{
                    fontWeight: "bold",
                    marginTop: "15px",
                    marginBottom: "10px",
                    display: "block",
                  }}
                >
                  Supported Pupillary Distance Range (PD)
                </label>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", color: "#4b5563" }}>
                      Min PD (mm):
                    </label>
                    <input
                      type="number"
                      name="minPd"
                      value={formData.minPd}
                      onChange={handleInputChange}
                      placeholder="58"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", color: "#4b5563" }}>
                      Max PD (mm):
                    </label>
                    <input
                      type="number"
                      name="maxPd"
                      value={formData.maxPd}
                      onChange={handleInputChange}
                      placeholder="72"
                    />
                  </div>

                </div>
                {fieldErrors.pdRange && (
                  <span style={errorStyle}>{fieldErrors.pdRange}</span>
                )}
              </div>

              <div
                className="form-group"
                style={{
                  background: "#f8fafc",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "15px",
                    display: "block",
                  }}
                >
                  Compatible Lens Types
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {lensTypes.map((lt) => {
                    const lensId = lt.id || lt.lensTypeId;
                    const isChecked =
                      formData.supportedLensTypeIds?.includes(lensId);
                    return (
                      <label
                        key={lensId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          background: isChecked ? "#e0f2fe" : "#fff",
                          padding: "8px",
                          borderRadius: "6px",
                          border: isChecked
                            ? "1px solid #bae6fd"
                            : "1px solid #e5e7eb",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={(e) =>
                            handleLensTypeCheckboxChange(
                              lensId,
                              e.target.checked,
                            )
                          }
                        />
                        <span style={{ fontSize: "14px" }}>
                          {lt.lensSpecification || lt.name || "Lens type"}
                        </span>
                      </label>
                    );
                  })}
                </div>

              </div>

              <h4
                style={{
                  color: "#111827",
                  borderBottom: "2px solid #e5e7eb",
                  paddingBottom: "8px",
                  marginTop: "25px",
                  marginBottom: "15px",
                }}
              >
                4. Color Variants & Stock
              </h4>
              <div
                className="form-group"
                style={{
                  background: "#f8fafc",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  {colors.map((c) => {
                    const variant = formData.colorVariants.find(
                      (v) => v.colorId === c.colorId,
                    );
                    const isSelected = !!variant;
                    return (
                      <div
                        key={c.colorId}
                        style={{
                          display: "flex",
                          alignItems: isSelected ? "flex-start" : "center",
                          flexDirection: isSelected ? "column" : "row",
                          gap: isSelected ? "8px" : "15px",
                          padding: "8px",
                          background: isSelected ? "#fff" : "transparent",
                          borderRadius: "6px",
                          border: isSelected
                            ? "1px solid #cbd5e1"
                            : "1px solid transparent",
                          gridColumn: isSelected ? "1 / -1" : "auto",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "130px",
                            cursor: "pointer",
                            fontWeight: isSelected ? "bold" : "normal",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleColorCheckboxChange(
                                c.colorId,
                                e.target.checked,
                              )
                            }
                          />
                          <span
                            style={{
                              display: "inline-block",
                              width: "15px",
                              height: "15px",
                              backgroundColor: c.hexCode || "#ccc",
                              borderRadius: "50%",
                              border: "1px solid #999",
                            }}
                          ></span>
                          {c.colorName}
                        </label>
                        {isSelected && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <label
                                style={{
                                  fontSize: "13px",
                                  color: "#4b5563",
                                  margin: 0,
                                }}
                              >
                                Stock:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stockQuantity}
                                onChange={(e) =>
                                  handleColorStockQuantityChange(
                                    c.colorId,
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: "70px",
                                  padding: "6px",
                                  borderRadius: "4px",
                                  border: "1px solid #cbd5e1",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <label
                                style={{
                                  fontSize: "13px",
                                  color: "#4b5563",
                                  margin: 0,
                                }}
                              >
                                Extra cost:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={variant.colorExtraCost || 0}
                                onChange={(e) =>
                                  handleColorExtraCostChange(
                                    c.colorId,
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: "90px",
                                  padding: "6px",
                                  borderRadius: "4px",
                                  border: "1px solid #cbd5e1",
                                }}
                                placeholder="0"
                              />
                              <span
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                ₫
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= SECTION 5: ẢNH THEO MÀU (FIX MỚI) ================= */}
              {isEditing && (
                <>
                  <h4
                    style={{
                      color: "#111827",
                      borderBottom: "2px solid #e5e7eb",
                      paddingBottom: "8px",
                      marginTop: "25px",
                      marginBottom: "15px",
                    }}
                  >
                    5. Image Gallery by Color
                  </h4>
                  <div
                    className="image-management"
                    style={{ marginBottom: "20px" }}
                  >
                    {/* Hiển thị ảnh nhóm theo màu */}
                    {(() => {
                      const groups = groupImagesByColor();
                      const hasImages = frameImages.length > 0;
                      if (!hasImages)
                        return (
                          <p
                            style={{
                              color: "#9ca3af",
                              fontStyle: "italic",
                              fontSize: "13px",
                              marginBottom: "15px",
                            }}
                          >
                            No images yet. Upload below.
                          </p>
                        );

                      return Object.entries(groups).map(([colorId, imgs]) => {
                        const colorInfo =
                          colorId === "__no_color__"
                            ? {
                                colorName: "General (no color)",
                                hexCode: "#e5e7eb",
                              }
                            : colors.find((c) => c.colorId === colorId) || {
                                colorName: colorId,
                                hexCode: "#ccc",
                              };

                        return (
                          <div
                            key={colorId}
                            style={{
                              marginBottom: "16px",
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              padding: "12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "10px",
                              }}
                            >
                              <span
                                style={{
                                  width: "14px",
                                  height: "14px",
                                  backgroundColor: colorInfo.hexCode,
                                  borderRadius: "50%",
                                  border: "1px solid #999",
                                  flexShrink: 0,
                                }}
                              ></span>
                              <strong
                                style={{ fontSize: "13px", color: "#374151" }}
                              >
                                {colorInfo.colorName}
                              </strong>
                              <span
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                ({imgs.length} images)
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "12px",
                                flexWrap: "wrap",
                              }}
                            >
                              {imgs.map((img, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    position: "relative",
                                    border: "1px solid #ddd",
                                    padding: "4px",
                                    borderRadius: "8px",
                                    background: "#fff",
                                  }}
                                >
                                  <img
                                    src={img.mediaUrl}
                                    alt="frame"
                                    style={{
                                      width: "90px",
                                      height: "90px",
                                      objectFit: "contain",
                                      display: "block",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteImage(img.id || img.mediaId)
                                    }
                                    style={{
                                      position: "absolute",
                                      top: "-8px",
                                      right: "-8px",
                                      background: "#ef4444",
                                      color: "white",
                                      borderRadius: "50%",
                                      width: "22px",
                                      height: "22px",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      lineHeight: "22px",
                                      textAlign: "center",
                                      padding: 0,
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Upload ảnh mới có chọn màu */}
                    <div
                      style={{
                        background: "#eff6ff",
                        padding: "14px",
                        borderRadius: "8px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "13px",
                          fontWeight: "bold",
                          color: "#1e40af",
                        }}
                      >
                        Upload New Image
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "12px",
                              color: "#4b5563",
                              fontWeight: "bold",
                            }}
                          >
                            Link to color:
                          </label>
                          <select
                            value={uploadColorId}
                            onChange={(e) => setUploadColorId(e.target.value)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #93c5fd",
                              fontSize: "13px",
                              minWidth: "180px",
                            }}
                          >
                            <option value="">
                              — General (no color) —
                            </option>
                            {currentFrameColors.map((c) => (
                              <option key={c.colorId} value={c.colorId}>
                                {c.colorName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "12px",
                              color: "#4b5563",
                              fontWeight: "bold",
                            }}
                          >
                            Select file:
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadImage}
                            disabled={isUploading}
                            style={{ fontSize: "13px" }}
                          />
                        </div>
                        {isUploading && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#3b82f6",
                              fontWeight: "bold",
                            }}
                          >
                            Uploading...
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          fontSize: "11px",
                          color: "#6b7280",
                        }}
                      >
                        Select a color so the image appears when customers choose that color. If no color is selected, the image will be used as the default.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div
                className="form-actions"
                style={{
                  marginTop: "30px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "15px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Frame
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THUỘC TÍNH */}

      {showBrandModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ width: "500px", maxWidth: "90%" }}
          >
            <h3>Brand Management</h3>
            <form
              onSubmit={handleAddBrand}
              style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
            >
              <input
                type="text"
                placeholder="New brand name..."
                value={brandForm.brandName}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, brandName: e.target.value })
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <button type="submit" className="btn-add">
                Add
              </button>
            </form>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #eee",
                borderRadius: "6px",
                padding: "10px",
              }}
            >
              {brands.length > 0 ? (
                brands.map((b) => (
                  <div
                    key={b.brandId || b.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <span>{b.brandName}</span>
                    <button
                      onClick={() => handleDeleteBrand(b.brandId || b.id)}
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#888" }}>
                  No data available
                </p>
              )}
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowBrandModal(false)}
                className="btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ width: "500px", maxWidth: "90%" }}
          >
            <h3>Material Management</h3>
            <form
              onSubmit={handleAddMaterial}
              style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
            >
              <input
                type="text"
                placeholder="New material name..."
                value={materialForm.materialName}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    materialName: e.target.value,
                  })
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <button type="submit" className="btn-add">
                Add
              </button>
            </form>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #eee",
                borderRadius: "6px",
                padding: "10px",
              }}
            >
              {materials.length > 0 ? (
                materials.map((m) => (
                  <div
                    key={m.materialId || m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <span>{m.materialName}</span>
                    <button
                      onClick={() => handleDeleteMaterial(m.materialId || m.id)}
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#888" }}>
                  No data available
                </p>
              )}
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowMaterialModal(false)}
                className="btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showShapeModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ width: "500px", maxWidth: "90%" }}
          >
            <h3>Shape Management</h3>
            <form
              onSubmit={handleAddShape}
              style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
            >
              <input
                type="text"
                placeholder="New shape name..."
                value={shapeForm.shapeName}
                onChange={(e) =>
                  setShapeForm({ ...shapeForm, shapeName: e.target.value })
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <button type="submit" className="btn-add">
                Add
              </button>
            </form>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #eee",
                borderRadius: "6px",
                padding: "10px",
              }}
            >
              {shapes.length > 0 ? (
                shapes.map((s) => (
                  <div
                    key={s.shapeId || s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <span>{s.shapeName}</span>
                    <button
                      onClick={() => handleDeleteShape(s.shapeId || s.id)}
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#888" }}>
                  No data available
                </p>
              )}
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowShapeModal(false)}
                className="btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showColorModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ width: "500px", maxWidth: "90%" }}
          >
            <h3>Color Management</h3>
            <form
              onSubmit={handleAddColor}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                alignItems: "center",
              }}
            >
              <input
                type="color"
                value={colorForm.hexCode}
                onChange={(e) =>
                  setColorForm({ ...colorForm, hexCode: e.target.value })
                }
                style={{
                  width: "40px",
                  height: "40px",
                  padding: "0",
                  border: "none",
                  cursor: "pointer",
                }}
              />
              <input
                type="text"
                placeholder="Color name (e.g. Matte Black)..."
                value={colorForm.colorName}
                onChange={(e) =>
                  setColorForm({ ...colorForm, colorName: e.target.value })
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <button type="submit" className="btn-add">
                Add
              </button>
            </form>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #eee",
                borderRadius: "6px",
                padding: "10px",
              }}
            >
              {colors.length > 0 ? (
                colors.map((c) => (
                  <div
                    key={c.colorId || c.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid #eee",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "20px",
                          height: "20px",
                          backgroundColor: c.hexCode || "#ccc",
                          borderRadius: "50%",
                          border: "1px solid #ccc",
                        }}
                      ></span>
                      <span>{c.colorName}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteColor(c.colorId || c.id)}
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#888" }}>
                  No data available
                </p>
              )}
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowColorModal(false)}
                className="btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}