# Sơ đồ Quy trình Nghiệp vụ Kho (WMS) – FOSITEK (Bản cập nhật Swimlane)

Tài liệu này trình bày các quy trình nghiệp vụ Nhập kho, Xuất kho và Kiểm kê của Hệ thống Quản lý Kho (WMS) FOSITEK dưới dạng **sơ đồ làn phân vai (Swimlane)** thông qua cấu trúc `subgraph` của Mermaid.

---

## 1. Quy trình Nhập kho (Receipts Workflow)

Quy trình phối hợp giữa **Kế toán/Nhân viên lập phiếu**, **Quản lý phê duyệt** và **Hệ thống tự động** cập nhật cơ sở dữ liệu.

```mermaid
graph TB
    subgraph KeToan ["Kế toán / Nhân viên kho"]
        Start([Bắt đầu Nhập kho]) --> LapPhieu["Lập Phiếu Nhập - Trạng thái: Draft"]
        LapPhieu --> NhapChiTiet["Nhập chi tiết: SKU, Số lượng, Vị trí kho, Mã lô, Hạn bảo hành, Số serial"]
        NhapChiTiet --> GuiDuyet["Gửi yêu cầu phê duyệt"]
        EditReceipt["Sửa đổi phiếu nhập hoặc hủy"]
        NhanHang["Thực hiện nhận hàng thực tế"]
        XacNhanHoanThanh["Xác nhận Hoàn thành"]
    end
    
    subgraph HeThong ["Hệ thống"]
        ChuyenChoDuyet["Chuyển trạng thái phiếu: Chờ phê duyệt"]
        ChuyenTuChoi["Chuyển trạng thái phiếu: Từ chối & gửi thông báo"]
        ChuyenDaDuyet["Chuyển trạng thái phiếu: Đã phê duyệt"]
        ChuyenHoanThanh["Chuyển trạng thái phiếu: Hoàn thành"]
        CapNhatTon["Tự động cộng tồn kho, lưu lô, ghi serial, tạo audit log"]
    end
    
    subgraph QuanLy ["Quản lý kho"]
        XemXet["Xem xét phiếu nhập"]
        DuyetPhieu{Quyết định duyệt?}
    end

    %% Luồng liên kết qua các làn (Swimlanes)
    GuiDuyet --> ChuyenChoDuyet
    ChuyenChoDuyet --> XemXet
    XemXet --> DuyetPhieu
    
    DuyetPhieu -->|Từ chối| ChuyenTuChoi
    ChuyenTuChoi --> EditReceipt
    EditReceipt --> LapPhieu
    
    DuyetPhieu -->|Đồng ý| ChuyenDaDuyet
    ChuyenDaDuyet --> NhanHang
    NhanHang --> XacNhanHoanThanh
    XacNhanHoanThanh --> ChuyenHoanThanh
    ChuyenHoanThanh --> CapNhatTon
    CapNhatTon --> EndReceipt([Kết thúc Nhập kho])
```

---

## 2. Quy trình Xuất kho (Deliveries Workflow)

Quy trình xuất kho phối hợp giữa 6 vai trò/bộ phận: **Bộ phận yêu cầu (Sale)**, **Hệ thống**, **Kế toán kho**, **Quản lý kho**, **Nhân viên kho** và **Đơn vị vận chuyển**.

```mermaid
graph TB
    subgraph Sale ["Bộ phận yêu cầu (Sale)"]
        Start([Bắt đầu]) --> DangNhap["Đăng nhập & chọn chức năng"]
        DangNhap --> TaoYeuCau["Tạo Yêu cầu xuất kho - Trạng thái: Pending"]
    end
    
    subgraph HeThong ["Hệ thống"]
        HienThiList["Hiển thị danh sách Yêu cầu"]
        LuuYeuCau["Lưu yêu cầu & gửi thông báo"]
        KiemTraTonKho["Kiểm tra tồn kho trong DB"]
        CapNhatTamDung["Cập nhật trạng thái Yêu cầu: Tạm dừng - Không đủ tồn kho"]
        HienThiKhaDung["Hiển thị trạng thái: Khả dụng"]
        CapNhatChoDuyet["Chuyển trạng thái Phiếu xuất: Chờ phê duyệt"]
        CapNhatTuChoi["Chuyển trạng thái Phiếu xuất: Từ chối & gửi thông báo"]
        CapNhatDaDuyet["Chuyển trạng thái Phiếu xuất: Đã phê duyệt"]
        CapNhatDangVanChuyen["Chuyển trạng thái Phiếu xuất: Đang vận chuyển"]
        CapNhatHoanThanh["Cập nhật số lượng sản phẩm & Chuyển phiếu xuất: Hoàn thành"]
    end
    
    subgraph KeToan ["Kế toán kho"]
        XemYeuCau["Xem chi tiết yêu cầu xuất"]
        NhanKiemTra["Nhấn 'Kiểm tra tồn kho'"]
        LapPhieuXuat["Lập phiếu xuất kho nháp từ yêu cầu"]
        GuiPheDuyet["Kiểm tra thông tin & Gửi phê duyệt"]
    end
    
    subgraph QuanLy ["Quản lý kho"]
        XemXet["Xem xét phiếu xuất kho"]
        DuyetPhieu{Phê duyệt?}
        TuChoi["Ghi nguyên nhân từ chối"]
    end
    
    subgraph NhanVien ["Nhân viên kho"]
        KiemHang["Kiểm hàng thực tế trong kho"]
        DongGoi["Đóng gói & dán tem thùng hàng"]
        XacNhanXuat["Nhấn 'Xác nhận xuất hàng'"]
        XacNhanHoanThanh["Nhận lại phiếu ký nhận & Nhấn 'Hoàn thành xuất kho'"]
    end
    
    subgraph VanChuyen ["Đơn vị vận chuyển / Người nhận"]
        NhanHang["Nhận hàng & kiểm tra số lượng"]
        KyNhan["Ký nhận phiếu xuất kho"]
    end

    %% Luồng liên kết qua các làn (Swimlanes)
    TaoYeuCau --> HienThiList
    HienThiList --> LuuYeuCau
    LuuYeuCau --> XemYeuCau
    XemYeuCau --> NhanKiemTra
    NhanKiemTra --> KiemTraTonKho
    
    KiemTraTonKho -->|Không đủ| CapNhatTamDung
    CapNhatTamDung --> EndFailed([Kết thúc - Tạm dừng])
    
    KiemTraTonKho -->|Đủ| HienThiKhaDung
    HienThiKhaDung --> LapPhieuXuat
    LapPhieuXuat --> GuiPheDuyet
    GuiPheDuyet --> CapNhatChoDuyet
    CapNhatChoDuyet --> XemXet
    
    XemXet --> DuyetPhieu
    DuyetPhieu -->|Không đồng ý| TuChoi
    TuChoi --> CapNhatTuChoi
    CapNhatTuChoi --> EndFailed2([Kết thúc - Hủy])
    
    DuyetPhieu -->|Đồng ý| CapNhatDaDuyet
    CapNhatDaDuyet --> KiemHang
    
    KiemHang --> DongGoi
    DongGoi --> XacNhanXuat
    XacNhanXuat --> CapNhatDangVanChuyen
    CapNhatDangVanChuyen --> NhanHang
    
    NhanHang --> KyNhan
    KyNhan --> XacNhanHoanThanh
    XacNhanHoanThanh --> CapNhatHoanThanh
    CapNhatHoanThanh --> EndSuccess([Kết thúc - Hoàn tất])
```

---

## 3. Quy trình Kiểm kê & Điều chỉnh Tồn kho (Stocktake & Adjustment Workflow)

Quy trình phối hợp giữa **Kế toán/Nhân viên kiểm đếm**, **Quản lý phê duyệt** và **Hệ thống** cập nhật lại số lượng tồn kho.

```mermaid
graph TB
    subgraph KeToan ["Kế toán / Nhân viên kho"]
        Start([Bắt đầu]) --> TaoKiemKe["Tạo Phiếu Kiểm kê - Trạng thái: Draft"]
        TaoKiemKe --> ChonViTri["Chọn sản phẩm & Vị trí kho cần kiểm"]
        ChonViTri --> KiemDem["Quét mã QR/Serial hoặc kiểm đếm thực tế"]
        KiemDem --> NhapThucTe["Nhập số lượng thực tế vào hệ thống"]
        LapDieuChinh["Lập Phiếu Điều chỉnh - Adjustment"]
        GiaiTrinh["Giải trình lý do thừa/thiếu & Gửi duyệt"]
        DemLai["Kiểm tra / Đếm lại thực tế"]
    end
    
    subgraph HeThong ["Hệ thống"]
        TinhChenhLech["Tính chênh lệch = Thực tế - Hệ thống"]
        CapNhatThanhCong["Chuyển trạng thái phiếu Kiểm kê: Completed"]
        CapNhatDieuChinh["Cập nhật tồn kho thực tế & Chuyển phiếu: Completed"]
    end
    
    subgraph QuanLy ["Quản lý kho"]
        XemXet["Xem xét phiếu điều chỉnh"]
        DuyetDieuChinh{Phê duyệt?}
    end

    %% Luồng liên kết qua các làn (Swimlanes)
    NhapThucTe --> TinhChenhLech
    
    TinhChenhLech -->|Không lệch| CapNhatThanhCong
    CapNhatThanhCong --> EndKiemKe([Kết thúc Kiểm kê])
    
    TinhChenhLech -->|Có lệch| LapDieuChinh
    LapDieuChinh --> GiaiTrinh
    GiaiTrinh --> XemXet
    
    XemXet --> DuyetDieuChinh
    DuyetDieuChinh -->|Từ chối| DemLai
    DemLai --> KiemDem
    
    DuyetDieuChinh -->|Đồng ý| CapNhatDieuChinh
    CapNhatDieuChinh --> EndKiemKe
```
