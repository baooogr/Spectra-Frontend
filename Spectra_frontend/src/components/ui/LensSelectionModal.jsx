import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";

export default function LensSelectionModal({ isOpen, onClose, product, onConfirmAddToCart }) {
  const navigate = useNavigate();
  
  const [lensTypes, setLensTypes] = useState([]);
  const [lensFeatures, setLensFeatures] = useState([]);
  
 
  const [selectedLensType, setSelectedLensType] = useState("");
  const [selectedLensFeature, setSelectedLensFeature] = useState("");
  
  
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  
  useEffect(() => {
    if (isOpen) {
      fetchLensTypes();
      fetchLensFeatures();
      
      setSelectedLensType("");
      setSelectedLensFeature("");
      setCalculatedPrice(null);
    }
  }, [isOpen]);

  const fetchLensTypes = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensTypes?page=1&pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setLensTypes(data.items || data || []);
      }
    } catch (err) { console.error("Lỗi tải LensType", err); }
  };

  const fetchLensFeatures = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensFeatures?page=1&pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setLensFeatures(data.items || data || []);
      }
    } catch (err) { console.error("Lỗi tải LensFeature", err); }
  };

  
  const calculateTotalPrice = async (typeId, featureId) => {
    if (!typeId || !featureId || !product) return;
    
    setIsLoadingPrice(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensFeatures/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePrice: product.basePrice,
          lensTypeId: typeId,
          lensFeatureId: featureId
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCalculatedPrice(data); 
      }
    } catch (error) {
      console.error("Lỗi tính tiền", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  
  useEffect(() => {
    if (selectedLensType && selectedLensFeature) {
      calculateTotalPrice(selectedLensType, selectedLensFeature);
    }
  }, [selectedLensType, selectedLensFeature]);


 
  const handleAddToCart = (withLens) => {
    if (withLens) {
     
      if (!selectedLensType || !selectedLensFeature) {
        alert("Vui lòng chọn đầy đủ Loại tròng và Tính năng tròng!");
        return;
      }
      
      const selectedTypeData = lensTypes.find(t => (t.id || t.lensTypeId) === selectedLensType);
      const selectedFeatureData = lensFeatures.find(f => (f.id || f.lensFeatureId) === selectedLensFeature);

      onConfirmAddToCart({
        lensIncluded: true,
        finalPrice: calculatedPrice?.totalPrice || product.basePrice,
        lensDetails: {
          type: selectedTypeData?.lensSpecification,
          feature: selectedFeatureData?.featureSpecification,
          index: selectedFeatureData?.lensIndex,
          requiresPrescription: selectedTypeData?.requiresPrescription
        }
      });
    } else {
      
      onConfirmAddToCart({
        lensIncluded: false,
        finalPrice: product.basePrice,
        lensDetails: null
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px', textAlign: 'left'}}>
        <h3 className="modal-title" style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
          👓 Tùy Chọn Tròng Kính
        </h3>
        <p style={{ color: "#666", marginBottom: '20px' }}>
          Bạn đang chọn gọng <strong>{product?.frameName}</strong> (${product?.basePrice}). Bạn có muốn lắp thêm tròng kính không?
        </p>

        
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>1. Chọn Loại Tròng:</label>
          <select 
            style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
            value={selectedLensType}
            onChange={(e) => setSelectedLensType(e.target.value)}
          >
            <option value="">-- Vui lòng chọn --</option>
            {lensTypes.map((type, idx) => (
              <option key={idx} value={type.id || type.lensTypeId}>
                {type.lensSpecification} (+${type.extraPrice}) {type.requiresPrescription ? '[Cần Toa]' : ''}
              </option>
            ))}
          </select>
        </div>

       
        <div style={{marginBottom: '20px'}}>
          <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>2. Chọn Tính Năng / Chiết Suất:</label>
          <select 
            style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
            value={selectedLensFeature}
            onChange={(e) => setSelectedLensFeature(e.target.value)}
          >
            <option value="">-- Vui lòng chọn --</option>
            {[...lensFeatures].sort((a,b) => a.lensIndex - b.lensIndex).map((feat, idx) => (
              <option key={idx} value={feat.id || feat.lensFeatureId}>
                Chiết suất {feat.lensIndex} - {feat.featureSpecification} (+${feat.extraPrice})
              </option>
            ))}
          </select>
        </div>

       
        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Giá Gọng Kính:</span>
            <strong>${product?.basePrice}</strong>
          </div>
          {calculatedPrice && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#6b7280' }}>
                <span>Phụ phí Loại Tròng:</span>
                <span>+${calculatedPrice.lensTypeExtraPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                <span>Phụ phí Tính năng Tròng:</span>
                <span>+${calculatedPrice.featureExtraPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                <strong>Tổng Tiền (Dự kiến):</strong>
                <strong style={{ color: '#10b981' }}>${calculatedPrice.totalPrice}</strong>
              </div>
            </>
          )}
          {isLoadingPrice && <div style={{textAlign: 'center', color: '#8b5cf6', fontSize: '14px', marginTop: '10px'}}>⏳ Đang tính toán giá...</div>}
        </div>

        <div className="modal-actions" style={{display: 'flex', gap: '10px', justifyContent: 'space-between'}}>
          <button 
            className="modal-btn modal-btn--outline" 
            onClick={() => handleAddToCart(false)} 
            style={{flex: 1}}
          >
            Không Cần Tròng (Mua Gọng Không)
          </button>
          
          <button 
            className="modal-btn modal-btn--primary" 
            onClick={() => handleAddToCart(true)} 
            disabled={!selectedLensType || !selectedLensFeature}
            style={{flex: 1, backgroundColor: (!selectedLensType || !selectedLensFeature) ? '#ccc' : '#111827', cursor: (!selectedLensType || !selectedLensFeature) ? 'not-allowed' : 'pointer'}}
          >
            Thêm Vào Giỏ Hàng
          </button>
        </div>
      </div>
    </div>
  );
}