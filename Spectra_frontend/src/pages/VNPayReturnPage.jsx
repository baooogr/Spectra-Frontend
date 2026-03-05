import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); 

  const responseCode = searchParams.get("vnp_ResponseCode");
  const transactionNo = searchParams.get("vnp_TransactionNo");
  const amount = searchParams.get("vnp_Amount");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy đoạn query URL VNPay trả về (ví dụ: ?vnp_Amount=...&vnp_BankCode=...)
        const queryString = window.location.search; 

        // Gửi xuống API Backend để kiểm tra chữ ký bảo mật
        const res = await fetch(`https://myspectra.runasp.net/api/Payments/vnpay-return${queryString}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        setStatus("failed");
      }
    };

    // VNPay quy định mã 00 là thanh toán thành công
    if (responseCode === "00") {
      verifyPayment();
    } else {
      setStatus("failed"); 
    }
  }, [responseCode]);

  return (
    <div style={{textAlign: "center", padding: "100px 20px", fontFamily: "sans-serif"}}>
      {status === "loading" && <h2>⏳ Đang đồng bộ kết quả thanh toán với hệ thống...</h2>}
      
      {status === "success" && (
        <div style={{backgroundColor: '#f0fdf4', maxWidth: '500px', margin: '0 auto', padding: '30px', borderRadius: '12px', border: '1px solid #bbf7d0'}}>
          <div style={{fontSize: "60px"}}>✅</div>
          <h2 style={{color: "#059669", marginTop: '10px'}}>Thanh Toán VNPay Thành Công!</h2>
          <p style={{color: '#374151'}}>Cảm ơn bạn. Đơn hàng của bạn đã được thanh toán đầy đủ.</p>
          <div style={{textAlign: 'left', backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginTop: '20px'}}>
            <p style={{margin: '5px 0', color: "#666"}}><b>Mã giao dịch:</b> {transactionNo}</p>
            <p style={{margin: '5px 0', color: "#666"}}>
              <b>Số tiền:</b> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) / 100)}
            </p>
          </div>
          <Link to="/orders" style={{display: "inline-block", marginTop: "20px", padding: "12px 25px", backgroundColor: "#111827", color: "white", textDecoration: "none", borderRadius: "6px", fontWeight: 'bold'}}>Xem lịch sử mua hàng</Link>
        </div>
      )}

      {status === "failed" && (
        <div style={{backgroundColor: '#fef2f2', maxWidth: '500px', margin: '0 auto', padding: '30px', borderRadius: '12px', border: '1px solid #fecaca'}}>
          <div style={{fontSize: "60px"}}>❌</div>
          <h2 style={{color: "#dc2626", marginTop: '10px'}}>Thanh Toán Thất Bại Hoặc Bị Hủy</h2>
          <p style={{color: '#374151'}}>Giao dịch chưa được thực hiện. Đơn hàng của bạn đã được ghi nhận nhưng đang ở trạng thái chưa thanh toán.</p>
          <p style={{color: "#991b1b", fontWeight: 'bold', fontSize: '14px'}}>Mã lỗi trả về: {responseCode}</p>
          <Link to="/" style={{display: "inline-block", marginTop: "20px", padding: "12px 25px", backgroundColor: "#111827", color: "white", textDecoration: "none", borderRadius: "6px", fontWeight: 'bold'}}>Trở về Trang chủ</Link>
        </div>
      )}
    </div>
  );
}