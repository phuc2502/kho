create database DB_KHO

-- ============================================================
--  NHÓM 1 – PHÂN QUYỀN (RBAC MỞ RỘNG)
-- ============================================================

-- 1. NguoiDung
CREATE TABLE NguoiDung (
    Ma_nguoi_dung   CHAR(10)        NOT NULL,
    Ten_nguoi_dung  NVARCHAR(100)   NOT NULL,
    So_dien_thoai   CHAR(15)        NULL,
    Trang_thai      BIT             NOT NULL DEFAULT 1,
    Thoi_gian_tao   DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat DATETIME     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_NguoiDung PRIMARY KEY (Ma_nguoi_dung),
    CONSTRAINT UQ_NguoiDung_SDT UNIQUE (So_dien_thoai)
);
GO

-- 2. TaiKhoan
CREATE TABLE TaiKhoan (
    Ma_tai_khoan        CHAR(10)        NOT NULL,
    Ma_nguoi_dung       CHAR(10)        NOT NULL,
    Email               VARCHAR(150)    NOT NULL,
    Mat_khau            VARCHAR(255)    NOT NULL,
    Trang_thai          BIT             NOT NULL DEFAULT 1,
    Ma_admin_tao        CHAR(10)        NOT NULL,
    Ma_admin_vo_hieu    CHAR(10)        NULL,
    Ly_do_vo_hieu_hoa   NVARCHAR(300)   NULL,
    Ngay_vo_hieu_hoa    DATETIME        NULL,
    Ngay_dang_nhap_cuoi DATETIME        NULL,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
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
GO

-- 3. VaiTro
CREATE TABLE VaiTro (
    Ma_vai_tro          CHAR(10)        NOT NULL,
    Ten_vai_tro         NVARCHAR(100)   NOT NULL,
    Mo_ta               NVARCHAR(255)   NULL,
    La_vai_tro_co_dinh  BIT             NOT NULL DEFAULT 0,
    CONSTRAINT PK_VaiTro PRIMARY KEY (Ma_vai_tro),
    CONSTRAINT UQ_VaiTro_Ten UNIQUE (Ten_vai_tro)
);
GO

-- 4. NguoiDung_VaiTro
CREATE TABLE NguoiDung_VaiTro (
    Ma_nguoi_dung   CHAR(10)    NOT NULL,
    Ma_vai_tro      CHAR(10)    NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_NguoiDung_VaiTro PRIMARY KEY (Ma_nguoi_dung, Ma_vai_tro),
    CONSTRAINT FK_NDVaiTro_NguoiDung FOREIGN KEY (Ma_nguoi_dung)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_NDVaiTro_VaiTro FOREIGN KEY (Ma_vai_tro)
        REFERENCES VaiTro(Ma_vai_tro)
);
GO

-- 5. Quyen
CREATE TABLE Quyen (
    Ma_quyen        CHAR(15)        NOT NULL,
    Ma_chuc_nang    VARCHAR(80)     NOT NULL,
    Ten_quyen       NVARCHAR(200)   NOT NULL,
    Nhom_quyen      NVARCHAR(100)   NULL,
    Mo_ta           NVARCHAR(255)   NULL,
    CONSTRAINT PK_Quyen PRIMARY KEY (Ma_quyen),
    CONSTRAINT UQ_Quyen_MaChucNang UNIQUE (Ma_chuc_nang)
);
GO

-- 6. VaiTro_Quyen
CREATE TABLE VaiTro_Quyen (
    Ma_vai_tro      CHAR(10)    NOT NULL,
    Ma_quyen        CHAR(15)    NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_VaiTro_Quyen PRIMARY KEY (Ma_vai_tro, Ma_quyen),
    CONSTRAINT FK_VTQuyen_VaiTro FOREIGN KEY (Ma_vai_tro)
        REFERENCES VaiTro(Ma_vai_tro),
    CONSTRAINT FK_VTQuyen_Quyen FOREIGN KEY (Ma_quyen)
        REFERENCES Quyen(Ma_quyen)
);
GO

-- 7. NguoiDung_Quyen
CREATE TABLE NguoiDung_Quyen (
    Ma_nguoi_dung   CHAR(10)        NOT NULL,
    Ma_quyen        CHAR(15)        NOT NULL,
    Loai_ghi_de     NVARCHAR(10)    NOT NULL,
    Ly_do           NVARCHAR(300)   NULL,
    Thoi_gian_tao   DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_NguoiDung_Quyen PRIMARY KEY (Ma_nguoi_dung, Ma_quyen),
    CONSTRAINT FK_NDQuyen_NguoiDung FOREIGN KEY (Ma_nguoi_dung)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_NDQuyen_Quyen FOREIGN KEY (Ma_quyen)
        REFERENCES Quyen(Ma_quyen),
    CONSTRAINT CK_NDQuyen_LoaiGhiDe CHECK (Loai_ghi_de IN (N'cap_them', N'thu_hoi'))
);
GO

-- 8. LichSuHoatDong (Audit Log – chỉ INSERT)
CREATE TABLE LichSuHoatDong (
    Ma_lich_su          BIGINT          NOT NULL IDENTITY(1,1),
    Ma_tai_khoan        CHAR(10)        NOT NULL,
    Ten_nguoi_dung      NVARCHAR(100)   NOT NULL,
    Ten_hanh_dong       NVARCHAR(100)   NOT NULL,
    Ten_bang_tac_dong   NVARCHAR(100)   NULL,
    Ma_ban_ghi_tac_dong NVARCHAR(50)    NULL,
    Du_lieu_cu          NVARCHAR(MAX)   NULL,
    Du_lieu_moi         NVARCHAR(MAX)   NULL,
    Dia_chi_ip          VARCHAR(45)     NULL,
    Thiet_bi            NVARCHAR(200)   NULL,
    Thoi_gian_thao_tac  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_LichSuHoatDong PRIMARY KEY (Ma_lich_su),
    CONSTRAINT FK_LichSu_TaiKhoan FOREIGN KEY (Ma_tai_khoan)
        REFERENCES TaiKhoan(Ma_tai_khoan)
);
GO

-- ============================================================
--  NHÓM 2 – KHO & ĐỊA ĐIỂM
-- ============================================================

-- 9. Kho
CREATE TABLE Kho (
    Ma_kho              CHAR(10)        NOT NULL,
    Ten_kho             NVARCHAR(200)   NOT NULL,
    Mo_ta               NVARCHAR(500)   NULL,
    Dia_chi             NVARCHAR(300)   NULL,
    Trang_thai          BIT             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Kho PRIMARY KEY (Ma_kho)
);
GO

-- 10. NguoiDung_Kho
CREATE TABLE NguoiDung_Kho (
    Ma_nguoi_dung   CHAR(10)        NOT NULL,
    Ma_kho          CHAR(10)        NOT NULL,
    Vai_tro_tai_kho NVARCHAR(50)    NULL,
    Thoi_gian_tao   DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_NguoiDung_Kho PRIMARY KEY (Ma_nguoi_dung, Ma_kho),
    CONSTRAINT FK_NDKho_NguoiDung FOREIGN KEY (Ma_nguoi_dung)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_NDKho_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho)
);
GO

-- 11. KhuVucKho
CREATE TABLE KhuVucKho (
    Ma_khu_vuc          CHAR(10)        NOT NULL,
    Ma_kho              CHAR(10)        NOT NULL,
    Ten_khu_vuc         NVARCHAR(100)   NOT NULL,
    Mo_ta               NVARCHAR(255)   NULL,
    Trang_thai          BIT             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_KhuVucKho PRIMARY KEY (Ma_khu_vuc),
    CONSTRAINT FK_KhuVuc_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho)
);
GO

-- 12. ViTriTrongKho
CREATE TABLE ViTriTrongKho (
    Ma_vi_tri           CHAR(15)        NOT NULL,
    Ma_khu_vuc          CHAR(10)        NOT NULL,
    Ten_vi_tri          NVARCHAR(100)   NOT NULL,
    Mo_ta               NVARCHAR(255)   NULL,
    Suc_chua_toi_da     INT             NOT NULL DEFAULT 0,
    Trang_thai          NVARCHAR(30)    NOT NULL DEFAULT N'Sẵn sàng',
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ViTriTrongKho PRIMARY KEY (Ma_vi_tri),
    CONSTRAINT FK_ViTri_KhuVuc FOREIGN KEY (Ma_khu_vuc)
        REFERENCES KhuVucKho(Ma_khu_vuc),
    CONSTRAINT CK_ViTri_TrangThai CHECK (Trang_thai IN (N'Sẵn sàng', N'Đầy', N'Bảo trì'))
);
GO

-- ============================================================
--  NHÓM 3 – SẢN PHẨM & TỒN KHO
-- ============================================================

-- 13. DanhMucSanPham
CREATE TABLE DanhMucSanPham (
    Ma_danh_muc         CHAR(10)        NOT NULL,
    Ten_danh_muc        NVARCHAR(200)   NOT NULL,
    Mo_ta               NVARCHAR(500)   NULL,
    Trang_thai          BIT             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DanhMucSanPham PRIMARY KEY (Ma_danh_muc)
);
GO

-- 14. SanPham
CREATE TABLE SanPham (
    Ma_san_pham         CHAR(15)        NOT NULL,
    Ma_danh_muc         CHAR(10)        NULL,
    Ten_san_pham        NVARCHAR(200)   NOT NULL,
    Ma_barcode          VARCHAR(100)    NULL,
    Mo_ta               NVARCHAR(500)   NULL,
    Don_vi_tinh         NVARCHAR(30)    NOT NULL,
    Trong_luong         DECIMAL(10,3)   NULL,
    Gia_san_xuat        DECIMAL(15,2)   NOT NULL DEFAULT 0,
    Gia_ban             DECIMAL(15,2)   NOT NULL DEFAULT 0,
    Quan_ly_theo_serial BIT             NOT NULL DEFAULT 0,
    Trang_thai          BIT             NOT NULL DEFAULT 1,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_SanPham PRIMARY KEY (Ma_san_pham),
    CONSTRAINT UQ_SanPham_Barcode UNIQUE (Ma_barcode),
    CONSTRAINT FK_SanPham_DanhMuc FOREIGN KEY (Ma_danh_muc)
        REFERENCES DanhMucSanPham(Ma_danh_muc)
);
GO

-- 15. SoSerial
CREATE TABLE SoSerial (
    Ma_serial           VARCHAR(50)     NOT NULL,
    Ma_san_pham         CHAR(15)        NOT NULL,
    Trang_thai          NVARCHAR(30)    NOT NULL,
    Ngay_san_xuat       DATE            NULL,
    Ghi_chu             NVARCHAR(300)   NULL,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_SoSerial PRIMARY KEY (Ma_serial),
    CONSTRAINT FK_SoSerial_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_SoSerial_TrangThai CHECK (Trang_thai IN (N'Trong kho', N'Đã xuất', N'Lỗi', N'Hủy'))
);
GO

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
GO

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
    Ghi_chu                     NVARCHAR(500)   NULL,
    Trang_thai                  NVARCHAR(50)    NOT NULL DEFAULT N'Chờ phê duyệt',
    Ly_do_tu_choi               NVARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PhieuNhapKho PRIMARY KEY (Ma_phieu_nhap),
    CONSTRAINT FK_PNK_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho),
    CONSTRAINT FK_PNK_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_PNK_NguoiDungPheDuyet FOREIGN KEY (Ma_nguoi_dung_phe_duyet)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PNK_TrangThai CHECK (Trang_thai IN (N'Chờ phê duyệt', N'Đã phê duyệt', N'Từ chối'))
);
GO

-- 18. ChiTietNhapKho
CREATE TABLE ChiTietNhapKho (
    Ma_phieu_nhap   CHAR(20)        NOT NULL,
    Ma_san_pham     CHAR(15)        NOT NULL,
    So_luong_nhap   INT             NOT NULL,
    So_luong_thuc_te INT            NOT NULL DEFAULT 0,
    Ghi_chu         NVARCHAR(300)   NULL,
    CONSTRAINT PK_ChiTietNhapKho PRIMARY KEY (Ma_phieu_nhap, Ma_san_pham),
    CONSTRAINT FK_CTNhap_PhieuNhap FOREIGN KEY (Ma_phieu_nhap)
        REFERENCES PhieuNhapKho(Ma_phieu_nhap),
    CONSTRAINT FK_CTNhap_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTNhap_SoLuongNhap CHECK (So_luong_nhap > 0),
    CONSTRAINT CK_CTNhap_SoLuongThucTe CHECK (So_luong_thuc_te >= 0)
);
GO

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
GO

-- 20. ChiTietNhapSerial
CREATE TABLE ChiTietNhapSerial (
    Ma_phieu_nhap   CHAR(20)    NOT NULL,
    Ma_serial       VARCHAR(50) NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ChiTietNhapSerial PRIMARY KEY (Ma_phieu_nhap, Ma_serial),
    CONSTRAINT FK_CTNhapSerial_PhieuNhap FOREIGN KEY (Ma_phieu_nhap)
        REFERENCES PhieuNhapKho(Ma_phieu_nhap),
    CONSTRAINT FK_CTNhapSerial_Serial FOREIGN KEY (Ma_serial)
        REFERENCES SoSerial(Ma_serial)
);
GO

-- 21. PhieuSuCo
CREATE TABLE PhieuSuCo (
    Ma_phieu_su_co      CHAR(20)        NOT NULL,
    Ma_phieu_nhap       CHAR(20)        NOT NULL,
    Ma_nguoi_dung_lap   CHAR(10)        NOT NULL,
    Ngay_lap            DATE            NOT NULL,
    Loai_su_co          NVARCHAR(50)    NOT NULL,
    Mo_ta               NVARCHAR(500)   NULL,
    So_luong_su_co      INT             NOT NULL DEFAULT 0,
    Trang_thai_xu_ly    NVARCHAR(50)    NOT NULL DEFAULT N'Đang xử lý',
    Ghi_chu             NVARCHAR(300)   NULL,
    Thoi_gian_tao       DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat  DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PhieuSuCo PRIMARY KEY (Ma_phieu_su_co),
    CONSTRAINT FK_PSC_PhieuNhap FOREIGN KEY (Ma_phieu_nhap)
        REFERENCES PhieuNhapKho(Ma_phieu_nhap),
    CONSTRAINT FK_PSC_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PSC_LoaiSuCo CHECK (Loai_su_co IN (N'Hàng lỗi', N'Sai lệch số lượng')),
    CONSTRAINT CK_PSC_TrangThaiXuLy CHECK (Trang_thai_xu_ly IN (N'Đang xử lý', N'Đã giải quyết', N'Leo thang GĐ'))
);
GO

-- ============================================================
--  NHÓM 5 – XUẤT KHO
-- ============================================================

-- 22. YeuCauXuatKho
CREATE TABLE YeuCauXuatKho (
    Ma_yeu_cau                  CHAR(20)        NOT NULL,
    Ma_kho                      CHAR(10)        NOT NULL,
    Ma_nguoi_dung_tao           CHAR(10)        NOT NULL,
    Ngay_tao                    DATE            NOT NULL,
    Ten_khach_hang              NVARCHAR(200)   NOT NULL,
    Thoi_gian_giao_hang_du_kien DATETIME        NULL,
    Ghi_chu                     NVARCHAR(500)   NULL,
    Trang_thai                  NVARCHAR(60)    NOT NULL DEFAULT N'Chờ xử lý',
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_YeuCauXuatKho PRIMARY KEY (Ma_yeu_cau),
    CONSTRAINT FK_YCXK_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho),
    CONSTRAINT FK_YCXK_NguoiDungTao FOREIGN KEY (Ma_nguoi_dung_tao)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_YCXK_TrangThai CHECK (Trang_thai IN (N'Chờ xử lý', N'Tạm dừng', N'Đã xử lý'))
);
GO

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
GO

-- 24. PhieuXuatKho
CREATE TABLE PhieuXuatKho (
    Ma_phieu_xuat               CHAR(20)        NOT NULL,
    Ma_yeu_cau                  CHAR(20)        NOT NULL,
    Ma_kho                      CHAR(10)        NOT NULL,
    Ma_nguoi_dung_lap           CHAR(10)        NOT NULL,
    Ma_nguoi_dung_phe_duyet     CHAR(10)        NULL,
    Ngay_lap                    DATE            NOT NULL,
    Ngay_xuat_thuc_te           DATE            NULL,
    Ghi_chu                     NVARCHAR(500)   NULL,
    Trang_thai                  NVARCHAR(60)    NOT NULL DEFAULT N'Chờ phê duyệt',
    Ly_do_tu_choi               NVARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT GETDATE(),
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
        N'Chờ phê duyệt', N'Đã phê duyệt', N'Từ chối',
        N'Đang vận chuyển', N'Hoàn tất'))
);
GO

-- 25. ChiTietXuatKho
CREATE TABLE ChiTietXuatKho (
    Ma_phieu_xuat   CHAR(20)        NOT NULL,
    Ma_san_pham     CHAR(15)        NOT NULL,
    So_luong_xuat   INT             NOT NULL,
    Ghi_chu         NVARCHAR(300)   NULL,
    CONSTRAINT PK_ChiTietXuatKho PRIMARY KEY (Ma_phieu_xuat, Ma_san_pham),
    CONSTRAINT FK_CTXuat_PhieuXuat FOREIGN KEY (Ma_phieu_xuat)
        REFERENCES PhieuXuatKho(Ma_phieu_xuat),
    CONSTRAINT FK_CTXuat_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTXuat_SoLuong CHECK (So_luong_xuat > 0)
);
GO

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
GO

-- 27. ChiTietXuatSerial
CREATE TABLE ChiTietXuatSerial (
    Ma_phieu_xuat   CHAR(20)    NOT NULL,
    Ma_serial       VARCHAR(50) NOT NULL,
    Thoi_gian_tao   DATETIME    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ChiTietXuatSerial PRIMARY KEY (Ma_phieu_xuat, Ma_serial),
    CONSTRAINT FK_CTXuatSerial_PhieuXuat FOREIGN KEY (Ma_phieu_xuat)
        REFERENCES PhieuXuatKho(Ma_phieu_xuat),
    CONSTRAINT FK_CTXuatSerial_Serial FOREIGN KEY (Ma_serial)
        REFERENCES SoSerial(Ma_serial)
);
GO

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
    Loai_kiem_ke                NVARCHAR(60)    NULL,
    Pham_vi_kiem_ke             NVARCHAR(300)   NULL,
    Thoi_han_hoan_thanh         DATE            NULL,
    Ghi_chu                     NVARCHAR(500)   NULL,
    Trang_thai                  NVARCHAR(60)    NOT NULL DEFAULT N'Chờ phê duyệt',
    Ly_do_tu_choi               NVARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PhieuKiemKe PRIMARY KEY (Ma_phieu_kiem_ke),
    CONSTRAINT FK_PKK_Kho FOREIGN KEY (Ma_kho)
        REFERENCES Kho(Ma_kho),
    CONSTRAINT FK_PKK_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_PKK_NguoiDungPheDuyet FOREIGN KEY (Ma_nguoi_dung_phe_duyet)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PKK_TrangThai CHECK (Trang_thai IN (
        N'Chờ phê duyệt', N'Đang kiểm kê', N'Hoàn tất', N'Từ chối'))
);
GO

-- 29. ChiTietKiemKe
-- Lưu ý: So_luong_chenh_lech là thuộc tính dẫn xuất, không lưu trong bảng.
-- Truy vấn: SELECT So_luong_thuc_te - So_luong_he_thong AS So_luong_chenh_lech ...
CREATE TABLE ChiTietKiemKe (
    Ma_phieu_kiem_ke    CHAR(20)        NOT NULL,
    Ma_san_pham         CHAR(15)        NOT NULL,
    So_luong_he_thong   INT             NOT NULL DEFAULT 0,
    So_luong_thuc_te    INT             NULL,        -- NULL = chưa kiểm
    Nguyen_nhan         NVARCHAR(300)   NULL,
    Ghi_chu             NVARCHAR(300)   NULL,
    Trang_thai_kiem_ke  NVARCHAR(30)    NOT NULL DEFAULT N'Chưa kiểm',
    CONSTRAINT PK_ChiTietKiemKe PRIMARY KEY (Ma_phieu_kiem_ke, Ma_san_pham),
    CONSTRAINT FK_CTKK_PhieuKiemKe FOREIGN KEY (Ma_phieu_kiem_ke)
        REFERENCES PhieuKiemKe(Ma_phieu_kiem_ke),
    CONSTRAINT FK_CTKK_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTKK_TrangThai CHECK (Trang_thai_kiem_ke IN (N'Chưa kiểm', N'Đã kiểm', N'Có chênh lệch'))
);
GO

-- 30. BienBanKiemKe
CREATE TABLE BienBanKiemKe (
    Ma_bien_ban_kk              CHAR(20)        NOT NULL,
    Ma_phieu_kiem_ke            CHAR(20)        NOT NULL,
    Ma_nguoi_dung_lap           CHAR(10)        NOT NULL,
    Ma_nguoi_dung_phe_duyet     CHAR(10)        NULL,
    Ngay_lap                    DATE            NOT NULL,
    Ket_luan                    NVARCHAR(500)   NULL,
    Ghi_chu                     NVARCHAR(500)   NULL,
    Trang_thai                  NVARCHAR(50)    NOT NULL DEFAULT N'Chờ phê duyệt',
    Ly_do_tu_choi               NVARCHAR(500)   NULL,
    Thoi_gian_xu_ly             DATETIME        NULL,
    Thoi_gian_tao               DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat          DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_BienBanKiemKe PRIMARY KEY (Ma_bien_ban_kk),
    CONSTRAINT UQ_BBKK_PhieuKiemKe UNIQUE (Ma_phieu_kiem_ke),   -- 1:1
    CONSTRAINT FK_BBKK_PhieuKiemKe FOREIGN KEY (Ma_phieu_kiem_ke)
        REFERENCES PhieuKiemKe(Ma_phieu_kiem_ke),
    CONSTRAINT FK_BBKK_NguoiDungLap FOREIGN KEY (Ma_nguoi_dung_lap)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT FK_BBKK_NguoiDungPheDuyet FOREIGN KEY (Ma_nguoi_dung_phe_duyet)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_BBKK_TrangThai CHECK (Trang_thai IN (N'Chờ phê duyệt', N'Đã phê duyệt', N'Từ chối'))
);
GO

-- 31. PhieuDieuChinhTonKho
CREATE TABLE PhieuDieuChinhTonKho (
    Ma_phieu_dieu_chinh     CHAR(20)        NOT NULL,
    Ma_bien_ban_kk          CHAR(20)        NOT NULL,
    Ma_nguoi_dung_xac_nhan  CHAR(10)        NOT NULL,
    Ngay_lap                DATE            NOT NULL,
    Ly_do_dieu_chinh        NVARCHAR(500)   NULL,
    Ghi_chu                 NVARCHAR(300)   NULL,
    Trang_thai              NVARCHAR(50)    NOT NULL DEFAULT N'Chờ xác nhận',
    Thoi_gian_tao           DATETIME        NOT NULL DEFAULT GETDATE(),
    Thoi_gian_cap_nhat      DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PhieuDieuChinhTonKho PRIMARY KEY (Ma_phieu_dieu_chinh),
    CONSTRAINT FK_PDCTK_BienBan FOREIGN KEY (Ma_bien_ban_kk)
        REFERENCES BienBanKiemKe(Ma_bien_ban_kk),
    CONSTRAINT FK_PDCTK_NguoiDungXacNhan FOREIGN KEY (Ma_nguoi_dung_xac_nhan)
        REFERENCES NguoiDung(Ma_nguoi_dung),
    CONSTRAINT CK_PDCTK_TrangThai CHECK (Trang_thai IN (N'Chờ xác nhận', N'Đã xác nhận', N'Từ chối'))
);
GO

-- 32. ChiTietDieuChinh
CREATE TABLE ChiTietDieuChinh (
    Ma_phieu_dieu_chinh CHAR(20)        NOT NULL,
    Ma_san_pham         CHAR(15)        NOT NULL,
    So_luong_dieu_chinh INT             NOT NULL,
    Loai_dieu_chinh     NVARCHAR(10)    NOT NULL,
    CONSTRAINT PK_ChiTietDieuChinh PRIMARY KEY (Ma_phieu_dieu_chinh, Ma_san_pham),
    CONSTRAINT FK_CTDC_PhieuDieuChinh FOREIGN KEY (Ma_phieu_dieu_chinh)
        REFERENCES PhieuDieuChinhTonKho(Ma_phieu_dieu_chinh),
    CONSTRAINT FK_CTDC_SanPham FOREIGN KEY (Ma_san_pham)
        REFERENCES SanPham(Ma_san_pham),
    CONSTRAINT CK_CTDC_SoLuong CHECK (So_luong_dieu_chinh > 0),
    CONSTRAINT CK_CTDC_LoaiDieuChinh CHECK (Loai_dieu_chinh IN (N'Tăng', N'Giảm'))
);
GO

-- ============================================================
--  DỮ LIỆU MẪU – QUYỀN HỆ THỐNG
-- ============================================================

INSERT INTO Quyen (Ma_quyen, Ma_chuc_nang, Ten_quyen, Nhom_quyen, Mo_ta)
VALUES
(N'Q001', N'tao_phieu_nhap',    N'Tạo phiếu nhập kho',                    N'Nhập kho',  N'Cho phép lập phiếu nhập kho mới'),
(N'Q002', N'phe_duyet_nhap',    N'Phê duyệt phiếu nhập',                  N'Nhập kho',  N'Cho phép duyệt/từ chối phiếu nhập kho'),
(N'Q003', N'tao_yeu_cau_xuat',  N'Tạo yêu cầu xuất kho',                  N'Xuất kho',  N'Sales tạo yêu cầu xuất kho'),
(N'Q004', N'lap_phieu_xuat',    N'Lập phiếu xuất kho',                    N'Xuất kho',  N'Kế toán kho lập phiếu xuất'),
(N'Q005', N'phe_duyet_xuat',    N'Phê duyệt phiếu xuất',                  N'Xuất kho',  N'Quản lý kho duyệt phiếu xuất'),
(N'Q006', N'xac_nhan_xuat_hang',N'Xác nhận xuất hàng vật lý',             N'Xuất kho',  N'NV kho xác nhận đã giao hàng'),
(N'Q007', N'tao_phieu_kiem_ke', N'Tạo phiếu kiểm kê',                     N'Kiểm kê',   N'Kế toán kho lập phiếu kiểm kê'),
(N'Q008', N'phe_duyet_kiem_ke', N'Phê duyệt phiếu/biên bản kiểm kê',      N'Kiểm kê',   N'Quản lý kho duyệt kiểm kê'),
(N'Q009', N'nhap_sl_kiem_ke',   N'Nhập số lượng thực tế kiểm kê',         N'Kiểm kê',   N'NV kho điền SL đếm thực tế'),
(N'Q010', N'xac_nhan_dieu_chinh',N'Xác nhận phiếu điều chỉnh tồn kho',   N'Kiểm kê',   N'Kế toán xác nhận điều chỉnh'),
(N'Q011', N'xem_ton_kho',       N'Xem tồn kho',                           N'Chung',     N'Tất cả vai trò đều có'),
(N'Q012', N'tao_tai_khoan',     N'Tạo tài khoản mới',                     N'Quản trị',  N'Chỉ Admin'),
(N'Q013', N'vo_hieu_tai_khoan', N'Vô hiệu hóa/kích hoạt tài khoản',       N'Quản trị',  N'Chỉ Admin'),
(N'Q014', N'quan_tri_he_thong', N'Quản trị cấu hình RBAC, vai trò, quyền',N'Quản trị',  N'Chỉ Admin');
GO

-- ============================================================
--  DỮ LIỆU MẪU – VAI TRÒ HỆ THỐNG
-- ============================================================

INSERT INTO VaiTro (Ma_vai_tro, Ten_vai_tro, Mo_ta, La_vai_tro_co_dinh)
VALUES
(N'VT001', N'Admin',           N'Quản trị viên hệ thống toàn quyền',                            0),
(N'VT002', N'Quan_ly_kho',     N'Quản lý kho – phê duyệt nhập/xuất/kiểm kê',                    0),
(N'VT003', N'Ke_toan_kho',     N'Kế toán kho – lập phiếu xuất, phiếu kiểm kê, điều chỉnh tồn', 0),
(N'VT004', N'Nhan_vien_kho',   N'Nhân viên kho – lập phiếu nhập, xác nhận xuất hàng',           0),
(N'VT005', N'QC',              N'Kiểm soát chất lượng – lập phiếu sự cố hàng lỗi',              1),
(N'VT006', N'Sale',            N'Kinh doanh – chỉ được tạo yêu cầu xuất kho',                   1);
GO

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
GO

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
WHERE pnk.Trang_thai = N'Chờ phê duyệt';
GO

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
GO




