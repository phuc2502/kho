# Hệ thống Quản lý Kho (WMS) - Kiến trúc MVC (Không Docker)

Hệ thống được thiết kế và xây dựng lại theo mô hình **MVC (Model-View-Controller)** chuẩn hóa, phân tách rõ ràng trách nhiệm giữa Dữ liệu, Giao diện hiển thị và Logic điều khiển.

---

## 🛠 Kiến trúc hệ thống

Dự án được phân chia thành hai phần chính:

```
kho/
├── backend/            # Express API Server (MVC)
│   ├── config/         # Cấu hình kết nối cơ sở dữ liệu và biến môi trường
│   ├── models/         # Model dữ liệu (Mongoose Schemas)
│   ├── controllers/    # Controller điều phối logic nghiệp vụ
│   ├── routes/         # Router định nghĩa endpoints API
│   ├── middlewares/    # Middleware xác thực (JWT) & Phân quyền động
│   └── server.js       # File khởi chạy ứng dụng
│
└── frontend/           # React + Vite (MVC / Component-based)
    ├── src/
    │   ├── models/     # Quản lý giao tiếp API và định nghĩa dữ liệu
    │   ├── controllers/# Custom hooks quản lý State và gọi Actions
    │   ├── views/      # Giao diện hiển thị (React Components)
    │   ├── components/ # Các components dùng chung (PermissionGuard, v.v.)
    │   └── main.jsx    # Điểm khởi đầu ứng dụng
```

---

## 🔑 Tính năng nổi bật

1. **Phân quyền chi tiết (Granular Permission-Based Access Control):**
   - Hỗ trợ 3 Vai trò mặc định: `Admin`, `Manager`, `Staff`.
   - Admin có quyền truy cập trang Quản trị Người dùng để trực tiếp bật/tắt các quyền cụ thể cho từng User (ví dụ: chỉ được xem sản phẩm, không được thêm/sửa/xóa).
2. **Quản lý Sản phẩm & Danh mục:**
   - CRUD danh mục và sản phẩm. Ràng buộc nghiệp vụ: Giá bán (`priceOut`) buộc phải lớn hơn giá nhập (`priceIn`).
3. **Quản lý cấu trúc Kho hàng:**
   - Định nghĩa sơ đồ kho theo cấu trúc phân cấp: Warehouse -> Zone -> Aisle -> Rack -> Bin.
4. **Nghiệp vụ Nhập/Xuất kho tự động biến động tồn kho:**
   - **Phiếu Nhập:** Khi phiếu nhập được chuyển trạng thái sang `completed`, số lượng sản phẩm tương ứng sẽ được tự động cộng vào vị trí Bin đã chọn trong Kho.
   - **Phiếu Xuất:** Kiểm tra tính khả dụng của tồn kho tại Bin trước khi xuất. Khi phiếu xuất hoàn tất, tự động trừ số lượng tồn kho tương ứng.
5. **Báo cáo tồn kho theo vị trí:**
   - Tra cứu số lượng tồn kho của từng SKU chính xác tại từng Bin/Rack cụ thể.

---

## ⚙️ Hướng dẫn cài đặt & Khởi chạy

### 1. Cài đặt Backend
Di chuyển vào thư mục backend và cài đặt dependencies:
```bash
cd backend
npm install
```
Tạo tệp `.env` dựa theo mẫu:
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/kho_mvc
JWT_SECRET=bi_mat_ma_hoa_jwt_kho_mvc
```
Khởi chạy Backend:
```bash
npm run dev
```

### 2. Cài đặt Frontend
Di chuyển vào thư mục frontend và cài đặt dependencies:
```bash
cd ../frontend
npm install
```
Tạo tệp `.env` cho frontend:
```env
VITE_API_URL=http://localhost:4000/api/v1
```
Khởi chạy Frontend:
```bash
npm run dev
```
Giao diện sẽ chạy tại địa chỉ: `http://localhost:5173`.
