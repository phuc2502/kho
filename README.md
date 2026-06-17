# Hệ thống Quản lý Kho (WMS) – FOSITEK Hà Nam

Hệ thống quản lý kho thành phẩm linh kiện điện tử cho **FOSITEK**, xây dựng theo mô hình **MVC (Model-View-Controller)** với phân tách rõ ràng giữa dữ liệu, giao diện và logic điều khiển.

---

## 🏗 Kiến trúc hệ thống

```text
kho/
├── backend/            # Express API Server (Node.js + Sequelize + MySQL)
│   ├── config/         # Cấu hình & Kết nối cơ sở dữ liệu
│   ├── models/         # Các Model Sequelize (ORM)
│   ├── controllers/    # Logic nghiệp vụ (Controllers)
│   ├── routes/         # Định nghĩa API endpoints
│   ├── middlewares/    # Phân quyền, JWT Auth, xử lý lỗi
│   ├── utils/          # Các hàm hỗ trợ (permission, audit, notification...)
│   ├── database/       # Thư mục chứa script khởi tạo dữ liệu
│   │   ├── seed.js     # Nạp dữ liệu mẫu gốc
│   │   └── seed_extra.js # Nạp dữ liệu mẫu linh kiện điện tử bổ sung
│   └── server.js       # Entry point khởi chạy backend
│
├── frontend/           # React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── models/     # Các lớp giao tiếp với API backend
│       ├── controllers/# Các context quản lý state (Auth, v.v.)
│       ├── views/      # Giao diện các trang nghiệp vụ
│       └── components/ # Component dùng chung (UI, Notification, Permission...)
│
└── Dockerfile          # Cấu hình Docker
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
npm run seed       # Nạp dữ liệu gốc 
npm run seed:extra # Bổ sung dữ liệu kho linh kiện điện tử
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

| Vai trò | Email | Mật khẩu |
|:--------|:------|:---------|
| 🔴 Admin | `admin@fositek.vn` | `admin123` |
| 🟠 Quản lý kho | `hoang.vu@fositek.vn` | `quanly123` |
| 🟡 Kế toán kho | `lananh.tran@fositek.vn` | `ketoan123` |
| 🟡 Kế toán kho | `hang.bui@fositek.vn` | `ketoan123` |
| 🟢 Nhân viên kho | `tuan.pham@fositek.vn` | `nhanvien123` |
| 🟢 Nhân viên kho | `hung.le@fositek.vn` | `nhanvien123` |
| 🔵 QC | `ngoc.do@fositek.vn` | `qc123456` |
| 🟣 Sale | `sale.nguyen@fositek.vn` | `sale1234` |

---

### Ma trận phân quyền theo vai trò

| Quyền hạn | Admin | Quản lý kho | Kế toán kho | Nhân viên kho | QC | Sale |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Quản lý người dùng & phân quyền** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Xem nhật ký hoạt động (Audit)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sản phẩm & Danh mục — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sản phẩm & Danh mục — Thêm/Sửa/Xóa** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sơ đồ kho — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sơ đồ kho — Thêm/Sửa/Xóa** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Tồn kho — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Phiếu nhập — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Phiếu nhập — Lập & Sửa** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Phiếu nhập — Duyệt & Hoàn thành** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Phiếu xuất — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Phiếu xuất — Lập & Sửa** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Phiếu xuất — Duyệt & Hoàn thành** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Yêu cầu xuất kho — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Yêu cầu xuất kho — Tạo mới** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Kiểm kê — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Kiểm kê — Lập & Sửa** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Kiểm kê — Phê duyệt** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Điều chỉnh tồn kho — Xem** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Điều chỉnh tồn kho — Lập** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Điều chỉnh tồn kho — Duyệt** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sự cố — Xem** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sự cố — Báo cáo** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

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

#### 🟢 Nhân viên kho (NhanVienKho) — `tuan.pham@fositek.vn` · `hung.le@fositek.vn`
Thao tác cơ bản: lập phiếu nhập/xuất (nháp), xem tồn kho, xem sơ đồ kho, báo cáo sự cố. Không tạo được phiếu kiểm kê, không điều chỉnh tồn kho, không phê duyệt bất kỳ phiếu nào.

#### 🔵 QC (Kiểm soát chất lượng) — `ngoc.do@fositek.vn`
Tương tự Nhân viên kho về quyền thao tác, tập trung vào kiểm tra chất lượng hàng nhập/xuất. Có thể lập phiếu nhập, phiếu xuất và báo cáo sự cố liên quan đến chất lượng. Không phê duyệt, không điều chỉnh tồn kho.

#### 🟣 Sale (Kinh doanh) — `sale.nguyen@fositek.vn`
Nhân viên kinh doanh. Quyền hạn tối thiểu, tập trung vào việc **tạo và theo dõi yêu cầu xuất kho** (delivery request) cho khách hàng. Chỉ xem được sản phẩm, tồn kho và sơ đồ kho — không thao tác trực tiếp vào phiếu xuất, phiếu nhập hay kiểm kê.

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
