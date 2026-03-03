import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";

export default function LensSelectionModal({ isOpen, onClose, product, onConfirmAddToCart }) {
  const navigate = useNavigate();
  
  const [lensTypes, setLensTypes] = useState([]);
  const [lensFeatures, setLensFeatures] = useState([]);
  
  const [selectedLensType, setSelectedLensType] = useState("");
  const [selectedLensFeature, setSelectedLensFeature] = useState("");
  
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState(null);
  
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLensTypes();
      fetchLensFeatures();
      setSelectedLensType("");
      setSelectedLensFeature("");
      setPrescriptionFile(null);
      setPrescriptionPreview(null);
      setCalculatedPrice(null);
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

  
  const calculateTotalPrice = async (typeId, featureId) => {
    if (!typeId || !featureId || !product) return;
    
    setIsLoadingPrice(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensFeatures/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePrice: Number(product.basePrice),
          lensTypeId: String(typeId),      
          lensFeatureId: String(featureId) 
        })
      });
      
      if (res.ok) {
        setCalculatedPrice(await res.json());
      } else {
        console.error("Lỗi 400: Dữ liệu tính tiền sai cấu trúc", await res.text());
      }
    } catch (error) { console.error("Lỗi tính tiền", error); } 
    finally { setIsLoadingPrice(false); }
  };

  useEffect(() => {
    if (selectedLensType && selectedLensFeature) {
      calculateTotalPrice(selectedLensType, selectedLensFeature);
    }
  }, [selectedLensType, selectedLensFeature]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescriptionFile(file);
      setPrescriptionPreview(URL.createObjectURL(file)); 
    }
  };

  const selectedTypeData = lensTypes.find(t => (t.id || t.lensTypeId)?.toString() === selectedLensType.toString());
  const selectedFeatureData = lensFeatures.find(f => (f.id || f.lensFeatureId)?.toString() === selectedLensFeature.toString());
  const requiresPrescription = selectedTypeData?.requiresPrescription || false;
  const isAddToCartDisabled = !selectedLensType || !selectedLensFeature || (requiresPrescription && !prescriptionFile);

  const handleAddToCart = (withLens) => {
    if (withLens) {
      if (isAddToCartDisabled) {
        alert("Vui lòng hoàn thiện tùy chọn tròng kính!"); return;
      }
      onConfirmAddToCart({
        lensIncluded: true,
        finalPrice: calculatedPrice?.totalPrice || product.basePrice,
        lensDetails: {
          typeId: String(selectedLensType),       
          featureId: String(selectedLensFeature), 
          type: selectedTypeData?.lensSpecification,
          feature: selectedFeatureData?.featureSpecification,
          index: selectedFeatureData?.lensIndex,
          requiresPrescription: requiresPrescription,
          prescriptionFile: prescriptionFile, 
          prescriptionPreview: prescriptionPreview 
        }
      });
    } else {
      onConfirmAddToCart({ lensIncluded: false, finalPrice: product.basePrice, lensDetails: null });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto'}}>
        <h3 className="modal-title" style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px'}}>👓 Tùy Chọn Tròng Kính</h3>
        <p style={{ color: "#666", marginBottom: '20px' }}>Bạn đang chọn gọng <strong>{product?.frameName}</strong> (${product?.basePrice}). Bạn có muốn lắp thêm tròng kính không?</p>

        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>1. Chọn Loại Tròng:</label>
          <select style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} value={selectedLensType} onChange={(e) => setSelectedLensType(e.target.value)}>
            <option value="">-- Vui lòng chọn --</option>
            {lensTypes.map((type, idx) => (
              <option key={idx} value={type.id || type.lensTypeId}>
                {type.lensSpecification} (+${type.extraPrice}) {type.requiresPrescription ? '[⚠️ Cần Toa]' : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>2. Chọn Tính Năng / Chiết Suất:</label>
          <select style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none'}} value={selectedLensFeature} onChange={(e) => setSelectedLensFeature(e.target.value)}>
            <option value="">-- Vui lòng chọn --</option>
            {[...lensFeatures].sort((a,b) => a.lensIndex - b.lensIndex).map((feat, idx) => (
              <option key={idx} value={feat.id || feat.lensFeatureId}>
                Chiết suất {feat.lensIndex} - {feat.featureSpecification} (+${feat.extraPrice})
              </option>
            ))}
          </select>
        </div>

        {requiresPrescription && (
          <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px dashed #ef4444'}}>
            <label style={{display: 'block', fontWeight: 'bold', color: '#b91c1c', marginBottom: '8px'}}>⚠️ Bắt Buộc: Tải lên Toa Thuốc</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{display: 'block', width: '100%', marginBottom: '10px'}} />
            {prescriptionPreview && <img src={prescriptionPreview} alt="Toa" style={{height: '100px', borderRadius: '6px', border: '1px solid #fca5a5', objectFit: 'cover'}} />}
          </div>
        )}

        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Giá Gọng Kính:</span><strong>${product?.basePrice}</strong>
          </div>
          {calculatedPrice && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#6b7280' }}>
                <span>Phụ phí Loại Tròng:</span><span>+${calculatedPrice.lensTypeExtraPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                <span>Phụ phí Tính năng Tròng:</span><span>+${calculatedPrice.featureExtraPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                <strong>Tổng Tiền (Dự kiến):</strong><strong style={{ color: '#10b981' }}>${calculatedPrice.totalPrice}</strong>
              </div>
            </>
          )}
          {isLoadingPrice && <div style={{textAlign: 'center', color: '#8b5cf6', fontSize: '14px', marginTop: '10px'}}>⏳ Đang tính toán giá...</div>}
        </div>

        <div className="modal-actions" style={{display: 'flex', gap: '10px', justifyContent: 'space-between'}}>
          <button className="modal-btn modal-btn--outline" onClick={() => handleAddToCart(false)} style={{flex: 1, padding: '12px', fontWeight: 'bold'}}>Mua Gọng Không</button>
          <button className="modal-btn modal-btn--primary" onClick={() => handleAddToCart(true)} disabled={isAddToCartDisabled} style={{flex: 1, padding: '12px', fontWeight: 'bold', backgroundColor: isAddToCartDisabled ? '#9ca3af' : '#111827', cursor: isAddToCartDisabled ? 'not-allowed' : 'pointer'}}>Thêm Vào Giỏ Hàng</button>
        </div>
      </div>
    </div>
  );
}