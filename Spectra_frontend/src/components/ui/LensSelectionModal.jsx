import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";

const exchangeRate = 26250;

const formatVND = (usdAmount) => {
  const vndAmount = usdAmount * exchangeRate;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code', 
    minimumFractionDigits: 2,
  }).format(vndAmount);
};

// --- 1. CÁC HÀM TẠO DỮ LIỆU DROPBOX (Đặt ngoài Component) ---
const generateOptions = (min, max, step = 0.25) => {
  const options = [];
  for (let i = min; i <= max; i = Math.round((i + step) * 100) / 100) {
    options.push(i.toFixed(2));
  }
  return options;
};


const sphOptions = generateOptions(-20, 12, 0.25);
const cylOptions = generateOptions(-6, 6, 0.25);
const pdOptions = Array.from({ length: 79 - 57 + 1 }, (_, i) => 57 + i);
const axisOptions = Array.from({ length: 181 }, (_, i) => i);

export default function LensSelectionModal({ isOpen, onClose, product, supportedLensTypes = [], onConfirmAddToCart }) {
  const navigate = useNavigate();

  const [lensTypes, setLensTypes] = useState([]);
  const [lensFeatures, setLensFeatures] = useState([]);
  const [selectedLensType, setSelectedLensType] = useState("");
  const [selectedLensFeature, setSelectedLensFeature] = useState("");

  const [savedPrescriptions, setSavedPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [inputMode, setInputMode] = useState("saved");

  // State lưu lỗi theo khu vực
  const [validationErrors, setValidationErrors] = useState({ right: [], left: [], other: [] });

  // Khởi tạo form với các giá trị mặc định chuẩn
  const [prescriptionForm, setPrescriptionForm] = useState({
    sphereRight: "0.00", cylinderRight: "0.00", axisRight: 0,
    sphereLeft: "0.00", cylinderLeft: "0.00", axisLeft: 0,
    pupillaryDistance: 60, doctorName: "Khách tự nhập", clinicName: "Khách tự nhập"
  });
  const [isSavingNew, setIsSavingNew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLensTypes();
      fetchLensFeatures();
      fetchMyPrescriptions();

      setSelectedLensType("");
      setSelectedLensFeature("");
      setSelectedPrescriptionId("");
      setInputMode("saved");
      setValidationErrors({ right: [], left: [], other: [] }); // Reset lỗi khi mở lại
    }
  }, [isOpen]);

  const fetchLensTypes = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensTypes?page=1&pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setLensTypes(data.items || data || []);
      }
    } catch (err) { console.error("Lỗi fetch LensTypes", err); }
  };

  const fetchLensFeatures = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensFeatures?page=1&pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setLensFeatures(data.items || data || []);
      }
    } catch (err) { console.error("Lỗi fetch LensFeatures", err); }
  };

  const fetchMyPrescriptions = async () => {
    const userStr = localStorage.getItem("user");
    const token = userStr ? JSON.parse(userStr)?.token : null;
    if (!token) return;
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Prescriptions/my/valid", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedPrescriptions(data || []);
        if (data.length > 0) setSelectedPrescriptionId(data[0].prescriptionId);
      }
    } catch (err) { console.error("Lỗi fetch Prescriptions", err); }
  };

  const handleSaveNewPrescription = async () => {
    const userStr = localStorage.getItem("user");
    const token = userStr ? JSON.parse(userStr)?.token : null;
    if (!token) { alert("Vui lòng đăng nhập để lưu toa thuốc!"); return; }

    // KIỂM TRA BẮT BUỘC NHẬP TRỤC (AXIS) KHI CÓ LOẠN (CYL) NGAY TẠI FRONTEND
    if ((Number(prescriptionForm.cylinderRight) !== 0 && Number(prescriptionForm.axisRight) === 0) || 
        (Number(prescriptionForm.cylinderLeft) !== 0 && Number(prescriptionForm.axisLeft) === 0)) {
      setValidationErrors({ other: ["Lỗi: Khi bạn có độ Loạn (CYL), bạn bắt buộc phải chọn Trục (AXIS) từ 1 đến 180."] });
      return;
    }

    setIsSavingNew(true);
    setValidationErrors({ right: [], left: [], other: [] }); 

    // GỬI PASCALCASE ĐỂ KHỚP VỚI BACKEND C#
    const payload = {
      SphereRight: Number(prescriptionForm.sphereRight),
      CylinderRight: Number(prescriptionForm.cylinderRight),
      AxisRight: Number(prescriptionForm.axisRight),
      AddRight: null, // Gửi null thay vì 0
      SphereLeft: Number(prescriptionForm.sphereLeft),
      CylinderLeft: Number(prescriptionForm.cylinderLeft),
      AxisLeft: Number(prescriptionForm.axisLeft),
      AddLeft: null, // Gửi null thay vì 0
      PupillaryDistance: Number(prescriptionForm.pupillaryDistance),
      DoctorName: prescriptionForm.doctorName,
      ClinicName: prescriptionForm.clinicName,
      ExpirationDate: "2026-12-31" // Ép cứng ngày hết hạn hợp lệ
    };

    try {
      const res = await fetch("https://myspectra.runasp.net/api/Prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newData = await res.json();
        alert("Đã lưu toa thuốc mới thành công!");
        setValidationErrors({ right: [], left: [], other: [] });
        await fetchMyPrescriptions();
        setSelectedPrescriptionId(newData.prescriptionId);
        setInputMode("saved");
      } else {
        const err = await res.json();
        if (err.errors) {
          const allMsgs = Object.values(err.errors).flat();
          setValidationErrors({
            right: allMsgs.filter(m => m.toLowerCase().includes("right")),
            left: allMsgs.filter(m => m.toLowerCase().includes("left")),
            other: allMsgs.filter(m => !m.toLowerCase().includes("right") && !m.toLowerCase().includes("left"))
          });
        } else {
          setValidationErrors({ other: [err.message || "Lỗi không xác định."] });
        }
      }
    } catch (err) { setValidationErrors({ other: ["Lỗi kết nối mạng."] }); }
    finally { setIsSavingNew(false); }
  };

  const selectedTypeData = lensTypes.find(t => String(t.id || t.lensTypeId || t.typeId) === String(selectedLensType));
  const selectedFeatureData = lensFeatures.find(f => String(f.id || f.lensFeatureId || f.featureId) === String(selectedLensFeature));

  const requiresPrescription = selectedTypeData?.requiresPrescription || false;
  const basePrice = Number(product?.basePrice) || 0;
  const lensTypeExtraPrice = Number(selectedTypeData?.basePrice || selectedTypeData?.extraPrice) || 0;
  const featureExtraPrice = Number(selectedFeatureData?.extraPrice) || 0;
  const currentTotalPrice = basePrice + lensTypeExtraPrice + featureExtraPrice;

  const isAddToCartDisabled = !selectedLensType || !selectedLensFeature || (requiresPrescription && !selectedPrescriptionId) || isSavingNew;

  const handleAddToCart = (withLens) => {
    if (withLens) {
      if (isAddToCartDisabled) return;
      onConfirmAddToCart({
        lensIncluded: true,
        finalPrice: currentTotalPrice,
        lensDetails: {
          typeId: String(selectedLensType),
          featureId: String(selectedLensFeature),
          lensType: selectedTypeData,
          lensFeature: selectedFeatureData,
          requiresPrescription: requiresPrescription,
          prescriptionId: selectedPrescriptionId || null
        }
      });
    } else {
      onConfirmAddToCart({ lensIncluded: false, finalPrice: basePrice, lensDetails: null });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', textAlign: 'left', maxHeight: '95vh', overflowY: 'auto', borderRadius: '15px' }}>
        <h3 className="modal-title" style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>👓 Cấu Hình Tròng Kính</h3>
        <p style={{ color: "#666", marginBottom: '20px' }}>Gọng: <strong>{product?.frameName}</strong> (${basePrice})</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          {/* PHẦN 1: CHỌN LOẠI TRÒNG */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>1. Chọn Loại Tròng:</label>
            <select 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} 
              // Lấy ID làm value để hiển thị
              value={typeof selectedLensType === 'object' ? (selectedLensType.id || selectedLensType.lensTypeId) : selectedLensType} 
              onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setSelectedLensType("");
                  return;
                }
                
                // ⚡ TÌM TRÒNG KÍNH VỪA CHỌN VÀ KIỂM TRA TƯƠNG THÍCH
                const lens = lensTypes.find(l => String(l.id || l.lensTypeId) === selectedId);
                const isSupported = supportedLensTypes.length === 0 || supportedLensTypes.some(
                  s => s.lensTypeId === (lens.id || lens.lensTypeId) || s.lensSpecification === (lens.lensSpecification || lens.typeName)
                );

                // ⚡ NẾU KHÔNG HỖ TRỢ -> HIỆN THÔNG BÁO VÀ CHẶN KHÔNG CHO CHỌN
                if (!isSupported) {
                  alert(`❌ Gọng kính này không hỗ trợ: ${lens.lensSpecification || lens.typeName}`);
                  return; 
                }

                // Nếu hợp lệ thì mới lưu vào State
                setSelectedLensType(selectedId);
              }}
            >
              <option value="">-- Chọn loại tròng --</option>
              {lensTypes.map((lens) => {
                // KIỂM TRA ĐỂ ĐỔI GIAO DIỆN BÊN TRONG DANH SÁCH MENU
                const isSupported = supportedLensTypes.length === 0 || supportedLensTypes.some(
                  s => s.lensTypeId === (lens.id || lens.lensTypeId) || s.lensSpecification === (lens.lensSpecification || lens.typeName)
                );

                return (
                  <option 
                    key={lens.id || lens.lensTypeId} 
                    value={lens.id || lens.lensTypeId}
                    style={!isSupported ? { color: "#9ca3af" } : { color: "#111827" }} // Đổi màu xám nếu không hỗ trợ
                  >
                    {lens.lensSpecification || lens.typeName} (+${lens.basePrice || 0}) {!isSupported ? " (🚫 Không hỗ trợ)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>2. Chiết Suất/Tính Năng:</label>
            <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }} value={selectedLensFeature} onChange={(e) => setSelectedLensFeature(e.target.value)}>
              <option value="">-- Vui lòng chọn --</option>
              {[...lensFeatures].sort((a, b) => a.lensIndex - b.lensIndex).map((feat, idx) => (
                <option key={idx} value={feat.id || feat.lensFeatureId || feat.featureId}>
                  Chiết suất {feat.lensIndex} - {feat.featureSpecification || feat.featureName || feat.name} (+${feat.extraPrice || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {requiresPrescription && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px dashed #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #fca5a5', paddingBottom: '10px' }}>
              <label style={{ fontWeight: 'bold', color: '#b91c1c', margin: 0 }}>⚠️ THÔNG SỐ TOA THUỐC</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setInputMode("saved"); setValidationErrors({ right: [], left: [], other: [] }); }} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', backgroundColor: inputMode === 'saved' ? '#111827' : '#fff', color: inputMode === 'saved' ? 'white' : '#111827', border: '1px solid #111827', borderRadius: '6px' }}>Toa đã lưu</button>
                <button onClick={() => { setInputMode("new"); setValidationErrors({ right: [], left: [], other: [] }); }} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', backgroundColor: inputMode === 'new' ? '#111827' : '#fff', color: inputMode === 'new' ? 'white' : '#111827', border: '1px solid #111827', borderRadius: '6px' }}>+ Nhập mới</button>
              </div>
            </div>

            {inputMode === "saved" ? (
              <div style={{ minHeight: '60px' }}>
                {savedPrescriptions.length > 0 ? (
                  <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} value={selectedPrescriptionId} onChange={e => setSelectedPrescriptionId(e.target.value)}>
                    <option value="">-- Chọn toa thuốc hợp lệ --</option>
                    {savedPrescriptions.map(p => (
                      <option key={p.prescriptionId} value={p.prescriptionId}>
                        Ngày {new Date(p.createdAt).toLocaleDateString('vi-VN')} (P:{p.sphereRight} / T:{p.sphereLeft})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ fontSize: '14px', color: '#dc2626', textAlign: 'center' }}>Bạn chưa có toa thuốc nào. Hãy chọn "Nhập mới".</p>
                )}
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  {/* MẮT PHẢI */}
                  <div style={{ border: '1px solid #fca5a5', padding: '10px', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
                    <h5 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>👁️ Mắt Phải (OD)</h5>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>SPH</label>
                        <select value={prescriptionForm.sphereRight} onChange={e => setPrescriptionForm({ ...prescriptionForm, sphereRight: e.target.value })} style={{ width: '100%', padding: '4px' }}>
                          {sphOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>CYL</label>
                        <select value={prescriptionForm.cylinderRight} onChange={e => {
                          const val = e.target.value;
                          let newAxis = prescriptionForm.axisRight;
                          
                          if (Number(val) === 0) {
                            newAxis = 0; 
                          } else if (Number(newAxis) === 0) {
                            newAxis = 1; // Đồng bộ UI và State
                          }
                      
                          setPrescriptionForm({ 
                            ...prescriptionForm, 
                            cylinderRight: val, 
                            axisRight: newAxis 
                          });
                        }} style={{ width: '100%', padding: '4px' }}>
                          {cylOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>AXIS</label>
                        <select disabled={Number(prescriptionForm.cylinderRight) === 0} value={prescriptionForm.axisRight} onChange={e => setPrescriptionForm({ ...prescriptionForm, axisRight: e.target.value })} style={{ width: '100%', padding: '4px' }}>
                          {axisOptions.map(v => (Number(prescriptionForm.cylinderRight) !== 0 && v === 0) ? null : <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* HIỂN THỊ LỖI MẮT PHẢI */}
                    {validationErrors.right?.length > 0 && (
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '15px', color: '#be123c', fontSize: '11px', listStyleType: 'circle' }}>
                        {validationErrors.right.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                  {/* MẮT TRÁI */}
                  <div style={{ border: '1px solid #93c5fd', padding: '10px', borderRadius: '8px', backgroundColor: '#f0f7ff' }}>
                    <h5 style={{ color: '#2563eb', margin: '0 0 10px 0' }}>👁️ Mắt Trái (OS)</h5>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>SPH</label>
                        <select value={prescriptionForm.sphereLeft} onChange={e => setPrescriptionForm({ ...prescriptionForm, sphereLeft: e.target.value })} style={{ width: '100%', padding: '4px' }}>
                          {sphOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>CYL</label>
                        <select value={prescriptionForm.cylinderLeft} onChange={e => {
                          const val = e.target.value;
                          let newAxis = prescriptionForm.axisLeft;
                          
                          if (Number(val) === 0) {
                            newAxis = 0; 
                          } else if (Number(newAxis) === 0) {
                            newAxis = 1; // Đồng bộ UI và State
                          }
                      
                          setPrescriptionForm({ 
                            ...prescriptionForm, 
                            cylinderLeft: val, 
                            axisLeft: newAxis 
                          });
                        }} style={{ width: '100%', padding: '4px' }}>
                          {cylOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>AXIS</label>
                        <select disabled={Number(prescriptionForm.cylinderLeft) === 0} value={prescriptionForm.axisLeft} onChange={e => setPrescriptionForm({ ...prescriptionForm, axisLeft: e.target.value })} style={{ width: '100%', padding: '4px' }}>
                          {axisOptions.map(v => (Number(prescriptionForm.cylinderLeft) !== 0 && v === 0) ? null : <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* HIỂN THỊ LỖI MẮT TRÁI */}
                    {validationErrors.left?.length > 0 && (
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '15px', color: '#be123c', fontSize: '11px', listStyleType: 'circle' }}>
                        {validationErrors.left.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>PD (mm):</label>
                    <select value={prescriptionForm.pupillaryDistance} onChange={e => setPrescriptionForm({ ...prescriptionForm, pupillaryDistance: e.target.value })} style={{ width: '80px', marginLeft: '10px', padding: '5px' }}>
                      {pdOptions.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={handleSaveNewPrescription} disabled={isSavingNew} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {isSavingNew ? "⏳ Đang lưu..." : "💾 Lưu & Chọn Toa Này"}
                  </button>
                </div>
                {/* LỖI CHUNG KHÁC */}
                {validationErrors.other?.length > 0 && (
                  <div style={{ marginTop: '10px', color: '#be123c', fontSize: '11px', textAlign: 'center', fontWeight: '500' }}>
                    ⚠️ {validationErrors.other.join(" | ")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Giá Gọng Kính:</span>
            <strong>${basePrice}</strong>
          </div>
          {(selectedLensType || selectedLensFeature) && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#6b7280' }}>
                <span>Phụ phí Loại Tròng:</span>
                <span>+${lensTypeExtraPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                <span>Phụ phí Tính năng Tròng:</span>
                <span>+${featureExtraPrice}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', marginTop: '10px' }}>
            <strong>Tổng Tiền:</strong>
            <strong style={{ color: '#10b981' }}>
              ${currentTotalPrice} ({formatVND(currentTotalPrice)})
            </strong>
          </div>
        </div>

        <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="modal-btn modal-btn--outline" onClick={() => handleAddToCart(false)} style={{ flex: 1, padding: '12px' }}>Chỉ Mua Gọng</button>
          <button className="modal-btn modal-btn--primary" onClick={() => handleAddToCart(true)} disabled={isAddToCartDisabled} style={{ flex: 1, padding: '12px', backgroundColor: isAddToCartDisabled ? '#9ca3af' : '#111827' }}>
            🛒 Thêm Vào Giỏ Hàng
          </button>
        </div>
      </div>
    </div>
  );
}