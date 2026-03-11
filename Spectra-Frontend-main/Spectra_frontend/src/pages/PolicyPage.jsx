import React, { useState } from 'react';
import './PolicyPage.css';

const DEFAULT_POLICIES = [
  {
    title: "1. Quy định về gọng và tròng kính",
    content: "Quý khách có thể mua riêng gọng kính. Tuy nhiên, tròng kính không được bán rời mà chỉ bán kèm khi quý khách chọn mua cùng gọng kính tại cửa hàng."
  },
  {
    title: "2. Điều kiện đổi/trả hàng",
    content: "Yêu cầu đổi/trả chỉ được giải quyết đối với các đơn hàng đã được giao thành công và sản phẩm chưa từng được đổi trả trước đó."
  },
  {
    title: "3. Chính sách giá trị khi đổi hàng",
    content: "Sản phẩm đổi phải có giá trị bằng hoặc thấp hơn sản phẩm ban đầu. Nếu quý khách muốn đổi sản phẩm có giá cao hơn, vui lòng tạo đơn hàng mới."
  },
  {
    title: "4. Mức hoàn tiền khi trả hàng",
    content: "Khi trả hàng, số tiền hoàn lại sẽ dao động từ 30% đến 50% giá trị gốc, tùy thuộc vào tình trạng sản phẩm khi chúng tôi nhận lại. Không áp dụng hoàn tiền 100%."
  }
];

export default function PolicyPage() {
  const [policies, setPolicies] = useState(() => {
    const saved = localStorage.getItem("store_policies");
    return saved ? JSON.parse(saved) : DEFAULT_POLICIES;
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Kiểm tra quyền từ LocalStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const handleSave = () => {
    localStorage.setItem("store_policies", JSON.stringify(policies));
    setIsEditing(false);
    alert("Cập nhật chính sách thành công!");
  };

  const handleUpdate = (index, field, value) => {
    const newPolicies = [...policies];
    newPolicies[index][field] = value;
    setPolicies(newPolicies);
  };

  return (
    <div className="policy-wrapper">
      <div className="policy-header">
        <h1 className="policy-title">Chính Sách Mua & Đổi Trả</h1>
        {canEdit && (
          <button 
            className={`btn-toggle-edit ${isEditing ? 'btn-save' : 'btn-edit'}`}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? "Lưu thay đổi" : "Chỉnh sửa nội dung"}
          </button>
        )}
      </div>

      <div>
        {policies.map((policy, index) => (
          <div key={index} className="policy-card">
            {isEditing ? (
              <>
                <input 
                  className="edit-input"
                  value={policy.title}
                  onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                />
                <textarea 
                  className="edit-textarea"
                  value={policy.content}
                  onChange={(e) => handleUpdate(index, 'content', e.target.value)}
                />
              </>
            ) : (
              <>
                <h3>{policy.title}</h3>
                <p>{policy.content}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}