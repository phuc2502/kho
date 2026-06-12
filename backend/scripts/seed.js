import { sequelize, connectDB } from '../config/db.js';
import { User }                    from '../models/user.model.js';
import { Category }                from '../models/category.model.js';
import { Product }                 from '../models/product.model.js';
import { WarehouseNode }            from '../models/warehouseNode.model.js';
import { Inventory }               from '../models/inventory.model.js';
import { Receipt, ReceiptItem }    from '../models/receipt.model.js';
import { Delivery, DeliveryItem }  from '../models/delivery.model.js';
import { Stocktake, StocktakeItem }from '../models/stocktake.model.js';
import { StocktakeMinutes }        from '../models/stocktakeMinutes.model.js';
import { StocktakeReport }         from '../models/stocktakeReport.model.js';
import { Incident, IncidentItem }  from '../models/incident.model.js';
import { DeliveryRequest, DeliveryRequestItem } from '../models/deliveryRequest.model.js';
import { Customer }                from '../models/customer.model.js';
import { Adjustment, AdjustmentItem } from '../models/adjustment.model.js';
import { StockCard }               from '../models/stockCard.model.js';

// helper: SET createdAt/updatedAt via raw SQL sau khi tạo (timestamps: true không cho set trực tiếp)
const setDates = async (table, id, createdDaysAgo, updatedDaysAgo = createdDaysAgo - 1) => {
  await sequelize.query(
    `UPDATE ${table} SET createdAt = DATE_SUB(NOW(), INTERVAL ? DAY),
                         updatedAt = DATE_SUB(NOW(), INTERVAL ? DAY)
     WHERE _id = ?`,
    { replacements: [createdDaysAgo, updatedDaysAgo, id] }
  );
};

const seed = async () => {
  try {
    await connectDB();
    console.log('Syncing database (force: true)…');
    await sequelize.sync({ force: true });
    console.log('Database cleared.\n');

    // ══════════════════════════════════════════════════════════════
    // 1. USERS (7 tài khoản)
    // ══════════════════════════════════════════════════════════════
    const admin      = await User.create({ username:'admin',      email:'admin@fositek.vn',         password:'admin123',    role:'Admin',        fullName:'Nguyễn Thành Đạt',   phone:'0836417501' });
    const manager    = await User.create({ username:'quanly',     email:'hoang.vu@fositek.vn',      password:'quanly123',   role:'QuanLyKho',    fullName:'Vũ Xuân Hoàng',      phone:'0836417502' });
    const accountant1= await User.create({ username:'ketoan1',    email:'lananh.tran@fositek.vn',   password:'ketoan123',   role:'KeToanKho',    fullName:'Trần Thị Lan Anh',   phone:'0836417503' });
    const staff1     = await User.create({ username:'nhanvien1',  email:'tuan.pham@fositek.vn',     password:'nhanvien123', role:'NhanVienKho',  fullName:'Phạm Văn Tuấn',      phone:'0836417504' });
    const staff2     = await User.create({ username:'nhanvien2',  email:'hung.le@fositek.vn',       password:'nhanvien123', role:'NhanVienKho',  fullName:'Lê Quang Hưng',      phone:'0836417505' });
    const qc         = await User.create({ username:'qc',         email:'ngoc.do@fositek.vn',       password:'qc123456',    role:'QC',           fullName:'Đỗ Thị Ngọc',        phone:'0836417506', position:'Nhân viên QC' });
    const accountant2= await User.create({ username:'ketoan2',    email:'hang.bui@fositek.vn',      password:'ketoan123',   role:'KeToanKho',    fullName:'Bùi Thị Hằng',       phone:'0836417508' });
    const sale       = await User.create({ username:'sale',       email:'sale.nguyen@fositek.vn',   password:'sale1234',    role:'Sale',         fullName:'Nguyễn Minh Khoa',   phone:'0836417509', position:'Nhân viên Kinh doanh' });

    console.log('✓ Users (8)');

    // ══════════════════════════════════════════════════════════════
    // 1.5. CUSTOMERS (12 khách hàng)
    // ══════════════════════════════════════════════════════════════
    const custSamsung  = await Customer.create({ code:'KH-20260101-0001', name:'Samsung Electronics Vietnam',  phone:'024-3825-0001', address:'Khu công nghiệp Yên Phong, Bắc Ninh' });
    const custDell     = await Customer.create({ code:'KH-20260101-0002', name:'Dell Technologies Vietnam',    phone:'028-3636-0002', address:'Khu công nghiệp VSIP II, Bình Dương' });
    const custHP       = await Customer.create({ code:'KH-20260101-0003', name:'HP Vietnam Sales',             phone:'024-3823-0003', address:'Keangnam Landmark 72, Hà Nội' });
    const custLenovo   = await Customer.create({ code:'KH-20260101-0004', name:'Lenovo Technology Vietnam',    phone:'028-3512-0004', address:'Tòa nhà Sunwah, TP Hồ Chí Minh' });
    const custAsus     = await Customer.create({ code:'KH-20260101-0005', name:'Asus Technology Vietnam',      phone:'028-3776-0005', address:'Khu công nghiệp Tân Bình, TP HCM' });
    const custLG       = await Customer.create({ code:'KH-20260101-0006', name:'LG Electronics Vietnam',       phone:'024-3936-0006', address:'Khu công nghiệp Tràng Duệ, Hải Phòng' });
    const custAcer     = await Customer.create({ code:'KH-20260101-0007', name:'Acer Inc. Vietnam Branch',     phone:'028-3915-0007', address:'Lầu 9, 27 Hoàng Diệu, TP HCM' });
    const custMSI      = await Customer.create({ code:'KH-20260101-0008', name:'MSI Technology Vietnam',       phone:'028-3820-0008', address:'Khu CNTT tập trung Quang Trung, TP HCM' });
    const custPanasonic= await Customer.create({ code:'KH-20260101-0009', name:'Panasonic Vietnam',            phone:'024-3831-0009', address:'Khu công nghiệp Thăng Long, Hà Nội' });
    const custToshiba  = await Customer.create({ code:'KH-20260101-0010', name:'Toshiba Storage Vietnam',      phone:'024-3944-0010', address:'Khu công nghiệp Bắc Thăng Long, Hà Nội' });
    const custFoxconn  = await Customer.create({ code:'KH-20260101-0011', name:'Foxconn Technology Vietnam',   phone:'0221-3730-011', address:'Khu công nghiệp Quế Võ, Bắc Ninh' });
    const custHisense  = await Customer.create({ code:'KH-20260101-0012', name:'Hisense Electronics Vietnam',  phone:'028-3622-0012', address:'Khu công nghiệp Long Hậu, Long An' });

    console.log('✓ Customers (12)');

    // ══════════════════════════════════════════════════════════════
    // 2. CATEGORIES
    // ══════════════════════════════════════════════════════════════
    const catHinge = await Category.create({ name:'Trục xoay máy tính (Bản lề)',       description:'Linh kiện trục xoay (hinge) dùng cho màn hình laptop: loại 360° cho 2-in-1 convertible và 180° cho laptop thông thường. Vật liệu: hợp kim kẽm ZA-8, thép không gỉ SUS304.' });
    const catSlide = await Category.create({ name:'Thanh trượt máy tính (Slide Rail)', description:'Thanh ray dẫn hướng và cơ cấu trượt định vị dùng trong cụm bàn phím và khung màn hình laptop. Vật liệu: thép không gỉ SUS301, nhôm hợp kim 6061-T6.' });
    const catMIM   = await Category.create({ name:'Linh kiện MIM (Kim loại đúc áp lực)',description:'Các chi tiết kim loại chính xác cao sản xuất bằng công nghệ Metal Injection Molding (MIM): giá đỡ bản lề, khung viền camera. Quản lý theo serial do giá trị cao và yêu cầu truy xuất nguồn gốc.' });
    console.log('✓ Categories (3)');

    // ══════════════════════════════════════════════════════════════
    // 3. PRODUCTS (6 SKU)
    // ══════════════════════════════════════════════════════════════
    const p1 = await Product.create({ sku:'FST-H360-14',    name:'Trục xoay 360° FST-H360-14',       description:'Trục xoay (hinge) 360° cho laptop convertible/2-in-1 màn hình 14". Vật liệu: ZA-8 + SUS304. Mô-men xoắn: 1.8 N·m. Độ bền: 30.000 chu kỳ.',              priceIn:18000,  priceOut:30000, unit:'Cái', categoryId:catHinge._id });
    const p2 = await Product.create({ sku:'FST-H180-156',   name:'Trục xoay 180° FST-H180-156',      description:'Trục xoay (hinge) 180° cho laptop thông thường màn hình 15.6". Vật liệu: ZA-8. Mô-men xoắn: 1.2 N·m. Độ bền: 20.000 chu kỳ.',                       priceIn:13500,  priceOut:22000, unit:'Cái', categoryId:catHinge._id });
    const p3 = await Product.create({ sku:'FST-SLK-380',    name:'Thanh ray dẫn hướng FST-SLK-380',  description:'Thanh ray dẫn hướng (keyboard slide rail) dài 380mm dùng trong cụm bàn phím laptop. Vật liệu: SUS301. Hành trình: 8mm. Lực trượt: 0.3–0.5N.',        priceIn:28000,  priceOut:46000, unit:'Bộ', categoryId:catSlide._id });
    const p4 = await Product.create({ sku:'FST-SL2IN1-135', name:'Cơ cấu trượt 2-in-1 FST-SL2IN1-135',description:'Cơ cấu trượt và định vị góc cho laptop 2-in-1 tháo rời bàn phím. Vật liệu: nhôm 6061-T6. Góc dừng: 0°–135°. Lực giữ: 2.5N. Độ bền: 100.000 chu kỳ.',priceIn:58000, priceOut:92000, unit:'Bộ', categoryId:catSlide._id });
    const p5 = await Product.create({ sku:'FST-MIM-HB14',   name:'Giá đỡ bản lề MIM FST-MIM-HB14',   description:'Chi tiết giá đỡ hinge bracket nối trục xoay vào khung máy laptop 14", sản xuất bằng MIM. Vật liệu: thép 17-4PH (H900). Kích thước: 38×22×4mm.',     priceIn:105000, priceOut:162000,unit:'Cái', categoryId:catMIM._id });
    const p6 = await Product.create({ sku:'FST-MIM-CB01',   name:'Khung viền camera MIM FST-MIM-CB01',description:'Khung gắn và bảo vệ module camera laptop (camera bezel frame), sản xuất bằng MIM. Vật liệu: thép 316L. Kích thước: 25×8×3mm. Xử lý: electropolish + PVD.',priceIn:88000, priceOut:136000,unit:'Cái', categoryId:catMIM._id });
    console.log('✓ Products (6)');

    // ══════════════════════════════════════════════════════════════
    // 4. WAREHOUSE NODES
    // ══════════════════════════════════════════════════════════════
    const wh    = await WarehouseNode.create({ name:'Kho thành phẩm FOSITEK – Hà Nam', code:'WH-FST-HN',  type:'warehouse' });
    const zoneA = await WarehouseNode.create({ name:'Khu A – Trục xoay',               code:'ZONE-A',     type:'zone', parentId:wh._id });
    const zoneB = await WarehouseNode.create({ name:'Khu B – Thanh trượt',             code:'ZONE-B',     type:'zone', parentId:wh._id });
    const zoneC = await WarehouseNode.create({ name:'Khu C – MIM',                     code:'ZONE-C',     type:'zone', parentId:wh._id });
    // Aisles (dãy kệ) — cấp giữa zone và rack
    const aisleA1 = await WarehouseNode.create({ name:'Dãy kệ A1', code:'DKE-A1', type:'aisle', parentId:zoneA._id });
    const aisleB1 = await WarehouseNode.create({ name:'Dãy kệ B1', code:'DKE-B1', type:'aisle', parentId:zoneB._id });
    const aisleC1 = await WarehouseNode.create({ name:'Dãy kệ C1', code:'DKE-C1', type:'aisle', parentId:zoneC._id });
    // Racks (kệ chứa) — con của dãy kệ
    const rackA1 = await WarehouseNode.create({ name:'Kệ A1', code:'RACK-A1', type:'rack', parentId:aisleA1._id });
    const rackA2 = await WarehouseNode.create({ name:'Kệ A2', code:'RACK-A2', type:'rack', parentId:aisleA1._id });
    const rackB1 = await WarehouseNode.create({ name:'Kệ B1', code:'RACK-B1', type:'rack', parentId:aisleB1._id });
    const rackB2 = await WarehouseNode.create({ name:'Kệ B2', code:'RACK-B2', type:'rack', parentId:aisleB1._id });
    const rackC1 = await WarehouseNode.create({ name:'Kệ C1', code:'RACK-C1', type:'rack', parentId:aisleC1._id });
    // Bins (khay chứa) — cấp lá
    const binA101 = await WarehouseNode.create({ name:'Kệ A1, Hàng 1', code:'VT-A1-01', type:'bin', parentId:rackA1._id });
    const binA102 = await WarehouseNode.create({ name:'Kệ A1, Hàng 2', code:'VT-A1-02', type:'bin', parentId:rackA1._id });
    const binA201 = await WarehouseNode.create({ name:'Kệ A2, Hàng 1', code:'VT-A2-01', type:'bin', parentId:rackA2._id });
    const binB101 = await WarehouseNode.create({ name:'Kệ B1, Hàng 1', code:'VT-B1-01', type:'bin', parentId:rackB1._id });
    const binB102 = await WarehouseNode.create({ name:'Kệ B1, Hàng 2', code:'VT-B1-02', type:'bin', parentId:rackB1._id });
    const binB201 = await WarehouseNode.create({ name:'Kệ B2, Hàng 1', code:'VT-B2-01', type:'bin', parentId:rackB2._id });
    const binC101 = await WarehouseNode.create({ name:'Kệ C1, Hàng 1', code:'VT-C1-01', type:'bin', parentId:rackC1._id });
    const binC102 = await WarehouseNode.create({ name:'Kệ C1, Hàng 2', code:'VT-C1-02', type:'bin', parentId:rackC1._id });
    console.log('✓ Warehouse: WH-FST-HN → ZONE A/B/C → 3 aisles → 5 racks → 8 bins');

    // ══════════════════════════════════════════════════════════════
    // 5. INVENTORY (tồn kho hiện tại)
    //    Ghi chú: một số bin sẽ được đặt ngày cũ để test widget "tồn lâu ngày"
    // ══════════════════════════════════════════════════════════════
    const inv1 = await Inventory.create({ productId:p1._id, warehouseNodeId:binA101._id, quantity:97  });
    const inv2 = await Inventory.create({ productId:p1._id, warehouseNodeId:binA102._id, quantity:200 });
    const inv3 = await Inventory.create({ productId:p2._id, warehouseNodeId:binA201._id, quantity:200 });
    const inv4 = await Inventory.create({ productId:p3._id, warehouseNodeId:binB101._id, quantity:300 });
    const inv5 = await Inventory.create({ productId:p3._id, warehouseNodeId:binB102._id, quantity:400 });
    const inv6 = await Inventory.create({ productId:p4._id, warehouseNodeId:binB201._id, quantity:200 });
    const inv7 = await Inventory.create({ productId:p5._id, warehouseNodeId:binC101._id, quantity:7   });
    const inv8 = await Inventory.create({ productId:p6._id, warehouseNodeId:binC102._id, quantity:5   });

    // ▶ Giả lập "tồn lâu ngày": cập nhật updatedAt của một số bin về quá 30 ngày trước
    //   binB102 (SLK-380, 400 bộ): updatedAt = 65 ngày trước
    //   binC101 (MIM-HB14, 7 cái): updatedAt = 92 ngày trước
    //   inv6    (SL2IN1, 200 bộ):  updatedAt = 48 ngày trước
    await sequelize.query(`UPDATE Inventories SET updatedAt=DATE_SUB(NOW(),INTERVAL 65 DAY) WHERE _id=?`, { replacements:[inv5._id] });
    await sequelize.query(`UPDATE Inventories SET updatedAt=DATE_SUB(NOW(),INTERVAL 92 DAY) WHERE _id=?`, { replacements:[inv7._id] });
    await sequelize.query(`UPDATE Inventories SET updatedAt=DATE_SUB(NOW(),INTERVAL 48 DAY) WHERE _id=?`, { replacements:[inv6._id] });

    console.log('✓ Inventory (8 dòng); 3 bin đặt updatedAt cũ cho widget tồn-lâu-ngày');

    // Set minStock for MIM products (low quantity alerts)
    await sequelize.query(`UPDATE Inventories SET minStock = 15 WHERE _id = ?`, { replacements: [inv7._id] }); // MIM-HB14 qty=7
    await sequelize.query(`UPDATE Inventories SET minStock = 15 WHERE _id = ?`, { replacements: [inv8._id] }); // MIM-CB01 qty=5
    console.log('✓ minStock set for MIM products (inv7=15, inv8=15)');

    // ══════════════════════════════════════════════════════════════
    // 6. RECEIPTS (5 phiếu nhập)
    // ══════════════════════════════════════════════════════════════
    // RC-001/002: Kế toán kho tạo phiếu, NVK đã hoàn tất (bins đã được gán, tồn kho đã cập nhật)
    const rc1 = await Receipt.create({ code:'RC-2026-00001', ghiChu:'Lô tháng 1/2026 – Trục xoay 360° & 180°',          totalAmount:(500*18000)+(300*13500), createdByUserId:accountant1._id, status:'completed' });
    await ReceiptItem.create({ receiptId:rc1._id, productId:p1._id, quantity:500, price:18000, warehouseNodeId:binA101._id });
    await ReceiptItem.create({ receiptId:rc1._id, productId:p2._id, quantity:300, price:13500, warehouseNodeId:binA201._id });
    await setDates('Receipts', rc1._id, 90, 88);

    const rc2 = await Receipt.create({ code:'RC-2026-00002', ghiChu:'Lô tháng 2/2026 – Thanh ray & cơ cấu trượt',       totalAmount:(700*28000)+(200*58000), createdByUserId:accountant1._id, status:'completed' });
    await ReceiptItem.create({ receiptId:rc2._id, productId:p3._id, quantity:700, price:28000, warehouseNodeId:binB101._id });
    await ReceiptItem.create({ receiptId:rc2._id, productId:p4._id, quantity:200, price:58000, warehouseNodeId:binB201._id });
    await setDates('Receipts', rc2._id, 75, 73);

    // RC-003: đã phê duyệt, NVK chưa cập nhật vị trí (warehouseNodeId=null → NVK sẽ gán khi hoàn tất)
    const rc3 = await Receipt.create({ code:'RC-2026-00003', ghiChu:'Lô tháng 3/2026 – Linh kiện MIM (HB14 + CB01)',    totalAmount:(10*105000)+(5*88000),  createdByUserId:accountant2._id, status:'approved' });
    await ReceiptItem.create({ receiptId:rc3._id, productId:p5._id, quantity:10,  price:105000, warehouseNodeId:null });
    await ReceiptItem.create({ receiptId:rc3._id, productId:p6._id, quantity:5,   price:88000,  warehouseNodeId:null });
    await setDates('Receipts', rc3._id, 3, 2);

    // RC-004: Kế toán kho vừa tạo, đang chờ phê duyệt (NVK báo thiếu hàng → incident INC-001)
    const rc4 = await Receipt.create({ code:'RC-2026-00004', ghiChu:'Lô bổ sung tháng 5/2026 – Trục xoay & thanh ray',  totalAmount:(200*18000)+(300*28000), createdByUserId:accountant1._id, status:'draft' });
    await ReceiptItem.create({ receiptId:rc4._id, productId:p1._id, quantity:200, price:18000, warehouseNodeId:null });
    await ReceiptItem.create({ receiptId:rc4._id, productId:p3._id, quantity:300, price:28000, warehouseNodeId:null });
    await setDates('Receipts', rc4._id, 5, 3);

    // RC-005: Bị từ chối do QC báo lỗi bề mặt
    const rc5 = await Receipt.create({ code:'RC-2026-00005', ghiChu:'Lô tháng 4/2026 – Từ chối do QC không đạt (lỗi bề mặt)', rejectNote:'QC phát hiện lỗi bề mặt xước trên 30% lô. Yêu cầu nhà cung cấp đổi hàng.', totalAmount:(150*13500), createdByUserId:accountant2._id, status:'rejected' });
    await ReceiptItem.create({ receiptId:rc5._id, productId:p2._id, quantity:150, price:13500, warehouseNodeId:null });
    await setDates('Receipts', rc5._id, 30, 29);

    console.log('✓ Receipts (5): completed×2, approved×1, draft×1, rejected×1');

    // ══════════════════════════════════════════════════════════════
    // 7. DELIVERIES (14 phiếu xuất)
    //    ── 7 phiếu lịch sử (> 30 ngày, completed) ──────────────
    //    ── 5 phiếu gần đây (≤ 30 ngày, completed) ──────────────
    //    ── 2 phiếu chờ xử lý (draft + approved) ────────────────
    // ══════════════════════════════════════════════════════════════

    // ── Lịch sử (widget "Top 10 xuất nhiều nhất") ────────────────

    // DL-001 Samsung – Trục xoay (75 ngày trước)
    const dl1 = await Delivery.create({
      code:'DL-2026-00001', customerId:custSamsung._id, tenKhachHang:'Samsung Electronics Vietnam',
      totalAmount:(150*30000)+(80*22000), status:'completed', createdByUserId:staff1._id
    });
    await DeliveryItem.create({ deliveryId:dl1._id, productId:p1._id, quantity:150, price:30000, warehouseNodeId:binA101._id });
    await DeliveryItem.create({ deliveryId:dl1._id, productId:p2._id, quantity:80,  price:22000, warehouseNodeId:binA201._id });
    await setDates('Deliveries', dl1._id, 75, 74);

    // DL-002 Dell – Thanh ray (65 ngày trước)
    const dl2 = await Delivery.create({
      code:'DL-2026-00002', customerId:custDell._id, tenKhachHang:'Dell Technologies Vietnam',
      totalAmount:(200*46000), status:'completed', createdByUserId:staff2._id
    });
    await DeliveryItem.create({ deliveryId:dl2._id, productId:p3._id, quantity:200, price:46000, warehouseNodeId:binB101._id });
    await setDates('Deliveries', dl2._id, 65, 64);

    // DL-003 HP – Trục xoay 360° & cơ cấu trượt (55 ngày trước)
    const dl3 = await Delivery.create({
      code:'DL-2026-00003', customerId:custHP._id, tenKhachHang:'HP Vietnam Sales',
      totalAmount:(100*30000)+(100*92000), status:'completed', createdByUserId:accountant1._id
    });
    await DeliveryItem.create({ deliveryId:dl3._id, productId:p1._id, quantity:100, price:30000, warehouseNodeId:binA101._id });
    await DeliveryItem.create({ deliveryId:dl3._id, productId:p4._id, quantity:100, price:92000, warehouseNodeId:binB201._id });
    await setDates('Deliveries', dl3._id, 55, 54);

    // DL-004 Lenovo – MIM (50 ngày trước)
    const dl4 = await Delivery.create({
      code:'DL-2026-00004', customerId:custLenovo._id, tenKhachHang:'Lenovo Technology Vietnam',
      totalAmount:(3*162000)+(2*136000), status:'completed', createdByUserId:staff1._id
    });
    await DeliveryItem.create({ deliveryId:dl4._id, productId:p5._id, quantity:3, price:162000, warehouseNodeId:binC101._id });
    await DeliveryItem.create({ deliveryId:dl4._id, productId:p6._id, quantity:2, price:136000, warehouseNodeId:binC102._id });
    await setDates('Deliveries', dl4._id, 50, 49);

    // DL-005 Asus – Thanh ray (42 ngày trước)
    const dl5 = await Delivery.create({
      code:'DL-2026-00005', customerId:custAsus._id, tenKhachHang:'Asus Technology Vietnam',
      totalAmount:(250*46000)+(80*92000), status:'completed', createdByUserId:accountant2._id
    });
    await DeliveryItem.create({ deliveryId:dl5._id, productId:p3._id, quantity:250, price:46000, warehouseNodeId:binB101._id });
    await DeliveryItem.create({ deliveryId:dl5._id, productId:p4._id, quantity:80,  price:92000, warehouseNodeId:binB201._id });
    await setDates('Deliveries', dl5._id, 42, 41);

    // DL-006 LG – Trục xoay + 180° (38 ngày trước)
    const dl6 = await Delivery.create({
      code:'DL-2026-00006', customerId:custLG._id, tenKhachHang:'LG Electronics Vietnam',
      totalAmount:(80*30000)+(50*22000), status:'completed', createdByUserId:staff1._id
    });
    await DeliveryItem.create({ deliveryId:dl6._id, productId:p1._id, quantity:80, price:30000, warehouseNodeId:binA101._id });
    await DeliveryItem.create({ deliveryId:dl6._id, productId:p2._id, quantity:50, price:22000, warehouseNodeId:binA201._id });
    await setDates('Deliveries', dl6._id, 38, 37);

    // DL-007 Acer – 180° & SL2IN1 (35 ngày trước)
    const dl7 = await Delivery.create({
      code:'DL-2026-00007', customerId:custAcer._id, tenKhachHang:'Acer Inc. Vietnam Branch',
      totalAmount:(120*22000)+(60*92000), status:'completed', createdByUserId:staff2._id
    });
    await DeliveryItem.create({ deliveryId:dl7._id, productId:p2._id, quantity:120, price:22000, warehouseNodeId:binA201._id });
    await DeliveryItem.create({ deliveryId:dl7._id, productId:p4._id, quantity:60,  price:92000, warehouseNodeId:binB201._id });
    await setDates('Deliveries', dl7._id, 35, 34);

    // ── Gần đây ≤30 ngày (widget "Tốc độ tiêu thụ 30 ngày") ──────

    // DL-008 Samsung Q2 – Trục xoay & thanh ray (20 ngày trước)
    const dl8 = await Delivery.create({
      code:'DL-2026-00008', customerId:custSamsung._id, tenKhachHang:'Samsung Electronics Vietnam',
      totalAmount:(200*30000)+(100*46000), status:'completed', createdByUserId:accountant1._id
    });
    await DeliveryItem.create({ deliveryId:dl8._id, productId:p1._id, quantity:200, price:30000, warehouseNodeId:binA102._id });
    await DeliveryItem.create({ deliveryId:dl8._id, productId:p3._id, quantity:100, price:46000, warehouseNodeId:binB102._id });
    await setDates('Deliveries', dl8._id, 20, 19);

    // DL-009 Dell Q2 – 180° (15 ngày trước)
    const dl9 = await Delivery.create({
      code:'DL-2026-00009', customerId:custDell._id, tenKhachHang:'Dell Technologies Vietnam',
      totalAmount:(150*22000), status:'completed', createdByUserId:staff1._id
    });
    await DeliveryItem.create({ deliveryId:dl9._id, productId:p2._id, quantity:150, price:22000, warehouseNodeId:binA201._id });
    await setDates('Deliveries', dl9._id, 15, 14);

    // DL-010 HP Q2 – SL2IN1 & MIM (10 ngày trước)
    const dl10 = await Delivery.create({
      code:'DL-2026-00010', customerId:custHP._id, tenKhachHang:'HP Vietnam Sales',
      totalAmount:(80*92000)+(2*162000), status:'completed', createdByUserId:accountant2._id
    });
    await DeliveryItem.create({ deliveryId:dl10._id, productId:p4._id, quantity:80, price:92000, warehouseNodeId:binB201._id });
    await DeliveryItem.create({ deliveryId:dl10._id, productId:p5._id, quantity:2,  price:162000,warehouseNodeId:binC101._id });
    await setDates('Deliveries', dl10._id, 10, 9);

    // DL-011 Asus Q2 – Thanh ray (7 ngày trước)
    const dl11 = await Delivery.create({
      code:'DL-2026-00011', customerId:custAsus._id, tenKhachHang:'Asus Technology Vietnam',
      totalAmount:(100*46000), status:'completed', createdByUserId:staff2._id
    });
    await DeliveryItem.create({ deliveryId:dl11._id, productId:p3._id, quantity:100, price:46000, warehouseNodeId:binB101._id });
    await setDates('Deliveries', dl11._id, 7, 6);

    // DL-012 Lenovo Q2 – 360° & 180° (3 ngày trước)
    const dl12 = await Delivery.create({
      code:'DL-2026-00012', customerId:custLenovo._id, tenKhachHang:'Lenovo Technology Vietnam',
      totalAmount:(50*30000)+(50*22000), status:'completed', createdByUserId:accountant1._id
    });
    await DeliveryItem.create({ deliveryId:dl12._id, productId:p1._id, quantity:50, price:30000, warehouseNodeId:binA101._id });
    await DeliveryItem.create({ deliveryId:dl12._id, productId:p2._id, quantity:50, price:22000, warehouseNodeId:binA201._id });
    await setDates('Deliveries', dl12._id, 3, 2);

    // ── Chờ xử lý (KPI cards) ─────────────────────────────────────

    // DL-013 Draft – chờ lập (hôm nay)
    const dl13 = await Delivery.create({
      code:'DL-2026-00013', customerId:custMSI._id, tenKhachHang:'MSI Technology Vietnam',
      totalAmount:(30*30000), status:'draft', createdByUserId:staff1._id
    });
    await DeliveryItem.create({ deliveryId:dl13._id, productId:p1._id, quantity:30, price:30000, warehouseNodeId:binA101._id });

    // DL-014 Approved – đã duyệt chờ xuất (hôm qua)
    const dl14 = await Delivery.create({
      code:'DL-2026-00014', customerId:custPanasonic._id, tenKhachHang:'Panasonic Vietnam',
      totalAmount:(50*46000), status:'approved', createdByUserId:accountant2._id
    });
    await DeliveryItem.create({ deliveryId:dl14._id, productId:p3._id, quantity:50, price:46000, warehouseNodeId:binB101._id });
    await setDates('Deliveries', dl14._id, 1, 0);
    // DL-014 đã approved → set reservedQty cho inventory tương ứng
    await sequelize.query(
      'UPDATE Inventories SET reservedQty = reservedQty + 50 WHERE `product` = ? AND `warehouseNode` = ?',
      { replacements: [p3._id, binB101._id] }
    );

    console.log('✓ Deliveries (14): completed×12, approved×1, draft×1');
    console.log('  Lịch sử (>30d): DL-001→007 | Gần đây (≤30d): DL-008→012 | Chờ: DL-013/014');

    // ══════════════════════════════════════════════════════════════
    // 8. STOCKTAKES (5 phiếu kiểm kê) + Biên bản + Báo cáo
    // ══════════════════════════════════════════════════════════════
    // ST-001: completed, không chênh lệch
    const st1 = await Stocktake.create({
      code:'ST-2026-00001', date:'2026-03-15',
      status:'completed', hasDiff:false,
      note:'Kiểm kê định kỳ Q1/2026. Kết quả: Tất cả khớp hệ thống.',
      createdByUserId:accountant1._id,
      approvedByUserId:manager._id, approvedAt:new Date('2026-03-16'),
      submittedByUserId:accountant1._id, submittedAt:new Date('2026-03-17')
    });
    await StocktakeItem.create({ stocktakeId:st1._id, productId:p1._id, warehouseNodeId:binA101._id, systemQty:97,  countedQty:97,  discrepancyQty:0 });
    await StocktakeItem.create({ stocktakeId:st1._id, productId:p2._id, warehouseNodeId:binA201._id, systemQty:200, countedQty:200, discrepancyQty:0 });
    await setDates('Stocktakes', st1._id, 87, 86);

    // ST-002: completed, có chênh lệch (SLK-380 thiếu 5)
    const st2 = await Stocktake.create({
      code:'ST-2026-00002', date:'2026-04-20',
      status:'completed', hasDiff:true,
      note:'Kiểm kê đột xuất Khu B. Phát hiện lệch 5 bộ SLK-380 tại VT-B1-01.',
      createdByUserId:staff1._id,
      approvedByUserId:manager._id, approvedAt:new Date('2026-04-22'),
      submittedByUserId:accountant1._id, submittedAt:new Date('2026-04-23')
    });
    await StocktakeItem.create({ stocktakeId:st2._id, productId:p3._id, warehouseNodeId:binB101._id, systemQty:305, countedQty:300, discrepancyQty:-5, discrepancyCategory:'thất_thoát', discrepancyReason:'Kiểm tra thực tế thấy thiếu 5 bộ so với sổ sách, nghi thất lạc trong quá trình bốc dỡ.' });
    await StocktakeItem.create({ stocktakeId:st2._id, productId:p4._id, warehouseNodeId:binB201._id, systemQty:200, countedQty:200, discrepancyQty:0 });
    await setDates('Stocktakes', st2._id, 51, 49);

    // ST-003: counting (đang đếm)
    const st3 = await Stocktake.create({
      code:'ST-2026-00003', date:'2026-05-28',
      status:'counting', hasDiff:false,
      note:'Kiểm kê định kỳ Q2/2026 – đang đếm.',
      createdByUserId:accountant2._id,
      approvedByUserId:manager._id, approvedAt:new Date('2026-05-29')
    });
    await StocktakeItem.create({ stocktakeId:st3._id, productId:p5._id, warehouseNodeId:binC101._id, systemQty:7, countedQty:0 });
    await StocktakeItem.create({ stocktakeId:st3._id, productId:p6._id, warehouseNodeId:binC102._id, systemQty:5, countedQty:0 });
    await setDates('Stocktakes', st3._id, 14, 14);

    // ST-004: pending_approval (chờ quản lý duyệt)
    const st4 = await Stocktake.create({
      code:'ST-2026-00004', date:'2026-06-10',
      status:'pending_approval', hasDiff:false,
      note:'Kiểm kê Khu A trước lô nhập tháng 6 – chờ quản lý duyệt.',
      createdByUserId:staff2._id
    });
    await StocktakeItem.create({ stocktakeId:st4._id, productId:p1._id, warehouseNodeId:binA101._id, systemQty:97,  countedQty:97  });
    await StocktakeItem.create({ stocktakeId:st4._id, productId:p1._id, warehouseNodeId:binA102._id, systemQty:200, countedQty:200 });
    await setDates('Stocktakes', st4._id, 1, 0);

    // ST-005: submitted (chờ duyệt biên bản, có chênh lệch)
    const st5 = await Stocktake.create({
      code:'ST-2026-00005', date:'2026-06-08',
      status:'submitted', hasDiff:true,
      note:'Kiểm kê đột xuất Khu C tháng 6 – phát hiện chênh lệch, chờ duyệt biên bản.',
      createdByUserId:accountant2._id,
      approvedByUserId:manager._id, approvedAt:new Date('2026-06-09'),
      submittedByUserId:accountant2._id, submittedAt:new Date('2026-06-10')
    });
    await StocktakeItem.create({ stocktakeId:st5._id, productId:p5._id, warehouseNodeId:binC101._id, systemQty:7, countedQty:5, discrepancyQty:-2, discrepancyCategory:'hư_hỏng', discrepancyReason:'2 cái bị hỏng do ẩm ướt, không còn sử dụng được.' });
    await StocktakeItem.create({ stocktakeId:st5._id, productId:p6._id, warehouseNodeId:binC102._id, systemQty:5, countedQty:7, discrepancyQty:2,  discrepancyCategory:'nhập_xuất_sai', discrepancyReason:'2 cái nhập thêm ngày 05/06 chưa được ghi vào hệ thống.' });
    await setDates('Stocktakes', st5._id, 2, 1);

    console.log('✓ Stocktakes (5): completed×2, counting×1, pending_approval×1, submitted×1');

    // ── Biên bản kiểm kê (3 biên bản) ────────────────────────────
    // BB-001: cho ST-001 (approved, không chênh lệch)
    const bb1 = await StocktakeMinutes.create({
      code:'BB-ST-2026-00001', stocktakeId:st1._id,
      summary:'Số liệu kiểm đếm khớp hoàn toàn với hệ thống.',
      status:'approved',
      createdByUserId:accountant1._id, approvedByUserId:manager._id, approvedAt:new Date('2026-03-18')
    });
    await setDates('StocktakeMinutes', bb1._id, 85, 84);

    // BB-002: cho ST-002 (approved, có chênh lệch SLK-380)
    const bb2 = await StocktakeMinutes.create({
      code:'BB-ST-2026-00002', stocktakeId:st2._id,
      summary:'Phát hiện 5 bộ SLK-380 thiếu tại VT-B1-01. Đề xuất điều chỉnh giảm 5 đơn vị.',
      status:'approved',
      createdByUserId:accountant1._id, approvedByUserId:manager._id, approvedAt:new Date('2026-04-24')
    });
    await setDates('StocktakeMinutes', bb2._id, 49, 48);

    // BB-005: cho ST-005 (pending_approval, chờ duyệt)
    const bb5 = await StocktakeMinutes.create({
      code:'BB-ST-2026-00005', stocktakeId:st5._id,
      summary:'Phát hiện chênh lệch 2 sản phẩm: MIM-HB14 thiếu 2 cái, MIM-CB01 thừa 2 cái. Chờ Quản lý xem xét.',
      status:'pending_approval',
      createdByUserId:accountant2._id
    });
    await setDates('StocktakeMinutes', bb5._id, 1, 0);

    console.log('✓ StocktakeMinutes (3): approved×2, pending_approval×1');

    // ── Báo cáo kiểm kê (2 báo cáo) ─────────────────────────────
    // BC-001: cho ST-001 (không chênh lệch)
    const rpt1 = await StocktakeReport.create({
      code:'BC-ST-2026-00001', stocktakeId:st1._id, adjustmentId:null,
      totalItems:2, matchedItems:2, discrepancyItems:0,
      totalShortage:0, totalSurplus:0,
      note:'Kết quả kiểm kê Q1/2026: tất cả sản phẩm khớp hệ thống.',
      generatedByUserId:manager._id
    });
    await setDates('StocktakeReports', rpt1._id, 84, 84);

    // BC-002: cho ST-002 (có chênh lệch — điều chỉnh tạo riêng)
    const rpt2 = await StocktakeReport.create({
      code:'BC-ST-2026-00002', stocktakeId:st2._id, adjustmentId:null,
      totalItems:2, matchedItems:1, discrepancyItems:1,
      totalShortage:5, totalSurplus:0,
      note:'Kết quả kiểm kê đột xuất Khu B: phát hiện thiếu 5 bộ SLK-380 tại VT-B1-01.',
      generatedByUserId:manager._id
    });
    await setDates('StocktakeReports', rpt2._id, 48, 48);

    console.log('✓ StocktakeReports (2): BC-001 (khớp), BC-002 (chênh lệch)');

    // ══════════════════════════════════════════════════════════════
    // 9b. ADJUSTMENTS (2 phiếu điều chỉnh tồn kho)
    // ══════════════════════════════════════════════════════════════

    // ADJ-001: Điều chỉnh sau kiểm kê ST-002 (SLK-380 thiếu 5)
    const adj1 = await Adjustment.create({
      code: 'ADJ-ST-2026-00001',
      reason: 'count_correction',
      status: 'completed',
      note: 'Điều chỉnh giảm 5 bộ FST-SLK-380 tại VT-B1-01 sau kiểm kê đột xuất ST-2026-00002. Nguyên nhân thất thoát chưa xác định.',
      createdByUserId: accountant1._id,
      approvedByUserId: manager._id,
      approvedAt: new Date('2026-04-25'),
    });
    await AdjustmentItem.create({ adjustmentId: adj1._id, productId: p3._id, warehouseNodeId: binB101._id, delta: -5 });
    await setDates('Adjustments', adj1._id, 47, 46);
    // Gắn điều chỉnh vào báo cáo kiểm kê ST-002
    await StocktakeReport.update({ adjustmentId: adj1._id }, { where: { _id: rpt2._id } });

    // ADJ-002: Điều chỉnh bản nháp tháng 6 (chờ duyệt)
    const adj2 = await Adjustment.create({
      code: 'ADJ-ST-2026-00002',
      reason: 'damaged',
      status: 'draft',
      note: 'Phiếu điều chỉnh tháng 6: ghi nhận hàng hỏng phát hiện khi kiểm kho định kỳ. Chờ quản lý xem xét.',
      createdByUserId: accountant2._id,
    });
    await AdjustmentItem.create({ adjustmentId: adj2._id, productId: p5._id, warehouseNodeId: binC101._id, delta: -2 });
    await setDates('Adjustments', adj2._id, 4, 3);

    console.log('✓ Adjustments (2): completed×1 (ADJ-001→ST-002), draft×1 (ADJ-002)');

    // ══════════════════════════════════════════════════════════════
    // 9. INCIDENTS (3 sự cố — theo luồng nhập kho 2.2.1 & 2.3.1)
    // ══════════════════════════════════════════════════════════════

    // INC-001: NVK phát hiện thiếu hàng khi nhận lô RC-004 (đang chờ QL duyệt)
    const inc1 = await Incident.create({
      code:'INC-2026-00001', type:'hang_thieu', refType:'receipt', refId:rc4._id,
      status:'pending_approval',
      note:'Kiểm đếm lô RC-2026-00004: FST-H360-14 thực nhận 185 cái, hoá đơn 200 cái → thiếu 15 cái. Đề nghị quản lý xem xét.',
      createdByUserId:staff1._id
    });
    await IncidentItem.create({ incidentId:inc1._id, productId:p1._id, quantity:15, reason:null });
    await setDates('Incidents', inc1._id, 5, 4);

    // INC-002: QC phát hiện lỗi bề mặt lô RC-003, QL đã phê duyệt báo cáo → tiếp tục xử lý
    const inc2 = await Incident.create({
      code:'INC-2026-00002', type:'hang_loi', refType:'receipt', refId:rc3._id,
      status:'approved',
      note:'Kiểm tra lô RC-2026-00003: phát hiện 2 cái MIM-HB14 bị lỗi bề mặt (xước mạ). Lô được chấp nhận vì tỷ lệ lỗi < 3%, ghi nhận để theo dõi NCC.',
      createdByUserId:qc._id,
      approvedByUserId:manager._id,
      approvedAt:new Date(Date.now() - 2*24*60*60*1000)
    });
    await IncidentItem.create({ incidentId:inc2._id, productId:p5._id, quantity:2, reason:'Lỗi bề mặt: vết xước mạ PVD, không đạt tiêu chuẩn ngoại quan cấp A' });
    await setDates('Incidents', inc2._id, 3, 2);

    // INC-003: QC báo lỗi lô RC-005, QL từ chối phiếu nhập → nhà cung cấp cần đổi hàng
    const inc3 = await Incident.create({
      code:'INC-2026-00003', type:'hang_loi', refType:'receipt', refId:rc5._id,
      status:'approved',
      rejectNote:null,
      note:'Toàn bộ 150 cái FST-H180-156 lô RC-2026-00005 có vết xước bề mặt và gỉ nhẹ do vận chuyển không đúng cách. Tỷ lệ lỗi ~35%, vượt ngưỡng cho phép. Đề nghị từ chối toàn lô.',
      createdByUserId:qc._id,
      approvedByUserId:manager._id,
      approvedAt:new Date(Date.now() - 29*24*60*60*1000)
    });
    await IncidentItem.create({ incidentId:inc3._id, productId:p2._id, quantity:150, reason:'Xước bề mặt + oxy hóa nhẹ. Nguyên nhân: đóng gói không đủ chống ẩm, bao bì bị ướt khi vận chuyển.' });
    await setDates('Incidents', inc3._id, 30, 29);

    console.log('✓ Incidents (3): pending_approval×1, approved×2');

    // ══════════════════════════════════════════════════════════════
    // 9c. STOCK CARDS (thẻ kho — lịch sử giao dịch)
    // ══════════════════════════════════════════════════════════════
    // Tạo StockCard cho 2 phiếu nhập completed và 7 phiếu xuất lịch sử

    const SC = StockCard;
    // RC-001: nhập p1 500 cái tại binA101
    await SC.create({ code:'SC-RC001-P1', productId:p1._id, warehouseNodeId:binA101._id, refCode:'RC-2026-00001', type:'import', qtyBefore:0,  qtyChange:500, qtyAfter:500, note:'Nhập lô tháng 1/2026', recordedAt:new Date('2026-03-15'), createdByUserId:staff1._id });
    // RC-001: nhập p2 300 cái tại binA201
    await SC.create({ code:'SC-RC001-P2', productId:p2._id, warehouseNodeId:binA201._id, refCode:'RC-2026-00001', type:'import', qtyBefore:0,  qtyChange:300, qtyAfter:300, note:'Nhập lô tháng 1/2026', recordedAt:new Date('2026-03-15'), createdByUserId:staff1._id });
    // RC-002: nhập p3 700 bộ tại binB101
    await SC.create({ code:'SC-RC002-P3', productId:p3._id, warehouseNodeId:binB101._id, refCode:'RC-2026-00002', type:'import', qtyBefore:0,  qtyChange:700, qtyAfter:700, note:'Nhập lô tháng 2/2026', recordedAt:new Date('2026-03-28'), createdByUserId:staff1._id });
    // RC-002: nhập p4 200 bộ tại binB201
    await SC.create({ code:'SC-RC002-P4', productId:p4._id, warehouseNodeId:binB201._id, refCode:'RC-2026-00002', type:'import', qtyBefore:0,  qtyChange:200, qtyAfter:200, note:'Nhập lô tháng 2/2026', recordedAt:new Date('2026-03-28'), createdByUserId:staff2._id });

    // DL-001 Samsung: xuất p1 -150, p2 -80
    await SC.create({ code:'SC-DL001-P1', productId:p1._id, warehouseNodeId:binA101._id, refCode:'DL-2026-00001', type:'export', qtyBefore:500, qtyChange:-150, qtyAfter:350, note:'Xuất Samsung Q1', recordedAt:new Date('2026-03-29'), createdByUserId:staff1._id });
    await SC.create({ code:'SC-DL001-P2', productId:p2._id, warehouseNodeId:binA201._id, refCode:'DL-2026-00001', type:'export', qtyBefore:300, qtyChange:-80,  qtyAfter:220, note:'Xuất Samsung Q1', recordedAt:new Date('2026-03-29'), createdByUserId:staff1._id });
    // DL-002 Dell: xuất p3 -200
    await SC.create({ code:'SC-DL002-P3', productId:p3._id, warehouseNodeId:binB101._id, refCode:'DL-2026-00002', type:'export', qtyBefore:700, qtyChange:-200, qtyAfter:500, note:'Xuất Dell Q1', recordedAt:new Date('2026-04-09'), createdByUserId:staff2._id });
    // DL-003 HP: xuất p1 -100, p4 -100
    await SC.create({ code:'SC-DL003-P1', productId:p1._id, warehouseNodeId:binA101._id, refCode:'DL-2026-00003', type:'export', qtyBefore:350, qtyChange:-100, qtyAfter:250, note:'Xuất HP Q1',   recordedAt:new Date('2026-04-19'), createdByUserId:accountant1._id });
    await SC.create({ code:'SC-DL003-P4', productId:p4._id, warehouseNodeId:binB201._id, refCode:'DL-2026-00003', type:'export', qtyBefore:200, qtyChange:-100, qtyAfter:100, note:'Xuất HP Q1',   recordedAt:new Date('2026-04-19'), createdByUserId:accountant1._id });
    // ADJ-001: điều chỉnh p3 -5
    await SC.create({ code:'SC-ADJ001-P3', productId:p3._id, warehouseNodeId:binB101._id, refCode:'ADJ-ST-2026-00001', type:'adjustment', qtyBefore:500, qtyChange:-5, qtyAfter:495, note:'Điều chỉnh sau kiểm kê ST-002', recordedAt:new Date('2026-04-25'), createdByUserId:accountant1._id });

    // Set dates for StockCards
    await sequelize.query(`UPDATE StockCards SET createdAt=DATE_SUB(NOW(),INTERVAL 90 DAY),updatedAt=DATE_SUB(NOW(),INTERVAL 90 DAY) WHERE code IN ('SC-RC001-P1','SC-RC001-P2')`);
    await sequelize.query(`UPDATE StockCards SET createdAt=DATE_SUB(NOW(),INTERVAL 75 DAY),updatedAt=DATE_SUB(NOW(),INTERVAL 75 DAY) WHERE code IN ('SC-RC002-P3','SC-RC002-P4')`);
    await sequelize.query(`UPDATE StockCards SET createdAt=DATE_SUB(NOW(),INTERVAL 74 DAY),updatedAt=DATE_SUB(NOW(),INTERVAL 74 DAY) WHERE code IN ('SC-DL001-P1','SC-DL001-P2')`);
    await sequelize.query(`UPDATE StockCards SET createdAt=DATE_SUB(NOW(),INTERVAL 65 DAY),updatedAt=DATE_SUB(NOW(),INTERVAL 65 DAY) WHERE code IN ('SC-DL002-P3')`);
    await sequelize.query(`UPDATE StockCards SET createdAt=DATE_SUB(NOW(),INTERVAL 55 DAY),updatedAt=DATE_SUB(NOW(),INTERVAL 55 DAY) WHERE code IN ('SC-DL003-P1','SC-DL003-P4')`);
    await sequelize.query(`UPDATE StockCards SET createdAt=DATE_SUB(NOW(),INTERVAL 47 DAY),updatedAt=DATE_SUB(NOW(),INTERVAL 47 DAY) WHERE code IN ('SC-ADJ001-P3')`);

    console.log('✓ StockCards (10): import×4, export×5, adjustment×1');

    // ══════════════════════════════════════════════════════════════
    // 10. DELIVERY REQUESTS — Yêu cầu xuất kho (7 yêu cầu)
    //     pending×2 | processing×2 | completed×2 | cancelled×1
    //     Một số linked tới phiếu xuất đã tạo ở mục 7
    // ══════════════════════════════════════════════════════════════

    // YCX-001 ── Samsung, completed (linked → DL-001)
    const ycx1 = await DeliveryRequest.create({
      code: 'YCX-2026-00001',
      customerId: custSamsung._id,
      tenKhachHang: 'Samsung Electronics Vietnam',
      status: 'completed',
      note: 'Đơn hàng Q1/2026 – bản lề cho dòng Galaxy Book Pro.',
      totalAmount: (150 * 30000) + (80 * 22000),
      createdByUserId: accountant1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx1._id, productId: p1._id, quantity: 150, priceEstimate: 30000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx1._id, productId: p2._id, quantity: 80,  priceEstimate: 22000 });
    await setDates('DeliveryRequests', ycx1._id, 77, 74);
    // Link phiếu xuất DL-001 về request này
    await Delivery.update({ requestId: ycx1._id }, { where: { _id: dl1._id } });

    // YCX-002 ── HP, completed (linked → DL-003)
    const ycx2 = await DeliveryRequest.create({
      code: 'YCX-2026-00002',
      customerId: custHP._id,
      tenKhachHang: 'HP Vietnam Sales',
      status: 'completed',
      note: 'Đơn hàng Q1/2026 – bộ hinge + cơ cấu trượt cho HP Envy & Spectre.',
      totalAmount: (100 * 30000) + (100 * 92000),
      createdByUserId: accountant2._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx2._id, productId: p1._id, quantity: 100, priceEstimate: 30000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx2._id, productId: p4._id, quantity: 100, priceEstimate: 92000 });
    await setDates('DeliveryRequests', ycx2._id, 57, 54);
    await Delivery.update({ requestId: ycx2._id }, { where: { _id: dl3._id } });

    // YCX-003 ── Samsung Q2, processing (linked → DL-008, đang giao)
    const ycx3 = await DeliveryRequest.create({
      code: 'YCX-2026-00003',
      customerId: custSamsung._id,
      tenKhachHang: 'Samsung Electronics Vietnam',
      status: 'processing',
      note: 'Đơn hàng Q2/2026 – trục xoay 360° & thanh ray dẫn hướng cho Galaxy Book Flex.',
      totalAmount: (200 * 30000) + (100 * 46000),
      createdByUserId: accountant1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx3._id, productId: p1._id, quantity: 200, priceEstimate: 30000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx3._id, productId: p3._id, quantity: 100, priceEstimate: 46000 });
    await setDates('DeliveryRequests', ycx3._id, 22, 19);
    await Delivery.update({ requestId: ycx3._id }, { where: { _id: dl8._id } });

    // YCX-004 ── Panasonic, processing (linked → DL-014, đã duyệt chờ xuất)
    const ycx4 = await DeliveryRequest.create({
      code: 'YCX-2026-00004',
      customerId: custPanasonic._id,
      tenKhachHang: 'Panasonic Vietnam',
      status: 'processing',
      note: 'Đơn bổ sung cho dây chuyền lắp ráp tháng 6 – thanh ray SLK-380.',
      expectedDeliveryDate: '2026-06-15',
      totalAmount: (50 * 46000),
      createdByUserId: staff1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx4._id, productId: p3._id, quantity: 50, priceEstimate: 46000 });
    await setDates('DeliveryRequests', ycx4._id, 3, 1);
    await Delivery.update({ requestId: ycx4._id }, { where: { _id: dl14._id } });

    // YCX-005 ── MSI, pending (chưa có phiếu xuất)
    const ycx5 = await DeliveryRequest.create({
      code: 'YCX-2026-00005',
      customerId: custMSI._id,
      tenKhachHang: 'MSI Technology Vietnam',
      status: 'pending',
      note: 'Yêu cầu cấp bách cho model MSI Prestige – cần trong tuần.',
      expectedDeliveryDate: '2026-06-18',
      totalAmount: (80 * 30000) + (50 * 22000),
      createdByUserId: accountant2._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx5._id, productId: p1._id, quantity: 80, priceEstimate: 30000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx5._id, productId: p2._id, quantity: 50, priceEstimate: 22000 });
    await setDates('DeliveryRequests', ycx5._id, 2, 2);

    // YCX-006 ── Toshiba, pending (hôm nay, do nhân viên Sale tạo)
    const ycx6 = await DeliveryRequest.create({
      code: 'YCX-2026-00006',
      customerId: custToshiba._id,
      tenKhachHang: 'Toshiba Storage Vietnam',
      status: 'pending',
      note: 'Đơn hàng dài hạn Q3/2026 – đề nghị xuất 1 lần trong tuần.',
      expectedDeliveryDate: '2026-06-20',
      totalAmount: (100 * 46000) + (60 * 92000),
      createdByUserId: sale._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx6._id, productId: p3._id, quantity: 100, priceEstimate: 46000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx6._id, productId: p4._id, quantity: 60,  priceEstimate: 92000 });
    // không setDates → giữ nguyên NOW()

    // YCX-007 ── Hisense, cancelled (khách hàng huỷ)
    const ycx7 = await DeliveryRequest.create({
      code: 'YCX-2026-00007',
      customerId: custHisense._id,
      tenKhachHang: 'Hisense Electronics Vietnam',
      status: 'cancelled',
      note: 'Khách hàng huỷ đơn do thay đổi thiết kế sản phẩm – không cần trục xoay 180°.',
      totalAmount: (200 * 22000),
      createdByUserId: staff2._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx7._id, productId: p2._id, quantity: 200, priceEstimate: 22000 });
    await setDates('DeliveryRequests', ycx7._id, 65, 60);

    // YCX-008-IS ── Foxconn, insufficient_stock (không đủ tồn kho – tạm dừng)
    const ycxIS = await DeliveryRequest.create({
      code: 'YCX-2026-00008-IS',
      customerId: custFoxconn._id,
      tenKhachHang: 'Foxconn Technology Vietnam',
      status: 'insufficient_stock',
      note: 'Yêu cầu số lượng lớn vượt tồn kho hiện tại – kho đang chờ nhập bổ sung.',
      expectedDeliveryDate: '2026-06-25',
      totalAmount: (500 * 162000),
      createdByUserId: sale._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycxIS._id, productId: p5._id, quantity: 500, priceEstimate: 162000 });
    await setDates('DeliveryRequests', ycxIS._id, 1, 1);

    // ── Bổ sung yêu cầu cho 10 phiếu xuất còn thiếu ─────────────

    // YCX-008 → DL-002 (Dell Q1 – thanh ray, 65 ngày)
    const ycx8 = await DeliveryRequest.create({
      code: 'YCX-2026-00008',
      customerId: custDell._id,
      tenKhachHang: 'Dell Technologies Vietnam',
      status: 'completed',
      note: 'Đơn Q1/2026 – thanh ray dẫn hướng SLK-380 cho dòng Inspiron 15.',
      totalAmount: (200 * 46000),
      createdByUserId: accountant1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx8._id, productId: p3._id, quantity: 200, priceEstimate: 46000 });
    await setDates('DeliveryRequests', ycx8._id, 67, 65);
    await Delivery.update({ requestId: ycx8._id }, { where: { _id: dl2._id } });

    // YCX-009 → DL-004 (Lenovo Q1 – MIM, 50 ngày)
    const ycx9 = await DeliveryRequest.create({
      code: 'YCX-2026-00009',
      customerId: custLenovo._id,
      tenKhachHang: 'Lenovo Technology Vietnam',
      status: 'completed',
      note: 'Đơn Q1/2026 – linh kiện MIM giá đỡ bản lề & khung camera cho ThinkPad X1.',
      totalAmount: (3 * 162000) + (2 * 136000),
      createdByUserId: staff2._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx9._id, productId: p5._id, quantity: 3, priceEstimate: 162000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx9._id, productId: p6._id, quantity: 2, priceEstimate: 136000 });
    await setDates('DeliveryRequests', ycx9._id, 52, 50);
    await Delivery.update({ requestId: ycx9._id }, { where: { _id: dl4._id } });

    // YCX-010 → DL-005 (Asus Q1 – thanh ray + cơ cấu trượt, 42 ngày)
    const ycx10 = await DeliveryRequest.create({
      code: 'YCX-2026-00010',
      customerId: custAsus._id,
      tenKhachHang: 'Asus Technology Vietnam',
      status: 'completed',
      note: 'Đơn Q1/2026 – SLK-380 & SL2IN1 cho ROG & ZenBook.',
      totalAmount: (250 * 46000) + (80 * 92000),
      createdByUserId: accountant2._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx10._id, productId: p3._id, quantity: 250, priceEstimate: 46000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx10._id, productId: p4._id, quantity: 80,  priceEstimate: 92000 });
    await setDates('DeliveryRequests', ycx10._id, 44, 42);
    await Delivery.update({ requestId: ycx10._id }, { where: { _id: dl5._id } });

    // YCX-011 → DL-006 (LG Q1 – trục xoay, 38 ngày)
    const ycx11 = await DeliveryRequest.create({
      code: 'YCX-2026-00011',
      customerId: custLG._id,
      tenKhachHang: 'LG Electronics Vietnam',
      status: 'completed',
      note: 'Đơn Q1/2026 – bản lề 360° & 180° cho LG Gram.',
      totalAmount: (80 * 30000) + (50 * 22000),
      createdByUserId: staff1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx11._id, productId: p1._id, quantity: 80, priceEstimate: 30000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx11._id, productId: p2._id, quantity: 50, priceEstimate: 22000 });
    await setDates('DeliveryRequests', ycx11._id, 40, 38);
    await Delivery.update({ requestId: ycx11._id }, { where: { _id: dl6._id } });

    // YCX-012 → DL-007 (Acer Q1 – bản lề + cơ cấu trượt, 35 ngày)
    const ycx12 = await DeliveryRequest.create({
      code: 'YCX-2026-00012',
      customerId: custAcer._id,
      tenKhachHang: 'Acer Inc. Vietnam Branch',
      status: 'completed',
      note: 'Đơn Q1/2026 – H180-156 & SL2IN1 cho Swift & Aspire.',
      totalAmount: (120 * 22000) + (60 * 92000),
      createdByUserId: accountant1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx12._id, productId: p2._id, quantity: 120, priceEstimate: 22000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx12._id, productId: p4._id, quantity: 60,  priceEstimate: 92000 });
    await setDates('DeliveryRequests', ycx12._id, 37, 35);
    await Delivery.update({ requestId: ycx12._id }, { where: { _id: dl7._id } });

    // YCX-013 → DL-009 (Dell Q2 – bản lề 180°, 15 ngày)
    const ycx13 = await DeliveryRequest.create({
      code: 'YCX-2026-00013',
      customerId: custDell._id,
      tenKhachHang: 'Dell Technologies Vietnam',
      status: 'completed',
      note: 'Đơn Q2/2026 – H180-156 bổ sung cho Vostro 14.',
      totalAmount: (150 * 22000),
      createdByUserId: staff1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx13._id, productId: p2._id, quantity: 150, priceEstimate: 22000 });
    await setDates('DeliveryRequests', ycx13._id, 17, 15);
    await Delivery.update({ requestId: ycx13._id }, { where: { _id: dl9._id } });

    // YCX-014 → DL-010 (HP Q2 – SL2IN1 + MIM, 10 ngày)
    const ycx14 = await DeliveryRequest.create({
      code: 'YCX-2026-00014',
      customerId: custHP._id,
      tenKhachHang: 'HP Vietnam Sales',
      status: 'completed',
      note: 'Đơn Q2/2026 – cơ cấu trượt & MIM giá đỡ cho HP Spectre x360.',
      totalAmount: (80 * 92000) + (2 * 162000),
      createdByUserId: accountant2._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx14._id, productId: p4._id, quantity: 80, priceEstimate: 92000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx14._id, productId: p5._id, quantity: 2,  priceEstimate: 162000 });
    await setDates('DeliveryRequests', ycx14._id, 12, 10);
    await Delivery.update({ requestId: ycx14._id }, { where: { _id: dl10._id } });

    // YCX-015 → DL-011 (Asus Q2 – thanh ray, 7 ngày)
    const ycx15 = await DeliveryRequest.create({
      code: 'YCX-2026-00015',
      customerId: custAsus._id,
      tenKhachHang: 'Asus Technology Vietnam',
      status: 'completed',
      note: 'Đơn Q2/2026 – SLK-380 cho ExpertBook B9.',
      totalAmount: (100 * 46000),
      createdByUserId: staff2._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx15._id, productId: p3._id, quantity: 100, priceEstimate: 46000 });
    await setDates('DeliveryRequests', ycx15._id, 9, 7);
    await Delivery.update({ requestId: ycx15._id }, { where: { _id: dl11._id } });

    // YCX-016 → DL-012 (Lenovo Q2 – bản lề, 3 ngày)
    const ycx16 = await DeliveryRequest.create({
      code: 'YCX-2026-00016',
      customerId: custLenovo._id,
      tenKhachHang: 'Lenovo Technology Vietnam',
      status: 'completed',
      note: 'Đơn Q2/2026 – bản lề 360° & 180° cho IdeaPad Flex.',
      totalAmount: (50 * 30000) + (50 * 22000),
      createdByUserId: accountant1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx16._id, productId: p1._id, quantity: 50, priceEstimate: 30000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx16._id, productId: p2._id, quantity: 50, priceEstimate: 22000 });
    await setDates('DeliveryRequests', ycx16._id, 5, 3);
    await Delivery.update({ requestId: ycx16._id }, { where: { _id: dl12._id } });

    // YCX-017 → DL-013 (MSI – đang xử lý, hôm nay)
    const ycx17 = await DeliveryRequest.create({
      code: 'YCX-2026-00017',
      customerId: custMSI._id,
      tenKhachHang: 'MSI Technology Vietnam',
      status: 'processing',
      note: 'Yêu cầu khẩn – bản lề 360° cho MSI Prestige 13 AI, cần xuất trong ngày.',
      totalAmount: (30 * 30000),
      createdByUserId: staff1._id,
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx17._id, productId: p1._id, quantity: 30, priceEstimate: 30000 });
    await Delivery.update({ requestId: ycx17._id }, { where: { _id: dl13._id } });

    console.log('✓ DeliveryRequests (17): completed×12, processing×3, pending×2, cancelled×1');
    console.log('  YCX-001→DL-001 | YCX-002→DL-003 | YCX-003→DL-008 | YCX-004→DL-014');
    console.log('  YCX-008→DL-002 | YCX-009→DL-004 | YCX-010→DL-005 | YCX-011→DL-006');
    console.log('  YCX-012→DL-007 | YCX-013→DL-009 | YCX-014→DL-010 | YCX-015→DL-011');
    console.log('  YCX-016→DL-012 | YCX-017→DL-013 | YCX-005/006 pending | YCX-007 cancelled');

    // ══════════════════════════════════════════════════════════════
    // TÓM TẮT
    // ══════════════════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  FOSITEK Seed v2 hoàn tất!');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  Tài khoản đăng nhập:');
    console.log('    admin@fositek.vn          / admin123    (Admin)');
    console.log('    hoang.vu@fositek.vn        / quanly123  (Quản lý kho)');
    console.log('    lananh.tran@fositek.vn     / ketoan123  (Kế toán kho)');
    console.log('    tuan.pham@fositek.vn       / nhanvien123(Nhân viên kho)');
    console.log('    ngoc.do@fositek.vn         / qc123456   (QC)');
    console.log('    sale.nguyen@fositek.vn     / sale1234   (Sale)');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  Dashboard widgets sẽ hiển thị:');
    console.log('    ◆ Tồn kho dưới ngưỡng : FST-MIM-CB01 (5), FST-MIM-HB14 (7)');
    console.log('    ◆ Top 10 xuất nhiều   : SLK-380 (650), H360-14 (580), H180-156 (450)…');
    console.log('    ◆ Tốc độ tiêu thụ 30d : H360-14 (250), SLK-380 (200), H180-156 (200)…');
    console.log('    ◆ Tồn lâu ngày        : SLK-380@VT-B1-02 (65d), MIM-HB14 (92d), SL2IN1 (48d)');
    console.log('    ◆ Sắp hết bảo hành    : (chờ migrate cột Han_bao_hanh)');
    console.log('    ◆ KPI – Chờ xử lý     : 2 phiếu xuất, 2 phiếu kiểm kê, 2 sự cố mở');
    console.log('    ◆ YC xuất kho         : 2 pending, 2 processing, 2 completed, 1 cancelled');
    console.log('══════════════════════════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('Seed thất bại:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seed();
