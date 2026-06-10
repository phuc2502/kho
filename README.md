# Hệ thống Quản lý Kho (WMS) – FOSITEK Hà Nam

Hệ thống quản lý kho thành phẩm linh kiện điện tử cho **FOSITEK**, xây dựng theo mô hình **MVC (Model-View-Controller)** với phân tách rõ ràng giữa dữ liệu, giao diện và logic điều khiển.

---

## 🏗 Kiến trúc hệ thống

```
kho/
├── backend/            # Express API Server (Node.js + Sequelize + MySQL)
│   ├── config/         # Kết nối cơ sở dữ liệu (MySQL/XAMPP)
│   ├── models/         # Model Sequelize (ORM)
│   ├── controllers/    # Logic nghiệp vụ
│   ├── routes/         # Định nghĩa API endpoints
│   ├── middlewares/    # JWT Auth + kiểm tra quyền động
│   ├── utils/          # permission.helper, audit.helper, migration.helper
│   ├── scripts/
│   │   └── seed.js     # Dữ liệu mẫu FOSITEK
│   └── server.js
│
├── frontend/           # React 18 + Vite + Tailwind CSS (Dropbox Design)
│   └── src/
│       ├── models/     # Giao tiếp API
│       ├── controllers/# Auth context, state hooks
│       ├── views/      # Các trang giao diện
│       └── components/ # PermissionGuard, shared components
│
├── DB.sql              # Schema SQL Server (thiết kế gốc – tham khảo)
└── seed_data.sql       # Dữ liệu mẫu SQL Server (tham khảo)
```

---

## ⚙️ Cài đặt & Khởi chạy

### Yêu cầu
- **XAMPP** (MySQL 8.x đang chạy trên cổng 3306)
- **Node.js** 18+

### 1. Backend

```bash
cd backend
npm install
```

Tệp `.env` (đã có sẵn, kiểm tra lại nếu cần):
```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=DB_KHO
JWT_SECRET=super_secret_key_change_me_in_production
```

Chạy seed để tạo database và nạp dữ liệu mẫu:
```bash
npm run seed
```

Khởi chạy server:
```bash
npm run dev        # development (nodemon)
npm start          # production
```

Backend chạy tại: `http://localhost:4000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Giao diện chạy tại: `http://localhost:5173`

---

## 🔑 Tài khoản đăng nhập & Phân quyền

### Danh sách tài khoản

| Họ tên | Email đăng nhập | Mật khẩu | Vai trò |
|:---|:---|:---|:---|
| Nguyễn Thành Đạt | `admin@fositek.vn` | `admin123` | **Admin** |
| Vũ Xuân Hoàng | `hoang.vu@fositek.vn` | `quanly123` | **Quản lý kho** |
| Trần Thị Lan Anh | `lananh.tran@fositek.vn` | `ketoan123` | **Kế toán kho** |
| Bùi Thị Hằng | `hang.bui@fositek.vn` | `ketoan123` | **Kế toán kho** |
| Phạm Văn Tuấn | `tuan.pham@fositek.vn` | `nhanvien123` | **Nhân viên kho** |
| Lê Quang Hưng | `hung.le@fositek.vn` | `nhanvien123` | **Nhân viên kho** |
| Đỗ Thị Ngọc | `ngoc.do@fositek.vn` | `qc123456` | **Nhân viên kho** |

---

### Ma trận phân quyền theo vai trò

| Quyền hạn | Admin | Quản lý kho | Kế toán kho | Nhân viên kho |
|:---|:---:|:---:|:---:|:---:|
| **Quản lý người dùng & phân quyền** | ✅ | ❌ | ❌ | ❌ |
| **Xem nhật ký hoạt động (Audit)** | ✅ | ✅ | ❌ | ❌ |
| **Sản phẩm & Danh mục — Xem** | ✅ | ✅ | ✅ | ✅ |
| **Sản phẩm & Danh mục — Thêm/Sửa/Xóa** | ✅ | ✅ | ❌ | ❌ |
| **Sơ đồ kho — Xem** | ✅ | ✅ | ✅ | ✅ |
| **Sơ đồ kho — Thêm/Sửa/Xóa** | ✅ | ✅ | ❌ | ❌ |
| **Phiếu nhập — Xem** | ✅ | ✅ | ✅ | ✅ |
| **Phiếu nhập — Lập & Sửa** | ✅ | ✅ | ✅ | ✅ |
| **Phiếu nhập — Duyệt & Hoàn thành** | ✅ | ✅ | ❌ | ❌ |
| **Phiếu xuất — Xem** | ✅ | ✅ | ✅ | ✅ |
| **Phiếu xuất — Lập & Sửa** | ✅ | ✅ | ✅ | ✅ |
| **Phiếu xuất — Duyệt & Hoàn thành** | ✅ | ✅ | ❌ | ❌ |
| **Kiểm kê — Xem** | ✅ | ✅ | ✅ | ✅ |
| **Kiểm kê — Lập & Sửa** | ✅ | ✅ | ✅ | ❌ |
| **Kiểm kê — Phê duyệt** | ✅ | ✅ | ❌ | ❌ |
| **Điều chỉnh tồn kho — Xem** | ✅ | ✅ | ✅ | ❌ |
| **Điều chỉnh tồn kho — Lập** | ✅ | ✅ | ✅ | ❌ |
| **Điều chỉnh tồn kho — Duyệt** | ✅ | ✅ | ❌ | ❌ |
| **Báo cáo sự cố — Xem & Tạo** | ✅ | ✅ | ✅ | ✅ |
| **Tồn kho — Xem số lượng thực tế** | ✅ | ✅ | ✅ | ✅ |

> **Admin** bypass toàn bộ kiểm tra quyền (superadmin).
> Admin có thể cấp thêm hoặc thu hồi quyền cụ thể cho từng người dùng thông qua trang **Tài khoản** trong hệ thống.

---

### Mô tả vai trò

#### 🔴 Admin — `admin@fositek.vn`
Quản trị viên hệ thống. Toàn quyền trên mọi chức năng. Là người duy nhất có thể:
- Tạo, vô hiệu hóa tài khoản người dùng
- Cấp thêm / thu hồi quyền cụ thể cho từng nhân viên
- Xem nhật ký hoạt động hệ thống

#### 🟠 Quản lý kho (QuanLyKho) — `hoang.vu@fositek.vn`
Quản lý vận hành kho. Có quyền phê duyệt toàn bộ phiếu nhập/xuất/kiểm kê/điều chỉnh. Có thể quản lý danh mục sản phẩm và sơ đồ kho.

#### 🟡 Kế toán kho (KeToanKho) — `lananh.tran@fositek.vn` · `hang.bui@fositek.vn`
Lập phiếu nhập kho, phiếu xuất kho, phiếu kiểm kê và điều chỉnh tồn kho. **Không có quyền phê duyệt** — phiếu sau khi lập phải chờ Quản lý kho duyệt.

#### 🟢 Nhân viên kho (NhanVienKho) — `tuan.pham@fositek.vn` · `hung.le@fositek.vn` · `ngoc.do@fositek.vn`
Thao tác cơ bản: lập phiếu nhập/xuất (nháp), xem tồn kho, xem sơ đồ kho, báo cáo sự cố. Không tạo được phiếu kiểm kê, không điều chỉnh tồn kho, không phê duyệt bất kỳ phiếu nào.

---

## 📦 Dữ liệu mẫu (sau khi seed)

### Sản phẩm

| Mã SKU | Tên sản phẩm | Danh mục | Giá nhập | Giá bán |
|:---|:---|:---|---:|---:|
| FST-H360-14 | Trục xoay 360° FST-H360-14 | Trục xoay (Bản lề) | 18.000 đ | 30.000 đ |
| FST-H180-156 | Trục xoay 180° FST-H180-156 | Trục xoay (Bản lề) | 13.500 đ | 22.000 đ |
| FST-SLK-380 | Thanh ray dẫn hướng FST-SLK-380 | Thanh trượt (Slide Rail) | 28.000 đ | 46.000 đ |
| FST-SL2IN1-135 | Cơ cấu trượt 2-in-1 FST-SL2IN1-135 | Thanh trượt (Slide Rail) | 58.000 đ | 92.000 đ |
| FST-MIM-HB14 | Giá đỡ bản lề MIM FST-MIM-HB14 | Linh kiện MIM | 105.000 đ | 162.000 đ |
| FST-MIM-CB01 | Khung viền camera MIM FST-MIM-CB01 | Linh kiện MIM | 88.000 đ | 136.000 đ |

### Tồn kho ban đầu

| Sản phẩm | Vị trí | Số lượng |
|:---|:---|---:|
| FST-H360-14 | VT-A1-01 (Kệ A1, Hàng 1) | 97 cái |
| FST-H360-14 | VT-A1-02 (Kệ A1, Hàng 2) | 200 cái |
| FST-H180-156 | VT-A2-01 (Kệ A2, Hàng 1) | 200 cái |
| FST-SLK-380 | VT-B1-01 (Kệ B1, Hàng 1) | 300 bộ |
| FST-SLK-380 | VT-B1-02 (Kệ B1, Hàng 2) | 400 bộ |
| FST-SL2IN1-135 | VT-B2-01 (Kệ B2, Hàng 1) | 200 bộ |
| FST-MIM-HB14 | VT-C1-01 (Kệ C1, Hàng 1) | 7 cái |
| FST-MIM-CB01 | VT-C1-02 (Kệ C1, Hàng 2) | 5 cái |

---

## 🔄 Luồng nghiệp vụ chính

### Phiếu nhập kho
```
Nháp (draft) → Đã duyệt (approved) → Hoàn thành (completed)
                                    ↘ Từ chối (rejected)
```
- **Lập phiếu** (Kế toán / Nhân viên): điền ghi chú/lô hàng (tùy chọn), thêm mặt hàng (SKU, số lượng, đơn giá, vị trí kho)
- **Duyệt** (Quản lý kho): xem xét phiếu, duyệt hoặc từ chối
- **Hoàn thành**: tồn kho tự động được cộng vào vị trí tương ứng

### Phiếu xuất kho
```
Nháp → Đã duyệt → Hoàn thành
              ↘ Từ chối
```
- Kiểm tra tồn kho khả dụng trước khi xuất
- Khi hoàn thành: tự động trừ số lượng tồn kho

---

## 🛠 Tech Stack

| Tầng | Công nghệ |
|:---|:---|
| Frontend | React 18, Vite, Tailwind CSS v3, recharts |
| Backend | Node.js, Express.js |
| ORM | Sequelize v6 |
| Database | MySQL 8.x (XAMPP) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Design | Dropbox Design System (cream paper, warm ink, Dropbox Blue) |
