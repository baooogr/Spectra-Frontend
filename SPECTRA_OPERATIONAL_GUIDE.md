# SPECTRA EYEWEAR — Hướng Dẫn Vận Hành Toàn Diện

> **Phiên bản:** 1.0  
> **Áp dụng cho:** Spectra Glasses Web Application  
> **Vai trò:** Customer · Staff · Manager · Admin

---

## Mục Lục

- [1. Tổng Quan Kiến Trúc & Vai Trò](#1-tổng-quan-kiến-trúc--vai-trò)
- [2. Xác Thực & Tài Khoản](#2-xác-thực--tài-khoản)
  - [2.1 Đăng Ký](#21-đăng-ký)
  - [2.2 Đăng Nhập](#22-đăng-nhập)
  - [2.3 Đăng Nhập Google](#23-đăng-nhập-google)
  - [2.4 Quên Mật Khẩu / Đặt Lại](#24-quên-mật-khẩu--đặt-lại)
  - [2.5 Đổi Mật Khẩu](#25-đổi-mật-khẩu)
  - [2.6 Quản Lý Hồ Sơ](#26-quản-lý-hồ-sơ)
- [3. Luồng Khách Hàng (Customer)](#3-luồng-khách-hàng-customer)
  - [3.1 Trang Chủ & Duyệt Sản Phẩm](#31-trang-chủ--duyệt-sản-phẩm)
  - [3.2 Chi Tiết Sản Phẩm & Chọn Tròng Kính](#32-chi-tiết-sản-phẩm--chọn-tròng-kính)
  - [3.3 Giỏ Hàng](#33-giỏ-hàng)
  - [3.4 Thanh Toán Đơn Thường (Checkout)](#34-thanh-toán-đơn-thường-checkout)
  - [3.5 Thanh Toán Đơn Pre-order](#35-thanh-toán-đơn-pre-order)
  - [3.6 VNPay & Xác Nhận](#36-vnpay--xác-nhận)
  - [3.7 Lịch Sử Đơn Hàng](#37-lịch-sử-đơn-hàng)
  - [3.8 Chi Tiết Đơn Hàng (OrderDetail)](#38-chi-tiết-đơn-hàng-orderdetail)
  - [3.9 Chi Tiết Đơn Pre-order (PreorderDetail)](#39-chi-tiết-đơn-pre-order-preorderdetail)
  - [3.10 Toa Thuốc Mắt](#310-toa-thuốc-mắt)
- [4. Luồng Khiếu Nại (Complaint)](#4-luồng-khiếu-nại-complaint)
  - [4.1 Tạo Khiếu Nại](#41-tạo-khiếu-nại)
  - [4.2 Chi Tiết & Theo Dõi Khiếu Nại](#42-chi-tiết--theo-dõi-khiếu-nại)
  - [4.3 Chỉnh Sửa Khiếu Nại](#43-chỉnh-sửa-khiếu-nại)
  - [4.4 Rút Khiếu Nại](#44-rút-khiếu-nại)
  - [4.5 Luồng Đổi Hàng (Exchange) — Xuyên Vai Trò](#45-luồng-đổi-hàng-exchange--xuyên-vai-trò)
  - [4.6 Luồng Trả Hàng (Return) — Xuyên Vai Trò](#46-luồng-trả-hàng-return--xuyên-vai-trò)
  - [4.7 Luồng Hoàn Tiền (Refund) — Xuyên Vai Trò](#47-luồng-hoàn-tiền-refund--xuyên-vai-trò)
  - [4.8 Luồng Bảo Hành (Warranty) — Xuyên Vai Trò](#48-luồng-bảo-hành-warranty--xuyên-vai-trò)
- [5. Luồng Đơn Hàng Xuyên Vai Trò](#5-luồng-đơn-hàng-xuyên-vai-trò)
  - [5.1 Đơn Hàng Thường — Từ Đặt Đến Giao](#51-đơn-hàng-thường--từ-đặt-đến-giao)
  - [5.2 Đơn Pre-order — Từ Chiến Dịch Đến Giao Hàng](#52-đơn-pre-order--từ-chiến-dịch-đến-giao-hàng)
- [6. Trang Quản Trị (Admin Panel)](#6-trang-quản-trị-admin-panel)
  - [6.1 Tổng Quan Kinh Doanh (Dashboard)](#61-tổng-quan-kinh-doanh-dashboard)
  - [6.2 Quản Lý Sản Phẩm (Kính)](#62-quản-lý-sản-phẩm-kính)
  - [6.3 Quản Lý Loại Tròng Kính](#63-quản-lý-loại-tròng-kính)
  - [6.4 Quản Lý Tính Năng Tròng](#64-quản-lý-tính-năng-tròng)
  - [6.5 Quản Lý Đơn Hàng](#65-quản-lý-đơn-hàng)
  - [6.6 Quản Lý Chiến Dịch Pre-order](#66-quản-lý-chiến-dịch-pre-order)
  - [6.7 Quản Lý Người Dùng](#67-quản-lý-người-dùng)
  - [6.8 Quản Lý Khiếu Nại](#68-quản-lý-khiếu-nại)
  - [6.9 Quản Lý Vận Chuyển (Shipping)](#69-quản-lý-vận-chuyển-shipping)
- [7. Bảng Trạng Thái & Chuyển Đổi](#7-bảng-trạng-thái--chuyển-đổi)
- [8. Phân Quyền Theo Vai Trò](#8-phân-quyền-theo-vai-trò)
- [9. Thuật Ngữ Tiếng Việt — Tiếng Anh](#9-thuật-ngữ-tiếng-việt--tiếng-anh)

---

## 1. Tổng Quan Kiến Trúc & Vai Trò

### Hệ thống

| Thành phần | Công nghệ                                           |
| ---------- | --------------------------------------------------- |
| Frontend   | React 19 + Vite, SWR, React Router v7, Leaflet Maps |
| Backend    | ASP.NET Core Web API, Entity Framework, SQL Server  |
| Thanh toán | VNPay Gateway                                       |
| Vận chuyển | GoShip — J&T Express, Nhập tay (GHN, GHTK, VNPost)  |
| Lưu ảnh    | Cloudinary                                          |
| Tiền tệ    | Hiển thị kép USD + VND (tỷ giá ~25.400)             |

### Bốn vai trò

| Vai trò                   | Mô tả                                                        | Truy cập Admin Panel                                           |
| ------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| **Customer** (Khách hàng) | Mua hàng, đặt trước, khiếu nại                               | Không                                                          |
| **Staff** (Nhân viên)     | Xử lý đơn, vận chuyển, khiếu nại                             | Có (qua URL `/admin`) — không hiển thị nút "Admin" trên header |
| **Manager** (Quản lý)     | Tất cả quyền Staff + CRUD sản phẩm, chiến dịch, quản lý user | Có (nút "Admin" trên header)                                   |
| **Admin** (Quản trị)      | Tất cả quyền Manager                                         | Có (nút "Admin" trên header)                                   |

---

## 2. Xác Thực & Tài Khoản

### 2.1 Đăng Ký

**Đường dẫn:** `/register`

1. Nhập các trường:
   - **Họ và tên** (bắt buộc)
   - **Email** (bắt buộc, phải hợp lệ)
   - **Mật khẩu** (bắt buộc, tối thiểu 6 ký tự)
   - **Xác nhận mật khẩu** (phải khớp)
   - **Số điện thoại** (bắt buộc)
2. Nhấn **"Đăng ký"**
3. Hệ thống gọi `POST /api/Auth/register`
4. Nếu thành công → tự động đăng nhập → chuyển về trang chủ `/`
5. Nếu email đã tồn tại → hiển thị lỗi

> Tài khoản mới tạo mặc định vai trò **customer**, trạng thái **active**.

### 2.2 Đăng Nhập

**Đường dẫn:** `/login`

1. Nhập **Email** và **Mật khẩu**
2. Nhấn **"Đăng nhập"**
3. Hệ thống gọi `POST /api/Auth/login` → trả về JWT token
4. Token và thông tin user lưu vào `localStorage`
5. Chuyển hướng: nếu có `returnUrl` → đến đó, ngược lại → `/`

### 2.3 Đăng Nhập Google

1. Trên trang `/login`, nhấn nút **Google Sign-In**
2. Popup Google hiện ra → chọn tài khoản
3. Hệ thống gọi `POST /api/Auth/google` với Google ID token
4. Nếu chưa có tài khoản → tự tạo mới (fullName lấy từ Google)
5. Đăng nhập tự động → chuyển về trang chủ

### 2.4 Quên Mật Khẩu / Đặt Lại

**Bước 1 — Quên mật khẩu** (`/forgot-password`):

1. Nhập **Email**
2. Nhấn **"Gửi link đặt lại mật khẩu"**
3. `POST /api/Auth/forgot-password` → gửi email chứa link reset

**Bước 2 — Đặt lại** (`/reset-password?token=...&email=...`):

1. Mở link từ email → trang đặt lại mật khẩu
2. Nhập **Mật khẩu mới** + **Xác nhận**
3. Nhấn **"Đặt Lại Mật Khẩu"**
4. `POST /api/Auth/reset-password` với token + email + newPassword

### 2.5 Đổi Mật Khẩu

**Đường dẫn:** `/profile` → tab **"Đổi mật khẩu"**

1. Nhập **Mật khẩu hiện tại**
2. Nhập **Mật khẩu mới** (tối thiểu 6 ký tự)
3. Nhập **Xác nhận mật khẩu mới**
4. Nhấn **"Đổi mật khẩu"**
5. `PUT /api/Auth/change-password`

### 2.6 Quản Lý Hồ Sơ

**Đường dẫn:** `/profile` → tab **"Thông tin cá nhân"**

**Xem:**

- Họ và tên, Email, Số điện thoại, Địa chỉ

**Sửa:**

1. Nhấn **"Sửa Thông Tin"**
2. Chỉnh sửa: Họ và tên, Số điện thoại, Địa chỉ giao hàng
3. Nhấn **"Lưu thay đổi"** hoặc **"Hủy"**
4. `PUT /api/Users/me` với `{fullName, phone, address}`

---

## 3. Luồng Khách Hàng (Customer)

### 3.1 Trang Chủ & Duyệt Sản Phẩm

**Trang chủ** (`/`):

- Hero carousel (3 slide tự chuyển mỗi 5 giây)
- Thanh tính năng: Free Shipping (>$50), Easy Returns (30 ngày), Quality Guarantee, 24/7 Support
- Mục "Shop by Category": Eyeglasses, Sunglasses, Prescription Lenses
- "Featured Products" — 8 sản phẩm đầu tiên dạng grid
- Nút **"Browse All Products →"** → `/shop`

**Trang Shop** (`/shop`):

- Thanh tìm kiếm trên header → nhập từ khóa → Enter → navigates đến `/shop?search=...`
- Navbar: **Home** | **Shop** | **Eyeglasses** (`/shop?category=eyeglasses`) | **Sunglasses** (`/shop?category=sunglasses`) | **My Orders**

**Bộ lọc (sidebar trái):**

| Bộ lọc      | Loại     | Chi tiết                                    |
| ----------- | -------- | ------------------------------------------- |
| Frame Shape | Checkbox | Load động từ API                            |
| Material    | Checkbox | Load động từ API                            |
| Price Range | Radio    | All Prices / Under $15 / $15–$20 / Over $20 |

- Nút **"Clear All"** xóa tất cả bộ lọc
- Grid hiển thị 12 sản phẩm/trang, có phân trang (Prev / số trang / Next)
- Lọc và tìm kiếm chạy phía client

### 3.2 Chi Tiết Sản Phẩm & Chọn Tròng Kính

**Đường dẫn:** `/products/:id`

**Bố cục 2 cột:**

| Cột trái                                  | Cột phải           |
| ----------------------------------------- | ------------------ |
| Ảnh chính (click để zoom) + dải thumbnail | Thông tin sản phẩm |

**Thông tin hiển thị:**

- Tên sản phẩm, Thương hiệu
- Giá (xanh nếu pre-order, đen nếu thường)
- Badge **"Ưu đãi đặt trước"** (nếu có chiến dịch pre-order)
- **Chọn màu sắc:** Nút tròn với tên màu → click đổi ảnh gallery
- **Trạng thái tồn kho:**
  - "Còn hàng (X)" — xanh lá
  - "Hết hàng" — đỏ
  - "Đang mở đặt trước (Tối đa X cái/đơn)" — xanh dương + ngày giao dự kiến
- **Số lượng:** Nút `-` / giá trị / `+`
- **Nút thêm giỏ:** "Thêm vào giỏ hàng" hoặc "Đặt trước ngay (Pre-order)" hoặc "Out of stock" (disabled)

**Thẻ thông tin:**

1. **"Chi tiết sản phẩm"** — Chất liệu, Kiểu dáng, Kích cỡ, Loại tròng kính hỗ trợ
2. **"Thông số kỹ thuật"** — Rộng tròng, Cầu kính, Càng kính, Rộng khung (mm), Rx Range, PD Range

**Khi nhấn "Thêm vào giỏ hàng" → Mở Modal "Cấu Hình Tròng Kính":**

| Bước                                                 | Nội dung                                                                                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Chọn Loại Tròng**                               | Dropdown hiển thị tên + giá phụ thu. Loại không hỗ trợ hiển thị "(Không hỗ trợ)" xám. Có link mở rộng "Xem thông tin các loại tròng" giải thích từng loại. |
| **2. Chiết Suất / Tính Năng**                        | Dropdown hiển thị chỉ số chiết suất + tên tính năng + giá phụ thu                                                                                          |
| **3. Toa Thuốc** _(chỉ hiện nếu loại tròng yêu cầu)_ | Hai chế độ: **"Toa đã lưu"** (dropdown toa hợp lệ) hoặc **"+ Nhập mới"** (form SPH/CYL/AXIS hai mắt + PD). Kiểm tra Rx/PD có nằm trong phạm vi gọng kính.  |

**Bảng giá tổng hợp:**

```
Giá Gọng Kính:           $XX
Phụ phí Loại Tròng:     +$XX
Phụ phí Tính năng Tròng: +$XX
─────────────────────────────
Tổng Tiền:               $XX (≈ XXX.XXX ₫)
```

**Hai nút:**

- **"Chỉ Mua Gọng"** — thêm gọng không tròng vào giỏ
- **"Thêm Vào Giỏ Hàng"** — thêm gọng + cấu hình tròng vào giỏ

### 3.3 Giỏ Hàng

**Đường dẫn:** `/cart`

**Bảng giỏ hàng hiển thị cho mỗi sản phẩm:**

- Ảnh sản phẩm + Tên + Màu
- Cấu hình tròng (nếu có): Loại tròng, Tính năng, Toa thuốc (SPH/CYL/AXIS/PD)
- Giá đơn vị (gọng + tròng)
- Nút tăng/giảm số lượng
- Nút xóa

**Phân chia đơn:** Giỏ hàng tự động tách thành:

- **Sản phẩm thường** → Checkout thường
- **Sản phẩm pre-order** → Checkout pre-order (hiển thị badge "Pre-order")

**Sidebar phải:**

- Tạm tính (Subtotal)
- Phương thức vận chuyển (chỉ cho đơn thường):
  - **Tiêu chuẩn (Standard)** — Miễn phí
  - **Nhanh (Express)** — Phí theo vùng
- Phí vận chuyển + Tổng cộng
- Nút **"Thanh toán"** → `/checkout`
- Nút **"Đặt trước ngay"** → `/checkout-preorder` (nếu có sản phẩm pre-order)

### 3.4 Thanh Toán Đơn Thường (Checkout)

**Đường dẫn:** `/checkout`

**Bước 1 — Thông tin giao hàng:**

- Họ và tên người nhận (tự điền từ profile)
- Số điện thoại (tự điền)
- Địa chỉ giao hàng (tự điền)

**Bước 2 — Phương thức vận chuyển:**

| Phương thức               | Phí                                                          |
| ------------------------- | ------------------------------------------------------------ |
| **Tiêu chuẩn (Standard)** | $0 (Miễn phí)                                                |
| **Nhanh (Express)**       | Tùy vùng: HCM $2 / Miền Nam $4 / Miền Trung $6 / Miền Bắc $7 |

> Hệ thống tự phát hiện vùng từ địa chỉ (từ khóa: "hồ chí minh", "bình dương", "đà nẵng", "hà nội"...)

**Bước 3 — Phương thức thanh toán:**

| Phương thức                        | Mô tả                        |
| ---------------------------------- | ---------------------------- |
| **COD** (Thanh toán khi nhận hàng) | Không cần thanh toán online  |
| **VNPay**                          | Chuyển hướng sang cổng VNPay |

**Bước 4 — Xác nhận:**

- Tổng sản phẩm, Phí vận chuyển, Tổng cộng (USD + VND)
- Nhấn **"Đặt hàng"**

**Sau khi đặt:**

- COD → chuyển đến `/checkout-success`
- VNPay → chuyển đến cổng VNPay → xử lý → redirect về `/payment/return`

### 3.5 Thanh Toán Đơn Pre-order

**Đường dẫn:** `/checkout-preorder`

**Khác biệt so với checkout thường:**

- **Bắt buộc VNPay** — không có COD
- Không chọn phương thức vận chuyển (chưa giao ngay)
- Hiển thị thông tin chiến dịch: tên, giá ưu đãi, ngày giao dự kiến
- Nhấn **"Thanh toán VNPay"** → chuyển đến cổng VNPay

### 3.6 VNPay & Xác Nhận

**Cổng VNPay:**

1. Chọn ngân hàng / quét QR
2. Nhập OTP
3. Xác nhận thanh toán

**Trang trả về** (`/payment/return`):

- Kiểm tra params `vnp_ResponseCode`, `vnp_TransactionStatus`
- **Thành công (`00`):** Hiển thị "Thanh toán thành công!" + link xem đơn hàng
- **Thất bại:** Hiển thị "Thanh toán thất bại" + mã lỗi + link thử lại

**Trang thành công** (`/checkout-success`):

- Hiển thị "Đặt Hàng Thành Công!"
- Mã đơn hàng
- Các nút: **"Xem đơn hàng"** → `/orders/:id`, **"Tiếp tục mua sắm"** → `/shop`

### 3.7 Lịch Sử Đơn Hàng

**Đường dẫn:** `/orders`

**3 tab lọc:**

| Tab            | Nội dung               |
| -------------- | ---------------------- |
| **Tất cả**     | Đơn thường + Pre-order |
| **Đơn thường** | Chỉ đơn hàng thường    |
| **Pre-order**  | Chỉ đơn đặt trước      |

**Mỗi đơn hiển thị:**

- Mã đơn (8 ký tự đầu)
- Ngày đặt (định dạng vi-VN)
- Badge trạng thái (màu sắc theo trạng thái)
- Danh sách sản phẩm: ảnh, tên, màu, số lượng, giá
- Tổng tiền
- Nút **"Xem chi tiết"**

### 3.8 Chi Tiết Đơn Hàng (OrderDetail)

**Đường dẫn:** `/orders/:id`

**Các thành phần:**

**A. Thông tin đơn:**

- Mã đơn, Ngày đặt, Trạng thái, Phương thức thanh toán
- Địa chỉ giao hàng
- Chi tiết sản phẩm: ảnh, tên, màu, cấu hình tròng, toa thuốc, giá, số lượng

**B. Lộ trình đơn hàng (Timeline 8 bước):**

| Bước | Tên              | Trạng thái tương ứng |
| ---- | ---------------- | -------------------- |
| 1    | Đơn hàng đã đặt  | `pending`            |
| 2    | Đã xác nhận      | `confirmed`          |
| 3    | Đang xử lý       | `processing`         |
| 4    | Đã giao cho ĐVVC | `shipped`            |
| 5    | Đang vận chuyển  | (sau `shipped`)      |
| 6    | Đang giao hàng   | (gần đến)            |
| 7    | Đã giao hàng     | `delivered`          |
| 8    | Hoàn thành       | (xác nhận nhận hàng) |

**C. Thanh theo dõi vận đơn** (hiện khi có `trackingNumber`):

- Hãng vận chuyển + Mã vận đơn (badge)
- Nút **"Theo dõi"** mở trang tracking ngoài (J&T, GHN, GHTK, VNPost)

**D. Bản đồ giao hàng (DeliveryMap):**

- Hiển thị tuyến đường từ kho đến địa chỉ giao
- Sử dụng Leaflet + OpenStreetMap + OSRM routing

**E. Nút hành động:**

- **"Đã nhận hàng"** — chỉ hiện khi `status=delivered` và chưa xác nhận. Gọi `PUT /api/Orders/{id}/confirm-delivery`
- **"Hủy đơn hàng"** — chỉ hiện khi `status=pending`. Gọi `PUT /api/Orders/{id}/cancel`

### 3.9 Chi Tiết Đơn Pre-order (PreorderDetail)

**Đường dẫn:** `/preorders/:id`

**Nội dung tương tự OrderDetail nhưng với đặc thù:**

- Hiển thị thông tin chiến dịch: tên, giá ưu đãi
- Trạng thái riêng: Chờ xác nhận → Đã xác nhận → Đã thanh toán → Đang xử lý (đã chuyển đổi)
- **Khi đơn pre-order đã được chuyển đổi (converted):**
  - Hiển thị đầy đủ timeline 8 bước (từ đơn hàng liên kết — `linkedOrder`)
  - Thanh theo dõi vận đơn với link tracking
  - Bản đồ giao hàng DeliveryMap
  - Thông tin phí vận chuyển

### 3.10 Toa Thuốc Mắt

**Đường dẫn:** `/profile` → tab **"Toa thuốc của tôi"**

**Xem danh sách toa:**

- Ngày tạo, Bác sĩ/Phòng khám, Ngày hết hạn
- Badge "Đã hết hạn" nếu quá hạn
- Thông số: Mắt Phải (R) SPH/CYL/AXIS, Mắt Trái (L) SPH/CYL/AXIS, PD (mm)

**Thêm toa mới:**

1. Nhấn **"+ Thêm toa đo mắt mới"**
2. Điền form:
   - **Mắt Phải (OD/Right):** Độ Cầu (SPH: -20 đến +12, bước 0.25), Độ Loạn (CYL: -6 đến +6), Trục (AXIS: 0–180)
   - **Mắt Trái (OS/Left):** Giống mắt phải
   - **Khoảng cách đồng tử (PD):** Dropdown 57–79 mm
   - **Tên Bác sĩ** (tùy chọn)
   - **Phòng khám/Bệnh viện** (tùy chọn)
3. Lưu ý: Nếu CYL ≠ 0 thì AXIS phải từ 1–180
4. Nhấn **"Lưu Toa Thuốc"**

---

## 4. Luồng Khiếu Nại (Complaint)

### Loại khiếu nại

| Loại        | Tiếng Việt | Mô tả                      |
| ----------- | ---------- | -------------------------- |
| `complaint` | Khiếu nại  | Phản hồi chung             |
| `return`    | Trả hàng   | Trả sản phẩm, hoàn tiền    |
| `exchange`  | Đổi hàng   | Đổi sang sản phẩm khác     |
| `refund`    | Hoàn tiền  | Yêu cầu hoàn tiền          |
| `warranty`  | Bảo hành   | Sửa chữa/thay thế bảo hành |

### Trạng thái khiếu nại

| Trạng thái       | Tiếng Việt    | Màu          |
| ---------------- | ------------- | ------------ |
| `pending`        | Chờ xử lý     | Vàng amber   |
| `under_review`   | Đang xem xét  | Tím indigo   |
| `approved`       | Đã duyệt      | Xanh lá      |
| `rejected`       | Từ chối       | Đỏ           |
| `in_progress`    | Đang xử lý    | Xanh dương   |
| `resolved`       | Đã giải quyết | Xanh emerald |
| `cancelled`      | Đã huỷ        | Xám          |
| _(customer hủy)_ | Bạn đã rút    | Tím purple   |

### 4.1 Tạo Khiếu Nại

**Đường dẫn:** `/complaints/new` hoặc từ `/profile` → tab "Khiếu nại" → **"+ Tạo khiếu nại mới"**

**Các bước:**

1. **Chọn sản phẩm:** Dropdown chỉ hiển thị đơn đã giao (delivered). Pre-order có tag `[Pre-order]`. Format: `{TênKính} {Màu} — Đơn #{MãĐơn}`
2. **Chọn loại:** 5 nút: Khiếu nại | Trả hàng | Đổi hàng | Hoàn tiền | Bảo hành
3. **Nhập lý do:** Textarea mô tả chi tiết
4. **Upload hình ảnh** (tùy chọn):
   - **Upload trực tiếp:** Gọi `POST /api/Complaints/upload-image` → Cloudinary. Tối đa 10MB/ảnh. Định dạng: jpg, jpeg, png, gif, webp
   - **Dán URL:** Nhập URL hình ảnh bên ngoài
   - Nhiều ảnh lưu cách nhau bằng dấu phẩy
5. Nhấn **"Gửi"** → `POST /api/Complaints`

**Quy tắc backend:**

- Sản phẩm phải thuộc đơn hàng của user
- Đơn phải ở trạng thái `delivered`
- Trong vòng **14 ngày** từ `DeliveryConfirmedAt` hoặc `DeliveredAt`
- Tự động đặt `status = "pending"`

### 4.2 Chi Tiết & Theo Dõi Khiếu Nại

**Đường dẫn:** `/complaints/:id`

**Hiển thị:**

- Mã khiếu nại (8 ký tự đầu), Badge loại, Badge trạng thái
- **Thanh tiến trình 5 bước** (nhãn tùy theo loại — xem bên dưới)
- Thẻ sản phẩm gốc: ảnh, tên, giá, số lượng
- Lý do (giữ nguyên xuống dòng)
- Gallery ảnh (click để xem lớn)
- Ghi chú nhân viên (nếu có)
- **Thông tin riêng theo loại** (tracking, hoàn tiền, đổi hàng — xem mục 4.5–4.8)

**Nút theo trạng thái:**

| Nút                 | pending | under_review | approved | in_progress | Kết thúc |
| ------------------- | ------- | ------------ | -------- | ----------- | -------- |
| **"Chỉnh sửa"**     | Co      | —            | —        | —           | —        |
| **"Rút khiếu nại"** | Co      | Co           | Co       | —           | —        |
| Nút riêng theo loại | —       | —            | Co       | Co          | —        |

### 4.3 Chỉnh Sửa Khiếu Nại

**Đường dẫn:** `/complaints/:id/edit`

**Điều kiện:** Chỉ khi `status = "pending"` và là chủ khiếu nại.

**Có thể sửa:**

- Loại khiếu nại (đổi nút)
- Lý do (textarea)
- URL hình ảnh (nhập thủ công — không upload mới trong chế độ sửa)

Nhấn **"Lưu"** → `PUT /api/Complaints/{id}` → quay về trang chi tiết.

### 4.4 Rút Khiếu Nại

**Nút:** "Rút khiếu nại" (đỏ)

**Có thể rút khi:** `pending`, `under_review`, `approved`

**Hành động:** `PUT /api/Complaints/{id}/cancel` → đặt `status = "cancelled"`, `CancelledByCustomer = true`

**Hiển thị:** Badge tím "Bạn đã rút" thay vì xám "Đã huỷ"

### 4.5 Luồng Đổi Hàng (Exchange) — Xuyên Vai Trò

> Đây là luồng phức tạp nhất, đòi hỏi tương tác qua lại giữa Customer và Staff/Manager.

**Thanh tiến trình 5 bước:**

1. Gửi yêu cầu đổi hàng
2. Nhân viên xem xét yêu cầu
3. Yêu cầu được duyệt — Chọn sản phẩm thay thế
4. Đang xử lý đổi hàng — Gửi trả sản phẩm cũ
5. Hoàn tất đổi hàng

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LUỒNG ĐỔI HÀNG CHI TIẾT                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  KHÁCH HÀNG                    HỆ THỐNG              NHÂN VIÊN/QL      │
│  ──────────                    ────────              ────────────       │
│                                                                         │
│  ① Tạo khiếu nại              status = pending                         │
│     loại "Đổi hàng"                                                    │
│         │                                                               │
│         ▼                                                               │
│                                                      ② Nhận khiếu nại  │
│                                                      Nhấn "Xử lý"      │
│                                                      Chuyển: under_review│
│         │                                                               │
│         ▼                                                               │
│                                                      ③ Xem xét xong    │
│                                                      Chuyển: approved   │
│         │                                                               │
│         ▼                                                               │
│  ④ Thấy trạng thái "Đã duyệt"                                         │
│     Nhấn "Chọn sản phẩm thay thế →"                                   │
│     → Mở trang ExchangeSelect                                          │
│         │                                                               │
│         ▼                                                               │
│  ⑤ Chọn gọng kính mới:                                                │
│     - Tìm/chọn sản phẩm                                               │
│     - Chọn màu sắc                                                     │
│     - Cấu hình tròng kính                                              │
│     - Xem so sánh giá:                                                 │
│       · Nâng cấp → "Bạn cần trả thêm +₫..."                          │
│       · Hạ cấp → "Bạn được hoàn lại -₫..."                            │
│       · Bằng giá → "Giá tương đương"                                   │
│     - Nhập địa chỉ giao hàng                                          │
│     - Nhấn "Xác nhận đổi hàng"                                        │
│         │                                                               │
│         ▼                                                               │
│                                Tạo đơn đổi hàng mới                    │
│                                (Exchange Order)                         │
│                                status = "confirmed"                     │
│         │                                                               │
│         ▼                                                               │
│                                                      ⑥ Thấy "Khách đã  │
│                                                      chọn sản phẩm      │
│                                                      thay thế"          │
│                                                      Chuyển: in_progress │
│         │                                                               │
│         ▼                                                               │
│                                                      ⑦ Xử lý đơn đổi   │
│                                                      (giao hàng mới,    │
│                                                       nhận hàng cũ)     │
│                                                          │              │
│                                                          ▼              │
│                                                      ⑧ Đơn đổi         │
│                                                      delivered →         │
│                                                      Chuyển: resolved   │
│         │                                                               │
│         ▼                                                               │
│  ⑨ Thấy "Đã giải quyết"                                               │
│     Nhận sản phẩm mới                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Trang ExchangeSelect** (`/complaints/:id/exchange`):

1. Hiển thị sản phẩm gốc (tên, giá, số lượng)
2. Grid tất cả sản phẩm + thanh tìm kiếm
3. Click chọn → viền xanh + checkmark
4. **Chọn màu:** Hiện các màu có sẵn, disabled nếu hết hàng
5. **Cấu hình tròng kính:** Nhấn "Cấu hình tròng kính" → mở LensSelectionModal
6. **Banner so sánh giá:**

   | Trường hợp | Thông báo                              |
   | ---------- | -------------------------------------- |
   | Mới > Cũ   | "Nâng cấp — Bạn cần trả thêm **+₫XX**" |
   | Mới < Cũ   | "Hạ cấp — Bạn được hoàn lại **-₫XX**"  |
   | Bằng nhau  | "Giá tương đương"                      |

7. **Thông tin giao hàng:** Họ tên, SĐT, Địa chỉ (tự điền từ profile)
8. **Số lượng:** Mặc định 1, tối đa = tồn kho màu đã chọn
9. Nhấn **"Xác nhận đổi hàng"** → `POST /api/Complaints/{id}/create-exchange-order`

**Quy tắc đặc biệt:**

- Staff **không thể** chuyển sang `in_progress` nếu khách chưa chọn sản phẩm thay thế
- Staff **không thể** chuyển sang `resolved` nếu đơn đổi hàng chưa ở trạng thái `delivered`

### 4.6 Luồng Trả Hàng (Return) — Xuyên Vai Trò

**Thanh tiến trình 5 bước:**

1. Gửi yêu cầu trả hàng
2. Nhân viên xem xét yêu cầu
3. Yêu cầu được duyệt — Chờ hướng dẫn trả hàng
4. Gửi trả sản phẩm — Chờ hoàn tiền
5. Hoàn tất trả hàng & hoàn tiền

```
KHÁCH HÀNG                              NHÂN VIÊN/QL
──────────                              ────────────

① Tạo khiếu nại "Trả hàng"
   status = pending
                                         ② Xử lý → under_review
                                         ③ Duyệt → approved

④ Thấy "Đã duyệt"
   Thông báo: "Vui lòng chờ nhân viên
   cung cấp mã vận đơn trả hàng"
                                         ⑤ Nhập mã vận đơn trả hàng
                                            (PUT .../return-tracking)
                                            Chuyển → in_progress

⑥ Thấy "Đang xử lý"
   Hiển thị: "Mã vận đơn trả hàng: XXX"
   Gửi sản phẩm theo mã vận đơn
                                         ⑦ Nhận hàng trả
                                            Nhập số tiền hoàn
                                            (PUT .../process-refund)

⑧ Thấy: "Số tiền sẽ hoàn: ₫XXX"
   "Nhân viên sẽ liên hệ qua SĐT/email
   để hỗ trợ hoàn tiền"
                                         ⑨ Chuyển → resolved

⑩ Thấy "Đã giải quyết"
   Nhận hoàn tiền
```

**Xử lý phía Admin (tuần tự — phải hoàn thành theo thứ tự):**

1. **Nhập mã vận đơn** → Nhấn "Cập nhật"
2. **Nhập số tiền hoàn** → Nhấn "Hoàn tiền" (chỉ sau khi đã có mã vận đơn)
3. **Cập nhật trạng thái** → Chọn trạng thái tiếp theo (chỉ sau khi hoàn thành cả hai)

### 4.7 Luồng Hoàn Tiền (Refund) — Xuyên Vai Trò

**Thanh tiến trình 5 bước:**

1. Gửi yêu cầu hoàn tiền
2. Nhân viên xem xét yêu cầu
3. Yêu cầu được duyệt
4. Đang xử lý hoàn tiền
5. Hoàn tiền thành công

```
KHÁCH HÀNG                              NHÂN VIÊN/QL
──────────                              ────────────

① Tạo khiếu nại "Hoàn tiền"
   status = pending
                                         ② Xử lý → under_review
                                         ③ Duyệt → approved

④ Thấy "Đã duyệt"
   "Yêu cầu đã được duyệt. Nhân viên
   sẽ xử lý hoàn tiền sớm nhất."
                                         ⑤ Nhập số tiền hoàn
                                            (PUT .../process-refund)
                                            Chuyển → in_progress

⑥ Thấy "Đang xử lý hoàn tiền..."
   Số tiền hoàn hiển thị (lớn, màu xanh)
                                         ⑦ Chuyển → resolved

⑧ Thấy "Đã giải quyết"
   "Đã hoàn tiền ngày DD/MM/YYYY"
```

### 4.8 Luồng Bảo Hành (Warranty) — Xuyên Vai Trò

**Thanh tiến trình 5 bước:**

1. Gửi yêu cầu bảo hành
2. Nhân viên xem xét yêu cầu
3. Yêu cầu được duyệt — Chờ hướng dẫn gửi hàng
4. Đang sửa chữa / thay thế sản phẩm
5. Hoàn tất bảo hành

```
KHÁCH HÀNG                              NHÂN VIÊN/QL
──────────                              ────────────

① Tạo khiếu nại "Bảo hành"
   status = pending
                                         ② Xử lý → under_review
                                         ③ Duyệt → approved

④ Thấy "Đã duyệt"
   "Vui lòng chờ nhân viên cung cấp
   mã vận đơn để gửi sản phẩm"
                                         ⑤ Nhập mã vận đơn gửi bảo hành
                                            (PUT .../return-tracking)
                                            Chuyển → in_progress

⑥ Thấy "Đang xử lý"
   "Mã vận đơn gửi bảo hành: XXX"
   "Hãy gửi sản phẩm về trung tâm
   bảo hành theo mã vận đơn phía trên."
                                         ⑦ Sửa chữa / thay thế xong
                                            Chuyển → resolved

⑧ Thấy "Đã giải quyết"
   Nhận sản phẩm đã bảo hành
```

---

## 5. Luồng Đơn Hàng Xuyên Vai Trò

### 5.1 Đơn Hàng Thường — Từ Đặt Đến Giao

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     VÒNG ĐỜI ĐƠN HÀNG THƯỜNG                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  KHÁCH HÀNG          HỆ THỐNG              STAFF/MANAGER                │
│  ──────────          ────────              ────────────                  │
│                                                                          │
│  ① Duyệt sản phẩm                                                      │
│  ② Thêm vào giỏ                                                        │
│  ③ Checkout                                                             │
│     (COD hoặc VNPay)                                                    │
│         │                                                                │
│         ▼                                                                │
│                      Tạo đơn hàng                                        │
│                      status = "pending"                                  │
│                      (Chờ xác nhận)                                      │
│                           │                                              │
│  ④ Xem OrderHistory      │         ⑤ Admin > Đơn hàng                  │
│     thấy "Chờ xác nhận"  │            Nhấn "Xác Nhận"                  │
│                           ▼            status → "confirmed"              │
│                                        (Đã xác nhận)                    │
│                           │                                              │
│  ⑥ Timeline cập nhật     │         ⑦ Nhấn "Xử Lý"                     │
│     bước 2 sáng lên      │            status → "processing"             │
│                           ▼            (Đang xử lý)                     │
│                                                                          │
│                                     ⑧ Admin > Vận Chuyển               │
│                                        Tab "Chờ giao"                   │
│                                        Chọn 1 trong 2:                  │
│                                        a) "Tạo vận đơn J&T"            │
│                                           → Modal GoShip               │
│                                           → Chọn giá cước             │
│                                           → Tự gán tracking            │
│                                        b) "Nhập mã"                    │
│                                           → Chọn hãng VC              │
│                                           → Nhập mã vận đơn           │
│                                                                          │
│                                        status → "shipped"               │
│                           │            (Đang giao hàng)                 │
│                           ▼                                              │
│  ⑨ Timeline bước 4       │                                              │
│     Thanh tracking hiện:  │                                              │
│     "J&T Express"         │                                              │
│     Mã: "JTxxxxxxxx"     │                                              │
│     Nút "Theo dõi" →     │                                              │
│     Bản đồ DeliveryMap   │                                              │
│                           │                                              │
│                           │         ⑩ Admin > Vận Chuyển               │
│                           │            Tab "Đang vận chuyển"            │
│                           │            Nhấn "Đã giao"                   │
│                           ▼            status → "delivered"              │
│                                        (Đã giao hàng)                   │
│                           │                                              │
│  ⑪ Thấy "Đã giao"       │                                              │
│     Nhấn "Đã nhận hàng"  │                                              │
│     (xác nhận nhận hàng)  │                                              │
│         │                                                                │
│         ▼                                                                │
│  ⑫ Đơn hoàn thành                                                      │
│     Có thể tạo khiếu nại                                               │
│     trong 14 ngày                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Hủy đơn:** Khách hàng có thể nhấn **"Hủy đơn hàng"** khi đơn ở trạng thái `pending`. Staff/Manager có thể hủy từ bất kỳ trạng thái nào chưa kết thúc.

### 5.2 Đơn Pre-order — Từ Chiến Dịch Đến Giao Hàng

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     VÒNG ĐỜI ĐƠN PRE-ORDER                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MANAGER                                KHÁCH HÀNG                       │
│  ───────                                ──────────                       │
│                                                                          │
│  ① Tạo Chiến Dịch Pre-order                                            │
│     - Chọn sản phẩm hết hàng                                           │
│     - Đặt giá ưu đãi                                                   │
│     - Đặt ngày bắt đầu/kết thúc                                        │
│     - Đặt tổng suất (maxSlots)                                         │
│     - Đặt ngày giao dự kiến                                            │
│         │                                                                │
│         ▼                                                                │
│                                         ② Thấy sản phẩm có             │
│                                            badge "Ưu đãi đặt trước"     │
│                                            Giá hiển thị xanh dương       │
│                                                                          │
│                                         ③ Thêm vào giỏ                  │
│                                            → Giỏ hiển thị "Pre-order"    │
│                                                                          │
│                                         ④ Checkout Pre-order             │
│                                            (Bắt buộc VNPay)             │
│                                            → Thanh toán VNPay           │
│         │                                                                │
│         ▼                                                                │
│                              Tạo đơn pre-order                           │
│                              status = "pending"                          │
│                              (Chờ xác nhận)                              │
│                                   │                                      │
│  ⑤ Admin > Đơn hàng              │     ⑥ Xem PreorderDetail             │
│     Tab "Pre-orders"              │        thấy "Chờ xác nhận"           │
│     Nhấn "Xác Nhận"              │                                      │
│     status → "confirmed"          │                                      │
│         │                         │                                      │
│         ▼                         │                                      │
│                              VNPay đã thanh toán                         │
│                              status → "paid"                             │
│                              (Đã thanh toán)                             │
│                                   │                                      │
│  ⑦ Khi hàng sẵn sàng            │     ⑧ PreorderDetail                 │
│     Admin > Đơn hàng              │        thấy "Đã thanh toán"          │
│     Nhấn "Chuyển Đổi"            │                                      │
│     (Convert to Order)            │                                      │
│         │                         │                                      │
│         ▼                         │                                      │
│                              Hệ thống tạo đơn hàng mới                  │
│                              Pre-order status → "converted"              │
│                              Đơn mới status = "processing"               │
│                                   │                                      │
│                                   │     ⑨ PreorderDetail cập nhật       │
│                                   │        Hiện timeline 8 bước          │
│                                   │        Hiện tracking & bản đồ       │
│                                   │        (từ linkedOrder)              │
│                                   │                                      │
│  ⑩ Staff xử lý đơn mới                                                 │
│     như đơn thường:                                                      │
│     Gán vận đơn → Shipped                                               │
│     → Delivered                   │                                      │
│                                   │     ⑪ Khách xác nhận nhận hàng     │
│                                   │                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Dừng khẩn cấp:** Manager có thể nhấn **"Dừng Khẩn Cấp"** trên chiến dịch đang chạy → `PATCH /api/PreorderCampaigns/{id}/end`

---

## 6. Trang Quản Trị (Admin Panel)

### Truy cập

- **URL:** `/admin`
- **Điều kiện:** Vai trò phải là `staff`, `manager`, hoặc `admin`
- **Manager/Admin:** Thấy nút **"Admin"** trên header
- **Staff:** Phải truy cập trực tiếp qua URL `/admin`

### Sidebar (Thanh điều hướng trái)

| Menu                    | Đường dẫn             | Quyền         |
| ----------------------- | --------------------- | ------------- |
| Về Trang Chủ            | `/`                   | Tất cả        |
| Tổng quan               | `/admin`              | Tất cả        |
| Quản lý Kính            | `/admin/products`     | Tất cả        |
| Quản lý Tròng Kính      | `/admin/lenstypes`    | Tất cả        |
| Quản lý Tính Năng Tròng | `/admin/lensfeatures` | Tất cả        |
| Đơn hàng                | `/admin/orders`       | Tất cả        |
| Chiến Dịch Pre-order    | `/admin/campaigns`    | Tất cả        |
| Khiếu nại               | `/admin/complaints`   | Tất cả        |
| Vận Chuyển              | `/admin/shipping`     | Tất cả        |
| Quản lý Người Dùng      | `/admin/users`        | Manager/Admin |

> Nút **"Thoát Admin"** gọi `logout()` và chuyển về `/login`

### 6.1 Tổng Quan Kinh Doanh (Dashboard)

**Quyền:** Manager, Admin

**5 thẻ tổng hợp:**

| Thẻ                     | Nội dung                       |
| ----------------------- | ------------------------------ |
| **Doanh Thu**           | Tổng doanh thu (định dạng VND) |
| **Đơn Hàng**            | Tổng số đơn hàng               |
| **Kính Đã Bán**         | Tổng số gọng kính đã bán       |
| **Khách Mới (30 ngày)** | Khách hàng mới trong 30 ngày   |
| **Sản Phẩm**            | Tổng số sản phẩm               |

**Bộ lọc thời gian:**

- Từ ngày → Đến ngày (date picker)
- Năm (cho biểu đồ tháng): 2023–2026
- Nút **"Lọc Dữ Liệu"**

**Biểu đồ:**

| Biểu đồ              | Loại               | Mô tả                                           |
| -------------------- | ------------------ | ----------------------------------------------- |
| Doanh Thu Theo Ngày  | Line Chart         | Doanh thu hàng ngày trong khoảng thời gian      |
| Doanh Thu Theo Tháng | Bar Chart          | Doanh thu 12 tháng của năm đã chọn              |
| Top 10 Bán Chạy      | Danh sách xếp hạng | Top 10 sản phẩm bán chạy nhất (top 3 highlight) |
| Trạng Thái Đơn Hàng  | Donut Pie Chart    | Phân bố đơn hàng theo trạng thái                |

### 6.2 Quản Lý Sản Phẩm (Kính)

**Quyền:** Manager

**Bảng hiển thị:**

| Cột            | Nội dung                                  |
| -------------- | ----------------------------------------- |
| Hình Ảnh       | Ảnh đầu tiên (50×50px)                    |
| Tên SP         | `frameName` (bold)                        |
| Thương Hiệu    | `brandName`                               |
| Giá Gốc ($)    | `basePrice`                               |
| Tình Trạng Tồn | Badge "Còn hàng" (xanh) / "Hết hàng" (đỏ) |
| Kích Cỡ        | `size`                                    |
| Chất Liệu      | `materialName`                            |
| Hành Động      | Sửa, Xóa                                  |

**Tạo / Sửa sản phẩm (Modal đầy đủ):**

| Section               | Trường                                                                                               | Chi tiết                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Thông tin cơ bản**  | Tên sản phẩm (_), Thương hiệu (_), Chất liệu (_), Kiểu dáng (_), Kích cỡ (_), Giá gốc ($) (_), Mô tả | Dropdown cho Brand/Material/Shape (có nút + tạo mới nhanh)           |
| **Biến thể màu sắc**  | Danh sách màu, mỗi màu có: Màu (_), Số lượng tồn kho (_)                                             | Nút "Thêm màu", có thể xóa từng màu. Dropdown Color có nút + tạo mới |
| **Ảnh sản phẩm**      | Upload ảnh theo từng biến thể màu                                                                    | Chọn tab màu → Upload ảnh → Xem gallery → Xóa từng ảnh               |
| **Thông số kỹ thuật** | Rộng tròng, Cầu kính, Càng kính, Rộng khung (mm)                                                     | Tất cả > 0                                                           |
| **Phạm vi Rx & PD**   | Min/Max Rx, Min/Max PD                                                                               | Cho kính có độ                                                       |
| **Tròng kính hỗ trợ** | Checkbox chọn loại tròng tương thích                                                                 | Từ danh sách LensTypes                                               |

**Quản lý nhanh Brand, Material, Shape, Color:**

- Ở form tạo/sửa sản phẩm, mỗi dropdown có nút **"+"** để tạo mới nhanh
- Hoặc quản lý riêng qua các trang CRUD tương ứng

### 6.3 Quản Lý Loại Tròng Kính

**Đường dẫn:** `/admin/lenstypes`  
**Quyền:** Manager

**Bảng:**

| Cột                  | Nội dung                                         |
| -------------------- | ------------------------------------------------ |
| Thông số / Tên Tròng | `lensSpecification` (VD: "Tròng chống lóa 1.56") |
| Yêu cầu Toa Thuốc    | "Bắt buộc có toa" (xanh) / "Không cần toa"       |
| Giá Cơ Bản ($)       | `basePrice`                                      |
| Hành Động            | Sửa, Xóa                                         |

**Modal Tạo/Sửa ("Thêm Loại Tròng" / "Sửa Loại Tròng"):**

- Tên / Thông số tròng (text, bắt buộc)
- Giá Cơ Bản $ (number, ≥ 0)
- Checkbox: "Loại tròng này bắt buộc khách phải nhập độ cận/viễn (Có toa thuốc)"
- Nút: **"Hủy"** | **"Lưu Thông Tin"**

### 6.4 Quản Lý Tính Năng Tròng

**Đường dẫn:** `/admin/lensfeatures`  
**Quyền:** Manager

**Bảng:**

| Cột                | Nội dung               |
| ------------------ | ---------------------- |
| Thông số Tính Năng | `featureSpecification` |
| Giá Phụ Thu ($)    | `extraPrice`           |
| Hành Động          | Sửa, Xóa               |

**Modal Tạo/Sửa ("Thêm Tính Năng Tròng" / "Sửa Tính Năng Tròng"):**

- Tên Tính Năng (text, bắt buộc)
- Giá Phụ Thu $ (number, ≥ 0)
- Nút: **"Hủy"** | **"Lưu Thông Tin"**

**Xóa:** Xác nhận "Bạn có chắc chắn muốn xóa tính năng tròng này vĩnh viễn?" — lỗi nếu đang sử dụng: "Xóa thất bại: Đang được sử dụng"

### 6.5 Quản Lý Đơn Hàng

**Đường dẫn:** `/admin/orders`  
**Quyền:** Staff, Manager, Admin

**Hai tab chính:**

| Tab                 | Nội dung               |
| ------------------- | ---------------------- |
| **Đơn hàng thường** | Tất cả đơn hàng thường |
| **Pre-orders**      | Tất cả đơn đặt trước   |

**Bảng đơn thường:**

| Cột        | Nội dung                                  |
| ---------- | ----------------------------------------- |
| Mã Đơn     | #[8 ký tự đầu]                            |
| Khách hàng | Tên + Email                               |
| Ngày đặt   | Định dạng vi-VN                           |
| Tổng tiền  | USD                                       |
| Trạng thái | Badge màu                                 |
| Thanh toán | "Đã thanh toán" / "Chưa TT" + Phương thức |
| Thao tác   | Dropdown trạng thái + "Xem chi tiết"      |

**Chuyển trạng thái đơn thường:**

| Từ trạng thái | Chuyển được đến       |
| ------------- | --------------------- |
| pending       | confirmed, cancelled  |
| confirmed     | processing, cancelled |
| processing    | shipped, cancelled    |
| shipped       | delivered, cancelled  |
| delivered     | _(kết thúc)_          |
| cancelled     | _(kết thúc)_          |

**Bảng pre-order:**

| Cột                 | Nội dung bổ sung |
| ------------------- | ---------------- |
| Tương tự đơn thường | + Tên chiến dịch |

**Chuyển trạng thái pre-order:**

| Từ trạng thái | Chuyển được đến               |
| ------------- | ----------------------------- |
| pending       | confirmed, cancelled          |
| confirmed     | paid, cancelled               |
| paid          | converted, cancelled          |
| converted     | _(kết thúc — đơn mới đã tạo)_ |

**Nút "Chuyển Đổi" (Convert):** Khi pre-order ở trạng thái `paid`:

- Nhấn → Hệ thống tạo đơn hàng thường mới
- Pre-order: status → `converted`
- Đơn mới: status = `processing`
- Đơn mới xuất hiện ở tab "Đơn hàng thường" → tiếp tục xử lý giao hàng

**Modal chi tiết đơn hàng:**

- Thông tin khách hàng: Tên, Email, SĐT
- Địa chỉ giao hàng
- Danh sách sản phẩm: ảnh, tên, màu, số lượng, giá, cấu hình tròng, toa thuốc
- Tổng tiền, Phương thức thanh toán, Trạng thái thanh toán

### 6.6 Quản Lý Chiến Dịch Pre-order

**Đường dẫn:** `/admin/campaigns`  
**Quyền:** Manager

**Bảng chiến dịch:**

| Cột             | Nội dung                                     |
| --------------- | -------------------------------------------- |
| Tên Chiến Dịch  | Tên (bold) + "Gồm X sản phẩm" (xám)          |
| Thời gian chạy  | Bắt đầu (xanh) + Kết thúc (đỏ)               |
| Ngày giao       | `estimatedDeliveryDate` (xanh bold)          |
| Số Suất (Slots) | `currentSlots / maxSlots` (đỏ nếu hết)       |
| Trạng thái      | "Chưa bắt đầu" / "Đang chạy" / "Đã kết thúc" |
| Hành Động       | Sửa, Dừng Khẩn Cấp                           |

**Trạng thái tự xác định:**

- `now ≥ startDate && now ≤ endDate` → "Đang chạy"
- `now > endDate` → "Đã kết thúc"
- Chưa đến ngày → "Chưa bắt đầu"

**Tạo chiến dịch ("Tạo Chiến Dịch Mới"):**

| Phần              | Trường                                                                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thông tin**     | Tên Chiến Dịch (_), Tổng Số Suất (_) (mặc định 100), Ngày Bắt Đầu (_) (viền xanh), Ngày Kết Thúc (_) (viền đỏ), Ngày Dự Kiến Giao Hàng (\*) (viền xanh dương nét đứt) |
| **Chọn sản phẩm** | Danh sách sản phẩm hết hàng (scrollable), checkbox chọn, mỗi sản phẩm: Giá KM Pre-order ($) + Giới hạn Mua/Đơn                                                        |

**Validation:** Ít nhất 1 sản phẩm, startDate < endDate, tất cả ngày phải có

**Nút:** **"Hủy Bỏ"** | **"Chạy Chiến Dịch Ngay"**

**Sửa chiến dịch ("Cập Nhật Chiến Dịch"):**

- Chỉ sửa được: Tên, Mô tả, Số Suất, Ngày Giao — _"Không thể sửa ngày bắt đầu/kết thúc và danh sách sản phẩm..."_

**Dừng Khẩn Cấp:** Xác nhận "Bạn có chắc chắn muốn KẾT THÚC SỚM chiến dịch này?" → `PATCH /api/PreorderCampaigns/{id}/end`

### 6.7 Quản Lý Người Dùng

**Đường dẫn:** `/admin/users`  
**Quyền:** Manager, Admin

**Bảng:**

| Cột        | Nội dung                                          |
| ---------- | ------------------------------------------------- |
| Họ Tên     | `fullName`                                        |
| Email      | `email`                                           |
| SĐT        | `phone`                                           |
| Vai Trò    | Dropdown: customer / staff / manager / admin      |
| Trạng Thái | Dropdown: active / pending / inactive / suspended |
| Ngày Tạo   | Định dạng vi-VN                                   |

**Đổi vai trò:**

1. Chọn vai trò mới trong dropdown
2. Xác nhận: "Bạn có chắc muốn đổi vai trò sang {role}?"
3. `PUT /api/Users/{id}/role`

**Đổi trạng thái:**

1. Chọn trạng thái mới trong dropdown
2. `PUT /api/Users/{id}/status`

**Lưu ý:** Không thể thay đổi vai trò của chính mình.

### 6.8 Quản Lý Khiếu Nại

**Đường dẫn:** `/admin/complaints`  
**Quyền:** Staff, Manager, Admin

**Tab lọc trạng thái:**
Tất cả | Chờ xử lý | Đang xem xét | Đã duyệt | Đang xử lý | Đã giải quyết | Từ chối | Đã huỷ

**Bảng:**

| Cột        | Nội dung                                                      |
| ---------- | ------------------------------------------------------------- |
| Mã         | #[8 ký tự]                                                    |
| Khách hàng | Tên (bold) + SĐT (xám)                                        |
| Loại       | Badge: Trả hàng / Đổi hàng / Hoàn tiền / Khiếu nại / Bảo hành |
| Lý do      | 60 ký tự đầu + thumbnails ảnh                                 |
| Trạng thái | Badge màu                                                     |
| Ngày tạo   | Định dạng vi-VN                                               |
| Thao tác   | Nút "Xử lý" (nếu có chuyển đổi hợp lệ)                        |

**Modal "Xử lý" — Chi tiết theo loại:**

**Phần chung:**

- Header: Mã, Loại, Trạng thái hiện tại
- Lý do: 100 ký tự đầu
- Ảnh bằng chứng (nếu có): Grid 100×100px, click mở tab mới

**Cho "Đổi hàng" (Exchange):**

- Hiển thị thông tin đơn đổi (nếu khách đã chọn sản phẩm mới):
  - Mã đơn đổi, Trạng thái, Địa chỉ giao
  - Danh sách sản phẩm thay thế, Tổng đơn đổi
- Nếu chưa chọn: "Khách hàng chưa chọn sản phẩm thay thế — Không thể chuyển sang Đang xử lý"

**Cho "Trả hàng" (Return) — Xử lý tuần tự:**

1. **Mã vận đơn trả hàng:** Input + Nút "Cập nhật" → `PUT .../return-tracking`
2. **Xử lý hoàn tiền:** Input số tiền + Nút "Hoàn tiền" → `PUT .../process-refund` _(chỉ sau bước 1)_
3. **Cập nhật trạng thái:** Dropdown + Nút "Cập nhật" _(chỉ sau bước 1 & 2)_

**Cho "Hoàn tiền" (Refund) — Xử lý tuần tự:**

1. **Xử lý hoàn tiền:** Input số tiền + Nút "Hoàn tiền"
2. **Cập nhật trạng thái:** Dropdown _(chỉ sau bước 1)_

**Cho "Bảo hành" (Warranty) — Xử lý tuần tự:**

1. **Mã vận đơn gửi bảo hành:** Input + Nút "Cập nhật"
2. **Cập nhật trạng thái:** Dropdown _(chỉ sau bước 1)_

**Cho "Khiếu nại" (Complaint) chung:**

- Chỉ có dropdown cập nhật trạng thái + Ghi chú nhân viên

**Ghi chú nhân viên:** Textarea nội bộ (không bắt buộc)

### 6.9 Quản Lý Vận Chuyển (Shipping)

**Đường dẫn:** `/admin/shipping`  
**Quyền:** Staff, Manager, Admin

**4 thẻ tổng hợp:**

| Thẻ       | Biểu tượng | Nội dung          |
| --------- | ---------- | ----------------- |
| Chờ giao  | Tím        | Số đơn processing |
| Đang giao | Cyan       | Số đơn shipped    |
| Đã giao   | Xanh lá    | Số đơn delivered  |
| Tổng đơn  | Xám        | Tổng tất cả       |

**4 tab:**

| Tab                     | Hiển thị                |
| ----------------------- | ----------------------- |
| **Chờ giao** (mặc định) | Đơn status = processing |
| **Đang vận chuyển**     | Đơn status = shipped    |
| **Đã giao**             | Đơn status = delivered  |
| **Tất cả**              | Tất cả đơn              |

**Bảng vận chuyển:**

| Cột          | Nội dung                                                                         |
| ------------ | -------------------------------------------------------------------------------- |
| Mã Đơn       | #[8 ký tự], badge "Pre-order" nếu convertedFromPreorderId                        |
| Khách Hàng   | Tên (bold) + SĐT (xám)                                                           |
| Địa Chỉ Giao | Địa chỉ (multiline)                                                              |
| Vận Chuyển   | Badge: "Nhanh" (vàng) / "Tiêu chuẩn" (xanh)                                      |
| Trạng Thái   | Badge trạng thái                                                                 |
| Mã Vận Đơn   | Tên hãng + Badge mã + Link "Theo dõi" → trang tracking J&T. Hoặc "Chưa có" (xám) |
| Dự Kiến Giao | Ngày dự kiến (xanh bold)                                                         |
| Thao Tác     | Nút hành động (xem dưới)                                                         |

**Nút hành động theo trạng thái:**

| Status     | Nút                                   |
| ---------- | ------------------------------------- |
| processing | **"Tạo vận đơn J&T"** + **"Nhập mã"** |
| shipped    | **"Đã giao"**                         |
| delivered  | _(không có)_                          |

**Tạo vận đơn J&T (GoShip Integration) — 3 bước:**

**Bước 1: Địa chỉ & Kiện hàng**

- Tên người nhận (tự điền từ đơn)
- Số điện thoại (tự điền)
- Địa chỉ (tự điền)
- Tỉnh/Thành phố → Quận/Huyện → Phường/Xã (dropdown cascade)
- Cân nặng (gram, mặc định 500), COD (VND, mặc định 0), Dài/Rộng/Cao (cm)
- Nút **"Lấy giá cước J&T →"**

**Bước 2: Chọn giá cước**

- Hiển thị các mức giá J&T Express
- Mỗi mức: Tên hãng, Loại dịch vụ, Thời gian giao, Giá (VND)
- Nút **"Tạo vận đơn J&T →"**

**Bước 3: Đang tạo...**

- "Đang tạo vận đơn J&T Express... Vui lòng chờ, hệ thống đang liên hệ GoShip."
- Thành công → đóng modal, cập nhật tracking, chuyển status → shipped

**Nhập mã thủ công:**

- Modal "Nhập Mã Vận Đơn Thủ Công"
- Hãng vận chuyển: Dropdown (J&T Express)
- Mã vận đơn: Text input
- Nút **"Xác Nhận"** → `PATCH /api/Shipping/orders/{id}/tracking` + status → shipped

**Kho hàng (Pre-set):** Spectra Glasses Warehouse, 123 Nguyễn Văn Linh, HCM

---

## 7. Bảng Trạng Thái & Chuyển Đổi

### Đơn hàng thường

```
pending ──→ confirmed ──→ processing ──→ shipped ──→ delivered
  │            │              │             │
  └──→ cancelled  cancelled   cancelled     cancelled
```

| Trạng thái | Tiếng Việt     | Mã màu     |
| ---------- | -------------- | ---------- |
| pending    | Chờ xác nhận   | Vàng       |
| confirmed  | Đã xác nhận    | Xanh dương |
| processing | Đang xử lý     | Cam        |
| shipped    | Đang giao hàng | Tím        |
| delivered  | Hoàn thành     | Xanh lá    |
| cancelled  | Đã huỷ         | Đỏ         |

### Đơn Pre-order

```
pending ──→ confirmed ──→ paid ──→ converted
  │            │           │
  └──→ cancelled  cancelled  cancelled
```

| Trạng thái | Tiếng Việt                                 |
| ---------- | ------------------------------------------ |
| pending    | Chờ xác nhận                               |
| confirmed  | Đã xác nhận                                |
| paid       | Đã thanh toán                              |
| converted  | Đang xử lý (đã chuyển đổi sang đơn thường) |

### Khiếu nại

```
pending ──→ under_review ──┬──→ approved ──→ in_progress ──→ resolved
  │            │            │       │            │
  │            │            └──→ rejected     cancelled
  └── cancel   └── cancel         │
                                 cancel
```

---

## 8. Phân Quyền Theo Vai Trò

### Tóm tắt quyền truy cập

| Chức năng                         | Customer | Staff | Manager | Admin |
| --------------------------------- | -------- | ----- | ------- | ----- |
| Duyệt/Mua sản phẩm                | O        | —     | —       | —     |
| Đặt pre-order                     | O        | —     | —       | —     |
| Xem đơn hàng của mình             | O        | —     | —       | —     |
| Xác nhận nhận hàng                | O        | —     | —       | —     |
| Hủy đơn (pending)                 | O        | —     | —       | —     |
| Tạo/Sửa/Rút khiếu nại             | O        | —     | —       | —     |
| Chọn sản phẩm đổi hàng            | O        | —     | —       | —     |
| Quản lý toa thuốc                 | O        | —     | —       | —     |
| Dashboard thống kê                | —        | —     | O       | O     |
| CRUD Sản phẩm (Kính)              | —        | —     | O       | —     |
| CRUD Loại tròng                   | —        | —     | O       | —     |
| CRUD Tính năng tròng              | —        | —     | O       | —     |
| CRUD Chiến dịch pre-order         | —        | —     | O       | —     |
| Quản lý đơn hàng (xem/đổi status) | —        | O     | O       | O     |
| Chuyển đổi pre-order → đơn thường | —        | O     | O       | O     |
| Quản lý vận chuyển                | —        | O     | O       | O     |
| Xử lý khiếu nại                   | —        | O     | O       | O     |
| Quản lý người dùng (vai trò/TT)   | —        | —     | O       | O     |

### API Endpoints — Phân quyền chi tiết

| Endpoint                                          | Quyền                            |
| ------------------------------------------------- | -------------------------------- |
| `POST /api/Auth/*`                                | Công khai                        |
| `GET /api/Frames`, `GET /api/Frames/{id}`         | Công khai                        |
| `POST/PUT/DELETE /api/Frames/*`                   | Manager                          |
| `GET /api/Orders/my`, `GET /api/Orders/{id}`      | Customer (chủ đơn)               |
| `PUT /api/Orders/{id}/status`                     | Staff, Manager, Admin            |
| `PUT /api/Orders/{id}/confirm-delivery`           | Customer (chủ đơn)               |
| `PUT /api/Orders/{id}/cancel`                     | Customer (chủ đơn, pending only) |
| `GET /api/Preorders/my`                           | Customer (chủ đơn)               |
| `POST /api/Preorders/{id}/convert`                | Staff, Manager, Admin            |
| `GET /api/Users/*` (danh sách)                    | Manager, Admin                   |
| `PUT /api/Users/{id}/role`, `/status`             | Manager, Admin                   |
| `GET /api/Dashboard/*`                            | Manager, Admin                   |
| `POST/PUT/DELETE /api/LensTypes/*`                | Manager                          |
| `POST/PUT/DELETE /api/LensFeatures/*`             | Manager                          |
| `POST/PUT/PATCH /api/PreorderCampaigns/*`         | Manager                          |
| `GET /api/Complaints` (tất cả)                    | Staff, Manager, Admin            |
| `GET /api/Complaints/my`                          | Customer (chủ sở hữu)            |
| `PUT /api/Complaints/{id}/status`                 | Staff, Manager, Admin            |
| `PUT /api/Complaints/{id}/return-tracking`        | Staff, Manager, Admin            |
| `PUT /api/Complaints/{id}/process-refund`         | Staff, Manager, Admin            |
| `POST /api/Complaints/{id}/create-exchange-order` | Customer (chủ khiếu nại)         |
| `POST/GET /api/Shipping/goship/*`                 | Staff, Manager, Admin            |
| `PATCH /api/Shipping/orders/{id}/tracking`        | Staff, Manager, Admin            |
| `GET /api/Prescriptions/my/*`                     | Customer                         |
| `POST /api/Prescriptions`                         | Customer                         |

---

## 9. Thuật Ngữ Tiếng Việt — Tiếng Anh

| Tiếng Việt               | English            | Ngữ cảnh                           |
| ------------------------ | ------------------ | ---------------------------------- |
| Kính / Gọng kính         | Frame / Product    | Sản phẩm chính                     |
| Tròng kính               | Lens               | Tròng lắp vào gọng                 |
| Loại tròng               | Lens Type          | VD: Tròng đơn, Đa tròng            |
| Tính năng tròng          | Lens Feature       | VD: Chống lóa, Chống ánh sáng xanh |
| Chiết suất               | Lens Index         | VD: 1.56, 1.61, 1.67               |
| Đơn hàng                 | Order              | Đơn mua thường                     |
| Đơn đặt trước            | Pre-order          | Đơn mua theo chiến dịch            |
| Chiến dịch               | Campaign           | Đợt pre-order                      |
| Khiếu nại                | Complaint          | Phản hồi/yêu cầu sau mua           |
| Trả hàng                 | Return             | Trả sản phẩm + hoàn tiền           |
| Đổi hàng                 | Exchange           | Đổi sang sản phẩm khác             |
| Hoàn tiền                | Refund             | Trả tiền lại                       |
| Bảo hành                 | Warranty           | Sửa chữa/thay thế                  |
| Vận chuyển               | Shipping           | Giao hàng                          |
| Mã vận đơn               | Tracking Number    | Mã theo dõi giao hàng              |
| Hãng vận chuyển          | Carrier            | VD: J&T, GHN, GHTK                 |
| Toa thuốc                | Prescription       | Đơn đo mắt                         |
| Độ cầu (SPH)             | Sphere             | Số đo cận/viễn                     |
| Độ loạn (CYL)            | Cylinder           | Số đo loạn thị                     |
| Trục (AXIS)              | Axis               | Hướng loạn thị                     |
| Khoảng cách đồng tử (PD) | Pupillary Distance | Khoảng cách 2 đồng tử              |
| Thương hiệu              | Brand              | Nhãn hiệu kính                     |
| Chất liệu                | Material           | Chất liệu gọng                     |
| Kiểu dáng                | Shape              | Hình dáng gọng                     |
| Màu sắc                  | Color              | Màu gọng                           |
| Kích cỡ                  | Size               | Nhỏ/Vừa/Lớn                        |
| Tồn kho                  | Stock / Inventory  | Số lượng còn trong kho             |
| Khách hàng               | Customer           | Người mua                          |
| Nhân viên                | Staff              | Nhân viên xử lý                    |
| Quản lý                  | Manager            | Người quản lý                      |
| Quản trị                 | Admin              | Quản trị viên hệ thống             |
| Doanh thu                | Revenue            | Tổng tiền bán                      |
| Thanh toán               | Payment            | Hình thức trả tiền                 |
| Tổng quan                | Dashboard          | Bảng điều khiển                    |

---

> **Ghi chú:** Tất cả API sử dụng JWT Bearer token trong header `Authorization`. Token lưu trong `localStorage` cùng object `user`. Tiền tệ hiển thị kép USD + VND với tỷ giá ~25.400–26.250 ₫/$. Ảnh sản phẩm lưu trên Cloudinary. Vận chuyển tích hợp GoShip (J&T Express) hoặc nhập tay.
