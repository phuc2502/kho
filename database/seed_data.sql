-- ============================================================
--  FOSITEK WAREHOUSE MANAGEMENT SYSTEM
--  DỮ LIỆU MẪU (SEED DATA) – Chạy sau DB.sql
--
--  Công ty TNHH FOSITEK (Việt Nam)
--  Địa chỉ: Lô CN05, KCN Đồng Văn III, Hà Nam
--  Sản phẩm: Trục xoay (Hinge), Thanh ray/Cơ cấu trượt, MIM
--
--  Thứ tự chạy:
--    1. DB.sql          → Tạo bảng + dữ liệu Quyen & VaiTro
--    2. seed_data.sql   → Toàn bộ dữ liệu mẫu nghiệp vụ
-- ============================================================

USE DB_KHO;
GO

-- ============================================================
-- NHÓM 1 – PHÂN QUYỀN: VaiTro_Quyen
-- ============================================================

-- Admin (VT001): toàn quyền
INSERT INTO VaiTro_Quyen (Ma_vai_tro, Ma_quyen) VALUES
('VT001','Q001'),('VT001','Q002'),('VT001','Q003'),('VT001','Q004'),
('VT001','Q005'),('VT001','Q006'),('VT001','Q007'),('VT001','Q008'),
('VT001','Q009'),('VT001','Q010'),('VT001','Q011'),('VT001','Q012'),
('VT001','Q013'),('VT001','Q014');
GO

-- Quản lý kho (VT002): phê duyệt nhập/xuất/kiểm kê + xem tồn
INSERT INTO VaiTro_Quyen (Ma_vai_tro, Ma_quyen) VALUES
('VT002','Q002'),('VT002','Q005'),('VT002','Q008'),('VT002','Q011');
GO

-- Kế toán kho (VT003): lập phiếu nhập/xuất/kiểm kê, xác nhận điều chỉnh
INSERT INTO VaiTro_Quyen (Ma_vai_tro, Ma_quyen) VALUES
('VT003','Q001'),('VT003','Q004'),('VT003','Q007'),
('VT003','Q010'),('VT003','Q011');
GO

-- Nhân viên kho (VT004): lập phiếu nhập, xác nhận xuất hàng, nhập SL kiểm kê
INSERT INTO VaiTro_Quyen (Ma_vai_tro, Ma_quyen) VALUES
('VT004','Q001'),('VT004','Q006'),('VT004','Q009'),('VT004','Q011');
GO

-- QC (VT005): chỉ xem tồn kho (lập phiếu sự cố qua cơ chế riêng)
INSERT INTO VaiTro_Quyen (Ma_vai_tro, Ma_quyen) VALUES
('VT005','Q011');
GO

-- Sale (VT006): tạo yêu cầu xuất + xem tồn
INSERT INTO VaiTro_Quyen (Ma_vai_tro, Ma_quyen) VALUES
('VT006','Q003'),('VT006','Q011');
GO

-- ============================================================
-- NHÓM 1 – NGƯỜI DÙNG (NguoiDung)
-- ============================================================
-- Mật khẩu mặc định: Fositek@2026 (bcrypt hash trong thực tế)

INSERT INTO NguoiDung (Ma_nguoi_dung, Ten_nguoi_dung, So_dien_thoai, Trang_thai, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('ND001', N'Nguyễn Thành Đạt',  '0836417501', 1, '2025-01-10 08:00:00', '2025-01-10 08:00:00'),
('ND002', N'Vũ Xuân Hoàng',     '0836417502', 1, '2025-01-10 08:30:00', '2025-01-10 08:30:00'),
('ND003', N'Trần Thị Lan Anh',  '0836417503', 1, '2025-01-10 08:45:00', '2025-01-10 08:45:00'),
('ND004', N'Phạm Văn Tuấn',     '0836417504', 1, '2025-01-10 09:00:00', '2025-01-10 09:00:00'),
('ND005', N'Lê Quang Hưng',     '0836417505', 1, '2025-01-10 09:15:00', '2025-01-10 09:15:00'),
('ND006', N'Đỗ Thị Ngọc',       '0836417506', 1, '2025-01-10 09:30:00', '2025-01-10 09:30:00'),
('ND007', N'Nguyễn Mạnh Cường', '0836417507', 1, '2025-01-10 09:45:00', '2025-01-10 09:45:00'),
('ND008', N'Bùi Thị Hằng',      '0836417508', 1, '2025-02-01 08:00:00', '2025-02-01 08:00:00');
GO

-- ============================================================
-- NHÓM 1 – TÀI KHOẢN (TaiKhoan)
-- Mat_khau: bcrypt hash của 'Fositek@2026'
-- ============================================================

INSERT INTO TaiKhoan (Ma_tai_khoan, Ma_nguoi_dung, Email, Mat_khau, Trang_thai, Ma_admin_tao, Ngay_dang_nhap_cuoi, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('TK001','ND001','admin@fositek.vn',       '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaJqetJBMd0D4uMtMSovkBl3e', 1,'ND001','2026-06-09 07:45:00','2025-01-10 08:05:00','2026-06-09 07:45:00'),
('TK002','ND002','hoang.vu@fositek.vn',    '$2b$10$M9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL56y5c2', 1,'ND001','2026-06-10 07:52:00','2025-01-10 08:35:00','2026-06-10 07:52:00'),
('TK003','ND003','lan.tran@fositek.vn',    '$2b$10$N8rp9vMPjdlhx3ANSTbNzfKaHBgflYq01mlhFIzbe79MUSpwmCd3f', 1,'ND001','2026-06-09 08:10:00','2025-01-10 08:50:00','2026-06-09 08:10:00'),
('TK004','ND004','tuan.pham@fositek.vn',   '$2b$10$O7sq0wNQkeliy4BOTUcOAgLbICheml8r03miFJace80NVTqxn1e4g', 1,'ND001','2026-06-10 07:58:00','2025-01-10 09:05:00','2026-06-10 07:58:00'),
('TK005','ND005','hung.le@fositek.vn',     '$2b$10$P6tr1xORljmjz5CPUVdPBhMcJDifnm9s14njGKbdf91OWUryo2f5h', 1,'ND001','2026-06-09 08:01:00','2025-01-10 09:20:00','2026-06-09 08:01:00'),
('TK006','ND006','ngoc.do@fositek.vn',     '$2b$10$Q5us2yPSkmlo06DQVWePCiNdKEjgon0t25okHLceg02PXVszp3g6i', 1,'ND001','2026-06-08 14:22:00','2025-01-10 09:35:00','2026-06-08 14:22:00'),
('TK007','ND007','cuong.nguyen@fositek.vn','$2b$10$R4vt3zQTlnmp17ERWXfQDjOeLekhpo1u36plIMdfh13QYWtap4h7j', 1,'ND001','2026-06-10 08:05:00','2025-01-10 09:50:00','2026-06-10 08:05:00'),
('TK008','ND008','hang.bui@fositek.vn',    '$2b$10$S3wu4ARUmoqn28FSXYgREkPfMfliop2v47qmJNegi24RZXubq5i8k', 1,'ND001','2026-06-09 08:30:00','2025-02-01 08:10:00','2026-06-09 08:30:00');
GO

-- ============================================================
-- NHÓM 1 – GÁN VAI TRÒ (NguoiDung_VaiTro)
-- ============================================================

INSERT INTO NguoiDung_VaiTro (Ma_nguoi_dung, Ma_vai_tro, Thoi_gian_tao)
VALUES
('ND001','VT001','2025-01-10 08:05:00'),   -- Đạt → Admin
('ND002','VT002','2025-01-10 08:35:00'),   -- Hoàng → Quản lý kho
('ND003','VT003','2025-01-10 08:50:00'),   -- Lan Anh → Kế toán kho
('ND004','VT004','2025-01-10 09:05:00'),   -- Tuấn → Nhân viên kho
('ND005','VT004','2025-01-10 09:20:00'),   -- Hưng → Nhân viên kho
('ND006','VT005','2025-01-10 09:35:00'),   -- Ngọc → QC
('ND007','VT006','2025-01-10 09:50:00'),   -- Cường → Sale
('ND008','VT003','2025-02-01 08:10:00');   -- Hằng → Kế toán kho
GO

-- ============================================================
-- NHÓM 1 – GHI ĐÈ QUYỀN CÁ NHÂN (NguoiDung_Quyen)
-- ============================================================

INSERT INTO NguoiDung_Quyen (Ma_nguoi_dung, Ma_quyen, Loai_ghi_de, Ly_do, Thoi_gian_tao)
VALUES
-- ND008 (Hằng – Kế toán kho 2) KHÔNG được tạo phiếu nhập kho (phân công rõ ràng)
('ND008','Q001',N'thu_hoi',  N'Kế toán Hằng chuyên phụ trách xuất kho và kiểm kê, không xử lý nhập kho', '2025-02-01 08:15:00'),
-- ND004 (Tuấn – NV kho) được cấp thêm quyền lập phiếu kiểm kê hỗ trợ khi kế toán vắng
('ND004','Q007',N'cap_them', N'Nhân viên Tuấn hỗ trợ lập phiếu kiểm kê khi kế toán nghỉ phép',           '2025-06-15 10:00:00');
GO

-- ============================================================
-- NHÓM 2 – KHO (Kho)
-- ============================================================

INSERT INTO Kho (Ma_kho, Ten_kho, Mo_ta, Dia_chi, Trang_thai, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('K001',
 N'Kho thành phẩm FOSITEK – Hà Nam',
 N'Kho lưu trữ thành phẩm chờ xuất khẩu: bản lề laptop, thanh trượt và sản phẩm MIM',
 N'Lô CN05, Khu công nghiệp Đồng Văn III, Phường Hoàng Đông, TX Duy Tiên, Hà Nam',
 1,
 '2025-01-05 07:00:00',
 '2025-01-05 07:00:00');
GO

-- ============================================================
-- NHÓM 2 – PHÂN CÔNG KHO (NguoiDung_Kho)
-- ============================================================

INSERT INTO NguoiDung_Kho (Ma_nguoi_dung, Ma_kho, Vai_tro_tai_kho, Thoi_gian_tao)
VALUES
('ND002','K001',N'Quản lý',     '2025-01-10 08:35:00'),
('ND003','K001',N'Kế toán',     '2025-01-10 08:50:00'),
('ND004','K001',N'Nhân viên',   '2025-01-10 09:05:00'),
('ND005','K001',N'Nhân viên',   '2025-01-10 09:20:00'),
('ND008','K001',N'Kế toán',     '2025-02-01 08:10:00');
GO

-- ============================================================
-- NHÓM 2 – KHU VỰC KHO (KhuVucKho)
-- ============================================================

INSERT INTO KhuVucKho (Ma_khu_vuc, Ma_kho, Ten_khu_vuc, Mo_ta, Trang_thai, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('KV001','K001',N'Khu A – Trục xoay',   N'Khu lưu trữ trục xoay laptop (hinge) 360° và 180°, nhiệt độ phòng, diện tích 400m²', 1,'2025-01-05 07:30:00','2025-01-05 07:30:00'),
('KV002','K001',N'Khu B – Thanh trượt',N'Khu lưu trữ thanh ray dẫn hướng và cơ cấu trượt 2-in-1, nhiệt độ phòng, 500m²',    1,'2025-01-05 07:30:00','2025-01-05 07:30:00'),
('KV003','K001',N'Khu C – MIM',        N'Khu lưu trữ sản phẩm kim loại cứng MIM, kiểm soát độ ẩm chặt, 200m²',       1,'2025-01-05 07:30:00','2025-01-05 07:30:00');
GO

-- ============================================================
-- NHÓM 2 – VỊ TRÍ TRONG KHO (ViTriTrongKho)
-- Quy tắc mã: VT-{Khu}{Kệ}-{Hàng}
-- ============================================================

INSERT INTO ViTriTrongKho (Ma_vi_tri, Ma_khu_vuc, Ten_vi_tri, Mo_ta, Suc_chua_toi_da, Trang_thai, Thoi_gian_cap_nhat)
VALUES
-- Khu A – Trục xoay (3 vị trí)
('VT-A1-01','KV001',N'Kệ A1, Hàng 1',N'Sát tường trái, gần cửa nhập, ưu tiên FIFO – trục xoay 360° FST-H360-14',    1000,N'Sẵn sàng','2025-01-05 08:00:00'),
('VT-A1-02','KV001',N'Kệ A1, Hàng 2',N'Tầng 2 kệ A1, hàng chờ xuất – trục xoay 360° FST-H360-14',                   1000,N'Sẵn sàng','2025-01-05 08:00:00'),
('VT-A2-01','KV001',N'Kệ A2, Hàng 1',N'Kệ phụ khu A, lưu trục xoay 180° FST-H180-156',                               800, N'Sẵn sàng','2025-01-05 08:00:00'),
-- Khu B – Thanh trượt (3 vị trí)
('VT-B1-01','KV002',N'Kệ B1, Hàng 1',N'Kệ trung tâm khu B, thanh ray dẫn hướng FST-SLK-380',                         2000,N'Sẵn sàng','2025-01-05 08:00:00'),
('VT-B1-02','KV002',N'Kệ B1, Hàng 2',N'Tầng 2 kệ B1, dự trữ FST-SLK-380',                                            2000,N'Sẵn sàng','2025-01-05 08:00:00'),
('VT-B2-01','KV002',N'Kệ B2, Hàng 1',N'Kệ B2 cao cấp, cơ cấu trượt 2-in-1 FST-SL2IN1-135',                          1500,N'Sẵn sàng','2025-01-05 08:00:00'),
-- Khu C – MIM (2 vị trí)
('VT-C1-01','KV003',N'Kệ C1, Hàng 1',N'Giá đỡ bản lề MIM FST-MIM-HB14, kiểm soát nhiệt độ 18-22°C',                 500, N'Sẵn sàng','2025-01-05 08:00:00'),
('VT-C1-02','KV003',N'Kệ C1, Hàng 2',N'Khung viền camera MIM FST-MIM-CB01, tách biệt để tránh xước bề mặt PVD',      300, N'Sẵn sàng','2025-01-05 08:00:00');
GO

-- ============================================================
-- NHÓM 3 – DANH MỤC SẢN PHẨM (DanhMucSanPham)
-- ============================================================

INSERT INTO DanhMucSanPham (Ma_danh_muc, Ten_danh_muc, Mo_ta, Trang_thai, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('DM001',N'Trục xoay máy tính (Bản lề)',
         N'Linh kiện trục xoay (hinge) dùng cho màn hình laptop: loại 360° cho dòng 2-in-1 convertible và loại 180° cho laptop thông thường. Vật liệu: hợp kim kẽm, thép không gỉ.',
         1,'2025-01-05 08:30:00','2025-01-05 08:30:00'),
('DM002',N'Thanh trượt máy tính (Slide Rail)',
         N'Thanh ray và cơ cấu trượt dùng trong cụm bàn phím và khung màn hình laptop. Gồm ray dẫn hướng tuyến tính và cơ cấu định vị góc cho dòng 2-in-1.',
         1,'2025-01-05 08:30:00','2025-01-05 08:30:00'),
('DM003',N'Linh kiện MIM (Kim loại đúc áp lực)',
         N'Các chi tiết kim loại chính xác cao được sản xuất bằng công nghệ Metal Injection Molding (MIM): giá đỡ bản lề, khung viền camera, nẹp kết cấu. Quản lý theo serial do giá trị cao và yêu cầu truy xuất nguồn gốc.',
         1,'2025-01-05 08:30:00','2025-01-05 08:30:00');
GO

-- ============================================================
-- NHÓM 3 – SẢN PHẨM (SanPham)
-- ============================================================

INSERT INTO SanPham (Ma_san_pham, Ma_danh_muc, Ten_san_pham, Ma_barcode, Mo_ta, Don_vi_tinh, Trong_luong, Gia_san_xuat, Gia_ban, Quan_ly_theo_serial, Trang_thai, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
-- ── DM001: Trục xoay (Hinge) – sản xuất hàng loạt, không cần serial ──────────
-- SP001: Trục xoay 360° cho laptop convertible 14"
('SP001','DM001',
 N'Trục xoay 360° FST-H360-14',
 'FST-H360-14-001',
 N'Trục xoay (hinge) xoay tròn 360° dùng cho laptop convertible/2-in-1 màn hình 14 inch. Vật liệu: hợp kim kẽm ZA-8 + chốt thép không gỉ SUS304. Mô-men xoắn: 1.8 N·m. Độ bền: 30.000 chu kỳ. Khách hàng: Samsung Galaxy Book Flex, HP Envy x360.',
 N'Cái', 0.042, 18000.00, 30000.00, 0, 1,'2025-01-05 09:00:00','2025-01-05 09:00:00'),

-- SP002: Trục xoay 180° cho laptop thông thường 15.6"
('SP002','DM001',
 N'Trục xoay 180° FST-H180-156',
 'FST-H180-156-001',
 N'Trục xoay (hinge) xoay 180° dùng cho laptop thông thường màn hình 15.6 inch. Vật liệu: hợp kim kẽm ZA-8. Mô-men xoắn: 1.2 N·m. Độ bền: 20.000 chu kỳ. Khách hàng: Dell Inspiron 15, Asus VivoBook 15.',
 N'Cái', 0.038, 13500.00, 22000.00, 0, 1,'2025-01-05 09:00:00','2025-01-05 09:00:00'),

-- ── DM002: Thanh trượt (Slide Rail) – không cần serial ───────────────────────
-- SP003: Thanh ray dẫn hướng bàn phím 380mm
('SP003','DM002',
 N'Thanh ray dẫn hướng bàn phím FST-SLK-380',
 'FST-SLK-380-001',
 N'Thanh ray dẫn hướng (keyboard slide rail) dài 380mm dùng trong cụm bàn phím laptop. Vật liệu: thép không gỉ SUS301, gia công CNC. Hành trình trượt: 8mm. Lực trượt: 0.3–0.5N. Độ bền: 50.000 chu kỳ.',
 N'Bộ', 0.095, 28000.00, 46000.00, 0, 1,'2025-01-05 09:00:00','2025-01-05 09:00:00'),

-- SP004: Cơ cấu trượt định vị 2-in-1
('SP004','DM002',
 N'Cơ cấu trượt định vị 2-in-1 FST-SL2IN1-135',
 'FST-SL2IN1-135-001',
 N'Cơ cấu trượt và định vị góc cho laptop 2-in-1 có thể tháo rời bàn phím. Vật liệu: nhôm hợp kim 6061-T6. Góc dừng: 0°–135°. Lực giữ: 2.5N. Độ bền: 100.000 chu kỳ. Khách hàng: Dell XPS Detachable, HP Elite Dragonfly.',
 N'Bộ', 0.148, 58000.00, 92000.00, 0, 1,'2025-01-05 09:00:00','2025-01-05 09:00:00'),

-- ── DM003: Linh kiện MIM – giá trị cao, quản lý theo serial ─────────────────
-- SP005: Giá đỡ bản lề MIM cho laptop 14" (Hinge Bracket)
('SP005','DM003',
 N'Giá đỡ bản lề MIM FST-MIM-HB14',
 'FST-MIM-HB14-001',
 N'Chi tiết giá đỡ (hinge bracket) nối trục xoay vào khung máy laptop 14", sản xuất bằng công nghệ MIM. Vật liệu: thép không gỉ 17-4PH (H900). Kích thước: 38×22×4mm. Xử lý bề mặt: black oxide + dầu chống gỉ. Dung sai: ±0.05mm. Yêu cầu truy xuất nguồn gốc từng chiếc.',
 N'Cái', 0.072, 105000.00, 162000.00, 1, 1,'2025-01-05 09:00:00','2025-01-05 09:00:00'),

-- SP006: Khung viền camera MIM (Camera Bezel Frame)
('SP006','DM003',
 N'Khung viền camera MIM FST-MIM-CB01',
 'FST-MIM-CB01-001',
 N'Khung gắn và bảo vệ module camera laptop (camera bezel frame), sản xuất bằng MIM. Vật liệu: thép không gỉ 316L. Kích thước: 25×8×3mm. Xử lý bề mặt: electropolish + phủ PVD đen. Dung sai: ±0.03mm. Quản lý serial để kiểm soát lô và truy xuất lỗi.',
 N'Cái', 0.028, 88000.00, 136000.00, 1, 1,'2025-01-05 09:00:00','2025-01-05 09:00:00');
GO

-- ============================================================
-- NHÓM 3 – SỐ SERIAL (SoSerial)
-- SP005: 10 serial (3 đã xuất, 7 trong kho)
-- SP006:  5 serial (tất cả trong kho)
-- ============================================================

INSERT INTO SoSerial (Ma_serial, Ma_san_pham, Trang_thai, Ngay_san_xuat, Ghi_chu, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
-- Giá đỡ bản lề MIM FST-MIM-HB14 (SP005) – 10 serial lô tháng 3/2026
('SN-2026-M001','SP005',N'Đã xuất',  '2026-03-05',NULL,                                    '2026-03-10 10:00:00','2026-05-22 14:30:00'),
('SN-2026-M002','SP005',N'Đã xuất',  '2026-03-05',NULL,                                    '2026-03-10 10:00:00','2026-05-22 14:30:00'),
('SN-2026-M003','SP005',N'Đã xuất',  '2026-03-05',NULL,                                    '2026-03-10 10:00:00','2026-05-22 14:30:00'),
('SN-2026-M004','SP005',N'Trong kho','2026-03-05',NULL,                                    '2026-03-10 10:00:00','2026-03-10 10:00:00'),
('SN-2026-M005','SP005',N'Trong kho','2026-03-05',NULL,                                    '2026-03-10 10:00:00','2026-03-10 10:00:00'),
('SN-2026-M006','SP005',N'Trong kho','2026-03-05',NULL,                                    '2026-03-10 10:00:00','2026-03-10 10:00:00'),
('SN-2026-M007','SP005',N'Trong kho','2026-03-05',NULL,                                    '2026-03-10 10:00:00','2026-03-10 10:00:00'),
('SN-2026-M008','SP005',N'Trong kho','2026-03-06',NULL,                                    '2026-03-10 10:00:00','2026-03-10 10:00:00'),
('SN-2026-M009','SP005',N'Trong kho','2026-03-06',NULL,                                    '2026-03-10 10:00:00','2026-03-10 10:00:00'),
('SN-2026-M010','SP005',N'Trong kho','2026-03-06',NULL,                                    '2026-03-10 10:00:00','2026-03-10 10:00:00'),
-- Khung viền camera MIM FST-MIM-CB01 (SP006) – 5 serial lô tháng 3/2026
('SN-2026-K001','SP006',N'Trong kho','2026-03-07',NULL,                                    '2026-03-10 10:30:00','2026-03-10 10:30:00'),
('SN-2026-K002','SP006',N'Trong kho','2026-03-07',NULL,                                    '2026-03-10 10:30:00','2026-03-10 10:30:00'),
('SN-2026-K003','SP006',N'Trong kho','2026-03-07',NULL,                                    '2026-03-10 10:30:00','2026-03-10 10:30:00'),
('SN-2026-K004','SP006',N'Trong kho','2026-03-08',N'Bề mặt đạt chuẩn, kiểm tra kỹ trước xuất','2026-03-10 10:30:00','2026-03-10 10:30:00'),
('SN-2026-K005','SP006',N'Trong kho','2026-03-08',NULL,                                    '2026-03-10 10:30:00','2026-03-10 10:30:00');
GO

-- ============================================================
-- NHÓM 4 – PHIẾU NHẬP KHO (PhieuNhapKho) – 5 phiếu
-- ============================================================

INSERT INTO PhieuNhapKho (Ma_phieu_nhap, Ma_kho, Ma_nguoi_dung_lap, Ma_nguoi_dung_phe_duyet, Ngay_lap, Ngay_nhap_thuc_te, Ghi_chu, Trang_thai, Ly_do_tu_choi, Thoi_gian_xu_ly, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
-- PNK-0001: Lô nhập đầu tiên (tháng 1/2026) – Đã duyệt
('PNK-2026-0001','K001','ND004','ND002',
 '2026-01-15','2026-01-16',
 N'Lô hàng đầu năm 2026: trục xoay 360° FST-H360-14 và 180° FST-H180-156 từ dây chuyền sản xuất tháng 1',
 N'Đã phê duyệt',NULL,'2026-01-16 09:30:00','2026-01-15 16:00:00','2026-01-16 09:30:00'),

-- PNK-0002: Lô nhập tháng 2/2026 – Đã duyệt
('PNK-2026-0002','K001','ND004','ND002',
 '2026-02-20','2026-02-21',
 N'Lô thanh ray FST-SLK-380 và cơ cấu trượt FST-SL2IN1-135 từ dây chuyền sản xuất tháng 2',
 N'Đã phê duyệt',NULL,'2026-02-21 10:00:00','2026-02-20 15:30:00','2026-02-21 10:00:00'),

-- PNK-0003: Lô MIM tháng 3/2026 – Đã duyệt (sản phẩm có serial)
('PNK-2026-0003','K001','ND005','ND002',
 '2026-03-10','2026-03-11',
 N'Lô sản phẩm MIM tháng 3: giá đỡ bản lề FST-MIM-HB14 và khung viền camera FST-MIM-CB01 – quản lý theo serial',
 N'Đã phê duyệt',NULL,'2026-03-11 09:00:00','2026-03-10 14:00:00','2026-03-11 09:00:00'),

-- PNK-0004: Lô nhập tháng 5/2026 – Chờ phê duyệt
('PNK-2026-0004','K001','ND004',NULL,
 '2026-05-05',NULL,
 N'Lô bổ sung trục xoay 360° FST-H360-14 và thanh ray FST-SLK-380 tháng 5 – đang chờ quản lý duyệt',
 N'Chờ phê duyệt',NULL,NULL,'2026-05-05 16:30:00','2026-05-05 16:30:00'),

-- PNK-0005: Lô nhập tháng 4/2026 – Đã từ chối (phát hiện hàng không đúng spec)
('PNK-2026-0005','K001','ND005','ND002',
 '2026-04-20',NULL,
 N'Lô trục xoay 180° FST-H180-156 tháng 4 – cần kiểm tra lại spec kỹ thuật',
 N'Từ chối',N'Trục xoay 180° FST-H180-156 không đạt tiêu chuẩn mô-men xoắn 1.2 N·m, chỉ đạt 0.8 N·m theo kết quả QC. Trả lại dây chuyền để điều chỉnh.','2026-04-21 11:00:00','2026-04-20 15:00:00','2026-04-21 11:00:00');
GO

-- ============================================================
-- NHÓM 4 – CHI TIẾT NHẬP KHO (ChiTietNhapKho)
-- ============================================================

INSERT INTO ChiTietNhapKho (Ma_phieu_nhap, Ma_san_pham, So_luong_nhap, So_luong_thuc_te, Ghi_chu)
VALUES
-- PNK-0001: SP001 (500), SP002 (300)
('PNK-2026-0001','SP001', 500, 495, N'Đếm 10%: phát hiện 5 cái bị xước nhẹ bề mặt – đã lập phiếu sự cố PSC-2026-001'),
('PNK-2026-0001','SP002', 300, 300, NULL),
-- PNK-0002: SP003 (1000), SP004 (300)
('PNK-2026-0002','SP003',1000,1000, NULL),
('PNK-2026-0002','SP004', 300, 300, NULL),
-- PNK-0003: SP005 (10), SP006 (5) – quản lý serial
('PNK-2026-0003','SP005',  10,  10, N'Nhập theo serial SN-2026-M001 đến SN-2026-M010'),
('PNK-2026-0003','SP006',   5,   5, N'Nhập theo serial SN-2026-K001 đến SN-2026-K005'),
-- PNK-0004: SP001 (200), SP003 (500) – chờ duyệt
('PNK-2026-0004','SP001', 200,   0, N'Chưa nhập thực tế – chờ phê duyệt'),
('PNK-2026-0004','SP003', 500,   0, N'Chưa nhập thực tế – chờ phê duyệt'),
-- PNK-0005: SP002 (150) – từ chối
('PNK-2026-0005','SP002', 150,   0, N'Không nhận hàng – phiếu bị từ chối do hàng không đạt spec');
GO

-- ============================================================
-- NHÓM 4 – CHI TIẾT NHẬP VỊ TRÍ (ChiTietNhapViTri)
-- Chỉ các phiếu đã được duyệt và hàng đã vào kho
-- ============================================================

INSERT INTO ChiTietNhapViTri (Ma_phieu_nhap, Ma_vi_tri, Ma_san_pham, So_luong_nhap_vao_vi_tri)
VALUES
-- PNK-0001: SP001 → 300 vào VT-A1-01 + 200 vào VT-A1-02; SP002 → 300 vào VT-A2-01
('PNK-2026-0001','VT-A1-01','SP001',300),
('PNK-2026-0001','VT-A1-02','SP001',200),
('PNK-2026-0001','VT-A2-01','SP002',300),
-- PNK-0002: SP003 → 600 vào VT-B1-01 + 400 vào VT-B1-02; SP004 → 300 vào VT-B2-01
('PNK-2026-0002','VT-B1-01','SP003',600),
('PNK-2026-0002','VT-B1-02','SP003',400),
('PNK-2026-0002','VT-B2-01','SP004',300),
-- PNK-0003: SP005 → VT-C1-01; SP006 → VT-C1-02
('PNK-2026-0003','VT-C1-01','SP005', 10),
('PNK-2026-0003','VT-C1-02','SP006',  5);
GO

-- ============================================================
-- NHÓM 4 – CHI TIẾT NHẬP SERIAL (ChiTietNhapSerial)
-- ============================================================

INSERT INTO ChiTietNhapSerial (Ma_phieu_nhap, Ma_serial, Thoi_gian_tao)
VALUES
('PNK-2026-0003','SN-2026-M001','2026-03-11 09:10:00'),
('PNK-2026-0003','SN-2026-M002','2026-03-11 09:10:00'),
('PNK-2026-0003','SN-2026-M003','2026-03-11 09:10:00'),
('PNK-2026-0003','SN-2026-M004','2026-03-11 09:10:00'),
('PNK-2026-0003','SN-2026-M005','2026-03-11 09:10:00'),
('PNK-2026-0003','SN-2026-M006','2026-03-11 09:10:00'),
('PNK-2026-0003','SN-2026-M007','2026-03-11 09:10:00'),
('PNK-2026-0003','SN-2026-M008','2026-03-11 09:15:00'),
('PNK-2026-0003','SN-2026-M009','2026-03-11 09:15:00'),
('PNK-2026-0003','SN-2026-M010','2026-03-11 09:15:00'),
('PNK-2026-0003','SN-2026-K001','2026-03-11 09:20:00'),
('PNK-2026-0003','SN-2026-K002','2026-03-11 09:20:00'),
('PNK-2026-0003','SN-2026-K003','2026-03-11 09:20:00'),
('PNK-2026-0003','SN-2026-K004','2026-03-11 09:20:00'),
('PNK-2026-0003','SN-2026-K005','2026-03-11 09:20:00');
GO

-- ============================================================
-- NHÓM 4 – PHIẾU SỰ CỐ (PhieuSuCo)
-- ============================================================

INSERT INTO PhieuSuCo (Ma_phieu_su_co, Ma_phieu_nhap, Ma_nguoi_dung_lap, Ngay_lap, Loai_su_co, Mo_ta, So_luong_su_co, Trang_thai_xu_ly, Ghi_chu, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
-- PSC-001: QC phát hiện 5 trục xoay SP001 bị xước trong lô PNK-0001
('PSC-2026-001','PNK-2026-0001','ND006',
 '2026-01-16',N'Hàng lỗi',
 N'QC phát hiện 5 cái trục xoay 360° FST-H360-14 (SP001) bị xước nhẹ bề mặt trong quá trình kiểm tra lô nhập. Nguyên nhân: đóng gói không đủ đệm bảo vệ từ dây chuyền sản xuất.',
 5,N'Đã giải quyết',
 N'Đã trả lại dây chuyền để tái chế. Nhà sản xuất cam kết cải thiện quy trình đóng gói từ lô tiếp theo.',
 '2026-01-16 10:00:00','2026-01-20 14:00:00'),

-- PSC-002: Sai lệch số lượng phát hiện khi kiểm kê (liên kết PNK-0002)
('PSC-2026-002','PNK-2026-0002','ND004',
 '2026-03-01',N'Sai lệch số lượng',
 N'Nhân viên kho phát hiện thiếu 3 bộ thanh ray dẫn hướng FST-SLK-380 (SP003) so với hệ thống khi đối chiếu tồn kho định kỳ đầu tháng 3.',
 3,N'Đang xử lý',
 N'Đang đối chiếu với biên bản nhập kho gốc và báo cáo với Quản lý kho để xử lý.',
 '2026-03-01 09:00:00','2026-03-01 09:00:00');
GO

-- ============================================================
-- NHÓM 5 – YÊU CẦU XUẤT KHO (YeuCauXuatKho) – 4 yêu cầu
-- ============================================================

INSERT INTO YeuCauXuatKho (Ma_yeu_cau, Ma_kho, Ma_nguoi_dung_tao, Ngay_tao, Ten_khach_hang, Thoi_gian_giao_hang_du_kien, Ghi_chu, Trang_thai, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
-- YCX-0001: Samsung – trục xoay 360° (đã xử lý)
('YCX-2026-0001','K001','ND007','2026-02-01',
 N'Samsung Electronics Vietnam Co., Ltd',
 '2026-02-08 08:00:00',
 N'Đơn hàng Samsung tháng 2. Đóng gói tem tiếng Anh, pallet 50x50cm. Giao cảng Hải Phòng.',
 N'Đã xử lý','2026-02-01 10:00:00','2026-02-08 15:00:00'),

-- YCX-0002: Foxconn – thanh trượt (đã xử lý)
('YCX-2026-0002','K001','ND007','2026-03-15',
 N'Foxconn Technology Vietnam Co., Ltd',
 '2026-03-22 08:00:00',
 N'Đơn hàng Foxconn tháng 3. Thanh ray FST-SLK-380 và cơ cấu trượt FST-SL2IN1-135. Giao nhà máy Foxconn Bắc Ninh.',
 N'Đã xử lý','2026-03-15 09:00:00','2026-03-22 17:00:00'),

-- YCX-0003: HP Vietnam – MIM có serial (đã xử lý)
('YCX-2026-0003','K001','ND007','2026-05-20',
 N'HP Vietnam Technology Manufacturing Co., Ltd',
 '2026-05-25 08:00:00',
 N'Đơn hàng HP – 3 giá đỡ bản lề MIM FST-MIM-HB14 mẫu thử cho dự án laptop thế hệ mới. Yêu cầu bao bì chống tĩnh điện.',
 N'Đã xử lý','2026-05-20 10:30:00','2026-05-25 14:00:00'),

-- YCX-0004: Dell – trục xoay + thanh ray (chờ xử lý – đơn đặt mới nhất)
('YCX-2026-0004','K001','ND007','2026-06-05',
 N'Dell EMC Vietnam Technology Co., Ltd',
 '2026-06-15 08:00:00',
 N'Đơn hàng Dell tháng 6. Trục xoay 360° FST-H360-14 và thanh ray FST-SLK-380 cho dòng XPS thế hệ mới. Đang chờ kế toán lập phiếu xuất.',
 N'Chờ xử lý','2026-06-05 11:00:00','2026-06-05 11:00:00');
GO

-- ============================================================
-- NHÓM 5 – CHI TIẾT YÊU CẦU XUẤT (ChiTietYeuCau)
-- ============================================================

INSERT INTO ChiTietYeuCau (Ma_yeu_cau, Ma_san_pham, So_luong_yeu_cau)
VALUES
-- YCX-0001: Samsung
('YCX-2026-0001','SP001',200),
('YCX-2026-0001','SP002',100),
-- YCX-0002: Foxconn
('YCX-2026-0002','SP003',300),
('YCX-2026-0002','SP004',100),
-- YCX-0003: HP
('YCX-2026-0003','SP005',  3),
-- YCX-0004: Dell
('YCX-2026-0004','SP001',100),
('YCX-2026-0004','SP003',200);
GO

-- ============================================================
-- NHÓM 5 – PHIẾU XUẤT KHO (PhieuXuatKho) – 3 phiếu
-- ============================================================

INSERT INTO PhieuXuatKho (Ma_phieu_xuat, Ma_yeu_cau, Ma_kho, Ma_nguoi_dung_lap, Ma_nguoi_dung_phe_duyet, Ngay_lap, Ngay_xuat_thuc_te, Ghi_chu, Trang_thai, Ly_do_tu_choi, Thoi_gian_xu_ly, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
-- PXK-0001: Samsung – Hoàn tất
('PXK-2026-0001','YCX-2026-0001','K001','ND003','ND002',
 '2026-02-05','2026-02-08',
 N'Xuất Samsung tháng 2. Đã đóng gói pallet, dán tem và bàn giao FedEx Việt Nam. Ký xác nhận đầy đủ.',
 N'Hoàn tất',NULL,'2026-02-06 09:00:00','2026-02-05 14:00:00','2026-02-08 15:00:00'),

-- PXK-0002: Foxconn – Đang vận chuyển
('PXK-2026-0002','YCX-2026-0002','K001','ND008','ND002',
 '2026-03-18','2026-03-19',
 N'Xuất Foxconn tháng 3. Đã bàn giao xe container, đang trên đường đến Bắc Ninh. Dự kiến giao 2026-03-22.',
 N'Đang vận chuyển',NULL,'2026-03-18 10:30:00','2026-03-18 09:00:00','2026-03-19 08:00:00'),

-- PXK-0003: HP – Hoàn tất (MIM có serial)
('PXK-2026-0003','YCX-2026-0003','K001','ND003','ND002',
 '2026-05-22','2026-05-22',
 N'Xuất 3 vỏ MIM mẫu thử cho HP. Đã đóng gói chống tĩnh điện, kiểm tra serial đầy đủ, giao nhân viên HP.',
 N'Hoàn tất',NULL,'2026-05-22 10:00:00','2026-05-22 09:00:00','2026-05-22 14:30:00');
GO

-- ============================================================
-- NHÓM 5 – CHI TIẾT XUẤT KHO (ChiTietXuatKho)
-- ============================================================

INSERT INTO ChiTietXuatKho (Ma_phieu_xuat, Ma_san_pham, So_luong_xuat, Ghi_chu)
VALUES
-- PXK-0001: Samsung
('PXK-2026-0001','SP001',200,NULL),
('PXK-2026-0001','SP002',100,NULL),
-- PXK-0002: Foxconn
('PXK-2026-0002','SP003',300,NULL),
('PXK-2026-0002','SP004',100,NULL),
-- PXK-0003: HP
('PXK-2026-0003','SP005',  3,N'Xuất theo serial: SN-2026-M001, M002, M003');
GO

-- ============================================================
-- NHÓM 5 – CHI TIẾT XUẤT VỊ TRÍ (ChiTietXuatViTri)
-- ============================================================

INSERT INTO ChiTietXuatViTri (Ma_phieu_xuat, Ma_vi_tri, Ma_san_pham, So_luong_xuat_tu_vi_tri)
VALUES
-- PXK-0001: lấy SP001 từ VT-A1-01 (FIFO), SP002 từ VT-A2-01
('PXK-2026-0001','VT-A1-01','SP001',200),
('PXK-2026-0001','VT-A2-01','SP002',100),
-- PXK-0002: lấy SP003 từ VT-B1-01 (FIFO), SP004 từ VT-B2-01
('PXK-2026-0002','VT-B1-01','SP003',300),
('PXK-2026-0002','VT-B2-01','SP004',100),
-- PXK-0003: lấy SP005 từ VT-C1-01
('PXK-2026-0003','VT-C1-01','SP005',  3);
GO

-- ============================================================
-- NHÓM 5 – CHI TIẾT XUẤT SERIAL (ChiTietXuatSerial)
-- ============================================================

INSERT INTO ChiTietXuatSerial (Ma_phieu_xuat, Ma_serial, Thoi_gian_tao)
VALUES
('PXK-2026-0003','SN-2026-M001','2026-05-22 14:00:00'),
('PXK-2026-0003','SN-2026-M002','2026-05-22 14:00:00'),
('PXK-2026-0003','SN-2026-M003','2026-05-22 14:00:00');
GO

-- ============================================================
-- NHÓM 3 – TỒN KHO THỰC TẾ HIỆN TẠI (TonKho)
-- Tính sau toàn bộ nhập/xuất đã hoàn tất + điều chỉnh kiểm kê
--
-- SP001: nhập 500, xuất 200, điều chỉnh -3  → 297 (VT-A1-01:97, VT-A1-02:200)
-- SP002: nhập 300, xuất 100                 → 200 (VT-A2-01:200)
-- SP003: nhập 1000, xuất 300                → 700 (VT-B1-01:300, VT-B1-02:400)
-- SP004: nhập 300, xuất 100                 → 200 (VT-B2-01:200)
-- SP005: nhập 10, xuất 3                    → 7   (VT-C1-01:7)
-- SP006: nhập 5, xuất 0                     → 5   (VT-C1-02:5)
-- ============================================================

INSERT INTO TonKho (Ma_ton_kho, Ma_san_pham, Ma_vi_tri, So_luong_ton, So_luong_toi_thieu, So_luong_toi_da, Ngay_cap_nhat)
VALUES
('TK-SP001-A101','SP001','VT-A1-01',  97, 100,1000,'2026-06-04'),
('TK-SP001-A102','SP001','VT-A1-02', 200, 100,1000,'2026-01-16'),
('TK-SP002-A201','SP002','VT-A2-01', 200,  80, 800,'2026-02-08'),
('TK-SP003-B101','SP003','VT-B1-01', 300, 200,2000,'2026-03-19'),
('TK-SP003-B102','SP003','VT-B1-02', 400, 200,2000,'2026-02-21'),
('TK-SP004-B201','SP004','VT-B2-01', 200,  50,1500,'2026-03-19'),
('TK-SP005-C101','SP005','VT-C1-01',   7,   5, 500,'2026-05-22'),
('TK-SP006-C102','SP006','VT-C1-02',   5,   3, 300,'2026-03-11');
GO

-- ============================================================
-- NHÓM 6 – PHIẾU KIỂM KÊ (PhieuKiemKe)
-- Kiểm kê nửa năm lần 1 – tháng 6/2026
-- ============================================================

INSERT INTO PhieuKiemKe (Ma_phieu_kiem_ke, Ma_kho, Ma_nguoi_dung_lap, Ma_nguoi_dung_phe_duyet, Ngay_lap, Loai_kiem_ke, Pham_vi_kiem_ke, Thoi_han_hoan_thanh, Ghi_chu, Trang_thai, Ly_do_tu_choi, Thoi_gian_xu_ly, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('PKK-2026-001','K001','ND003','ND002',
 '2026-06-01',
 N'Toàn bộ',
 N'Toàn bộ kho K001 – kiểm kê nửa năm theo quy định công ty, bao gồm tất cả 6 mã sản phẩm đang có tồn',
 '2026-06-03',
 N'Kiểm kê nửa năm 2026 theo yêu cầu của Ban Giám đốc. Kế toán gửi mail thông báo trước 3 ngày.',
 N'Hoàn tất',NULL,'2026-06-02 14:00:00','2026-06-01 09:00:00','2026-06-03 17:00:00');
GO

-- ============================================================
-- NHÓM 6 – CHI TIẾT KIỂM KÊ (ChiTietKiemKe)
-- So_luong_he_thong = tồn kho tại thời điểm lập phiếu (TRƯỚC điều chỉnh)
-- ============================================================

INSERT INTO ChiTietKiemKe (Ma_phieu_kiem_ke, Ma_san_pham, So_luong_he_thong, So_luong_thuc_te, Nguyen_nhan, Ghi_chu, Trang_thai_kiem_ke)
VALUES
-- SP001: hệ thống 300 (97+200+3 trước điều chỉnh), thực tế 297 → lệch -3
('PKK-2026-001','SP001',300,297,N'Có thể do 3 cái bị tính nhầm lô hoặc bị rơi hỏng trong quá trình bốc xếp nội bộ',N'Chênh lệch 3 cái, đã ghi nhận biên bản',N'Có chênh lệch'),
-- SP002: khớp sổ sách
('PKK-2026-001','SP002',200,200,NULL,NULL,N'Đã kiểm'),
-- SP003: khớp sổ sách
('PKK-2026-001','SP003',700,700,NULL,NULL,N'Đã kiểm'),
-- SP004: khớp sổ sách
('PKK-2026-001','SP004',200,200,NULL,NULL,N'Đã kiểm'),
-- SP005: khớp serial
('PKK-2026-001','SP005',  7,  7,NULL,N'Kiểm tra song song số serial còn lại khớp 7/7',N'Đã kiểm'),
-- SP006: khớp serial
('PKK-2026-001','SP006',  5,  5,NULL,N'Kiểm tra 5 serial đều còn nguyên vẹn trong kho',N'Đã kiểm');
GO

-- ============================================================
-- NHÓM 6 – BIÊN BẢN KIỂM KÊ (BienBanKiemKe)
-- ============================================================

INSERT INTO BienBanKiemKe (Ma_bien_ban_kk, Ma_phieu_kiem_ke, Ma_nguoi_dung_lap, Ma_nguoi_dung_phe_duyet, Ngay_lap, Ket_luan, Ghi_chu, Trang_thai, Ly_do_tu_choi, Thoi_gian_xu_ly, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('BBKK-2026-001','PKK-2026-001','ND003','ND002',
 '2026-06-03',
 N'Kết quả kiểm kê: 5/6 mã sản phẩm khớp sổ sách. Riêng SP001 (Trục xoay 360° FST-H360-14) thiếu 3 cái so với hệ thống. Đề nghị điều chỉnh giảm tồn kho SP001 tại vị trí VT-A1-01 xuống còn 97 cái.',
 N'Chênh lệch nhỏ (<1%), chấp nhận điều chỉnh theo biên bản. Nhân viên bốc xếp đã được nhắc nhở cẩn thận trong quá trình di chuyển hàng.',
 N'Đã phê duyệt',NULL,'2026-06-04 09:30:00','2026-06-03 17:00:00','2026-06-04 09:30:00');
GO

-- ============================================================
-- NHÓM 6 – PHIẾU ĐIỀU CHỈNH TỒN KHO (PhieuDieuChinhTonKho)
-- ============================================================

INSERT INTO PhieuDieuChinhTonKho (Ma_phieu_dieu_chinh, Ma_bien_ban_kk, Ma_nguoi_dung_xac_nhan, Ngay_lap, Ly_do_dieu_chinh, Ghi_chu, Trang_thai, Thoi_gian_tao, Thoi_gian_cap_nhat)
VALUES
('PDCTK-2026-001','BBKK-2026-001','ND003',
 '2026-06-04',
 N'Điều chỉnh giảm 3 cái Trục xoay 360° FST-H360-14 (SP001) tại vị trí VT-A1-01, phát sinh từ kết quả kiểm kê nửa năm 2026-06-03',
 N'Đã cập nhật TonKho. Kế toán Lan Anh ký xác nhận.',
 N'Đã xác nhận','2026-06-04 09:35:00','2026-06-04 10:00:00');
GO

-- ============================================================
-- NHÓM 6 – CHI TIẾT ĐIỀU CHỈNH (ChiTietDieuChinh)
-- ============================================================

INSERT INTO ChiTietDieuChinh (Ma_phieu_dieu_chinh, Ma_san_pham, So_luong_dieu_chinh, Loai_dieu_chinh)
VALUES
('PDCTK-2026-001','SP001', 3, N'Giảm');
GO

-- ============================================================
-- NHẬT KÝ HOẠT ĐỘNG (LichSuHoatDong)
-- Ma_lich_su: IDENTITY – không cần INSERT thủ công
-- ============================================================

INSERT INTO LichSuHoatDong (Ma_tai_khoan, Ten_nguoi_dung, Ten_hanh_dong, Ten_bang_tac_dong, Ma_ban_ghi_tac_dong, Du_lieu_cu, Du_lieu_moi, Dia_chi_ip, Thiet_bi, Thoi_gian_thao_tac)
VALUES
-- 1. Admin đăng nhập lần đầu
('TK001',N'Nguyễn Thành Đạt','DANG_NHAP',NULL,NULL,NULL,NULL,
 '192.168.1.10','Mozilla/5.0 – Chrome/120 – Windows 11','2025-01-10 08:00:00'),

-- 2. Admin tạo tài khoản cho Vũ Xuân Hoàng
('TK001',N'Nguyễn Thành Đạt','TAO_TAI_KHOAN','TaiKhoan','TK002',
 NULL,
 N'{"Ma_tai_khoan":"TK002","Email":"hoang.vu@fositek.vn","Vai_tro":"Quan_ly_kho","Trang_thai":1}',
 '192.168.1.10','Mozilla/5.0 – Chrome/120 – Windows 11','2025-01-10 08:35:00'),

-- 3. Quản lý kho (Hoàng) đăng nhập
('TK002',N'Vũ Xuân Hoàng','DANG_NHAP',NULL,NULL,NULL,NULL,
 '192.168.1.15','Mozilla/5.0 – Chrome/120 – Windows 11','2025-01-10 09:00:00'),

-- 4. Nhân viên Tuấn lập phiếu nhập PNK-0001
('TK004',N'Phạm Văn Tuấn','TAO_PHIEU_NHAP','PhieuNhapKho','PNK-2026-0001',
 NULL,
 N'{"Ma_phieu_nhap":"PNK-2026-0001","Ngay_lap":"2026-01-15","Trang_thai":"Chờ phê duyệt","SL_SP001":500,"SL_SP002":300}',
 '192.168.1.20','Mozilla/5.0 – Chrome/120 – Windows 10','2026-01-15 16:00:00'),

-- 5. Quản lý Hoàng phê duyệt PNK-0001
('TK002',N'Vũ Xuân Hoàng','PHE_DUYET_NHAP','PhieuNhapKho','PNK-2026-0001',
 N'{"Trang_thai":"Chờ phê duyệt"}',
 N'{"Trang_thai":"Đã phê duyệt","Nguoi_phe_duyet":"ND002","Thoi_gian_xu_ly":"2026-01-16 09:30:00"}',
 '192.168.1.15','Mozilla/5.0 – Chrome/120 – Windows 11','2026-01-16 09:30:00'),

-- 6. QC Ngọc lập phiếu sự cố PSC-0001
('TK006',N'Đỗ Thị Ngọc','TAO_PHIEU_SU_CO','PhieuSuCo','PSC-2026-001',
 NULL,
 N'{"Ma_phieu_su_co":"PSC-2026-001","Loai":"Hàng lỗi","So_luong":5,"SP":"SP001","PNK":"PNK-2026-0001"}',
 '192.168.1.25','Mozilla/5.0 – Firefox/121 – Windows 10','2026-01-16 10:00:00'),

-- 7. Sale Cường tạo yêu cầu xuất YCX-0001
('TK007',N'Nguyễn Mạnh Cường','TAO_YEU_CAU_XUAT','YeuCauXuatKho','YCX-2026-0001',
 NULL,
 N'{"Ma_yeu_cau":"YCX-2026-0001","Khach_hang":"Samsung Electronics Vietnam","SP001":200,"SP002":100,"Giao_hang":"2026-02-08"}',
 '192.168.1.30','Mozilla/5.0 – Chrome/120 – macOS 14','2026-02-01 10:00:00'),

-- 8. Kế toán Lan Anh lập phiếu xuất PXK-0001
('TK003',N'Trần Thị Lan Anh','LAP_PHIEU_XUAT','PhieuXuatKho','PXK-2026-0001',
 NULL,
 N'{"Ma_phieu_xuat":"PXK-2026-0001","YeuCau":"YCX-2026-0001","Trang_thai":"Chờ phê duyệt"}',
 '192.168.1.18','Mozilla/5.0 – Chrome/120 – Windows 11','2026-02-05 14:00:00'),

-- 9. Quản lý Hoàng phê duyệt PXK-0001
('TK002',N'Vũ Xuân Hoàng','PHE_DUYET_XUAT','PhieuXuatKho','PXK-2026-0001',
 N'{"Trang_thai":"Chờ phê duyệt"}',
 N'{"Trang_thai":"Đã phê duyệt","Nguoi_phe_duyet":"ND002","Thoi_gian_xu_ly":"2026-02-06 09:00:00"}',
 '192.168.1.15','Mozilla/5.0 – Chrome/120 – Windows 11','2026-02-06 09:00:00'),

-- 10. Nhân viên Hưng xác nhận xuất hàng PXK-0001 hoàn tất
('TK005',N'Lê Quang Hưng','XAC_NHAN_XUAT_HANG','PhieuXuatKho','PXK-2026-0001',
 N'{"Trang_thai":"Đã phê duyệt"}',
 N'{"Trang_thai":"Hoàn tất","Ngay_xuat_thuc_te":"2026-02-08"}',
 '192.168.1.22','Mozilla/5.0 – Chrome/120 – Windows 10','2026-02-08 15:00:00'),

-- 11. Kế toán Lan Anh lập phiếu kiểm kê PKK-2026-001
('TK003',N'Trần Thị Lan Anh','TAO_PHIEU_KIEM_KE','PhieuKiemKe','PKK-2026-001',
 NULL,
 N'{"Ma_phieu_kiem_ke":"PKK-2026-001","Loai":"Toàn bộ","Ngay_lap":"2026-06-01","Han_hoan_thanh":"2026-06-03"}',
 '192.168.1.18','Mozilla/5.0 – Chrome/120 – Windows 11','2026-06-01 09:00:00'),

-- 12. Quản lý Hoàng phê duyệt biên bản BBKK-2026-001 và điều chỉnh SP001
('TK002',N'Vũ Xuân Hoàng','PHE_DUYET_BIEN_BAN_KIEM_KE','BienBanKiemKe','BBKK-2026-001',
 N'{"Trang_thai":"Chờ phê duyệt"}',
 N'{"Trang_thai":"Đã phê duyệt","Ket_luan":"Thiếu 3 cái SP001 tại VT-A1-01","Thoi_gian_xu_ly":"2026-06-04 09:30:00"}',
 '192.168.1.15','Mozilla/5.0 – Chrome/120 – Windows 11','2026-06-04 09:30:00');
GO

-- ============================================================
-- XÁC NHẬN DỮ LIỆU
-- ============================================================
PRINT N'✓ seed_data.sql đã chạy thành công.';
PRINT N'';
PRINT N'Thống kê dữ liệu đã tạo:';
PRINT N'  • NguoiDung:             8 bản ghi';
PRINT N'  • TaiKhoan:              8 bản ghi';
PRINT N'  • VaiTro_Quyen:         28 bản ghi (6 vai trò × quyền tương ứng)';
PRINT N'  • NguoiDung_VaiTro:      8 bản ghi';
PRINT N'  • NguoiDung_Quyen:       2 bản ghi (ghi đè cá nhân)';
PRINT N'  • Kho:                   1 kho (Hà Nam)';
PRINT N'  • KhuVucKho:             3 khu vực (A/B/C)';
PRINT N'  • ViTriTrongKho:         8 vị trí';
PRINT N'  • DanhMucSanPham:        3 danh mục';
PRINT N'  • SanPham:               6 sản phẩm (4 barcode-only, 2 có serial)';
PRINT N'  • SoSerial:             15 serial (10×SP005 + 5×SP006)';
PRINT N'  • TonKho:                8 bản ghi tồn hiện tại';
PRINT N'  • PhieuNhapKho:          5 phiếu (3 duyệt, 1 chờ, 1 từ chối)';
PRINT N'  • PhieuSuCo:             2 phiếu sự cố';
PRINT N'  • YeuCauXuatKho:         4 yêu cầu (3 đã xử lý, 1 chờ)';
PRINT N'  • PhieuXuatKho:          3 phiếu (2 hoàn tất, 1 đang vận chuyển)';
PRINT N'  • PhieuKiemKe:           1 phiếu (hoàn tất)';
PRINT N'  • BienBanKiemKe:         1 biên bản';
PRINT N'  • PhieuDieuChinhTonKho:  1 phiếu điều chỉnh';
PRINT N'  • LichSuHoatDong:       12 bản ghi nhật ký';
GO
