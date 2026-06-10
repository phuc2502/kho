**3.1.2. THIẾT KẾ MỨC LOGIC**

Hệ thống Quản lý Kho thành phẩm – FOSITEK (Phiên bản cập nhật)

# **a) Các bảng và thuộc tính đã chuẩn hóa**

Dưới đây là 33 bảng trong hệ thống Quản lý kho thành phẩm FOSITEK đã được chuẩn hóa tối ưu (chuẩn 3NF), thiết kế theo mô hình RBAC mở rộng (Role-Based Access Control \+ User-level permission override).

> **\[THÊM MỚI\]** Cập nhật: bổ sung bảng thứ 33 — **NhatKyEmail (EmailLogs)** — nhật ký gửi email hệ thống (tạo tài khoản, đặt lại mật khẩu, link khôi phục).

## **Tổng hợp các bảng theo nhóm chức năng**

**Nhóm 1 – Phân quyền (RBAC mở rộng)**

| STT | Tên bảng | Mô tả chức năng |
| ----- | :---- | :---- |
| 1 | **NguoiDung** | Thông tin hồ sơ nhân viên: tên, SĐT, trạng thái (không chứa thông tin đăng nhập và không lưu chức vụ) |
| 2 | **TaiKhoan** | Tài khoản đăng nhập riêng biệt, mỗi người dùng có 1 tài khoản |
| 3 | **VaiTro** | Danh mục vai trò (Role): Quản lý kho, Kế toán kho, Nhân viên kho, QC, Sale… |
| 4 | **NguoiDung\_VaiTro** | Gán vai trò cho người dùng (N:N, hỗ trợ RBAC) |
| 5 | **Quyen** | Danh mục quyền (Permission): tao\_phieu\_nhap, phe\_duyet\_xuat… |
| 6 | **VaiTro\_Quyen** | Gán quyền mặc định cho từng vai trò (N:N) |
| 7 | **NguoiDung\_Quyen** | Ghi đè quyền trực tiếp cho người dùng cụ thể (cấp thêm hoặc thu hồi) |
| 8 | **LichSuHoatDong** | Ghi nhật ký toàn bộ thao tác quan trọng trong hệ thống (Audit Log) |
| 9 | **NhatKyEmail** *(EmailLogs)* | **\[THÊM MỚI\]** Nhật ký gửi email hệ thống: tạo tài khoản, admin đặt lại MK, link quên mật khẩu — ghi cả thành công và thất bại |

**Nhóm 2 – Kho & Địa điểm**

| STT | Tên bảng | Mô tả chức năng |
| ----- | :---- | :---- |
| 9 | **Kho** | Danh sách các kho vật lý (1 công ty có thể có nhiều kho) |
| 10 | **NguoiDung\_Kho** | Phân công người dùng phụ trách kho (N:N) |
| 11 | **KhuVucKho** | Các khu vực trong một kho (Khu A, Khu B…) |
| 12 | **ViTriTrongKho** | Vị trí cụ thể trong khu vực (kệ, hàng, cột) |

**Nhóm 3 – Sản phẩm & Tồn kho**

| STT | Tên bảng | Mô tả chức năng |
| ----- | :---- | :---- |
| 13 | **DanhMucSanPham** | Nhóm hàng (bản lề laptop, thanh trượt, sản phẩm MIM…) |
| 14 | **SanPham** | Thông tin từng sản phẩm/linh kiện thành phẩm (có mã barcode) |
| 15 | **SoSerial** | Theo dõi từng đơn vị sản phẩm có serial riêng |
| 16 | **TonKho** | Số lượng tồn theo từng (sản phẩm – vị trí kho) |

**Nhóm 4 – Nhập kho**

| STT | Tên bảng | Mô tả chức năng |
| ----- | :---- | :---- |
| 17 | **PhieuNhapKho** | Phiếu nhập kho (header) – do nhân viên kho lập, quản lý duyệt |
| 18 | **ChiTietNhapKho** | Chi tiết sản phẩm trong mỗi phiếu nhập (N:N PhieuNhap – SanPham) |
| 19 | **ChiTietNhapViTri** | Ghi nhận hàng nhập vào vị trí nào trong kho |
| 20 | **ChiTietNhapSerial** | Liên kết serial được ghi nhận trong phiếu nhập |
| 21 | **PhieuSuCo** | Ghi nhận sự cố: hàng lỗi (QC) hoặc sai lệch số lượng |

**Nhóm 5 – Xuất kho**

| STT | Tên bảng | Mô tả chức năng |
| ----- | :---- | :---- |
| 22 | **YeuCauXuatKho** | Yêu cầu xuất kho do Sales/bộ phận liên quan tạo |
| 23 | **ChiTietYeuCau** | Danh sách sản phẩm và số lượng trong yêu cầu xuất |
| 24 | **PhieuXuatKho** | Phiếu xuất kho chính thức (phát sinh từ yêu cầu, kế toán lập, quản lý duyệt) |
| 25 | **ChiTietXuatKho** | Chi tiết sản phẩm xuất trong phiếu xuất |
| 26 | **ChiTietXuatViTri** | Lấy hàng từ vị trí nào trong kho |
| 27 | **ChiTietXuatSerial** | Serial xuất kho |

**Nhóm 6 – Kiểm kê & Điều chỉnh**

| STT | Tên bảng | Mô tả chức năng |
| ----- | :---- | :---- |
| 28 | **PhieuKiemKe** | Phiếu kiểm kê (kế toán lập, quản lý phê duyệt) |
| 29 | **ChiTietKiemKe** | Danh sách sản phẩm kiểm kê kèm SL hệ thống / thực tế (đã bỏ cột chênh lệch dẫn xuất) |
| 30 | **BienBanKiemKe** | Biên bản kiểm kê do kế toán lập sau khi có kết quả |
| 31 | **PhieuDieuChinhTonKho** | Điều chỉnh tồn kho sau khi biên bản được phê duyệt |
| 32 | **ChiTietDieuChinh** | Chi tiết từng sản phẩm được điều chỉnh tồn (N:N) |

# **b) Mô tả chi tiết từng bảng**

## **Nhóm 1 – Phân quyền (RBAC mở rộng)**

Hệ thống áp dụng mô hình RBAC mở rộng: quyền được quản lý ở hai cấp:

(1) Cấp vai trò (VaiTro\_Quyen): Admin gán quyền mặc định cho từng vai trò.

(2) Cấp người dùng (NguoiDung\_Quyen): Admin có thể ghi đè quyền riêng cho từng cá nhân – cấp thêm quyền ngoài vai trò hoặc thu hồi quyền mà vai trò mặc định có. Tại runtime, hệ thống ưu tiên kiểm tra NguoiDung\_Quyen trước, sau đó mới tra VaiTro\_Quyen.

**Danh sách mã quyền (Ma\_chuc\_nang) đại diện:**

| Mã chức năng | Tên quyền | Vai trò thường có |
| :---- | :---- | :---- |
| tao\_phieu\_nhap | Tạo phiếu nhập kho | NV kho, Kế toán kho |
| phe\_duyet\_nhap | Phê duyệt phiếu nhập | Quản lý kho |
| tao\_yeu\_cau\_xuat | Tạo yêu cầu xuất kho | Sale (cố định) |
| lap\_phieu\_xuat | Lập phiếu xuất kho | Kế toán kho |
| phe\_duyet\_xuat | Phê duyệt phiếu xuất | Quản lý kho |
| xac\_nhan\_xuat\_hang | Xác nhận xuất hàng vật lý | NV kho |
| tao\_phieu\_kiem\_ke | Tạo phiếu kiểm kê | Kế toán kho |
| phe\_duyet\_kiem\_ke | Phê duyệt phiếu/biên bản kiểm kê | Quản lý kho |
| nhap\_sl\_kiem\_ke | Nhập số lượng thực tế kiểm kê | NV kho |
| xac\_nhan\_dieu\_chinh | Xác nhận phiếu điều chỉnh tồn kho | Kế toán kho |
| xem\_ton\_kho | Xem tồn kho | Tất cả vai trò |
| tao\_tai\_khoan | Tạo tài khoản mới cho nhân viên | Chỉ Admin |
| vo\_hieu\_tai\_khoan | Vô hiệu hóa / kích hoạt lại tài khoản | Chỉ Admin |
| quan\_tri\_he\_thong | Quản trị cấu hình RBAC, vai trò, quyền | Chỉ Admin |

**Bảng: NguoiDung**

\* Chỉ lưu thông tin hồ sơ nhân viên. Thông tin đăng nhập được tách riêng sang bảng TaiKhoan. Khi tạo nhân viên mới, Admin sẽ đồng thời tạo bản ghi NguoiDung (hồ sơ) và TaiKhoan (đăng nhập). Phân quyền thực sự do VaiTro\_Quyen và NguoiDung\_Quyen quyết định – không cần lưu chức vụ hiển thị trong bảng này.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_nguoi\_dung (PK)** | *CHAR(10)* | NOT NULL, UNIQUE | *ND001 – mã tự động sinh* |
| Ten\_nguoi\_dung | *NVARCHAR(100)* | NOT NULL | *Bùi Thiện Phúc* |
| So\_dien\_thoai | *CHAR(15)* | UNIQUE | *0912345678* |
| Trang\_thai | *BIT* | DEFAULT 1 | *1: Đang làm việc / 0: Đã nghỉ* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() | *Ngày tạo hồ sơ* |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() | *Tự cập nhật khi sửa hồ sơ* |

**Bảng: TaiKhoan**

\* Tách riêng khỏi NguoiDung để đảm bảo mỗi nhân viên có đúng 1 tài khoản đăng nhập. Admin tạo tài khoản cho nhân viên mới (cần quyền tao\_tai\_khoan); khi nhân viên nghỉ việc, Admin vô hiệu hóa bằng cách set Trang\_thai \= 0 (cần quyền vo\_hieu\_tai\_khoan) – hồ sơ NguoiDung vẫn giữ nguyên để bảo toàn lịch sử. Email dùng làm username. Mật khẩu lưu hash bcrypt.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_tai\_khoan (PK)** | *CHAR(10)* | NOT NULL, UNIQUE | *TK001* |
| Ma\_nguoi\_dung (FK) | *CHAR(10)* | FK → NguoiDung, UNIQUE, NOT NULL | *Mỗi người dùng chỉ có 1 tài khoản* |
| Email | *VARCHAR(150)* | NOT NULL, UNIQUE | *phuc@fositek.vn – dùng làm username* |
| Mat\_khau | *VARCHAR(255)* | NOT NULL | *Lưu hash bcrypt – Admin đặt mật khẩu tạm khi tạo mới* |
| Trang\_thai | *BIT* | DEFAULT 1 | *1: Hoạt động / 0: Đã vô hiệu hóa* |
| Ma\_admin\_tao (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *Admin nào đã tạo tài khoản này* |
| Ma\_admin\_vo\_hieu (FK) | *CHAR(10)* | FK → NguoiDung, NULL | *Admin nào đã vô hiệu hóa (NULL nếu chưa vô hiệu)* |
| Ly\_do\_vo\_hieu\_hoa | *NVARCHAR(300)* |  | *Nghỉ việc / Vi phạm nội quy… (NULL nếu chưa vô hiệu)* |
| Ngay\_vo\_hieu\_hoa | *DATETIME* |  | *Thời điểm vô hiệu hóa (NULL nếu còn hoạt động)* |
| Ngay\_dang\_nhap\_cuoi | *DATETIME* |  | *2026-05-01 08:30:00* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() | *Ngày Admin tạo tài khoản* |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() | *Cập nhật khi đổi mật khẩu/trạng thái* |

**Bảng: VaiTro**

\* La\_vai\_tro\_co\_dinh \= 1 → Admin không được xóa/sửa (QC, Sale). \= 0 → có thể cấu hình quyền linh hoạt.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_vai\_tro (PK)** | *CHAR(10)* | NOT NULL, UNIQUE | *VT001* |
| Ten\_vai\_tro | *NVARCHAR(100)* | NOT NULL, UNIQUE | *Quan\_ly\_kho / Ke\_toan\_kho / Nhan\_vien\_kho / QC / Sale* |
| Mo\_ta | *NVARCHAR(255)* |  | *Vai trò phụ trách phê duyệt nhập/xuất kho* |
| La\_vai\_tro\_co\_dinh | *BIT* | DEFAULT 0 | *0: cấu hình được; 1: Cố định (QC, Sale)* |

**Bảng: NguoiDung\_VaiTro**

\* Bảng trung gian N:N. 1 người có thể kiêm nhiều vai trò.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_nguoi\_dung (PK, FK) | *CHAR(10)* | FK → NguoiDung |  |
| Ma\_vai\_tro (PK, FK) | *CHAR(10)* | FK → VaiTro |  |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() | *Ngày gán vai trò* |

**Bảng: Quyen**

\* Nhom\_quyen giúp giao diện Admin nhóm các quyền thành section dễ tick/chọn hàng loạt.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_quyen (PK)** | *CHAR(15)* | NOT NULL, UNIQUE | *Q001* |
| Ma\_chuc\_nang | *VARCHAR(80)* | NOT NULL, UNIQUE | *tao\_phieu\_nhap / phe\_duyet\_xuat…* |
| Ten\_quyen | *NVARCHAR(200)* | NOT NULL | *Tạo phiếu nhập kho* |
| Nhom\_quyen | *NVARCHAR(100)* |  | *Nhập kho / Xuất kho / Kiểm kê / Quản trị* |
| Mo\_ta | *NVARCHAR(255)* |  | *Cho phép lập phiếu nhập kho mới* |

**Bảng: VaiTro\_Quyen**

\* Quyền mặc định theo vai trò. Admin tick vào đây để cấp/thu hồi quyền cho từng vai trò.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_vai\_tro (PK, FK) | *CHAR(10)* | FK → VaiTro |  |
| Ma\_quyen (PK, FK) | *CHAR(15)* | FK → Quyen |  |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() | *Ngày cấp quyền cho vai trò* |

**Bảng: NguoiDung\_Quyen  ★ Bảng mới – Phân quyền trực tiếp cho người dùng**

\* Ghi đè quyền riêng lẻ cho từng người dùng cụ thể. Loai\_ghi\_de \= 'cap\_them' → cấp thêm quyền dù vai trò không có; 'thu\_hoi' → thu hồi quyền dù vai trò mặc định có. Tại runtime, hệ thống ưu tiên bản ghi này trước VaiTro\_Quyen.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_nguoi\_dung (PK, FK) | *CHAR(10)* | FK → NguoiDung |  |
| Ma\_quyen (PK, FK) | *CHAR(15)* | FK → Quyen |  |
| Loai\_ghi\_de | *NVARCHAR(10)* | NOT NULL | *'cap\_them' hoặc 'thu\_hoi'* |
| Ly\_do | *NVARCHAR(300)* |  | *Lý do Admin cấp thêm/thu hồi quyền đặc biệt* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() | *Ngày Admin thiết lập* |

**Bảng: LichSuHoatDong  ★ Bảng mới – Nhật ký hệ thống (Audit Log)**

\* Ghi lại toàn bộ thao tác quan trọng: tạo/sửa/xóa phiếu, phê duyệt, đăng nhập/đăng xuất, thay đổi quyền. Bảng chỉ INSERT, không UPDATE/DELETE để đảm bảo tính toàn vẹn kiểm toán. Du\_lieu\_cu và Du\_lieu\_moi lưu JSON snapshot của bản ghi trước/sau khi thay đổi.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_lich\_su (PK)** | *BIGINT* | NOT NULL, IDENTITY(1,1) | *ID tự tăng, không dùng CHAR* |
| Ma\_tai\_khoan (FK) | *CHAR(10)* | FK → TaiKhoan, NOT NULL | *Ai thực hiện thao tác* |
| Ten\_nguoi\_dung | *NVARCHAR(100)* | NOT NULL | *Snapshot tên tại thời điểm ghi log* |
| Ten\_hanh\_dong | *NVARCHAR(100)* | NOT NULL | *DANG\_NHAP / TAO\_PHIEU\_NHAP / PHE\_DUYET\_XUAT / XOA\_NGUOI\_DUNG…* |
| Ten\_bang\_tac\_dong | *NVARCHAR(100)* |  | *PhieuNhapKho / NguoiDung / TaiKhoan…* |
| Ma\_ban\_ghi\_tac\_dong | *NVARCHAR(50)* |  | *Mã bản ghi bị tác động (PK của bảng đó)* |
| Du\_lieu\_cu | *NVARCHAR(MAX)* |  | *JSON snapshot trước khi thay đổi (NULL nếu tạo mới)* |
| Du\_lieu\_moi | *NVARCHAR(MAX)* |  | *JSON snapshot sau khi thay đổi (NULL nếu xóa)* |
| Dia\_chi\_ip | *VARCHAR(45)* |  | *IP v4/v6 của thiết bị thực hiện* |
| Thiet\_bi | *NVARCHAR(200)* |  | *User-Agent hoặc tên thiết bị* |
| Thoi\_gian\_thao\_tac | *DATETIME* | DEFAULT GETDATE(), NOT NULL | *Timestamp chính xác của thao tác* |

## **Nhóm 2 – Kho & Địa điểm**

Cấu trúc ba tầng: Kho → KhuVucKho → ViTriTrongKho. Bảng NguoiDung\_Kho cho phép 1 quản lý phụ trách nhiều kho và 1 kho có nhiều quản lý/kế toán/nhân viên.

**Bảng: Kho**

\* Hệ thống phục vụ kho thành phẩm, không cần phân loại kho. Thuộc tính Loai\_kho đã được bỏ để đơn giản hóa mô hình.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_kho (PK)** | *CHAR(10)* | NOT NULL, UNIQUE | *K001* |
| Ten\_kho | *NVARCHAR(200)* | NOT NULL | *Kho thành phẩm FOSITEK – Hà Nam* |
| Mo\_ta | *NVARCHAR(500)* |  | *Lưu trữ thành phẩm chờ xuất khẩu* |
| Dia\_chi | *NVARCHAR(300)* |  | *Lô CN05, KCN Đồng Văn III, Hà Nam* |
| Trang\_thai | *BIT* | DEFAULT 1 | *1: Hoạt động / 0: Tạm đóng* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: NguoiDung\_Kho**

\* Vai\_tro\_tai\_kho là thông tin bổ sung (Quản lý / Kế toán / NV), không thay thế RBAC chính thức.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_nguoi\_dung (PK, FK) | *CHAR(10)* | FK → NguoiDung |  |
| Ma\_kho (PK, FK) | *CHAR(10)* | FK → Kho |  |
| Vai\_tro\_tai\_kho | *NVARCHAR(50)* |  | *Quản lý / Kế toán / Nhân viên* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() | *Ngày phân công* |

**Bảng: KhuVucKho**

\* Phân vùng trong kho theo loại hàng hoặc điều kiện bảo quản.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_khu\_vuc (PK)** | *CHAR(10)* | NOT NULL, UNIQUE | *KV001* |
| Ma\_kho (FK) | *CHAR(10)* | FK → Kho, NOT NULL | *Khu vực thuộc kho nào* |
| Ten\_khu\_vuc | *NVARCHAR(100)* | NOT NULL | *Khu A – Bản lề laptop* |
| Mo\_ta | *NVARCHAR(255)* |  | *Khu lưu trữ nhiệt độ phòng, 500m²* |
| Trang\_thai | *BIT* | DEFAULT 1 | *1: Đang hoạt động / 0: Tạm đóng* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: ViTriTrongKho**

\* Mã theo quy tắc: Khu-Kệ-Hàng, ví dụ VT-A1-01. Suc\_chua\_toi\_da hỗ trợ tối ưu sắp xếp FIFO.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_vi\_tri (PK)** | *CHAR(15)* | NOT NULL, UNIQUE | *VT-A1-01* |
| Ma\_khu\_vuc (FK) | *CHAR(10)* | FK → KhuVucKho, NOT NULL | *Vị trí thuộc khu vực nào* |
| Ten\_vi\_tri | *NVARCHAR(100)* | NOT NULL | *Kệ A1, hàng 1* |
| Mo\_ta | *NVARCHAR(255)* |  | *Sát tường bên trái, gần cửa nhập* |
| Suc\_chua\_toi\_da | *INT* | DEFAULT 0 | *500 (cái/bộ/hộp)* |
| Trang\_thai | *NVARCHAR(30)* | DEFAULT 'Sẵn sàng' | *Sẵn sàng / Đầy / Bảo trì* |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() | *Cập nhật khi trạng thái thay đổi* |

## **Nhóm 3 – Sản phẩm & Tồn kho**

**Bảng: DanhMucSanPham**

\* Gồm 3 nhóm chính của FOSITEK: Bản lề (hinge), Thanh trượt (slider), Sản phẩm MIM.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_danh\_muc (PK)** | *CHAR(10)* | NOT NULL, UNIQUE | *DM001* |
| Ten\_danh\_muc | *NVARCHAR(200)* | NOT NULL | *Bản lề laptop / Thanh trượt / MIM* |
| Mo\_ta | *NVARCHAR(500)* |  | *Linh kiện dùng cho dòng Ultrabook* |
| Trang\_thai | *BIT* | DEFAULT 1 | *1: Đang dùng / 0: Ngừng* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: SanPham**

\* Quan\_ly\_theo\_serial \= 1 → bật theo dõi bảng SoSerial. Ma\_barcode lưu mã vạch sản phẩm để hỗ trợ quét mã trong tương lai (Mobile Scanner). Gia\_san\_xuat hỗ trợ báo cáo giá trị tồn kho.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_san\_pham (PK)** | *CHAR(15)* | NOT NULL, UNIQUE | *SP001* |
| Ma\_danh\_muc (FK) | *CHAR(10)* | FK → DanhMucSanPham |  |
| Ten\_san\_pham | *NVARCHAR(200)* | NOT NULL | *Bản lề laptop 360° model A* |
| Ma\_barcode | *VARCHAR(100)* | UNIQUE | *Mã vạch sản phẩm – dùng cho quét mã vạch kho* |
| Mo\_ta | *NVARCHAR(500)* |  | *Bản lề nhôm, tải trọng 2kg, 14 inch* |
| Don\_vi\_tinh | *NVARCHAR(30)* | NOT NULL | *Cái / Bộ / Hộp* |
| Trong\_luong | *DECIMAL(10,3)* |  | *0.050 (kg)* |
| Gia\_san\_xuat | *DECIMAL(15,2)* | DEFAULT 0 | *15000.00 VND* |
| Gia\_ban | *DECIMAL(15,2)* | DEFAULT 0 | *25000.00 VND* |
| Quan\_ly\_theo\_serial | *BIT* | DEFAULT 0 | *1: Có serial riêng từng cái; 0: Không* |
| Trang\_thai | *BIT* | DEFAULT 1 | *1: Đang sản xuất / 0: Ngừng* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Lưu ý về Barcode và Serial:**

Barcode (Ma\_barcode trong SanPham): Là mã định danh chung cho một loại sản phẩm. Ví dụ: tất cả các cái 'Bản lề laptop 360° model A' đều có cùng barcode. Dùng để quét nhận dạng loại hàng khi nhập/xuất.

Serial (Ma\_serial trong SoSerial): Là mã định danh duy nhất cho từng đơn vị sản phẩm cụ thể. Chỉ áp dụng cho sản phẩm có Quan\_ly\_theo\_serial \= 1\. Dùng để truy xuất nguồn gốc từng sản phẩm riêng lẻ.

**Bảng: SoSerial**

\* Chỉ tồn tại khi SanPham.Quan\_ly\_theo\_serial \= 1\. Trạng thái: Trong kho / Đã xuất / Lỗi / Hủy.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_serial (PK)** | *VARCHAR(50)* | NOT NULL, UNIQUE | *SN-2026-00001* |
| Ma\_san\_pham (FK) | *CHAR(15)* | FK → SanPham, NOT NULL | *Serial thuộc sản phẩm nào* |
| Trang\_thai | *NVARCHAR(30)* | NOT NULL | *Trong kho / Đã xuất / Lỗi / Hủy* |
| Ngay\_san\_xuat | *DATE* |  | *2026-03-10* |
| Ghi\_chu | *NVARCHAR(300)* |  | *Phát hiện lỗi bề mặt – chuyển cách ly* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: TonKho**

\* 1 bản ghi \= 1 cặp (SanPham – ViTriTrongKho). So\_luong\_ton tự động cập nhật sau mỗi nhập/xuất.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_ton\_kho (PK)** | *CHAR(15)* | NOT NULL, UNIQUE | *TK001* |
| Ma\_san\_pham (FK) | *CHAR(15)* | FK → SanPham, NOT NULL |  |
| Ma\_vi\_tri (FK) | *CHAR(15)* | FK → ViTriTrongKho, NOT NULL |  |
| So\_luong\_ton | *INT* | DEFAULT 0 | *320 cái* |
| So\_luong\_toi\_thieu | *INT* | DEFAULT 0 | *50 – ngưỡng cần nhập thêm* |
| So\_luong\_toi\_da | *INT* | DEFAULT 0 | *500 – tránh tồn quá nhiều* |
| Ngay\_cap\_nhat | *DATE* |  | *2026-04-20* |

## **Nhóm 4 – Nhập kho**

**Bảng: PhieuNhapKho**

\* Header của phiếu nhập. Trang\_thai\_phe\_duyet lưu riêng để hỗ trợ tra cứu lịch sử phê duyệt.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_phieu\_nhap (PK)** | *CHAR(20)* | NOT NULL, UNIQUE | *PNK-2026-0042* |
| Ma\_kho (FK) | *CHAR(10)* | FK → Kho, NOT NULL | *Kho tiếp nhận hàng* |
| Ma\_nguoi\_dung\_lap (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *NV kho lập phiếu* |
| Ma\_nguoi\_dung\_phe\_duyet (FK) | *CHAR(10)* | FK → NguoiDung, NULL | *Quản lý duyệt (NULL khi chưa duyệt)* |
| Ngay\_lap | *DATE* | NOT NULL | *2026-03-15* |
| Ngay\_nhap\_thuc\_te | *DATE* |  | *Ngày hàng thực tế vào kho* |
| Ghi\_chu | *NVARCHAR(500)* |  | *Lô tháng 3, từ line 2 sản xuất* |
| Trang\_thai | *NVARCHAR(50)* | DEFAULT 'Cho phe duyet' | *Chờ phê duyệt / Đã phê duyệt / Từ chối* |
| Ly\_do\_tu\_choi | *NVARCHAR(500)* |  | *Điền khi trạng thái \= Từ chối* |
| Thoi\_gian\_xu\_ly | *DATETIME* |  | *Thời điểm quản lý xử lý phê duyệt* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: ChiTietNhapKho**

\* So\_luong\_thuc\_te do NV kho đếm, So\_luong\_nhap từ chứng từ – chênh lệch sẽ phát sinh PhieuSuCo. Không lưu Thoi\_gian\_tao/cap\_nhat vì bảng này chỉ ghi nhận tại thời điểm nhập phiếu.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_nhap (PK, FK) | *CHAR(20)* | FK → PhieuNhapKho |  |
| Ma\_san\_pham (PK, FK) | *CHAR(15)* | FK → SanPham |  |
| So\_luong\_nhap | *INT* | NOT NULL | *Số lượng theo chứng từ/phiếu* |
| So\_luong\_thuc\_te | *INT* | DEFAULT 0 | *Số lượng NV kho đếm thực tế* |
| Ghi\_chu | *NVARCHAR(300)* |  |  |

**Bảng: ChiTietNhapViTri**

\* Ghi nhận từng vị trí hàng được đặt vào, hỗ trợ cập nhật TonKho theo vị trí.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_nhap (PK, FK) | *CHAR(20)* | FK → PhieuNhapKho |  |
| Ma\_vi\_tri (PK, FK) | *CHAR(15)* | FK → ViTriTrongKho |  |
| Ma\_san\_pham (FK) | *CHAR(15)* | FK → SanPham, NOT NULL | *Cần biết SP nào nhập vào vị trí này* |
| So\_luong\_nhap\_vao\_vi\_tri | *INT* | NOT NULL | *Số lượng nhập vào vị trí cụ thể* |

**Bảng: ChiTietNhapSerial**

\* Mỗi serial được liên kết với 1 phiếu nhập để truy xuất nguồn gốc lô hàng.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_nhap (PK, FK) | *CHAR(20)* | FK → PhieuNhapKho |  |
| Ma\_serial (PK, FK) | *VARCHAR(50)* | FK → SoSerial |  |

**Bảng: PhieuSuCo**

\* Loai\_su\_co: 'Hàng lỗi' (QC phát hiện) hoặc 'Sai lệch số lượng' (NV kho phát hiện). Dùng chung 1 bảng.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_phieu\_su\_co (PK)** | *CHAR(20)* | NOT NULL, UNIQUE | *PSC-2026-005* |
| Ma\_phieu\_nhap (FK) | *CHAR(20)* | FK → PhieuNhapKho, NOT NULL | *Sự cố phát sinh từ phiếu nhập nào* |
| Ma\_nguoi\_dung\_lap (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *Người lập phiếu (QC hoặc NV kho)* |
| Ngay\_lap | *DATE* | NOT NULL |  |
| Loai\_su\_co | *NVARCHAR(50)* | NOT NULL | *Hàng lỗi / Sai lệch số lượng* |
| Mo\_ta | *NVARCHAR(500)* |  | *30 bản lề bị rỉ sét bề mặt* |
| So\_luong\_su\_co | *INT* | DEFAULT 0 | *30* |
| Trang\_thai\_xu\_ly | *NVARCHAR(50)* | DEFAULT 'Dang xu ly' | *Đang xử lý / Đã giải quyết / Leo thang GĐ* |
| Ghi\_chu | *NVARCHAR(300)* |  | *Chờ phản hồi NCC* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

## **Nhóm 5 – Xuất kho**

**Bảng: YeuCauXuatKho**

\* Sales tạo yêu cầu, không tạo phiếu xuất trực tiếp – đảm bảo tách bạch vai trò.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_yeu\_cau (PK)** | *CHAR(20)* | NOT NULL, UNIQUE | *YCX-2026-0088* |
| Ma\_kho (FK) | *CHAR(10)* | FK → Kho, NOT NULL | *Kho cần xuất* |
| Ma\_nguoi\_dung\_tao (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *Sales tạo yêu cầu* |
| Ngay\_tao | *DATE* | NOT NULL | *2026-04-10* |
| Ten\_khach\_hang | *NVARCHAR(200)* | NOT NULL | *Samsung Electronics Vietnam* |
| Thoi\_gian\_giao\_hang\_du\_kien | *DATETIME* |  | *2026-04-15 08:00* |
| Ghi\_chu | *NVARCHAR(500)* |  | *Đóng gói tem tiếng Anh* |
| Trang\_thai | *NVARCHAR(60)* | DEFAULT 'Cho xu ly' | *Chờ xử lý / Tạm dừng / Đã xử lý* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: ChiTietYeuCau**

\* Danh sách SP và số lượng cần xuất. Không cần Thoi\_gian\_tao vì phụ thuộc phiếu cha.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_yeu\_cau (PK, FK) | *CHAR(20)* | FK → YeuCauXuatKho |  |
| Ma\_san\_pham (PK, FK) | *CHAR(15)* | FK → SanPham |  |
| So\_luong\_yeu\_cau | *INT* | NOT NULL | *Số lượng yêu cầu xuất* |

**Bảng: PhieuXuatKho**

\* Kế toán kho lập từ yêu cầu đã xác nhận tồn kho đủ.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_phieu\_xuat (PK)** | *CHAR(20)* | NOT NULL, UNIQUE | *PXK-2026-0101* |
| Ma\_yeu\_cau (FK) | *CHAR(20)* | FK → YeuCauXuatKho, NOT NULL | *Phát sinh từ yêu cầu nào* |
| Ma\_kho (FK) | *CHAR(10)* | FK → Kho, NOT NULL |  |
| Ma\_nguoi\_dung\_lap (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *Kế toán kho lập* |
| Ma\_nguoi\_dung\_phe\_duyet (FK) | *CHAR(10)* | FK → NguoiDung, NULL | *Quản lý kho duyệt* |
| Ngay\_lap | *DATE* | NOT NULL | *2026-04-10* |
| Ngay\_xuat\_thuc\_te | *DATE* |  | *2026-04-15* |
| Ghi\_chu | *NVARCHAR(500)* |  | *Xuất cảng Hải Phòng, giao FedEx* |
| Trang\_thai | *NVARCHAR(60)* | DEFAULT 'Cho phe duyet' | *Chờ PD / Đã PD / Từ chối / Đang vận chuyển / Hoàn tất* |
| Ly\_do\_tu\_choi | *NVARCHAR(500)* |  | *Điền khi trạng thái \= Từ chối* |
| Thoi\_gian\_xu\_ly | *DATETIME* |  | *Thời điểm Quản lý xử lý* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: ChiTietXuatKho**

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_xuat (PK, FK) | *CHAR(20)* | FK → PhieuXuatKho |  |
| Ma\_san\_pham (PK, FK) | *CHAR(15)* | FK → SanPham |  |
| So\_luong\_xuat | *INT* | NOT NULL | *Số lượng thực tế xuất* |
| Ghi\_chu | *NVARCHAR(300)* |  |  |

**Bảng: ChiTietXuatViTri**

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_xuat (PK, FK) | *CHAR(20)* | FK → PhieuXuatKho |  |
| Ma\_vi\_tri (PK, FK) | *CHAR(15)* | FK → ViTriTrongKho |  |
| Ma\_san\_pham (FK) | *CHAR(15)* | FK → SanPham, NOT NULL | *SP nào được lấy từ vị trí này* |
| So\_luong\_xuat\_tu\_vi\_tri | *INT* | NOT NULL | *Số lượng lấy từ vị trí này* |

**Bảng: ChiTietXuatSerial**

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_xuat (PK, FK) | *CHAR(20)* | FK → PhieuXuatKho |  |
| Ma\_serial (PK, FK) | *VARCHAR(50)* | FK → SoSerial |  |

## **Nhóm 6 – Kiểm kê & Điều chỉnh tồn kho**

**Bảng: PhieuKiemKe**

\* Kế toán kho tạo, quản lý duyệt. Sau khi duyệt, hệ thống gửi thông báo NV kho tiến hành đếm.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_phieu\_kiem\_ke (PK)** | *CHAR(20)* | NOT NULL, UNIQUE | *PKK-2026-001* |
| Ma\_kho (FK) | *CHAR(10)* | FK → Kho, NOT NULL |  |
| Ma\_nguoi\_dung\_lap (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *Kế toán kho lập* |
| Ma\_nguoi\_dung\_phe\_duyet (FK) | *CHAR(10)* | FK → NguoiDung, NULL | *Quản lý kho duyệt* |
| Ngay\_lap | *DATE* | NOT NULL | *2026-06-01* |
| Loai\_kiem\_ke | *NVARCHAR(60)* |  | *Toàn bộ / Chọn mẫu / Theo nhóm hàng* |
| Pham\_vi\_kiem\_ke | *NVARCHAR(300)* |  | *Toàn bộ kho / Chỉ bản lề laptop* |
| Thoi\_han\_hoan\_thanh | *DATE* |  | *2026-06-03* |
| Ghi\_chu | *NVARCHAR(500)* |  | *Kiểm kê nửa năm theo yêu cầu* |
| Trang\_thai | *NVARCHAR(60)* | DEFAULT 'Cho phe duyet' | *Chờ PD / Đang kiểm kê / Hoàn tất* |
| Ly\_do\_tu\_choi | *NVARCHAR(500)* |  | *Điền khi trạng thái \= Từ chối* |
| Thoi\_gian\_xu\_ly | *DATETIME* |  | *Thời điểm Quản lý xử lý* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: ChiTietKiemKe**

\* Đã bỏ thuộc tính So\_luong\_chenh\_lech vì đây là thuộc tính dẫn xuất (= So\_luong\_thuc\_te – So\_luong\_he\_thong), tính toán trực tiếp khi truy vấn thay vì lưu trong DB để tránh dư thừa dữ liệu và nguy cơ không nhất quán.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_kiem\_ke (PK, FK) | *CHAR(20)* | FK → PhieuKiemKe |  |
| Ma\_san\_pham (PK, FK) | *CHAR(15)* | FK → SanPham |  |
| So\_luong\_he\_thong | *INT* | DEFAULT 0 | *SL theo sổ sách hệ thống tại thời điểm lập phiếu* |
| So\_luong\_thuc\_te | *INT* | DEFAULT NULL | *SL nhân viên đếm thực tế (NULL \= chưa kiểm)* |
| Nguyen\_nhan | *NVARCHAR(300)* |  | *Hàng nhầm lô / mất mát…* |
| Ghi\_chu | *NVARCHAR(300)* |  |  |
| Trang\_thai\_kiem\_ke | *NVARCHAR(30)* | DEFAULT 'Chua kiem' | *Chưa kiểm / Đã kiểm / Có chênh lệch* |

\* Truy vấn chênh lệch: SELECT Ma\_san\_pham, So\_luong\_thuc\_te \- So\_luong\_he\_thong AS So\_luong\_chenh\_lech FROM ChiTietKiemKe WHERE Ma\_phieu\_kiem\_ke \= @ma

**Bảng: BienBanKiemKe**

\* 1:1 với PhieuKiemKe. Sau khi quản lý duyệt biên bản → hệ thống tự sinh PhieuDieuChinhTonKho.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_bien\_ban\_kk (PK)** | *CHAR(20)* | NOT NULL, UNIQUE | *BBKK-2026-001* |
| Ma\_phieu\_kiem\_ke (FK) | *CHAR(20)* | FK → PhieuKiemKe, UNIQUE | *Quan hệ 1:1 với phiếu kiểm kê* |
| Ma\_nguoi\_dung\_lap (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *Kế toán kho lập biên bản* |
| Ma\_nguoi\_dung\_phe\_duyet (FK) | *CHAR(10)* | FK → NguoiDung, NULL | *Quản lý kho duyệt* |
| Ngay\_lap | *DATE* | NOT NULL | *2026-06-03* |
| Ket\_luan | *NVARCHAR(500)* |  | *Khớp sổ sách / Thiếu 15 cái bản lề A* |
| Ghi\_chu | *NVARCHAR(500)* |  | *Chênh lệch do tính nhầm lô trước* |
| Trang\_thai | *NVARCHAR(50)* | DEFAULT 'Cho phe duyet' | *Chờ PD / Đã PD / Từ chối* |
| Ly\_do\_tu\_choi | *NVARCHAR(500)* |  |  |
| Thoi\_gian\_xu\_ly | *DATETIME* |  |  |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: PhieuDieuChinhTonKho**

\* Kế toán xác nhận → cập nhật TonKho và ghi lịch sử vào LichSuHoatDong.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| **Ma\_phieu\_dieu\_chinh (PK)** | *CHAR(20)* | NOT NULL, UNIQUE | *PDCTK-2026-001* |
| Ma\_bien\_ban\_kk (FK) | *CHAR(20)* | FK → BienBanKiemKe, NOT NULL | *Phát sinh từ biên bản nào* |
| Ma\_nguoi\_dung\_xac\_nhan (FK) | *CHAR(10)* | FK → NguoiDung, NOT NULL | *Kế toán xác nhận* |
| Ngay\_lap | *DATE* | NOT NULL | *2026-06-04* |
| Ly\_do\_dieu\_chinh | *NVARCHAR(500)* |  | *Kiểm kê phát hiện thiếu 15 bản lề A* |
| Ghi\_chu | *NVARCHAR(300)* |  |  |
| Trang\_thai | *NVARCHAR(50)* | DEFAULT 'Cho xac nhan' | *Chờ xác nhận / Đã xác nhận / Từ chối* |
| Thoi\_gian\_tao | *DATETIME* | DEFAULT GETDATE() |  |
| Thoi\_gian\_cap\_nhat | *DATETIME* | DEFAULT GETDATE() |  |

**Bảng: ChiTietDieuChinh**

\* Loai\_dieu\_chinh: Tăng hoặc Giảm. So\_luong\_dieu\_chinh là giá trị tuyệt đối dương.

| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Ví dụ |
| :---- | :---- | :---- | :---- |
| Ma\_phieu\_dieu\_chinh (PK, FK) | *CHAR(20)* | FK → PhieuDieuChinhTonKho |  |
| Ma\_san\_pham (PK, FK) | *CHAR(15)* | FK → SanPham |  |
| So\_luong\_dieu\_chinh | *INT* | NOT NULL, \> 0 | *Giá trị tuyệt đối dương* |
| Loai\_dieu\_chinh | *NVARCHAR(10)* | NOT NULL | *Tăng / Giảm* |

# **c) Mối quan hệ giữa các bảng**

Toàn bộ quan hệ được chia theo 6 nhóm chức năng. Các quan hệ N:N đều được thực hiện thông qua bảng trung gian.

| Bảng nguồn | Quan hệ | Bảng đích | Lực lượng | Ghi chú |
| :---- | ----- | :---- | ----- | :---- |
| NguoiDung | \<Có\> | TaiKhoan | 1 : 1 | Mỗi người có đúng 1 tài khoản đăng nhập |
| NguoiDung | \<Có\> | NguoiDung\_VaiTro | 1 : N | 1 người có nhiều vai trò |
| VaiTro | \<Có\> | NguoiDung\_VaiTro | 1 : N | 1 vai trò gán cho nhiều người |
| VaiTro | \<Có\> | VaiTro\_Quyen | 1 : N | 1 vai trò có nhiều quyền mặc định |
| Quyen | \<Thuộc\> | VaiTro\_Quyen | 1 : N | 1 quyền nằm trong nhiều vai trò |
| NguoiDung | \<Có\> | NguoiDung\_Quyen | 1 : N | Ghi đè quyền riêng cho người dùng cụ thể |
| Quyen | \<Áp dụng\> | NguoiDung\_Quyen | 1 : N | 1 quyền có thể ghi đè cho nhiều người |
| TaiKhoan | \<Ghi lại\> | LichSuHoatDong | 1 : N | 1 tài khoản có nhiều bản ghi nhật ký |
| NguoiDung | \<Phụ trách\> | NguoiDung\_Kho | 1 : N | N:N – 1 người phụ trách nhiều kho |
| Kho | \<Phụ trách\> | NguoiDung\_Kho | 1 : N | 1 kho có nhiều quản lý/kế toán/NV |
| Kho | \<Chứa\> | KhuVucKho | 1 : N | 1 kho có nhiều khu vực |
| KhuVucKho | \<Chứa\> | ViTriTrongKho | 1 : N | 1 khu vực có nhiều vị trí |
| DanhMucSanPham | \<Chứa\> | SanPham | 1 : N | 1 danh mục có nhiều sản phẩm |
| SanPham | \<Có\> | SoSerial | 1 : N | Chỉ áp dụng khi Quan\_ly\_theo\_serial \= 1 |
| SanPham | \<Tồn tại tại\> | TonKho | 1 : N | 1 SP có thể tồn ở nhiều vị trí |
| ViTriTrongKho | \<Lưu\> | TonKho | 1 : N | 1 vị trí lưu nhiều loại sản phẩm |
| Kho | \<Nhận\> | PhieuNhapKho | 1 : N | 1 kho có nhiều phiếu nhập |
| NguoiDung | \<Lập\> | PhieuNhapKho | 1 : N | NV kho lập phiếu |
| NguoiDung | \<Phê duyệt\> | PhieuNhapKho | 1 : N | Quản lý kho duyệt phiếu nhập |
| PhieuNhapKho | \<Gồm\> | ChiTietNhapKho | 1 : N | Thuộc tính: So\_luong\_nhap, So\_luong\_thuc\_te |
| SanPham | \<Trong\> | ChiTietNhapKho | 1 : N | N:N qua bảng chi tiết |
| PhieuNhapKho | \<Nhập vào\> | ChiTietNhapViTri | 1 : N | Ghi vị trí đặt hàng |
| ViTriTrongKho | \<Nhận\> | ChiTietNhapViTri | 1 : N | N:N qua bảng chi tiết |
| PhieuNhapKho | \<Ghi nhận\> | ChiTietNhapSerial | 1 : N | 1 phiếu nhập → nhiều serial |
| SoSerial | \<Được ghi nhận\> | ChiTietNhapSerial | 1 : N |  |
| PhieuNhapKho | \<Phát sinh\> | PhieuSuCo | 1 : N | 1 phiếu nhập có thể có nhiều sự cố |
| NguoiDung | \<Lập\> | PhieuSuCo | 1 : N | QC hoặc NV kho lập |
| Kho | \<Có\> | YeuCauXuatKho | 1 : N | Yêu cầu xuất thuộc kho nào |
| NguoiDung | \<Tạo\> | YeuCauXuatKho | 1 : N | Sales tạo yêu cầu |
| YeuCauXuatKho | \<Gồm\> | ChiTietYeuCau | 1 : N | N:N qua bảng chi tiết |
| SanPham | \<Trong\> | ChiTietYeuCau | 1 : N | Thuộc tính: So\_luong\_yeu\_cau |
| YeuCauXuatKho | \<Phát sinh\> | PhieuXuatKho | 1 : N | 1 yêu cầu → 1 phiếu xuất |
| Kho | \<Xuất\> | PhieuXuatKho | 1 : N |  |
| NguoiDung | \<Lập\> | PhieuXuatKho | 1 : N | Kế toán kho lập |
| NguoiDung | \<Phê duyệt\> | PhieuXuatKho | 1 : N | Quản lý kho duyệt |
| PhieuXuatKho | \<Gồm\> | ChiTietXuatKho | 1 : N | N:N qua bảng chi tiết |
| SanPham | \<Trong\> | ChiTietXuatKho | 1 : N | Thuộc tính: So\_luong\_xuat |
| PhieuXuatKho | \<Lấy từ\> | ChiTietXuatViTri | 1 : N | Ghi vị trí lấy hàng |
| ViTriTrongKho | \<Xuất\> | ChiTietXuatViTri | 1 : N | N:N qua bảng chi tiết |
| PhieuXuatKho | \<Ghi nhận\> | ChiTietXuatSerial | 1 : N | Serial được xuất kho |
| SoSerial | \<Được xuất\> | ChiTietXuatSerial | 1 : N |  |
| Kho | \<Kiểm kê tại\> | PhieuKiemKe | 1 : N |  |
| NguoiDung | \<Lập\> | PhieuKiemKe | 1 : N | Kế toán kho lập |
| NguoiDung | \<Phê duyệt\> | PhieuKiemKe | 1 : N | Quản lý kho duyệt |
| PhieuKiemKe | \<Gồm\> | ChiTietKiemKe | 1 : N | Thuộc tính: SL hệ thống, thực tế |
| SanPham | \<Trong\> | ChiTietKiemKe | 1 : N | Chênh lệch tính tại query |
| PhieuKiemKe | \<Phát sinh\> | BienBanKiemKe | 1 : 1 | 1 phiếu → 1 biên bản kiểm kê |
| NguoiDung | \<Phê duyệt\> | BienBanKiemKe | 1 : N | Quản lý kho duyệt biên bản |
| BienBanKiemKe | \<Phát sinh\> | PhieuDieuChinhTonKho | 1 : N | 1 biên bản → 1+ phiếu điều chỉnh |
| NguoiDung | \<Xác nhận\> | PhieuDieuChinhTonKho | 1 : N | Kế toán xác nhận điều chỉnh |
| PhieuDieuChinhTonKho | \<Điều chỉnh\> | ChiTietDieuChinh | 1 : N | N:N qua bảng chi tiết |
| SanPham | \<Được điều chỉnh\> | ChiTietDieuChinh | 1 : N | Thuộc tính: So\_luong, Loai\_dieu\_chinh |

# **d) Ghi chú thiết kế**

**Bỏ Loai\_kho khỏi bảng Kho**

Hệ thống được thiết kế chuyên biệt cho kho thành phẩm của FOSITEK, không cần quản lý nhiều loại kho (NVL, bán thành phẩm). Bỏ thuộc tính Loai\_kho giúp đơn giản hóa mô hình và tránh dư thừa thông tin không cần thiết.

**Thiết kế RBAC mở rộng**

Admin có thể tick chọn quyền (Quyen.Ma\_chuc\_nang) và gán vào VaiTro\_Quyen (mặc định theo vai trò) hoặc gán trực tiếp vào NguoiDung\_Quyen (ghi đè cá nhân).

Vai trò QC và Sale có La\_vai\_tro\_co\_dinh \= 1; quyền của họ ít và cố định.

Kiểm tra quyền tại runtime (ưu tiên ghi đè cá nhân trước):

1\. Tra NguoiDung\_Quyen WHERE Ma\_nguoi\_dung \= @userId: nếu có bản ghi Loai\_ghi\_de \= 'cap\_them' → cho phép; 'thu\_hoi' → từ chối.

2\. Nếu không có bản ghi ghi đè, tra VaiTro\_Quyen qua NguoiDung\_VaiTro.

**Tách bảng NguoiDung và TaiKhoan**

NguoiDung lưu hồ sơ nhân viên (tên, số điện thoại, trạng thái làm việc). TaiKhoan lưu thông tin đăng nhập (email, mật khẩu hash, trạng thái). Vai trò và chức danh được quản lý qua bảng VaiTro – không lưu trường chức vụ tự do trong NguoiDung để tránh dư thừa và không nhất quán với RBAC.

Quy trình tạo tài khoản mới: Admin (cần quyền tao\_tai\_khoan) tạo đồng thời 1 bản ghi NguoiDung và 1 bản ghi TaiKhoan, đặt mật khẩu tạm cho nhân viên. Cột Ma\_admin\_tao ghi nhận Admin nào tạo.

Quy trình vô hiệu hóa tài khoản: Admin (cần quyền vo\_hieu\_tai\_khoan) set Trang\_thai \= 0, điền Ly\_do\_vo\_hieu\_hoa, Ngay\_vo\_hieu\_hoa và Ma\_admin\_vo\_hieu. Hồ sơ NguoiDung giữ nguyên để bảo toàn toàn bộ lịch sử nhập/xuất/kiểm kê liên quan đến người đó.

Mỗi nhân viên có đúng 1 tài khoản (ràng buộc UNIQUE trên FK Ma\_nguoi\_dung trong TaiKhoan).

**Barcode vs. Serial**

Barcode (Ma\_barcode trong SanPham): Định danh loại hàng – tất cả sản phẩm cùng model chia sẻ 1 barcode. Hỗ trợ tính năng Mobile Scanner (quét nhanh khi nhập/xuất/kiểm kê) dự kiến phát triển sau.

Serial (SoSerial): Định danh đơn vị hàng riêng lẻ – chỉ áp dụng cho sản phẩm cao cấp cần truy xuất nguồn gốc. Hai cơ chế này bổ trợ nhau, không thay thế nhau.

**Bảng LichSuHoatDong (Audit Log)**

Bảng chỉ INSERT, không bao giờ UPDATE hoặc DELETE để đảm bảo tính toàn vẹn kiểm toán. PK dùng BIGINT IDENTITY thay vì CHAR để tối ưu hiệu năng ghi log tần suất cao. Du\_lieu\_cu và Du\_lieu\_moi lưu JSON snapshot giúp tra cứu lịch sử thay đổi chi tiết mà không cần bảng lịch sử riêng cho từng nghiệp vụ.

**\[THÊM MỚI\] Bảng NhatKyEmail (EmailLogs)**

Ghi nhật ký mọi email được hệ thống gửi đi, bao gồm cả trường hợp thành công và thất bại. Chỉ INSERT, không UPDATE/DELETE thủ công (Admin có thể xóa batch các bản ghi thất bại qua giao diện). Kết hợp với LichSuHoatDong để có cái nhìn đầy đủ về hoạt động hệ thống.

| Thuộc tính | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| Ma\_nhat\_ky *(\_id)* | INT | PK, AUTO\_INCREMENT | Khóa chính |
| Loai\_email *(type)* | ENUM | NOT NULL | welcome / adminReset / forgotPassword |
| Email\_nguoi\_nhan *(recipient)* | VARCHAR(255) | NOT NULL | Địa chỉ email người nhận |
| Tieu\_de *(subject)* | VARCHAR(500) | NOT NULL | Subject của email |
| Trang\_thai *(status)* | ENUM | NOT NULL, DEFAULT 'success' | success / failed |
| Thong\_bao\_loi *(errorMessage)* | TEXT | NULL | Mô tả lỗi SMTP nếu gửi thất bại |
| Ma\_nguoi\_dung *(userId)* | INT | NULL, FK → Users | User liên quan (nullable) |
| Nguoi\_trigger *(sentBy)* | VARCHAR(255) | NULL | Email admin hoặc 'system' |
| Thoi\_gian\_tao *(createdAt)* | DATETIME | NOT NULL, DEFAULT NOW() | Thời điểm ghi nhận |

*Không có updatedAt — bản ghi log không bao giờ bị sửa.*

Các loại email được ghi nhận:
- **welcome**: Admin tạo tài khoản mới → gửi email chào mừng kèm mật khẩu tạm
- **adminReset**: Admin nhấn "Đặt lại MK" → gửi email mật khẩu mới cho nhân viên
- **forgotPassword**: Nhân viên yêu cầu quên mật khẩu → gửi link đặt lại (60 phút)

**Xem xét Thoi\_gian\_tao / Thoi\_gian\_cap\_nhat theo từng bảng**

Có cả hai trường (bảng có vòng đời nghiệp vụ đầy đủ): Kho, KhuVucKho, ViTriTrongKho, DanhMucSanPham, SanPham, SoSerial, NguoiDung, TaiKhoan, VaiTro, Quyen, PhieuSuCo, YeuCauXuatKho, PhieuXuatKho, PhieuNhapKho, PhieuKiemKe, BienBanKiemKe, PhieuDieuChinhTonKho.

Chỉ có Thoi\_gian\_tao (bảng trung gian hoặc bảng chỉ ghi một lần): NguoiDung\_VaiTro, NguoiDung\_Kho, VaiTro\_Quyen, NguoiDung\_Quyen, ChiTietNhapSerial, ChiTietXuatSerial.

Không cần Thoi\_gian\_tao/cap\_nhat (bảng chi tiết phụ thuộc hoàn toàn vào phiếu cha, không tự thay đổi): ChiTietNhapKho, ChiTietNhapViTri, ChiTietYeuCau, ChiTietXuatKho, ChiTietXuatViTri, ChiTietKiemKe, ChiTietDieuChinh.

Bảng TonKho chỉ cần Ngay\_cap\_nhat (DATE) vì tồn kho thường được cập nhật nhiều lần trong ngày bởi trigger, không cần lưu thời gian tạo ban đầu.

Bảng LichSuHoatDong chỉ có Thoi\_gian\_thao\_tac (không có cap\_nhat vì là append-only).