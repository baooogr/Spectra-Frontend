import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";

export default function LensSelectionModal({ isOpen, onClose, product, onConfirmAddToCart }) {
  const navigate = useNavigate();
  
  const [lensTypes, setLensTypes] = useState([]);
  const [lensFeatures, setLensFeatures] = useState([]);
  const [selectedLensType, setSelectedLensType] = useState("");
  const [selectedLensFeature, setSelectedLensFeature] = useState("");
  
  const [savedPrescriptions, setSavedPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [inputMode, setInputMode] = useState("saved"); 

  const [prescriptionForm, setPrescriptionForm] = useState({
    sphereRight: 0, cylinderRight: 0, axisRight: 0, addRight: 0,
    sphereLeft: 0, cylinderLeft: 0, axisLeft: 0, addLeft: 0,
    pupillaryDistance: 60, doctorName: "", clinicName: ""
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
    }
  }, [isOpen]);

  const fetchLensTypes = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensTypes?page=1&pageSize=100");
      if (res.ok) setLensTypes((await res.json()).items || []);
    } catch (err) { console.error("Lỗi", err); }
  };

  const fetchLensFeatures = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensFeatures?page=1&pageSize=100");
      if (res.ok) setLensFeatures((await res.json()).items || []);
    } catch (err) { console.error("Lỗi", err); }
  };

  const fetchMyPrescriptions = async () => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
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
    } catch (err) {}
  };

  const handleSaveNewPrescription = async () => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) { alert("Vui lòng đăng nhập để lưu toa thuốc!"); return; }

    setIsSavingNew(true);
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6); 

    const payload = {
      sphereRight: prescriptionForm.sphereRight ? Number(prescriptionForm.sphereRight) : 0,
      cylinderRight: prescriptionForm.cylinderRight ? Number(prescriptionForm.cylinderRight) : 0,
      axisRight: prescriptionForm.axisRight ? Number(prescriptionForm.axisRight) : 0,
      addRight: prescriptionForm.addRight ? Number(prescriptionForm.addRight) : 0,
      sphereLeft: prescriptionForm.sphereLeft ? Number(prescriptionForm.sphereLeft) : 0,
      cylinderLeft: prescriptionForm.cylinderLeft ? Number(prescriptionForm.cylinderLeft) : 0,
      axisLeft: prescriptionForm.axisLeft ? Number(prescriptionForm.axisLeft) : 0,
      addLeft: prescriptionForm.addLeft ? Number(prescriptionForm.addLeft) : 0,
      pupillaryDistance: prescriptionForm.pupillaryDistance ? Number(prescriptionForm.pupillaryDistance) : 60,
      doctorName: prescriptionForm.doctorName || "Khách tự nhập",
      clinicName: prescriptionForm.clinicName || "Khách tự nhập",
      expirationDate: expiryDate.toISOString()
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
        await fetchMyPrescriptions(); 
        setSelectedPrescriptionId(newData.prescriptionId);
        setInputMode("saved");
      } else {
        const err = await res.json();
        alert("Lỗi nhập liệu: " + (err.message || "Vui lòng kiểm tra lại thông số."));
      }
    } catch (err) { alert("Lỗi kết nối mạng."); } 
    finally { setIsSavingNew(false); }
  };

  // ⚡ TÍNH GIÁ TRỰC TIẾP TRÊN FRONTEND (Bypass gọi API tính tiền để không bị delay)
  const selectedTypeData = lensTypes.find(t => (t.id || t.lensTypeId || t.typeId)?.toString() === selectedLensType.toString());
  const selectedFeatureData = lensFeatures.find(f => (f.id || f.lensFeatureId || f.featureId)?.toString() === selectedLensFeature.toString());
  
  const requiresPrescription = selectedTypeData?.requiresPrescription || false;
  
  // Lấy giá trị tiền
  const basePrice = Number(product?.basePrice) || 0;
  const lensTypeExtraPrice = Number(selectedTypeData?.extraPrice) || 0;
  const featureExtraPrice = Number(selectedFeatureData?.extraPrice) || 0;
  
  // TỔNG TIỀN CHÍNH XÁC NHẤT
  const currentTotalPrice = basePrice + lensTypeExtraPrice + featureExtraPrice;

  const isAddToCartDisabled = !selectedLensType || !selectedLensFeature || (requiresPrescription && !selectedPrescriptionId) || isSavingNew;

  const handleAddToCart = (withLens) => {
    if (withLens) {
      if (isAddToCartDisabled) return;
      
      // Đẩy giá trị vừa tính trực tiếp vào Giỏ Hàng
      onConfirmAddToCart({
        lensIncluded: true,
        finalPrice: currentTotalPrice, // ⚡ TIỀN ĐÃ ĐƯỢC CỘNG ĐẦY ĐỦ
        lensDetails: {
          typeId: String(selectedLensType),
          featureId: String(selectedLensFeature),
          type: selectedTypeData?.lensSpecification,
          feature: selectedFeatureData?.featureSpecification,
          index: selectedFeatureData?.lensIndex,
          requiresPrescription: requiresPrescription,
          prescriptionId: selectedPrescriptionId || null, 
          prescriptionUrl: null 
        }
      });
    } else {
      // Nếu chỉ mua gọng, lấy giá basePrice
      onConfirmAddToCart({ lensIncluded: false, finalPrice: basePrice, lensDetails: null });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto'}}>
        <h3 className="modal-title" style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px'}}>👓 Tùy Chọn Tròng Kính</h3>
        <p style={{ color: "#666", marginBottom: '20px' }}>Bạn đang chọn gọng <strong>{product?.frameName}</strong> (${basePrice}).</p>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
          <div>
            <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>1. Chọn Loại Tròng:</label>
            <select style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} value={selectedLensType} onChange={(e) => setSelectedLensType(e.target.value)}>
              <option value="">-- Vui lòng chọn --</option>
              {lensTypes.map((type, idx) => (
                <option key={idx} value={type.id || type.lensTypeId || type.typeId}>
                  {type.lensSpecification} (+${type.extraPrice}) {type.requiresPrescription ? '[⚠️ Cần Toa]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>2. Chiết Suất/Tính Năng:</label>
            <select style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} value={selectedLensFeature} onChange={(e) => setSelectedLensFeature(e.target.value)}>
              <option value="">-- Vui lòng chọn --</option>
              {[...lensFeatures].sort((a,b) => a.lensIndex - b.lensIndex).map((feat, idx) => (
                <option key={idx} value={feat.id || feat.lensFeatureId || feat.featureId}>
                  Chiết suất {feat.lensIndex} - {feat.featureSpecification} (+${feat.extraPrice})
                </option>
              ))}
            </select>
          </div>
        </div>

        {requiresPrescription && (
          <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px dashed #ef4444'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #fca5a5', paddingBottom: '10px'}}>
              <label style={{fontWeight: 'bold', color: '#b91c1c', margin: 0}}>⚠️ Yêu Cầu Thông Số Mắt</label>
              <div style={{display: 'flex', gap: '10px'}}>
                <button onClick={() => setInputMode("saved")} style={{padding: '5px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: inputMode === 'saved' ? '#111827' : '#fff', color: inputMode === 'saved' ? 'white' : '#111827', border: '1px solid #111827', borderRadius: '4px'}}>Dùng toa đã lưu</button>
                <button onClick={() => setInputMode("new")} style={{padding: '5px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: inputMode === 'new' ? '#111827' : '#fff', color: inputMode === 'new' ? 'white' : '#111827', border: '1px solid #111827', borderRadius: '4px'}}>+ Nhập toa mới</button>
              </div>
            </div>

            {inputMode === "saved" ? (
              <div>
                {savedPrescriptions.length > 0 ? (
                  <select 
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}}
                    value={selectedPrescriptionId}
                    onChange={e => setSelectedPrescriptionId(e.target.value)}
                  >
                    <option value="">-- Chọn toa thuốc hợp lệ của bạn --</option>
                    {savedPrescriptions.map(p => (
                      <option key={p.prescriptionId} value={p.prescriptionId}>
                        Khai báo ngày {new Date(p.createdAt).toLocaleDateString('vi-VN')} (S:{p.sphereRight}/${p.sphereLeft})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{fontSize: '14px', color: '#dc2626'}}>Bạn chưa có toa thuốc nào còn hạn trong hồ sơ. Vui lòng bấm "Nhập toa mới".</p>
                )}
              </div>
            ) : (
              <div style={{backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb'}}>
                <p style={{fontSize: '12px', color: '#666', marginTop: 0, marginBottom: '10px'}}>Nhập các thông số theo giấy khám của bạn (Âm là Cận, Dương là Viễn).</p>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div style={{border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px'}}>
                    <h5 style={{color: '#dc2626', margin: '0 0 10px 0'}}>👁️ Mắt Phải (OD)</h5>
                    <div style={{display: 'flex', gap: '5px', marginBottom: '5px'}}>
                      <div style={{flex: 1}}><label style={{fontSize: '11px'}}>SPH</label><input type="number" step="0.25" value={prescriptionForm.sphereRight} onChange={e => setPrescriptionForm({...prescriptionForm, sphereRight: e.target.value})} style={{width: '100%', padding: '5px'}} /></div>
                      <div style={{flex: 1}}><label style={{fontSize: '11px'}}>CYL</label><input type="number" step="0.25" value={prescriptionForm.cylinderRight} onChange={e => setPrescriptionForm({...prescriptionForm, cylinderRight: e.target.value})} style={{width: '100%', padding: '5px'}} /></div>
                      <div style={{flex: 1}}><label style={{fontSize: '11px'}}>AXIS</label><input type="number" value={prescriptionForm.axisRight} onChange={e => setPrescriptionForm({...prescriptionForm, axisRight: e.target.value})} style={{width: '100%', padding: '5px'}} /></div>
                    </div>
                  </div>

                  <div style={{border: '1px solid #93c5fd', padding: '10px', borderRadius: '6px'}}>
                    <h5 style={{color: '#2563eb', margin: '0 0 10px 0'}}>👁️ Mắt Trái (OS)</h5>
                    <div style={{display: 'flex', gap: '5px', marginBottom: '5px'}}>
                      <div style={{flex: 1}}><label style={{fontSize: '11px'}}>SPH</label><input type="number" step="0.25" value={prescriptionForm.sphereLeft} onChange={e => setPrescriptionForm({...prescriptionForm, sphereLeft: e.target.value})} style={{width: '100%', padding: '5px'}} /></div>
                      <div style={{flex: 1}}><label style={{fontSize: '11px'}}>CYL</label><input type="number" step="0.25" value={prescriptionForm.cylinderLeft} onChange={e => setPrescriptionForm({...prescriptionForm, cylinderLeft: e.target.value})} style={{width: '100%', padding: '5px'}} /></div>
                      <div style={{flex: 1}}><label style={{fontSize: '11px'}}>AXIS</label><input type="number" value={prescriptionForm.axisLeft} onChange={e => setPrescriptionForm({...prescriptionForm, axisLeft: e.target.value})} style={{width: '100%', padding: '5px'}} /></div>
                    </div>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '15px', alignItems: 'center', marginTop: '15px'}}>
                  <div style={{width: '120px'}}>
                    <label style={{fontSize: '12px', fontWeight: 'bold'}}>PD (mm):</label>
                    <input type="number" value={prescriptionForm.pupillaryDistance} onChange={e => setPrescriptionForm({...prescriptionForm, pupillaryDistance: e.target.value})} style={{width: '100%', padding: '6px'}} />
                  </div>
                  <button type="button" onClick={handleSaveNewPrescription} disabled={isSavingNew} style={{padding: '8px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: 'fit-content', marginTop: '15px'}}>
                    {isSavingNew ? "Đang lưu..." : "Lưu & Chọn toa này"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BẢNG HIỂN THỊ GIÁ TIỀN CHÍNH XÁC */}
        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Giá Gọng Kính:</span><strong>${basePrice}</strong>
          </div>
          {(selectedLensType || selectedLensFeature) && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#6b7280' }}>
                <span>Phụ phí Loại Tròng:</span><span>+${lensTypeExtraPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                <span>Phụ phí Tính năng Tròng:</span><span>+${featureExtraPrice}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', marginTop: '10px' }}>
            <strong>Tổng Tiền (Dự kiến):</strong><strong style={{ color: '#10b981' }}>${currentTotalPrice}</strong>
          </div>
        </div>

        <div className="modal-actions" style={{display: 'flex', gap: '10px', justifyContent: 'space-between'}}>
          <button className="modal-btn modal-btn--outline" onClick={() => handleAddToCart(false)} style={{flex: 1, padding: '12px', fontWeight: 'bold'}}>Mua Gọng Không</button>
          <button className="modal-btn modal-btn--primary" onClick={() => handleAddToCart(true)} disabled={isAddToCartDisabled} style={{flex: 1, padding: '12px', fontWeight: 'bold', backgroundColor: isAddToCartDisabled ? '#9ca3af' : '#111827', cursor: isAddToCartDisabled ? 'not-allowed' : 'pointer'}}>
            {isSavingNew ? "Đang lưu toa..." : "Thêm Vào Giỏ Hàng"}
          </button>
        </div>
      </div>
    </div>
  );
}