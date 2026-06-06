CREATE DATABASE IF NOT EXISTS DB_KHO;
USE DB_KHO;

-- ============================================================
--  NHÓM 1 – PHÂN QUYỀN (RBAC MỞ RỘNG)
-- ============================================================

-- 1. NguoiDung
CREATE TABLE NguoiDung (
    Ma_nguoi_dung   CHAR(10)        NOT NULL,
    Ten_nguoi_dung  VARCHAR(100)   NOT NULL,
    So_dien_thoai   CHAR(15)        NULL,
    Chuc_vu         VARCHAR(100)   NULL,
    Trang_thai      TINYINT(1)             NOT NULL DEFAULT 1,
    Thoi_gian_tao   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_NguoiDung PRIMARY KEY (Ma_nguoi_dung),
    CONSTRAINT UQ_NguoiDung_SDT UNIQUE (So_dien_thoai)
);

-- 2. TaiKhoan
CREATE TABLE TaiKhoan (
    Ma_tai_khoan        CHAR(10)        NOT NULL,
    Ma_nguoi_dung       CHAR(10)        NOT NULL,
    Email               VARCHAR(150)    NOT NULL,
    Mat_khau            VARCHAR(255)    NOT NULL,
    Trang_thai          TINYINT(1)             NOT NULL DEFAULT 1,
    Ma_admin_tao        CHAR(10)        NOT NULL,
    Ma_admin_vo_hieu    CHAR(10)        NULL,
    Ly_do_vo_hieu_hoa   VARCHAR(300)   NULL,
    Ngay_vo_hieu_hoa    DATETIME        NULL,
    Ngay_dang_nhap_cuoi DATETIME        NULL,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_TaiKhoan PRIMARY KEY (Ma_tai_khoan),
    CONSTRAINT UQ_TaiKhoan_NguoiDung UNIQUE (Ma_nguoi_dung),
    CONSTRAINT UQ_TaiKhoan_Email UNIQUE (Email),
    CONSTRAINT FK_TaiKhoan_NguoiDung FOREIGN KEY (Ma_nguoi_dung)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_TaiKhoan_AdminTao FOREIGN KEY (Ma_admin_tao)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_TaiKhoan_AdminVoHieu FOREIGN KEY (Ma_admin_vo_hieu)
        REFERENCES NguoiDung(Ma_nguoi_dung)
);

-- 3. VaiTro
CREATE TABLE VaiTro (
    Ma_vai_tro          CHAR(10)        NOT NULL,
    Ten_vai_tro         VARCHAR(100)   NOT NULL,
    Mo_ta               VARCHAR(255)   NULL,
    La_vai_tro_co_dinh  TINYINT(1)             NOT NULL DEFAULT 0,
    CONSTRAINT PK_VaiTro PRIMARY KEY (Ma_vai_tro),
    CONSTRAINT UQ_VaiTro_Ten UNIQUE (Ten_vai_tro)
);

-- 4. NguoiDung_VaiTro
CREATE TABLE NguoiDung_VaiTro (
    Ma_nguoi_dung   CHAR(10)    NOT NULL,
    Ma_vai_tro      CHAR(10)    NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_NguoiDung_VaiTro PRIMARY KEY (Ma_nguoi_dung, Ma_vai_tro),
    CONSTRAINT FK_NDVaiTro_NguoiDung FOREIGN KEY (Ma_nguoi_dung)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_NDVaiTro_VaiTro FOREIGN KEY (Ma_vai_tro)
        REFERENCES VaiTro(Ma_vai_tro)
);

-- 5. Quyen
CREATE TABLE Quyen (
    Ma_quyen        CHAR(15)        NOT NULL,
    Ma_chuc_nang    VARCHAR(80)     NOT NULL,
    Ten_quyen       VARCHAR(200)   NOT NULL,
    Nhom_quyen      VARCHAR(100)   NULL,
    Mo_ta           VARCHAR(255)   NULL,
    CONSTRAINT PK_Quyen PRIMARY KEY (Ma_quyen),
    CONSTRAINT UQ_Quyen_MaChucNang UNIQUE (Ma_chuc_nang)
);

-- 6. VaiTro_Quyen
CREATE TABLE VaiTro_Quyen (
    Ma_vai_tro      CHAR(10)    NOT NULL,
    Ma_quyen        CHAR(15)    NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_VaiTro_Quyen PRIMARY KEY (Ma_vai_tro, Ma_quyen),
    CONSTRAINT FK_VTQuyen_VaiTro FOREIGN KEY (Ma_vai_tro)
        REFERENCES VaiTro(Ma_vai_tro),
    CONSTRAINT FK_VTQuyen_Quyen FOREIGN KEY (Ma_quyen)
        REFERENCES Quyen(Ma_quyen)
);

-- 7. NguoiDung_Quyen
CREATE TABLE NguoiDung_Quyen (
    Ma_nguoi_dung   CHAR(10)        NOT NULL,
    Ma_quyen        CHAR(15)        NOT NULL,
    Loai_ghi_de     VARCHAR(10)    NOT NULL,
    Ly_do           VARCHAR(300)   NULL,
    Thoi_gian_tao   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_NguoiDung_Quyen PRIMARY KEY (Ma_nguoi_dung, Ma_quyen),
    CONSTRAINT FK_NDQuyen_NguoiDung FOREIGN KEY (Ma_nguoi_dung)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_NDQuyen_Quyen FOREIGN KEY (Ma_quyen)
        REFERENCES Quyen(Ma_quyen),
    CONSTRAINT CK_NDQuyen_LoaiGhiDe CHECK (Loai_ghi_de IN ('cap_them', 'thu_hoi'))
);

-- 8. LichSuHoatDong (Audit Log – chỉ INSERT)
CREATE TABLE LichSuHoatDong (
    Ma_lich_su          BIGINT          NOT NULL AUTO_INCREMENT,
    Ma_tai_khoan        CHAR(10)        NOT NULL,
    Ten_nguoi_dung      VARCHAR(100)   NOT NULL,
    Ten_hanh_dong       VARCHAR(100)   NOT NULL,
    Ten_bang_tac_dong   VARCHAR(100)   NULL,
    Ma_ban_ghi_tac_dong VARCHAR(50)    NULL,
    Du_lieu_cu          LONGTEXT   NULL,
    Du_lieu_moi         LONGTEXT   NULL,
    Dia_chi_ip          VARCHAR(45)     NULL,
    Thiet_bi            VARCHAR(200)   NULL,
    Thoi_gian_thao_tac  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_LichSuHoatDong PRIMARY KEY (Ma_lich_su),
    CONSTRAINT FK_LichSu_TaiKhoan FOREIGN KEY (Ma_tai_khoan)
        REFERENCES TaiKhoan(Ma_tai_khoan)
);

-- ============================================================
--  NHÓM 2 – KHO & ĐỊA ĐIỂM
-- ============================================================

-- 9. Kho
CREATE TABLE Kho (
    Ma_kho              CHAR(10)        NOT NULL,
    Ten_kho             VARCHAR(200)   NOT NULL,
    Mo_ta               VARCHAR(500)   NULL,
    Dia_chi             VARCHAR(300)   NULL,
    Trang_thai          TINYINT(1)             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_Kho PRIMARY KEY (Ma_kho)
);

-- 10. NguoiDung_Kho
CREATE TABLE NguoiDung_Kho (
    Ma_nguoi_dung   CHAR(10)        NOT NULL,
    Ma_kho          CHAR(10)        NOT NULL,
    Vai_tro_tai_kho VARCHAR(50)    NULL,
    Thoi_gian_tao   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_NguoiDung_Kho PRIMARY KEY (Ma_nguoi_dung, Ma_kho),
    CONSTRAINT FK_NDKho_NguoiDung FOREIGN KEY (Ma_nguoi_dung)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_NDKho_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho)
);

-- 11. KhuVucKho
CREATE TABLE KhuVucKho (
    Ma_khu_vuc          CHAR(10)        NOT NULL,
    Ma_kho              CHAR(10)        NOT NULL,
    Ten_khu_vuc         VARCHAR(100)   NOT NULL,
    Mo_ta               VARCHAR(255)   NULL,
    Trang_thai          TINYINT(1)             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_KhuVucKho PRIMARY KEY (Ma_khu_vuc),
    CONSTRAINT FK_KhuVuc_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho)
);

-- 12. ViTriTrongKho
CREATE TABLE ViTriTrongKho (
    Ma_vi_tri           CHAR(15)        NOT NULL,
    Ma_khu_vuc          CHAR(10)        NOT NULL,
    Ten_vi_tri          VARCHAR(100)   NOT NULL,
    Mo_ta               VARCHAR(255)   NULL,
    Suc_chua_toi_da     INT             NOT NULL DEFAULT 0,
    Trang_thai          VARCHAR(30)    NOT NULL DEFAULT 'Sẵn sàng',
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_ViTriTrongKho PRIMARY KEY (Ma_vi_tri),
    CONSTRAINT FK_ViTri_KhuVuc FOREIGN KEY (Ma_khu_vuc)
        REFERENCES KhuVucKho(Ma_khu_vuc),
    CONSTRAINT CK_ViTri_TrangThai CHECK (Trang_thai IN ('Sẵn sàng', 'Đầy', 'Bảo trì'))
);

-- ============================================================
--  NHÓM 3 – SẢN PHẨM & TỒN KHO
-- ============================================================

-- 13. DanhMucSanPham
CREATE TABLE DanhMucSanPham (
    Ma_danh_muc         CHAR(10)        NOT NULL,
    Ten_danh_muc        VARCHAR(200)   NOT NULL,
    Mo_ta               VARCHAR(500)   NULL,
    Trang_thai          TINYINT(1)             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_DanhMucSanPham PRIMARY KEY (Ma_danh_muc)
);

-- 14. SanPham
CREATE TABLE SanPham (
    Ma_san_pham         CHAR(15)        NOT NULL,
    Ma_danh_muc         CHAR(10)        NULL,
    Ten_san_pham        VARCHAR(200)   NOT NULL,
    Ma_barcode          VARCHAR(100)    NULL,
    Mo_ta               VARCHAR(500)   NULL,
    Don_vi_tinh         VARCHAR(30)    NOT NULL,
    Trong_luong         DECIMAL(10,3)   NULL,
    Gia_san_xuat        DECIMAL(15,2)   NOT NULL DEFAULT 0,
    Gia_ban             DECIMAL(15,2)   NOT NULL DEFAULT 0,
    Quan_ly_theo_serial TINYINT(1)             NOT NULL DEFAULT 0,
    Trang_thai          TINYINT(1)             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_SanPham PRIMARY KEY (Ma_san_pham),
    CONSTRAINT UQ_SanPham_Barcode UNIQUE (Ma_barcode),
    CONSTRAINT FK_SanPham_DanhMuc FOREIGN KEY (Ma_danh_muc)
        REFERENCES DanhMucSanPham(Ma_danh_muc)
);

-- 15. SoSerial
CREATE TABLE SoSerial (
    Ma_serial           VARCHAR(50)     NOT NULL,
    Ma_san_pham         CHAR(15)        NOT NULL,
    Trang_thai          VARCHAR(30)    NOT NULL,
    Ngay_san_xuat       DATE            NULL,
    Ghi_chu             VARCHAR(300)   NULL,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_SoSerial PRIMARY KEY (Ma_serial),
    CONSTRAINT FK_SoSerial_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_SoSerial_TrangThai CHECK (Trang_thai IN ('Trong kho', 'Đã xuất', 'Lỗi', 'Hủy'))
);

-- 16. TonKho
CREATE TABLE TonKho (
    Ma_ton_kho          CHAR(15)    NOT NULL,
    Ma_san_pham         CHAR(15)    NOT NULL,
    Ma_vi_tri           CHAR(15)    NOT NULL,
    So_luong_ton        INT         NOT NULL DEFAULT 0,
    So_luong_toi_thieu  INT         NOT NULL DEFAULT 0,
    So_luong_toi_da     INT         NOT NULL DEFAULT 0,
    Ngay_cap_nhat       DATE        NULL,
    CONSTRAINT PK_TonKho PRIMARY KEY (Ma_ton_kho),
    CONSTRAINT UQ_TonKho_SP_ViTri UNIQUE (Ma_san_pham, Ma_vi_tri),
    CONSTRAINT FK_TonKho_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT FK_TonKho_ViTri FOREIGN KEY (Ma_vi_tri)
        REFERENCES ViTriTrongKho(Ma_vi_tri),
    CONSTRAINT CK_TonKho_SoLuong CHECK (So_luong_ton >= 0)
);

-- ============================================================
--  NHÓM 4 – NHẬP KHO
-- ============================================================

-- 17. PhieuNhapKho
CREATE TABLE PhieuNhapKho (
    Ma_phieu_nhap               CHAR(20)        NOT NULL,
    Ma_kho                      CHAR(10)        NOT NULL,
    Ma_nguoi_dung_lap           CHAR(10)        NOT NULL,
    Ma_nguoi_dung_phe_duyet     CHAR(10)        NULL,
    Ngay_lap                    DATE            NOT NULL,
    Ngay_nhap_thuc_te           DATE            NULL,
    Ghi_chu                     VARCHAR(500)   NULL,
    Trang_thai                  VARCHAR(50)    NOT NULL DEFAULT 'Chờ phê duyệt',
    Ly_do_tu_choi               VARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_PhieuNhapKho PRIMARY KEY (Ma_phieu_nhap),
    CONSTRAINT FK_PNK_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho),
    CONSTRAINT FK_PNK_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_PNK_NguoiDungPheDuyet FOREIGN KEY (Ma_nguoi_dung_phe_duyet)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PNK_TrangThai CHECK (Trang_thai IN ('Chờ phê duyệt', 'Đã phê duyệt', 'Từ chối'))
);

-- 18. ChiTietNhapKho
CREATE TABLE ChiTietNhapKho (
    Ma_phieu_nhap   CHAR(20)        NOT NULL,
    Ma_san_pham     CHAR(15)        NOT NULL,
    So_luong_nhap   INT             NOT NULL,
    So_luong_thuc_te INT            NOT NULL DEFAULT 0,
    Ghi_chu         VARCHAR(300)   NULL,
    CONSTRAINT PK_ChiTietNhapKho PRIMARY KEY (Ma_phieu_nhap, Ma_san_pham),
    CONSTRAINT FK_CTNhap_PhieuNhap FOREIGN KEY (Ma_phieu_nhap)
        REFERENCES PhieuNhapKho(Ma_phieu_nhap),
    CONSTRAINT FK_CTNhap_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTNhap_SoLuongNhap CHECK (So_luong_nhap > 0),
    CONSTRAINT CK_CTNhap_SoLuongThucTe CHECK (So_luong_thuc_te >= 0)
);

-- 19. ChiTietNhapViTri
CREATE TABLE ChiTietNhapViTri (
    Ma_phieu_nhap           CHAR(20)    NOT NULL,
    Ma_vi_tri               CHAR(15)    NOT NULL,
    Ma_san_pham             CHAR(15)    NOT NULL,
    So_luong_nhap_vao_vi_tri INT        NOT NULL,
    CONSTRAINT PK_ChiTietNhapViTri PRIMARY KEY (Ma_phieu_nhap, Ma_vi_tri),
    CONSTRAINT FK_CTNhapViTri_PhieuNhap FOREIGN KEY (Ma_phieu_nhap)
        REFERENCES PhieuNhapKho(Ma_phieu_nhap),
    CONSTRAINT FK_CTNhapViTri_ViTri FOREIGN KEY (Ma_vi_tri)
        REFERENCES ViTriTrongKho(Ma_vi_tri),
    CONSTRAINT FK_CTNhapViTri_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTNhapViTri_SoLuong CHECK (So_luong_nhap_vao_vi_tri > 0)
);

-- 20. ChiTietNhapSerial
CREATE TABLE ChiTietNhapSerial (
    Ma_phieu_nhap   CHAR(20)    NOT NULL,
    Ma_serial       VARCHAR(50) NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_ChiTietNhapSerial PRIMARY KEY (Ma_phieu_nhap, Ma_serial),
    CONSTRAINT FK_CTNhapSerial_PhieuNhap FOREIGN KEY (Ma_phieu_nhap)
        REFERENCES PhieuNhapKho(Ma_phieu_nhap),
    CONSTRAINT FK_CTNhapSerial_Serial FOREIGN KEY (Ma_serial)
        REFERENCES SoSerial(Ma_serial)
);

-- 21. PhieuSuCo
CREATE TABLE PhieuSuCo (
    Ma_phieu_su_co      CHAR(20)        NOT NULL,
    Ma_phieu_nhap       CHAR(20)        NOT NULL,
    Ma_nguoi_dung_lap   CHAR(10)        NOT NULL,
    Ngay_lap            DATE            NOT NULL,
    Loai_su_co          VARCHAR(50)    NOT NULL,
    Mo_ta               VARCHAR(500)   NULL,
    So_luong_su_co      INT             NOT NULL DEFAULT 0,
    Trang_thai_xu_ly    VARCHAR(50)    NOT NULL DEFAULT 'Đang xử lý',
    Ghi_chu             VARCHAR(300)   NULL,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_PhieuSuCo PRIMARY KEY (Ma_phieu_su_co),
    CONSTRAINT FK_PSC_PhieuNhap FOREIGN KEY (Ma_phieu_nhap)
        REFERENCES PhieuNhapKho(Ma_phieu_nhap),
    CONSTRAINT FK_PSC_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PSC_LoaiSuCo CHECK (Loai_su_co IN ('Hàng lỗi', 'Sai lệch số lượng')),
    CONSTRAINT CK_PSC_TrangThaiXuLy CHECK (Trang_thai_xu_ly IN ('Đang xử lý', 'Đã giải quyết', 'Leo thang GĐ'))
);

-- ============================================================
--  NHÓM 5 – XUẤT KHO
-- ============================================================

-- 22. YeuCauXuatKho
CREATE TABLE YeuCauXuatKho (
    Ma_yeu_cau                  CHAR(20)        NOT NULL,
    Ma_kho                      CHAR(10)        NOT NULL,
    Ma_nguoi_dung_tao           CHAR(10)        NOT NULL,
    Ngay_tao                    DATE            NOT NULL,
    Ten_khach_hang              VARCHAR(200)   NOT NULL,
    Thoi_gian_giao_hang_du_kien DATETIME        NULL,
    Ghi_chu                     VARCHAR(500)   NULL,
    Trang_thai                  VARCHAR(60)    NOT NULL DEFAULT 'Chờ xử lý',
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_YeuCauXuatKho PRIMARY KEY (Ma_yeu_cau),
    CONSTRAINT FK_YCXK_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho),
    CONSTRAINT FK_YCXK_NguoiDungTao FOREIGN KEY (Ma_nguoi_dung_tao)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_YCXK_TrangThai CHECK (Trang_thai IN ('Chờ xử lý', 'Tạm dừng', 'Đã xử lý'))
);

-- 23. ChiTietYeuCau
CREATE TABLE ChiTietYeuCau (
    Ma_yeu_cau          CHAR(20)    NOT NULL,
    Ma_san_pham         CHAR(15)    NOT NULL,
    So_luong_yeu_cau    INT         NOT NULL,
    CONSTRAINT PK_ChiTietYeuCau PRIMARY KEY (Ma_yeu_cau, Ma_san_pham),
    CONSTRAINT FK_CTYC_YeuCau FOREIGN KEY (Ma_yeu_cau)
        REFERENCES YeuCauXuatKho(Ma_yeu_cau),
    CONSTRAINT FK_CTYC_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTYC_SoLuong CHECK (So_luong_yeu_cau > 0)
);

-- 24. PhieuXuatKho
CREATE TABLE PhieuXuatKho (
    Ma_phieu_xuat               CHAR(20)        NOT NULL,
    Ma_yeu_cau                  CHAR(20)        NOT NULL,
    Ma_kho                      CHAR(10)        NOT NULL,
    Ma_nguoi_dung_lap           CHAR(10)        NOT NULL,
    Ma_nguoi_dung_phe_duyet     CHAR(10)        NULL,
    Ngay_lap                    DATE            NOT NULL,
    Ngay_xuat_thuc_te           DATE            NULL,
    Ghi_chu                     VARCHAR(500)   NULL,
    Trang_thai                  VARCHAR(60)    NOT NULL DEFAULT 'Chờ phê duyệt',
    Ly_do_tu_choi               VARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_PhieuXuatKho PRIMARY KEY (Ma_phieu_xuat),
    CONSTRAINT FK_PXK_YeuCau FOREIGN KEY (Ma_yeu_cau)
        REFERENCES YeuCauXuatKho(Ma_yeu_cau),
    CONSTRAINT FK_PXK_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho),
    CONSTRAINT FK_PXK_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_PXK_NguoiDungPheDuyet FOREIGN KEY (Ma_nguoi_dung_phe_duyet)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PXK_TrangThai CHECK (Trang_thai IN (
        'Chờ phê duyệt', 'Đã phê duyệt', 'Từ chối',
        'Đang vận chuyển', 'Hoàn tất'))
);

-- 25. ChiTietXuatKho
CREATE TABLE ChiTietXuatKho (
    Ma_phieu_xuat   CHAR(20)        NOT NULL,
    Ma_san_pham     CHAR(15)        NOT NULL,
    So_luong_xuat   INT             NOT NULL,
    Ghi_chu         VARCHAR(300)   NULL,
    CONSTRAINT PK_ChiTietXuatKho PRIMARY KEY (Ma_phieu_xuat, Ma_san_pham),
    CONSTRAINT FK_CTXuat_PhieuXuat FOREIGN KEY (Ma_phieu_xuat)
        REFERENCES PhieuXuatKho(Ma_phieu_xuat),
    CONSTRAINT FK_CTXuat_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTXuat_SoLuong CHECK (So_luong_xuat > 0)
);

-- 26. ChiTietXuatViTri
CREATE TABLE ChiTietXuatViTri (
    Ma_phieu_xuat           CHAR(20)    NOT NULL,
    Ma_vi_tri               CHAR(15)    NOT NULL,
    Ma_san_pham             CHAR(15)    NOT NULL,
    So_luong_xuat_tu_vi_tri INT         NOT NULL,
    CONSTRAINT PK_ChiTietXuatViTri PRIMARY KEY (Ma_phieu_xuat, Ma_vi_tri),
    CONSTRAINT FK_CTXuatViTri_PhieuXuat FOREIGN KEY (Ma_phieu_xuat)
        REFERENCES PhieuXuatKho(Ma_phieu_xuat),
    CONSTRAINT FK_CTXuatViTri_ViTri FOREIGN KEY (Ma_vi_tri)
        REFERENCES ViTriTrongKho(Ma_vi_tri),
    CONSTRAINT FK_CTXuatViTri_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTXuatViTri_SoLuong CHECK (So_luong_xuat_tu_vi_tri > 0)
);

-- 27. ChiTietXuatSerial
CREATE TABLE ChiTietXuatSerial (
    Ma_phieu_xuat   CHAR(20)    NOT NULL,
    Ma_serial       VARCHAR(50) NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_ChiTietXuatSerial PRIMARY KEY (Ma_phieu_xuat, Ma_serial),
    CONSTRAINT FK_CTXuatSerial_PhieuXuat FOREIGN KEY (Ma_phieu_xuat)
        REFERENCES PhieuXuatKho(Ma_phieu_xuat),
    CONSTRAINT FK_CTXuatSerial_Serial FOREIGN KEY (Ma_serial)
        REFERENCES SoSerial(Ma_serial)
);

-- ============================================================
--  NHÓM 6 – KIỂM KÊ & ĐIỀU CHỈNH TỒN KHO
-- ============================================================

-- 28. PhieuKiemKe
CREATE TABLE PhieuKiemKe (
    Ma_phieu_kiem_ke            CHAR(20)        NOT NULL,
    Ma_kho                      CHAR(10)        NOT NULL,
    Ma_nguoi_dung_lap           CHAR(10)        NOT NULL,
    Ma_nguoi_dung_phe_duyet     CHAR(10)        NULL,
    Ngay_lap                    DATE            NOT NULL,
    Loai_kiem_ke                VARCHAR(60)    NULL,
    Pham_vi_kiem_ke             VARCHAR(300)   NULL,
    Thoi_han_hoan_thanh         DATE            NULL,
    Ghi_chu                     VARCHAR(500)   NULL,
    Trang_thai                  VARCHAR(60)    NOT NULL DEFAULT 'Chờ phê duyệt',
    Ly_do_tu_choi               VARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_PhieuKiemKe PRIMARY KEY (Ma_phieu_kiem_ke),
    CONSTRAINT FK_PKK_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho),
    CONSTRAINT FK_PKK_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_PKK_NguoiDungPheDuyet FOREIGN KEY (Ma_nguoi_dung_phe_duyet)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PKK_TrangThai CHECK (Trang_thai IN (
        'Chờ phê duyệt', 'Đang kiểm kê', 'Hoàn tất', 'Từ chối'))
);

-- 29. ChiTietKiemKe
CREATE TABLE ChiTietKiemKe (
    Ma_phieu_kiem_ke    CHAR(20)        NOT NULL,
    Ma_san_pham         CHAR(15)        NOT NULL,
    So_luong_he_thong   INT             NOT NULL DEFAULT 0,
    So_luong_thuc_te    INT             NULL,        -- NULL = chưa kiểm
    Nguyen_nhan         VARCHAR(300)   NULL,
    Ghi_chu             VARCHAR(300)   NULL,
    Trang_thai_kiem_ke  VARCHAR(30)    NOT NULL DEFAULT 'Chưa kiểm',
    CONSTRAINT PK_ChiTietKiemKe PRIMARY KEY (Ma_phieu_kiem_ke, Ma_san_pham),
    CONSTRAINT FK_CTKK_PhieuKiemKe FOREIGN KEY (Ma_phieu_kiem_ke)
        REFERENCES PhieuKiemKe(Ma_phieu_kiem_ke),
    CONSTRAINT FK_CTKK_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTKK_TrangThai CHECK (Trang_thai_kiem_ke IN ('Chưa kiểm', 'Đã kiểm', 'Có chênh lệch'))
);

-- 30. BienBanKiemKe
CREATE TABLE BienBanKiemKe (
    Ma_bien_ban_kk              CHAR(20)        NOT NULL,
    Ma_phieu_kiem_ke            CHAR(20)        NOT NULL,
    Ma_nguoi_dung_lap           CHAR(10)        NOT NULL,
    Ma_nguoi_dung_phe_duyet     CHAR(10)        NULL,
    Ngay_lap                    DATE            NOT NULL,
    Ket_luan                    VARCHAR(500)   NULL,
    Ghi_chu                     VARCHAR(500)   NULL,
    Trang_thai                  VARCHAR(50)    NOT NULL DEFAULT 'Chờ phê duyệt',
    Ly_do_tu_choi               VARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_BienBanKiemKe PRIMARY KEY (Ma_bien_ban_kk),
    CONSTRAINT UQ_BBKK_PhieuKiemKe UNIQUE (Ma_phieu_kiem_ke),   -- 1:1
    CONSTRAINT FK_BBKK_PhieuKiemKe FOREIGN KEY (Ma_phieu_kiem_ke)
        REFERENCES PhieuKiemKe(Ma_phieu_kiem_ke),
    CONSTRAINT FK_BBKK_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_BBKK_NguoiDungPheDuyet FOREIGN KEY (Ma_nguoi_dung_phe_duyet)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_BBKK_TrangThai CHECK (Trang_thai IN ('Chờ phê duyệt', 'Đã phê duyệt', 'Từ chối'))
);

-- 31. PhieuDieuChinhTonKho
CREATE TABLE PhieuDieuChinhTonKho (
    Ma_phieu_dieu_chinh     CHAR(20)        NOT NULL,
    Ma_bien_ban_kk          CHAR(20)        NOT NULL,
    Ma_nguoi_dung_xac_nhan  CHAR(10)        NOT NULL,
    Ngay_lap                DATE            NOT NULL,
    Ly_do_dieu_chinh        VARCHAR(500)   NULL,
    Ghi_chu                 VARCHAR(300)   NULL,
    Trang_thai              VARCHAR(50)    NOT NULL DEFAULT 'Chờ xác nhận',
    Thoi_gian_tao           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Thoi_gian_cap_nhat      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_PhieuDieuChinhTonKho PRIMARY KEY (Ma_phieu_dieu_chinh),
    CONSTRAINT FK_PDCTK_BienBan FOREIGN KEY (Ma_bien_ban_kk)
        REFERENCES BienBanKiemKe(Ma_bien_ban_kk),
    CONSTRAINT FK_PDCTK_NguoiDungXacNhan FOREIGN KEY (Ma_nguoi_dung_xac_nhan)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PDCTK_TrangThai CHECK (Trang_thai IN ('Chờ xác nhận', 'Đã xác nhận', 'Từ chối'))
);

-- 32. ChiTietDieuChinh
CREATE TABLE ChiTietDieuChinh (
    Ma_phieu_dieu_chinh CHAR(20)        NOT NULL,
    Ma_san_pham         CHAR(15)        NOT NULL,
    So_luong_dieu_chinh INT             NOT NULL,
    Loai_dieu_chinh     VARCHAR(10)    NOT NULL,
    CONSTRAINT PK_ChiTietDieuChinh PRIMARY KEY (Ma_phieu_dieu_chinh, Ma_san_pham),
    CONSTRAINT FK_CTDC_PhieuDieuChinh FOREIGN KEY (Ma_phieu_dieu_chinh)
        REFERENCES PhieuDieuChinhTonKho(Ma_phieu_dieu_chinh),
    CONSTRAINT FK_CTDC_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTDC_SoLuong CHECK (So_luong_dieu_chinh > 0),
    CONSTRAINT CK_CTDC_LoaiDieuChinh CHECK (Loai_dieu_chinh IN ('Tăng', 'Giảm'))
);

-- ============================================================
--  DỮ LIỆU MẪU – QUYỀN HỆ THỐNG
-- ============================================================

INSERT INTO Quyen (Ma_quyen, Ma_chuc_nang, Ten_quyen, Nhom_quyen, Mo_ta)
VALUES
('Q001', 'tao_phieu_nhap',    'Tạo phiếu nhập kho',                    'Nhập kho',  'Cho phép lập phiếu nhập kho mới'),
('Q002', 'phe_duyet_nhap',    'Phê duyệt phiếu nhập',                  'Nhập kho',  'Cho phép duyệt/từ chối phiếu nhập kho'),
('Q003', 'tao_yeu_cau_xuat',  'Tạo yêu cầu xuất kho',                  'Xuất kho',  'Sales tạo yêu cầu xuất kho'),
('Q004', 'lap_phieu_xuat',    'Lập phiếu xuất kho',                    'Xuất kho',  'Kế toán kho lập phiếu xuất'),
('Q005', 'phe_duyet_xuat',    'Phê duyệt phiếu xuất',                  'Xuất kho',  'Quản lý kho duyệt phiếu xuất'),
('Q006', 'xac_nhan_xuat_hang','Xác nhận xuất hàng vật lý',             'Xuất kho',  'NV kho xác nhận đã giao hàng'),
('Q007', 'tao_phieu_kiem_ke', 'Tạo phiếu kiểm kê',                     'Kiểm kê',   'Kế toán kho lập phiếu kiểm kê'),
('Q008', 'phe_duyet_kiem_ke', 'Phê duyệt phiếu/biên bản kiểm kê',      'Kiểm kê',   'Quản lý kho duyệt kiểm kê'),
('Q009', 'nhap_sl_kiem_ke',   'Nhập số lượng thực tế kiểm kê',         'Kiểm kê',   'NV kho điền SL đếm thực tế'),
('Q010', 'xac_nhan_dieu_chinh','Xác nhận phiếu điều chỉnh tồn kho',   'Kiểm kê',   'Kế toán xác nhận điều chỉnh'),
('Q011', 'xem_ton_kho',       'Xem tồn kho',                           'Chung',     'Tất cả vai trò đều có'),
('Q012', 'tao_tai_khoan',     'Tạo tài khoản mới',                     'Quản trị',  'Chỉ Admin'),
('Q013', 'vo_hieu_tai_khoan', 'Vô hiệu hóa/kích hoạt tài khoản',       'Quản trị',  'Chỉ Admin'),
('Q014', 'quan_tri_he_thong', 'Quản trị cấu hình RBAC, vai trò, quyền','Quản trị',  'Chỉ Admin');

-- ============================================================
--  DỮ LIỆU MẪU – VAI TRÒ HỆ THỐNG
-- ============================================================

INSERT INTO VaiTro (Ma_vai_tro, Ten_vai_tro, Mo_ta, La_vai_tro_co_dinh)
VALUES
('VT001', 'Admin',           'Quản trị viên hệ thống toàn quyền',                            0),
('VT002', 'Quan_ly_kho',     'Quản lý kho – phê duyệt nhập/xuất/kiểm kê',                    0),
('VT003', 'Ke_toan_kho',     'Kế toán kho – lập phiếu xuất, phiếu kiểm kê, điều chỉnh tồn', 0),
('VT004', 'Nhan_vien_kho',   'Nhân viên kho – lập phiếu nhập, xác nhận xuất hàng',           0),
('VT005', 'QC',              'Kiểm soát chất lượng – lập phiếu sự cố hàng lỗi',              1),
('VT006', 'Sale',            'Kinh doanh – chỉ được tạo yêu cầu xuất kho',                   1);

-- ============================================================
--  VIEW HỮU ÍCH
-- ============================================================

-- View tồn kho tổng hợp theo sản phẩm
CREATE VIEW vw_TonKhoTheoSanPham AS
SELECT
    sp.Ma_san_pham,
    sp.Ten_san_pham,
    dm.Ten_danh_muc,
    SUM(tk.So_luong_ton) AS Tong_so_luong_ton,
    sp.Don_vi_tinh
FROM SanPham sp
LEFT JOIN DanhMucSanPham dm ON sp.Ma_danh_muc = dm.Ma_danh_muc
LEFT JOIN TonKho tk ON sp.Ma_san_pham = tk.Ma_san_pham
GROUP BY sp.Ma_san_pham, sp.Ten_san_pham, dm.Ten_danh_muc, sp.Don_vi_tinh;

-- View phiếu nhập đang chờ duyệt
CREATE VIEW vw_PhieuNhapChoDuyet AS
SELECT
    pnk.Ma_phieu_nhap,
    pnk.Ngay_lap,
    nd.Ten_nguoi_dung AS Nguoi_lap,
    k.Ten_kho,
    pnk.Ghi_chu,
    pnk.Trang_thai
FROM PhieuNhapKho pnk
JOIN NguoiDung nd ON pnk.Ma_nguoi_dung_lap = nd.Ma_nguoi_dung
JOIN Kho k ON pnk.Ma_kho = k.Ma_kho
WHERE pnk.Trang_thai = 'Chờ phê duyệt';

-- View chênh lệch kiểm kê (thuộc tính dẫn xuất)
CREATE VIEW vw_ChenhLechKiemKe AS
SELECT
    ctkk.Ma_phieu_kiem_ke,
    ctkk.Ma_san_pham,
    sp.Ten_san_pham,
    ctkk.So_luong_he_thong,
    ctkk.So_luong_thuc_te,
    (ctkk.So_luong_thuc_te - ctkk.So_luong_he_thong) AS So_luong_chenh_lech,
    ctkk.Trang_thai_kiem_ke
FROM ChiTietKiemKe ctkk
JOIN SanPham sp ON ctkk.Ma_san_pham = sp.Ma_san_pham
WHERE ctkk.So_luong_thuc_te IS NOT NULL;
