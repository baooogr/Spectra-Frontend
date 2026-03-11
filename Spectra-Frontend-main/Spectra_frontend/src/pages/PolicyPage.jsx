import React, { useState } from 'react';
import './PolicyPage.css'; // Import file CSS riêng

const DEFAULT_POLICIES = [
  {
    title: "1. Chính sách mua gọng và tròng kính",
    content: "Quý khách có thể chọn mua riêng gọng kính. Tuy nhiên, tròng kính cắt theo độ không bán rời và chỉ hỗ trợ bán kèm khi quý khách mua cùng gọng kính."
  },
  {
    title: "2. Điều kiện tiếp nhận đổi/trả",
    content: "Chỉ áp dụng với đơn hàng đã giao thành công và sản phẩm chưa từng áp dụng đổi trả trước đó."
  },
  {
    title: "3. Quy định giá trị đổi hàng",
    content: "Sản phẩm đổi phải có giá trị bằng hoặc thấp hơn sản phẩm đã mua. Nếu muốn đổi sang sản phẩm giá trị cao hơn, vui lòng tạo đơn hàng mới."
  },
  {
    title: "4. Mức hoàn tiền khi trả hàng",
    content: "Số tiền hoàn lại sẽ từ 30% đến 50% giá trị gốc tùy thuộc vào tình trạng thực tế của sản phẩm khi thu hồi. Không hoàn tiền 100%."
  }
];

export default function PolicyPage() {
  const [policies, setPolicies] = useState(() => {
    const saved = localStorage.getItem("store_policies");
    return saved ? JSON.parse(saved) : DEFAULT_POLICIES;
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user"));
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const handleSave = () => {
    localStorage.setItem("store_policies", JSON.stringify(policies));
    setIsEditing(false);
    alert("Đã cập nhật chính sách cửa hàng!");
  };

  return (
    <div className="policy-container">
      <div className="policy-header">
        <h1 className="policy-title">Chính Sách Mua & Đổi Trả</h1>
        {canEdit && (
          <button 
            className={isEditing ? "btn-save" : "btn-edit"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? "Lưu thay đổi" : "Chỉnh sửa nội dung"}
          </button>
        )}
      </div>

      <div className="policy-list">
        {policies.map((policy, index) => (
          <div key={index} className="policy-item">
            {isEditing ? (
              <>
                <input 
                  className="policy-input"
                  value={policy.title}
                  onChange={(e) => {
                    const newPol = [...policies];
                    newPol[index].title = e.target.value;
                    setPolicies(newPol);
                  }}
                />
                <textarea 
                  className="policy-textarea"
                  value={policy.content}
                  onChange={(e) => {
                    const newPol = [...policies];
                    newPol[index].content = e.target.value;
                    setPolicies(newPol);
                  }}
                />
              </>
            ) : (
              <>
                <h3 className="policy-item-title">{policy.title}</h3>
                <p className="policy-item-content">{policy.content}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}