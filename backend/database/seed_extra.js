/**
 * seed_extra.js — Bổ sung dữ liệu mở rộng cho FOSITEK Warehouse
 * Chạy SAU khi seed.js đã hoàn tất (KHÔNG force sync)
 *
 * Lệnh chạy: node database/seed_extra.js
 *
 * Nội dung bổ sung:
 *  - 3 sản phẩm mới (tụ điện, IC chip, cáp FPC)
 *  - 1 khu kho mới (Zone D – Điện tử thụ động)
 *  - 12 phiếu nhập kho mới (nhiều trạng thái)
 *  - 15 phiếu xuất kho mới (nhiều khách hàng)
 *  - 8 yêu cầu xuất kho mới
 *  - 4 phiếu kiểm kê + biên bản + báo cáo
 *  - 3 phiếu điều chỉnh tồn kho
 *  - 5 sự cố nhập kho
 *  - Thẻ kho bổ sung
 */

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

const setDates = async (table, id, createdDaysAgo, updatedDaysAgo = createdDaysAgo - 1) => {
  await sequelize.query(
    `UPDATE ${table} SET createdAt = DATE_SUB(NOW(), INTERVAL ? DAY),
                         updatedAt = DATE_SUB(NOW(), INTERVAL ? DAY)
     WHERE _id = ?`,
    { replacements: [createdDaysAgo, updatedDaysAgo, id] }
  );
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysLater = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const seedExtra = async () => {
  try {
    await connectDB();
    console.log('Kết nối DB thành công. Bắt đầu seed dữ liệu bổ sung...\n');

    // ══════════════════════════════════════════════════════════════
    // LẤY DỮ LIỆU HIỆN CÓ
    // ══════════════════════════════════════════════════════════════
    const admin      = await User.findOne({ where: { username: 'admin' } });
    const manager    = await User.findOne({ where: { username: 'quanly' } });
    const accountant1= await User.findOne({ where: { username: 'ketoan1' } });
    const accountant2= await User.findOne({ where: { username: 'ketoan2' } });
    const staff1     = await User.findOne({ where: { username: 'nhanvien1' } });
    const staff2     = await User.findOne({ where: { username: 'nhanvien2' } });
    const qc         = await User.findOne({ where: { username: 'qc' } });
    const sale       = await User.findOne({ where: { username: 'sale' } });

    const custSamsung  = await Customer.findOne({ where: { code: 'KH-20260101-0001' } });
    const custDell     = await Customer.findOne({ where: { code: 'KH-20260101-0002' } });
    const custHP       = await Customer.findOne({ where: { code: 'KH-20260101-0003' } });
    const custLenovo   = await Customer.findOne({ where: { code: 'KH-20260101-0004' } });
    const custAsus     = await Customer.findOne({ where: { code: 'KH-20260101-0005' } });
    const custLG       = await Customer.findOne({ where: { code: 'KH-20260101-0006' } });
    const custAcer     = await Customer.findOne({ where: { code: 'KH-20260101-0007' } });
    const custMSI      = await Customer.findOne({ where: { code: 'KH-20260101-0008' } });
    const custPanasonic= await Customer.findOne({ where: { code: 'KH-20260101-0009' } });
    const custToshiba  = await Customer.findOne({ where: { code: 'KH-20260101-0010' } });
    const custFoxconn  = await Customer.findOne({ where: { code: 'KH-20260101-0011' } });
    const custHisense  = await Customer.findOne({ where: { code: 'KH-20260101-0012' } });

    // Sản phẩm cũ
    const p1 = await Product.findOne({ where: { sku: 'FST-H360-14' } });
    const p2 = await Product.findOne({ where: { sku: 'FST-H180-156' } });
    const p3 = await Product.findOne({ where: { sku: 'FST-SLK-380' } });
    const p4 = await Product.findOne({ where: { sku: 'FST-SL2IN1-135' } });
    const p5 = await Product.findOne({ where: { sku: 'FST-MIM-HB14' } });
    const p6 = await Product.findOne({ where: { sku: 'FST-MIM-CB01' } });

    // Warehouse
    const wh      = await WarehouseNode.findOne({ where: { code: 'WH-FST-HN' } });
    const zoneA   = await WarehouseNode.findOne({ where: { code: 'ZONE-A' } });
    const zoneB   = await WarehouseNode.findOne({ where: { code: 'ZONE-B' } });
    const zoneC   = await WarehouseNode.findOne({ where: { code: 'ZONE-C' } });
    const binA101 = await WarehouseNode.findOne({ where: { code: 'VT-A1-01' } });
    const binA102 = await WarehouseNode.findOne({ where: { code: 'VT-A1-02' } });
    const binA201 = await WarehouseNode.findOne({ where: { code: 'VT-A2-01' } });
    const binB101 = await WarehouseNode.findOne({ where: { code: 'VT-B1-01' } });
    const binB102 = await WarehouseNode.findOne({ where: { code: 'VT-B1-02' } });
    const binB201 = await WarehouseNode.findOne({ where: { code: 'VT-B2-01' } });
    const binC101 = await WarehouseNode.findOne({ where: { code: 'VT-C1-01' } });
    const binC102 = await WarehouseNode.findOne({ where: { code: 'VT-C1-02' } });

    console.log('✓ Đã tải xong dữ liệu hiện có.');

    // ══════════════════════════════════════════════════════════════
    // KHÁCH HÀNG MỚI (thêm 5)
    // ══════════════════════════════════════════════════════════════
    const custSony    = await Customer.create({ code:'KH-20260601-0013', name:'Sony Vietnam',                  phone:'024-3835-0013', address:'Khu công nghiệp Thăng Long II, Hưng Yên' });
    const custIntel   = await Customer.create({ code:'KH-20260601-0014', name:'Intel Products Vietnam',        phone:'028-3910-0014', address:'Lầu 16, Saigon Centre, TP Hồ Chí Minh' });
    const custVinfast = await Customer.create({ code:'KH-20260601-0015', name:'VinFast Auto',                  phone:'1900-232323',   address:'Khu Kinh tế Đình Vũ, Hải Phòng' });
    const custViet    = await Customer.create({ code:'KH-20260601-0016', name:'Việt Hoa Electronics',          phone:'028-3822-0016', address:'34 Nguyễn Bỉnh Khiêm, Quận 1, TP HCM' });
    const custBose    = await Customer.create({ code:'KH-20260601-0017', name:'Bosch Vietnam',                 phone:'024-3789-0017', address:'Tầng 8, Deloitte, 12 Trang Thi, Hà Nội' });

    console.log('✓ Customers mới (5): Sony, Intel, VinFast, Việt Hoa, Bosch');

    // ══════════════════════════════════════════════════════════════
    // DANH MỤC MỚI (thêm 2)
    // ══════════════════════════════════════════════════════════════
    const catPassive = await Category.create({
      name: 'Linh kiện điện tử thụ động (Passive)',
      description: 'Tụ điện, điện trở, cuộn cảm, thạch anh dùng trong mạch nguồn và lọc nhiễu PCB. Quản lý theo lô sản xuất và ngày hết hạn bảo quản.'
    });
    const catIC = await Category.create({
      name: 'Vi mạch tích hợp (IC / Chip)',
      description: 'Các chip điều khiển, driver IC, bộ nhớ flash và vi xử lý nhúng dùng trong cụm điều khiển cơ cấu bản lề và hệ thống cảm biến vị trí. Quản lý chặt theo lot code và ngày sản xuất.'
    });
    const catFPC = await Category.create({
      name: 'Cáp mềm FPC / FFC',
      description: 'Cáp màng mỏng linh hoạt (Flexible Printed Circuit) kết nối bo mạch chủ với màn hình, bàn phím, cảm biến vân tay. Phân loại theo độ rộng, số chân và bước chân (pitch).'
    });

    console.log('✓ Categories mới (3): Passive, IC/Chip, FPC/FFC');

    // ══════════════════════════════════════════════════════════════
    // SẢN PHẨM MỚI (thêm 9 SKU)
    // ══════════════════════════════════════════════════════════════
    // Tụ điện
    const p7 = await Product.create({
      sku: 'FST-CAP-100U25V', name: 'Tụ điện 100µF 25V FST-CAP-100U25V',
      description: 'Tụ điện phân cực nhôm 100µF/25V, loại SMD 6.3×7.7mm. Nhiệt độ hoạt động: -40°C đến +105°C. Điện dung sai số: ±20%. ESR thấp 0.1Ω. Dùng trong mạch lọc nguồn PCB laptop.',
      priceIn: 850, priceOut: 1400, unit: 'Cái', categoryId: catPassive._id
    });
    const p8 = await Product.create({
      sku: 'FST-CAP-10U50V', name: 'Tụ điện 10µF 50V FST-CAP-10U50V',
      description: 'Tụ điện tantalum 10µF/50V, loại SMD size D (7343). Nhiệt độ hoạt động: -55°C đến +125°C. Điện dung sai số: ±10%. Dùng trong mạch lọc tần số cao PCB.',
      priceIn: 2200, priceOut: 3600, unit: 'Cái', categoryId: catPassive._id
    });
    const p9 = await Product.create({
      sku: 'FST-RES-10K', name: 'Điện trở 10kΩ 1% 0402 FST-RES-10K',
      description: 'Điện trở màng dày SMD 0402 (1005 metric), 10kΩ ±1%, công suất 1/16W, nhiệt độ hoạt động -55°C đến +155°C. Dùng trong mạch phân áp và kéo lên/xuống cho mạch điều khiển.',
      priceIn: 120, priceOut: 200, unit: 'Cái', categoryId: catPassive._id
    });
    // IC chip
    const p10 = await Product.create({
      sku: 'FST-IC-STM32G030', name: 'Vi điều khiển STM32G030F6P6 FST-IC-STM32G030',
      description: 'Microcontroller ARM Cortex-M0+ 64MHz, flash 32KB, RAM 8KB, gói QFP-20. Dùng làm bộ điều khiển trung gian cho cơ cấu bản lề điện động và cảm biến góc nghiêng. Lot code theo lô sản xuất ST Microelectronics.',
      priceIn: 28000, priceOut: 45000, unit: 'Cái', categoryId: catIC._id
    });
    const p11 = await Product.create({
      sku: 'FST-IC-DRV8833', name: 'Driver motor DRV8833PWPR FST-IC-DRV8833',
      description: 'H-bridge motor driver IC 1.5A/channel, điện áp 2.7–10.8V, gói HTSSOP-16. Điều khiển động cơ DC và cuộn dây trong cơ cấu bản lề điện động và khóa tháo rời bàn phím 2-in-1.',
      priceIn: 42000, priceOut: 68000, unit: 'Cái', categoryId: catIC._id
    });
    const p12 = await Product.create({
      sku: 'FST-IC-W25Q64', name: 'Flash memory W25Q64JVSSIQ FST-IC-W25Q64',
      description: 'NOR Flash 64Mbit (8MB) giao tiếp SPI/QSPI, điện áp 2.7–3.6V, gói SOIC-8. Lưu trữ firmware và cấu hình cho vi điều khiển cơ cấu hinge. Thời gian ghi 3ms/page.',
      priceIn: 18500, priceOut: 30000, unit: 'Cái', categoryId: catIC._id
    });
    // FPC cable
    const p13 = await Product.create({
      sku: 'FST-FPC-30P05', name: 'Cáp FPC 30 chân 0.5mm FST-FPC-30P05',
      description: 'Cáp màng linh hoạt FPC 30 chân, bước chân 0.5mm, dài 150mm, chiều rộng 16mm. Kết nối màn hình với board system. Lớp mạ: vàng niken 1µm. Nhiệt độ hoạt động: -40°C đến +85°C.',
      priceIn: 15000, priceOut: 25000, unit: 'Cái', categoryId: catFPC._id
    });
    const p14 = await Product.create({
      sku: 'FST-FPC-51P1MM', name: 'Cáp FPC 51 chân 1.0mm FST-FPC-51P1MM',
      description: 'Cáp màng linh hoạt FPC 51 chân, bước chân 1.0mm, dài 200mm, đầu nối ZIF lock. Kết nối bàn phím với board system. Chịu uốn 200.000 chu kỳ. Lớp mạ: thiếc-chì không chì.',
      priceIn: 22000, priceOut: 36000, unit: 'Cái', categoryId: catFPC._id
    });
    const p15 = await Product.create({
      sku: 'FST-FFC-20P1MM', name: 'Cáp FFC 20 chân 1.0mm FST-FFC-20P1MM',
      description: 'Cáp phẳng linh hoạt FFC 20 chân, bước chân 1.0mm, dài 100mm, cả hai đầu đồng hướng. Kết nối cảm biến vân tay và nút nguồn. Chiều dày 0.3mm. Nhiệt độ -55°C đến +105°C.',
      priceIn: 9500, priceOut: 16000, unit: 'Cái', categoryId: catFPC._id
    });

    console.log('✓ Products mới (9): p7-p9 Passive, p10-p12 IC, p13-p15 FPC/FFC');

    // ══════════════════════════════════════════════════════════════
    // KHO MỞ RỘNG — ZONE D + ZONE E
    // ══════════════════════════════════════════════════════════════
    const zoneD = await WarehouseNode.create({ name: 'Khu D – Linh kiện điện tử thụ động', code: 'ZONE-D', type: 'zone', parentId: wh._id });
    const zoneE = await WarehouseNode.create({ name: 'Khu E – IC & Cáp mềm FPC',          code: 'ZONE-E', type: 'zone', parentId: wh._id });

    const aisleD1 = await WarehouseNode.create({ name: 'Dãy kệ D1', code: 'DKE-D1', type: 'aisle', parentId: zoneD._id });
    const aisleD2 = await WarehouseNode.create({ name: 'Dãy kệ D2', code: 'DKE-D2', type: 'aisle', parentId: zoneD._id });
    const aisleE1 = await WarehouseNode.create({ name: 'Dãy kệ E1', code: 'DKE-E1', type: 'aisle', parentId: zoneE._id });
    const aisleE2 = await WarehouseNode.create({ name: 'Dãy kệ E2', code: 'DKE-E2', type: 'aisle', parentId: zoneE._id });

    const rackD1 = await WarehouseNode.create({ name: 'Kệ D1', code: 'RACK-D1', type: 'rack', parentId: aisleD1._id });
    const rackD2 = await WarehouseNode.create({ name: 'Kệ D2', code: 'RACK-D2', type: 'rack', parentId: aisleD1._id });
    const rackD3 = await WarehouseNode.create({ name: 'Kệ D3', code: 'RACK-D3', type: 'rack', parentId: aisleD2._id });
    const rackE1 = await WarehouseNode.create({ name: 'Kệ E1', code: 'RACK-E1', type: 'rack', parentId: aisleE1._id });
    const rackE2 = await WarehouseNode.create({ name: 'Kệ E2', code: 'RACK-E2', type: 'rack', parentId: aisleE1._id });
    const rackE3 = await WarehouseNode.create({ name: 'Kệ E3', code: 'RACK-E3', type: 'rack', parentId: aisleE2._id });

    // Bins Zone D
    const binD101 = await WarehouseNode.create({ name: 'Kệ D1, Hàng 1', code: 'VT-D1-01', type: 'bin', parentId: rackD1._id });
    const binD102 = await WarehouseNode.create({ name: 'Kệ D1, Hàng 2', code: 'VT-D1-02', type: 'bin', parentId: rackD1._id });
    const binD103 = await WarehouseNode.create({ name: 'Kệ D1, Hàng 3', code: 'VT-D1-03', type: 'bin', parentId: rackD1._id });
    const binD201 = await WarehouseNode.create({ name: 'Kệ D2, Hàng 1', code: 'VT-D2-01', type: 'bin', parentId: rackD2._id });
    const binD202 = await WarehouseNode.create({ name: 'Kệ D2, Hàng 2', code: 'VT-D2-02', type: 'bin', parentId: rackD2._id });
    const binD301 = await WarehouseNode.create({ name: 'Kệ D3, Hàng 1', code: 'VT-D3-01', type: 'bin', parentId: rackD3._id });
    // Bins Zone E
    const binE101 = await WarehouseNode.create({ name: 'Kệ E1, Hàng 1', code: 'VT-E1-01', type: 'bin', parentId: rackE1._id });
    const binE102 = await WarehouseNode.create({ name: 'Kệ E1, Hàng 2', code: 'VT-E1-02', type: 'bin', parentId: rackE1._id });
    const binE201 = await WarehouseNode.create({ name: 'Kệ E2, Hàng 1', code: 'VT-E2-01', type: 'bin', parentId: rackE2._id });
    const binE202 = await WarehouseNode.create({ name: 'Kệ E2, Hàng 2', code: 'VT-E2-02', type: 'bin', parentId: rackE2._id });
    const binE301 = await WarehouseNode.create({ name: 'Kệ E3, Hàng 1', code: 'VT-E3-01', type: 'bin', parentId: rackE3._id });
    const binE302 = await WarehouseNode.create({ name: 'Kệ E3, Hàng 2', code: 'VT-E3-02', type: 'bin', parentId: rackE3._id });

    console.log('✓ Warehouse mở rộng: Zone D/E → 6 aisles → 6 racks → 13 bins mới');

    // ══════════════════════════════════════════════════════════════
    // TỒN KHO MỞ RỘNG
    // ══════════════════════════════════════════════════════════════
    // Zone D – Passive
    const invD1 = await Inventory.create({ productId: p7._id,  warehouseNodeId: binD101._id, quantity: 5000 });
    const invD2 = await Inventory.create({ productId: p7._id,  warehouseNodeId: binD102._id, quantity: 3000 });
    const invD3 = await Inventory.create({ productId: p8._id,  warehouseNodeId: binD103._id, quantity: 2500 });
    const invD4 = await Inventory.create({ productId: p9._id,  warehouseNodeId: binD201._id, quantity: 10000 });
    const invD5 = await Inventory.create({ productId: p9._id,  warehouseNodeId: binD202._id, quantity: 8000 });
    const invD6 = await Inventory.create({ productId: p8._id,  warehouseNodeId: binD301._id, quantity: 1500 });
    // Zone E – IC & FPC
    const invE1 = await Inventory.create({ productId: p10._id, warehouseNodeId: binE101._id, quantity: 800  });
    const invE2 = await Inventory.create({ productId: p11._id, warehouseNodeId: binE102._id, quantity: 600  });
    const invE3 = await Inventory.create({ productId: p12._id, warehouseNodeId: binE201._id, quantity: 1200 });
    const invE4 = await Inventory.create({ productId: p13._id, warehouseNodeId: binE202._id, quantity: 3500 });
    const invE5 = await Inventory.create({ productId: p14._id, warehouseNodeId: binE301._id, quantity: 2800 });
    const invE6 = await Inventory.create({ productId: p15._id, warehouseNodeId: binE302._id, quantity: 4200 });

    // Đặt minStock cho IC (linh kiện đắt, cần cảnh báo sớm)
    await sequelize.query(`UPDATE Inventories SET minStock = 200 WHERE _id = ?`, { replacements: [invE1._id] });
    await sequelize.query(`UPDATE Inventories SET minStock = 150 WHERE _id = ?`, { replacements: [invE2._id] });
    await sequelize.query(`UPDATE Inventories SET minStock = 300 WHERE _id = ?`, { replacements: [invE3._id] });
    // Giả lập tồn lâu ngày: tụ điện D3 (80 ngày), FPC D5 (55 ngày)
    await sequelize.query(`UPDATE Inventories SET updatedAt = DATE_SUB(NOW(), INTERVAL 80 DAY) WHERE _id = ?`, { replacements: [invD3._id] });
    await sequelize.query(`UPDATE Inventories SET updatedAt = DATE_SUB(NOW(), INTERVAL 55 DAY) WHERE _id = ?`, { replacements: [invD6._id] });

    console.log('✓ Inventory mới (12 dòng) + minStock IC + tồn lâu ngày giả lập');

    // ══════════════════════════════════════════════════════════════
    // PHIẾU NHẬP KHO MỚI (12 phiếu: RC-006 → RC-017)
    // ══════════════════════════════════════════════════════════════

    // RC-006: Nhập tụ điện lớn tháng 2 – completed (85 ngày trước)
    const rc6 = await Receipt.create({
      code: 'RC-2026-00006',
      ghiChu: 'Lô tháng 2/2026 – Tụ điện 100µF và 10µF từ NCC Murata',
      totalAmount: (8000 * 850) + (4000 * 2200),
      createdByUserId: accountant1._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc6._id, productId: p7._id, quantity: 8000, price: 850,  warehouseNodeId: binD101._id });
    await ReceiptItem.create({ receiptId: rc6._id, productId: p8._id, quantity: 4000, price: 2200, warehouseNodeId: binD103._id });
    await setDates('Receipts', rc6._id, 85, 83);

    // RC-007: Nhập điện trở 10kΩ số lượng lớn – completed (80 ngày trước)
    const rc7 = await Receipt.create({
      code: 'RC-2026-00007',
      ghiChu: 'Lô tháng 2/2026 – Điện trở 0402 10kΩ từ NCC Yageo Taiwan',
      totalAmount: (18000 * 120),
      createdByUserId: accountant2._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc7._id, productId: p9._id, quantity: 18000, price: 120, warehouseNodeId: binD201._id });
    await setDates('Receipts', rc7._id, 80, 78);

    // RC-008: Nhập IC STM32 và DRV8833 – completed (70 ngày trước)
    const rc8 = await Receipt.create({
      code: 'RC-2026-00008',
      ghiChu: 'Lô tháng 3/2026 – Vi điều khiển STM32 và driver DRV8833',
      totalAmount: (1200 * 28000) + (900 * 42000),
      createdByUserId: accountant1._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc8._id, productId: p10._id, quantity: 1200, price: 28000, warehouseNodeId: binE101._id });
    await ReceiptItem.create({ receiptId: rc8._id, productId: p11._id, quantity: 900,  price: 42000, warehouseNodeId: binE102._id });
    await setDates('Receipts', rc8._id, 70, 68);

    // RC-009: Nhập Flash memory W25Q64 – completed (60 ngày trước)
    const rc9 = await Receipt.create({
      code: 'RC-2026-00009',
      ghiChu: 'Lô tháng 3/2026 – Flash memory 64Mbit từ NCC Winbond',
      totalAmount: (1800 * 18500),
      createdByUserId: accountant2._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc9._id, productId: p12._id, quantity: 1800, price: 18500, warehouseNodeId: binE201._id });
    await setDates('Receipts', rc9._id, 60, 58);

    // RC-010: Nhập cáp FPC 30P và 51P – completed (50 ngày trước)
    const rc10 = await Receipt.create({
      code: 'RC-2026-00010',
      ghiChu: 'Lô tháng 4/2026 – Cáp FPC màn hình và bàn phím từ NCC Sumitomo',
      totalAmount: (5000 * 15000) + (4000 * 22000),
      createdByUserId: accountant1._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc10._id, productId: p13._id, quantity: 5000, price: 15000, warehouseNodeId: binE202._id });
    await ReceiptItem.create({ receiptId: rc10._id, productId: p14._id, quantity: 4000, price: 22000, warehouseNodeId: binE301._id });
    await setDates('Receipts', rc10._id, 50, 48);

    // RC-011: Nhập cáp FFC + bổ sung tụ – completed (40 ngày trước)
    const rc11 = await Receipt.create({
      code: 'RC-2026-00011',
      ghiChu: 'Lô tháng 4/2026 – Cáp FFC 20P và bổ sung tụ 10µF',
      totalAmount: (5000 * 9500) + (2000 * 2200),
      createdByUserId: accountant2._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc11._id, productId: p15._id, quantity: 5000, price: 9500, warehouseNodeId: binE302._id });
    await ReceiptItem.create({ receiptId: rc11._id, productId: p8._id,  quantity: 2000, price: 2200, warehouseNodeId: binD301._id });
    await setDates('Receipts', rc11._id, 40, 38);

    // RC-012: Nhập bổ sung Trục xoay 360° lô lớn – completed (35 ngày trước)
    const rc12 = await Receipt.create({
      code: 'RC-2026-00012',
      ghiChu: 'Lô tháng 5/2026 – Bổ sung trục xoay 360° cho đơn Samsung Q3',
      totalAmount: (300 * 18000),
      createdByUserId: accountant1._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc12._id, productId: p1._id, quantity: 300, price: 18000, warehouseNodeId: binA102._id });
    await setDates('Receipts', rc12._id, 35, 33);

    // RC-013: Nhập IC STM32 lô Q2 – approved (25 ngày trước, chờ NVK hoàn tất)
    const rc13 = await Receipt.create({
      code: 'RC-2026-00013',
      ghiChu: 'Lô tháng 5/2026 – Bổ sung STM32G030 cho đơn Intel',
      totalAmount: (500 * 28000),
      createdByUserId: accountant2._id, status: 'approved'
    });
    await ReceiptItem.create({ receiptId: rc13._id, productId: p10._id, quantity: 500, price: 28000, warehouseNodeId: null });
    await setDates('Receipts', rc13._id, 25, 23);

    // RC-014: Nhập FPC số lượng lớn – draft (15 ngày trước, chờ quản lý duyệt)
    const rc14 = await Receipt.create({
      code: 'RC-2026-00014',
      ghiChu: 'Lô tháng 6/2026 – Cáp FPC 30P số lượng lớn cho đơn VinFast',
      totalAmount: (6000 * 15000),
      createdByUserId: accountant1._id, status: 'draft'
    });
    await ReceiptItem.create({ receiptId: rc14._id, productId: p13._id, quantity: 6000, price: 15000, warehouseNodeId: null });
    await setDates('Receipts', rc14._id, 15, 13);

    // RC-015: Nhập tụ D-grade bị phát hiện lỗi – rejected (20 ngày trước)
    const rc15 = await Receipt.create({
      code: 'RC-2026-00015',
      ghiChu: 'Lô tháng 5/2026 – Tụ 100µF từ NCC mới TW Capacitor (bị từ chối)',
      rejectNote: 'QC phát hiện tụ điện không đạt tiêu chuẩn ESR – đo được 0.8Ω thay vì ≤0.1Ω quy định. Toàn lô bị từ chối.',
      totalAmount: (3000 * 850),
      createdByUserId: accountant2._id, status: 'rejected'
    });
    await ReceiptItem.create({ receiptId: rc15._id, productId: p7._id, quantity: 3000, price: 850, warehouseNodeId: null });
    await setDates('Receipts', rc15._id, 20, 18);

    // RC-016: Nhập điện trở bổ sung – completed (10 ngày trước)
    const rc16 = await Receipt.create({
      code: 'RC-2026-00016',
      ghiChu: 'Lô tháng 6/2026 – Bổ sung điện trở 10kΩ từ Yageo',
      totalAmount: (10000 * 120),
      createdByUserId: accountant1._id, status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc16._id, productId: p9._id, quantity: 10000, price: 120, warehouseNodeId: binD202._id });
    await setDates('Receipts', rc16._id, 10, 8);

    // RC-017: Nhập MIM + FFC hôm nay – draft (chờ gửi phê duyệt)
    const rc17 = await Receipt.create({
      code: 'RC-2026-00017',
      ghiChu: 'Lô tháng 6/2026 – Giá đỡ bản lề MIM và cáp FFC 20P bổ sung',
      totalAmount: (30 * 105000) + (3000 * 9500),
      createdByUserId: accountant2._id, status: 'draft'
    });
    await ReceiptItem.create({ receiptId: rc17._id, productId: p5._id,  quantity: 30,   price: 105000, warehouseNodeId: null });
    await ReceiptItem.create({ receiptId: rc17._id, productId: p15._id, quantity: 3000, price: 9500,   warehouseNodeId: null });

    console.log('✓ Receipts mới (12): RC-006→017 | completed×8, approved×1, draft×1, rejected×1, preparing×1');

    // ══════════════════════════════════════════════════════════════
    // PHIẾU XUẤT KHO MỚI (15 phiếu: DL-015 → DL-029)
    // ══════════════════════════════════════════════════════════════

    // DL-015: Sony – cáp FPC 30P (80 ngày trước, completed)
    const dl15 = await Delivery.create({
      code: 'DL-2026-00015', customerId: custSony._id, tenKhachHang: 'Sony Vietnam',
      totalAmount: (800 * 25000),
      status: 'completed', createdByUserId: staff1._id,
      signerName: 'Nguyễn Văn An', signedAt: daysAgo(79), signatureNote: 'Nhận đủ hàng, đúng quy cách'
    });
    await DeliveryItem.create({ deliveryId: dl15._id, productId: p13._id, quantity: 800, price: 25000, warehouseNodeId: binE202._id });
    await setDates('Deliveries', dl15._id, 80, 79);

    // DL-016: Intel – STM32 + DRV8833 (65 ngày trước, completed)
    const dl16 = await Delivery.create({
      code: 'DL-2026-00016', customerId: custIntel._id, tenKhachHang: 'Intel Products Vietnam',
      totalAmount: (200 * 45000) + (150 * 68000),
      status: 'completed', createdByUserId: accountant1._id,
      signerName: 'Trần Minh Đức', signedAt: daysAgo(64), signatureNote: 'Nhận đủ, kiểm tra nhãn lot'
    });
    await DeliveryItem.create({ deliveryId: dl16._id, productId: p10._id, quantity: 200, price: 45000, warehouseNodeId: binE101._id });
    await DeliveryItem.create({ deliveryId: dl16._id, productId: p11._id, quantity: 150, price: 68000, warehouseNodeId: binE102._id });
    await setDates('Deliveries', dl16._id, 65, 64);

    // DL-017: Foxconn – tụ điện (55 ngày trước, completed)
    const dl17 = await Delivery.create({
      code: 'DL-2026-00017', customerId: custFoxconn._id, tenKhachHang: 'Foxconn Technology Vietnam',
      totalAmount: (2000 * 1400) + (1500 * 3600),
      status: 'completed', createdByUserId: staff2._id,
      signerName: 'Lê Văn Bình', signedAt: daysAgo(54)
    });
    await DeliveryItem.create({ deliveryId: dl17._id, productId: p7._id, quantity: 2000, price: 1400, warehouseNodeId: binD101._id });
    await DeliveryItem.create({ deliveryId: dl17._id, productId: p8._id, quantity: 1500, price: 3600, warehouseNodeId: binD103._id });
    await setDates('Deliveries', dl17._id, 55, 54);

    // DL-018: VinFast – cáp FPC 30P và FFC 20P (45 ngày trước, completed)
    const dl18 = await Delivery.create({
      code: 'DL-2026-00018', customerId: custVinfast._id, tenKhachHang: 'VinFast Auto',
      totalAmount: (1200 * 25000) + (1000 * 16000),
      status: 'completed', createdByUserId: accountant2._id,
      signerName: 'Phạm Thị Thu', signedAt: daysAgo(44), signatureNote: 'Hàng đạt tiêu chuẩn ô tô, nhận tại kho VF'
    });
    await DeliveryItem.create({ deliveryId: dl18._id, productId: p13._id, quantity: 1200, price: 25000, warehouseNodeId: binE202._id });
    await DeliveryItem.create({ deliveryId: dl18._id, productId: p15._id, quantity: 1000, price: 16000, warehouseNodeId: binE302._id });
    await setDates('Deliveries', dl18._id, 45, 44);

    // DL-019: Việt Hoa – điện trở 10kΩ (38 ngày trước, completed)
    const dl19 = await Delivery.create({
      code: 'DL-2026-00019', customerId: custViet._id, tenKhachHang: 'Việt Hoa Electronics',
      totalAmount: (5000 * 200),
      status: 'completed', createdByUserId: staff1._id,
      signerName: 'Hoàng Văn Cường', signedAt: daysAgo(37)
    });
    await DeliveryItem.create({ deliveryId: dl19._id, productId: p9._id, quantity: 5000, price: 200, warehouseNodeId: binD201._id });
    await setDates('Deliveries', dl19._id, 38, 37);

    // DL-020: Bosch – Flash W25Q64 + FPC 51P (30 ngày trước, completed)
    const dl20 = await Delivery.create({
      code: 'DL-2026-00020', customerId: custBose._id, tenKhachHang: 'Bosch Vietnam',
      totalAmount: (400 * 30000) + (600 * 36000),
      status: 'completed', createdByUserId: staff2._id,
      signerName: 'Nguyễn Thị Lan', signedAt: daysAgo(29), signatureNote: 'Kiểm lot code đạt, nhận đủ'
    });
    await DeliveryItem.create({ deliveryId: dl20._id, productId: p12._id, quantity: 400, price: 30000, warehouseNodeId: binE201._id });
    await DeliveryItem.create({ deliveryId: dl20._id, productId: p14._id, quantity: 600, price: 36000, warehouseNodeId: binE301._id });
    await setDates('Deliveries', dl20._id, 30, 29);

    // DL-021: Samsung – trục xoay 360° + STM32 (25 ngày trước, completed)
    const dl21 = await Delivery.create({
      code: 'DL-2026-00021', customerId: custSamsung._id, tenKhachHang: 'Samsung Electronics Vietnam',
      totalAmount: (100 * 30000) + (80 * 45000),
      status: 'completed', createdByUserId: accountant1._id,
      signerName: 'Kim Young Jun', signedAt: daysAgo(24)
    });
    await DeliveryItem.create({ deliveryId: dl21._id, productId: p1._id,  quantity: 100, price: 30000, warehouseNodeId: binA102._id });
    await DeliveryItem.create({ deliveryId: dl21._id, productId: p10._id, quantity: 80,  price: 45000, warehouseNodeId: binE101._id });
    await setDates('Deliveries', dl21._id, 25, 24);

    // DL-022: LG – cáp FPC 51P (18 ngày trước, completed)
    const dl22 = await Delivery.create({
      code: 'DL-2026-00022', customerId: custLG._id, tenKhachHang: 'LG Electronics Vietnam',
      totalAmount: (500 * 36000),
      status: 'completed', createdByUserId: staff1._id,
      signerName: 'Park Ji Hoon', signedAt: daysAgo(17)
    });
    await DeliveryItem.create({ deliveryId: dl22._id, productId: p14._id, quantity: 500, price: 36000, warehouseNodeId: binE301._id });
    await setDates('Deliveries', dl22._id, 18, 17);

    // DL-023: Toshiba – điện trở + tụ (12 ngày trước, completed)
    const dl23 = await Delivery.create({
      code: 'DL-2026-00023', customerId: custToshiba._id, tenKhachHang: 'Toshiba Storage Vietnam',
      totalAmount: (3000 * 200) + (800 * 1400),
      status: 'completed', createdByUserId: staff2._id,
      signerName: 'Tanaka Hiroshi', signedAt: daysAgo(11)
    });
    await DeliveryItem.create({ deliveryId: dl23._id, productId: p9._id, quantity: 3000, price: 200,  warehouseNodeId: binD202._id });
    await DeliveryItem.create({ deliveryId: dl23._id, productId: p7._id, quantity: 800,  price: 1400, warehouseNodeId: binD101._id });
    await setDates('Deliveries', dl23._id, 12, 11);

    // DL-024: Acer – FFC 20P + DRV8833 (8 ngày trước, completed)
    const dl24 = await Delivery.create({
      code: 'DL-2026-00024', customerId: custAcer._id, tenKhachHang: 'Acer Inc. Vietnam Branch',
      totalAmount: (800 * 16000) + (100 * 68000),
      status: 'completed', createdByUserId: accountant2._id,
      signerName: 'Chen Wei', signedAt: daysAgo(7), signatureNote: 'Đủ số lượng, đúng spec'
    });
    await DeliveryItem.create({ deliveryId: dl24._id, productId: p15._id, quantity: 800, price: 16000, warehouseNodeId: binE302._id });
    await DeliveryItem.create({ deliveryId: dl24._id, productId: p11._id, quantity: 100, price: 68000, warehouseNodeId: binE102._id });
    await setDates('Deliveries', dl24._id, 8, 7);

    // DL-025: MSI – Flash + tụ 10µF (5 ngày trước, completed)
    const dl25 = await Delivery.create({
      code: 'DL-2026-00025', customerId: custMSI._id, tenKhachHang: 'MSI Technology Vietnam',
      totalAmount: (200 * 30000) + (500 * 3600),
      status: 'completed', createdByUserId: staff1._id,
      signerName: 'Wang Xiaoming', signedAt: daysAgo(4)
    });
    await DeliveryItem.create({ deliveryId: dl25._id, productId: p12._id, quantity: 200, price: 30000, warehouseNodeId: binE201._id });
    await DeliveryItem.create({ deliveryId: dl25._id, productId: p8._id,  quantity: 500, price: 3600,  warehouseNodeId: binD301._id });
    await setDates('Deliveries', dl25._id, 5, 4);

    // DL-026: HP – STM32 (2 ngày trước, completed)
    const dl26 = await Delivery.create({
      code: 'DL-2026-00026', customerId: custHP._id, tenKhachHang: 'HP Vietnam Sales',
      totalAmount: (120 * 45000),
      status: 'completed', createdByUserId: accountant1._id,
      signerName: 'Nguyễn Hải Đăng', signedAt: daysAgo(1), signatureNote: 'Nhận đủ, lot H2-2026'
    });
    await DeliveryItem.create({ deliveryId: dl26._id, productId: p10._id, quantity: 120, price: 45000, warehouseNodeId: binE101._id });
    await setDates('Deliveries', dl26._id, 2, 1);

    // DL-027: Intel – cáp FPC 51P (đang bàn giao – hôm nay, shipping)
    const dl27 = await Delivery.create({
      code: 'DL-2026-00027', customerId: custIntel._id, tenKhachHang: 'Intel Products Vietnam',
      totalAmount: (300 * 36000),
      status: 'shipping', createdByUserId: staff2._id
    });
    await DeliveryItem.create({ deliveryId: dl27._id, productId: p14._id, quantity: 300, price: 36000, warehouseNodeId: binE301._id });
    // Set reservedQty cho DL-027 (đã approved → đã giữ chỗ)
    await sequelize.query(
      'UPDATE Inventories SET reservedQty = reservedQty + 300 WHERE `product` = ? AND `warehouseNode` = ?',
      { replacements: [p14._id, binE301._id] }
    );

    // DL-028: VinFast – FPC 30P + FFC (approved, hôm qua)
    const dl28 = await Delivery.create({
      code: 'DL-2026-00028', customerId: custVinfast._id, tenKhachHang: 'VinFast Auto',
      totalAmount: (500 * 25000) + (700 * 16000),
      status: 'approved', createdByUserId: accountant2._id
    });
    await DeliveryItem.create({ deliveryId: dl28._id, productId: p13._id, quantity: 500, price: 25000, warehouseNodeId: binE202._id });
    await DeliveryItem.create({ deliveryId: dl28._id, productId: p15._id, quantity: 700, price: 16000, warehouseNodeId: binE302._id });
    await setDates('Deliveries', dl28._id, 1, 0);
    await sequelize.query(
      'UPDATE Inventories SET reservedQty = reservedQty + 500 WHERE `product` = ? AND `warehouseNode` = ?',
      { replacements: [p13._id, binE202._id] }
    );
    await sequelize.query(
      'UPDATE Inventories SET reservedQty = reservedQty + 700 WHERE `product` = ? AND `warehouseNode` = ?',
      { replacements: [p15._id, binE302._id] }
    );

    // DL-029: Bosch – IC + điện trở (draft, hôm nay)
    const dl29 = await Delivery.create({
      code: 'DL-2026-00029', customerId: custBose._id, tenKhachHang: 'Bosch Vietnam',
      totalAmount: (60 * 68000) + (2000 * 200),
      status: 'draft', createdByUserId: staff1._id
    });
    await DeliveryItem.create({ deliveryId: dl29._id, productId: p11._id, quantity: 60,   price: 68000, warehouseNodeId: binE102._id });
    await DeliveryItem.create({ deliveryId: dl29._id, productId: p9._id,  quantity: 2000, price: 200,   warehouseNodeId: binD201._id });

    console.log('✓ Deliveries mới (15): DL-015→029 | completed×12, shipping×1, approved×1, draft×1');

    // ══════════════════════════════════════════════════════════════
    // YÊU CẦU XUẤT KHO MỚI (8 yêu cầu)
    // ══════════════════════════════════════════════════════════════

    // YCX-018: Sony – FPC 30P completed (linked → DL-015)
    const ycx18 = await DeliveryRequest.create({
      code: 'YCX-2026-00018', customerId: custSony._id, tenKhachHang: 'Sony Vietnam',
      status: 'completed',
      note: 'Đơn Q1/2026 – cáp FPC 30P cho dòng Xperia Laptop. Yêu cầu lot mới sản xuất tháng 1.',
      expectedDeliveryDate: daysLater(-79),
      totalAmount: (800 * 25000), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx18._id, productId: p13._id, quantity: 800, priceEstimate: 25000 });
    await setDates('DeliveryRequests', ycx18._id, 82, 79);
    await Delivery.update({ requestId: ycx18._id }, { where: { _id: dl15._id } });

    // YCX-019: Intel – IC completed (linked → DL-016)
    const ycx19 = await DeliveryRequest.create({
      code: 'YCX-2026-00019', customerId: custIntel._id, tenKhachHang: 'Intel Products Vietnam',
      status: 'completed',
      note: 'Đơn tháng 3/2026 – STM32G030 và DRV8833 cho dự án Edge AI Box.',
      expectedDeliveryDate: daysLater(-64),
      totalAmount: (200 * 45000) + (150 * 68000), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx19._id, productId: p10._id, quantity: 200, priceEstimate: 45000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx19._id, productId: p11._id, quantity: 150, priceEstimate: 68000 });
    await setDates('DeliveryRequests', ycx19._id, 67, 64);
    await Delivery.update({ requestId: ycx19._id }, { where: { _id: dl16._id } });

    // YCX-020: VinFast – FPC + FFC (linked → DL-018, completed)
    const ycx20 = await DeliveryRequest.create({
      code: 'YCX-2026-00020', customerId: custVinfast._id, tenKhachHang: 'VinFast Auto',
      status: 'completed',
      note: 'Đơn cáp kết nối cho hệ thống màn hình và điều khiển ô tô điện VF9.',
      expectedDeliveryDate: daysLater(-44),
      totalAmount: (1200 * 25000) + (1000 * 16000), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx20._id, productId: p13._id, quantity: 1200, priceEstimate: 25000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx20._id, productId: p15._id, quantity: 1000, priceEstimate: 16000 });
    await setDates('DeliveryRequests', ycx20._id, 47, 44);
    await Delivery.update({ requestId: ycx20._id }, { where: { _id: dl18._id } });

    // YCX-021: Intel – FPC 51P (processing, linked → DL-027 đang bàn giao)
    const ycx21 = await DeliveryRequest.create({
      code: 'YCX-2026-00021', customerId: custIntel._id, tenKhachHang: 'Intel Products Vietnam',
      status: 'processing',
      note: 'Đơn tháng 6/2026 – cáp FPC 51P cho bo mạch công nghiệp NUC Gen5.',
      expectedDeliveryDate: daysLater(0),
      totalAmount: (300 * 36000), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx21._id, productId: p14._id, quantity: 300, priceEstimate: 36000 });
    await setDates('DeliveryRequests', ycx21._id, 3, 1);
    await Delivery.update({ requestId: ycx21._id }, { where: { _id: dl27._id } });

    // YCX-022: VinFast – FPC + FFC (processing, linked → DL-028 đã duyệt)
    const ycx22 = await DeliveryRequest.create({
      code: 'YCX-2026-00022', customerId: custVinfast._id, tenKhachHang: 'VinFast Auto',
      status: 'processing',
      note: 'Đơn bổ sung Q2/2026 – cáp cho xe VF5 Plus mở rộng sản xuất.',
      expectedDeliveryDate: daysLater(2),
      totalAmount: (500 * 25000) + (700 * 16000), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx22._id, productId: p13._id, quantity: 500, priceEstimate: 25000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx22._id, productId: p15._id, quantity: 700, priceEstimate: 16000 });
    await setDates('DeliveryRequests', ycx22._id, 2, 0);
    await Delivery.update({ requestId: ycx22._id }, { where: { _id: dl28._id } });

    // YCX-023: Sony – cáp FFC + Flash (pending, chưa tạo phiếu xuất)
    const ycx23 = await DeliveryRequest.create({
      code: 'YCX-2026-00023', customerId: custSony._id, tenKhachHang: 'Sony Vietnam',
      status: 'pending',
      note: 'Đơn Q3/2026 – cáp FFC 20P và Flash W25Q64 cho TV Bravia dòng XR.',
      expectedDeliveryDate: daysLater(5),
      totalAmount: (1500 * 16000) + (300 * 30000), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx23._id, productId: p15._id, quantity: 1500, priceEstimate: 16000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx23._id, productId: p12._id, quantity: 300,  priceEstimate: 30000 });
    // không setDates → giữ NOW()

    // YCX-024: Bosch – IC + RES pending (hôm nay)
    const ycx24 = await DeliveryRequest.create({
      code: 'YCX-2026-00024', customerId: custBose._id, tenKhachHang: 'Bosch Vietnam',
      status: 'pending',
      note: 'Đơn công nghiệp Q3/2026 – DRV8833 và điện trở 10kΩ cho hệ thống servo Bosch.',
      expectedDeliveryDate: daysLater(7),
      totalAmount: (100 * 68000) + (3000 * 200), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx24._id, productId: p11._id, quantity: 100,  priceEstimate: 68000 });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx24._id, productId: p9._id,  quantity: 3000, priceEstimate: 200 });

    // YCX-025: Hisense – tụ điện (insufficient_stock)
    const ycx25 = await DeliveryRequest.create({
      code: 'YCX-2026-00025', customerId: custHisense._id, tenKhachHang: 'Hisense Electronics Vietnam',
      status: 'insufficient_stock',
      note: 'Yêu cầu số lượng lớn tụ 100µF vượt tồn kho – chờ nhập lô mới từ Murata.',
      expectedDeliveryDate: daysLater(10),
      totalAmount: (15000 * 1400), createdByUserId: sale._id
    });
    await DeliveryRequestItem.create({ deliveryRequestId: ycx25._id, productId: p7._id, quantity: 15000, priceEstimate: 1400 });
    await setDates('DeliveryRequests', ycx25._id, 1, 1);

    console.log('✓ DeliveryRequests mới (8): YCX-018→025 | completed×3, processing×2, pending×2, insufficient_stock×1');

    // ══════════════════════════════════════════════════════════════
    // PHIẾU KIỂM KÊ MỚI (4 phiếu: ST-006 → ST-009)
    // ══════════════════════════════════════════════════════════════

    // ST-006: Kiểm kê Zone D completed (65 ngày trước, có chênh lệch tụ điện)
    const st6 = await Stocktake.create({
      code: 'ST-2026-00006', date: '2026-04-10',
      status: 'completed', hasDiff: true,
      note: 'Kiểm kê định kỳ Zone D tháng 4/2026. Phát hiện thiếu 50 tụ 100µF.',
      createdByUserId: staff1._id,
      approvedByUserId: manager._id, approvedAt: daysAgo(62),
      submittedByUserId: staff1._id, submittedAt: daysAgo(61)
    });
    await StocktakeItem.create({ stocktakeId: st6._id, productId: p7._id, warehouseNodeId: binD101._id, systemQty: 5050, countedQty: 5000, discrepancyQty: -50, discrepancyCategory: 'thất_thoát', discrepancyReason: 'Thiếu 50 cái, nghi do đóng gói sai khi xuất hàng cho Foxconn.' });
    await StocktakeItem.create({ stocktakeId: st6._id, productId: p9._id, warehouseNodeId: binD201._id, systemQty: 10000, countedQty: 10000, discrepancyQty: 0 });
    await setDates('Stocktakes', st6._id, 65, 63);

    // ST-007: Kiểm kê Zone E completed (45 ngày trước, không chênh lệch)
    const st7 = await Stocktake.create({
      code: 'ST-2026-00007', date: '2026-04-30',
      status: 'completed', hasDiff: false,
      note: 'Kiểm kê định kỳ Zone E tháng 4/2026. Tất cả IC và cáp khớp hệ thống.',
      createdByUserId: accountant2._id,
      approvedByUserId: manager._id, approvedAt: daysAgo(43),
      submittedByUserId: accountant2._id, submittedAt: daysAgo(42)
    });
    await StocktakeItem.create({ stocktakeId: st7._id, productId: p10._id, warehouseNodeId: binE101._id, systemQty: 800, countedQty: 800, discrepancyQty: 0 });
    await StocktakeItem.create({ stocktakeId: st7._id, productId: p11._id, warehouseNodeId: binE102._id, systemQty: 600, countedQty: 600, discrepancyQty: 0 });
    await StocktakeItem.create({ stocktakeId: st7._id, productId: p12._id, warehouseNodeId: binE201._id, systemQty: 1200, countedQty: 1200, discrepancyQty: 0 });
    await setDates('Stocktakes', st7._id, 45, 43);

    // ST-008: Kiểm kê toàn bộ Zone A + B (submitted, chờ duyệt biên bản)
    const st8 = await Stocktake.create({
      code: 'ST-2026-00008', date: '2026-06-05',
      status: 'submitted', hasDiff: true,
      note: 'Kiểm kê Zone A và B tháng 6/2026. Phát hiện thừa 10 trục xoay 180° và thiếu 5 bộ SL2IN1.',
      createdByUserId: staff2._id,
      approvedByUserId: manager._id, approvedAt: daysAgo(10),
      submittedByUserId: staff2._id, submittedAt: daysAgo(9)
    });
    await StocktakeItem.create({ stocktakeId: st8._id, productId: p1._id, warehouseNodeId: binA101._id, systemQty: 97,  countedQty: 97,  discrepancyQty: 0 });
    await StocktakeItem.create({ stocktakeId: st8._id, productId: p1._id, warehouseNodeId: binA102._id, systemQty: 200, countedQty: 200, discrepancyQty: 0 });
    await StocktakeItem.create({ stocktakeId: st8._id, productId: p2._id, warehouseNodeId: binA201._id, systemQty: 200, countedQty: 210, discrepancyQty: 10, discrepancyCategory: 'nhập_xuất_sai', discrepancyReason: '10 cái nhập bổ sung ngày 30/05 chưa cập nhật hệ thống kịp thời.' });
    await StocktakeItem.create({ stocktakeId: st8._id, productId: p4._id, warehouseNodeId: binB201._id, systemQty: 200, countedQty: 195, discrepancyQty: -5, discrepancyCategory: 'thất_thoát', discrepancyReason: 'Thiếu 5 bộ SL2IN1 – nghi do xuất thiếu lô DL-010 chưa ghi nhận.' });
    await setDates('Stocktakes', st8._id, 12, 10);

    // ST-009: Kiểm kê Zone D+E tháng 6 (counting – đang đếm)
    const st9 = await Stocktake.create({
      code: 'ST-2026-00009', date: '2026-06-15',
      status: 'counting', hasDiff: false,
      note: 'Kiểm kê Zone D và E tháng 6/2026 – đang thực hiện đếm thực tế.',
      createdByUserId: accountant1._id,
      approvedByUserId: manager._id, approvedAt: daysAgo(2)
    });
    await StocktakeItem.create({ stocktakeId: st9._id, productId: p7._id,  warehouseNodeId: binD101._id, systemQty: 5000, countedQty: 0 });
    await StocktakeItem.create({ stocktakeId: st9._id, productId: p8._id,  warehouseNodeId: binD103._id, systemQty: 2500, countedQty: 0 });
    await StocktakeItem.create({ stocktakeId: st9._id, productId: p9._id,  warehouseNodeId: binD201._id, systemQty: 10000, countedQty: 0 });
    await StocktakeItem.create({ stocktakeId: st9._id, productId: p10._id, warehouseNodeId: binE101._id, systemQty: 800,  countedQty: 0 });
    await StocktakeItem.create({ stocktakeId: st9._id, productId: p11._id, warehouseNodeId: binE102._id, systemQty: 600,  countedQty: 0 });
    await StocktakeItem.create({ stocktakeId: st9._id, productId: p13._id, warehouseNodeId: binE202._id, systemQty: 3500, countedQty: 0 });
    await setDates('Stocktakes', st9._id, 3, 2);

    console.log('✓ Stocktakes mới (4): ST-006→009 | completed×2, submitted×1, counting×1');

    // ── Biên bản kiểm kê mới ──
    const bb6 = await StocktakeMinutes.create({
      code: 'BB-ST-2026-00006', stocktakeId: st6._id,
      summary: 'Xác nhận thiếu 50 cái tụ 100µF tại VT-D1-01. Đề xuất điều chỉnh giảm và ghi nhận theo dõi NCC.',
      status: 'approved',
      createdByUserId: staff1._id, approvedByUserId: manager._id, approvedAt: daysAgo(60)
    });
    await setDates('StocktakeMinutes', bb6._id, 62, 60);

    const bb7 = await StocktakeMinutes.create({
      code: 'BB-ST-2026-00007', stocktakeId: st7._id,
      summary: 'Số liệu Zone E khớp hoàn toàn hệ thống. Không có chênh lệch cần xử lý.',
      status: 'approved',
      createdByUserId: accountant2._id, approvedByUserId: manager._id, approvedAt: daysAgo(41)
    });
    await setDates('StocktakeMinutes', bb7._id, 43, 41);

    const bb8 = await StocktakeMinutes.create({
      code: 'BB-ST-2026-00008', stocktakeId: st8._id,
      summary: 'Zone A/B: thừa 10 trục xoay 180° tại VT-A2-01, thiếu 5 bộ SL2IN1 tại VT-B2-01. Chờ Quản lý phê duyệt điều chỉnh.',
      status: 'pending_approval',
      createdByUserId: staff2._id
    });
    await setDates('StocktakeMinutes', bb8._id, 9, 8);

    console.log('✓ StocktakeMinutes mới (3): BB-006/007 approved, BB-008 pending');

    // ── Báo cáo kiểm kê mới ──
    const rpt6 = await StocktakeReport.create({
      code: 'BC-ST-2026-00006', stocktakeId: st6._id, adjustmentId: null,
      totalItems: 2, matchedItems: 1, discrepancyItems: 1,
      totalShortage: 50, totalSurplus: 0,
      note: 'Zone D tháng 4: thiếu 50 tụ 100µF tại VT-D1-01 – chưa xác định nguyên nhân.',
      generatedByUserId: manager._id
    });
    await setDates('StocktakeReports', rpt6._id, 60, 60);

    const rpt7 = await StocktakeReport.create({
      code: 'BC-ST-2026-00007', stocktakeId: st7._id, adjustmentId: null,
      totalItems: 3, matchedItems: 3, discrepancyItems: 0,
      totalShortage: 0, totalSurplus: 0,
      note: 'Zone E tháng 4: tất cả IC và cáp khớp hệ thống. Chất lượng quản lý tốt.',
      generatedByUserId: manager._id
    });
    await setDates('StocktakeReports', rpt7._id, 41, 41);

    console.log('✓ StocktakeReports mới (2): BC-006/007');

    // ══════════════════════════════════════════════════════════════
    // ĐIỀU CHỈNH TỒN KHO MỚI (3 phiếu)
    // ══════════════════════════════════════════════════════════════

    // ADJ-003: Điều chỉnh sau ST-006 (tụ 100µF thiếu 50)
    const adj3 = await Adjustment.create({
      code: 'ADJ-ST-2026-00003',
      reason: 'count_correction',
      status: 'completed',
      note: 'Điều chỉnh giảm 50 cái FST-CAP-100U25V tại VT-D1-01 sau kiểm kê Zone D tháng 4.',
      createdByUserId: staff1._id,
      approvedByUserId: manager._id,
      approvedAt: daysAgo(59)
    });
    await AdjustmentItem.create({ adjustmentId: adj3._id, productId: p7._id, warehouseNodeId: binD101._id, delta: -50 });
    await setDates('Adjustments', adj3._id, 61, 59);
    await StocktakeReport.update({ adjustmentId: adj3._id }, { where: { _id: rpt6._id } });

    // ADJ-004: Điều chỉnh hàng hỏng – IC bị nhiễm ẩm (15 ngày trước)
    const adj4 = await Adjustment.create({
      code: 'ADJ-2026-00004',
      reason: 'damaged',
      status: 'completed',
      note: 'Ghi nhận 20 cái STM32G030 bị hỏng do rò rỉ nước làm ẩm khu E1 trong mưa lũ ngày 05/06. Đã cách ly và hủy.',
      createdByUserId: accountant1._id,
      approvedByUserId: manager._id,
      approvedAt: daysAgo(13)
    });
    await AdjustmentItem.create({ adjustmentId: adj4._id, productId: p10._id, warehouseNodeId: binE101._id, delta: -20 });
    await setDates('Adjustments', adj4._id, 15, 13);

    // ADJ-005: Điều chỉnh draft – bổ sung tồn kho nhập sót (hôm nay, chờ duyệt)
    const adj5 = await Adjustment.create({
      code: 'ADJ-2026-00005',
      reason: 'system_error',
      status: 'draft',
      note: 'Phát hiện 200 cái điện trở 10kΩ chưa được ghi nhận khi nhập RC-016. Đề nghị cộng bổ sung vào tồn kho VT-D2-02.',
      createdByUserId: accountant2._id
    });
    await AdjustmentItem.create({ adjustmentId: adj5._id, productId: p9._id, warehouseNodeId: binD202._id, delta: +200 });
    await setDates('Adjustments', adj5._id, 2, 1);

    console.log('✓ Adjustments mới (3): ADJ-003 (count_correction), ADJ-004 (damaged), ADJ-005 (system_error draft)');

    // ══════════════════════════════════════════════════════════════
    // SỰ CỐ NHẬP KHO MỚI (5 sự cố: INC-004 → INC-008)
    // ══════════════════════════════════════════════════════════════

    // INC-004: QC phát hiện tụ D-grade lô RC-015 (đã approved)
    const inc4 = await Incident.create({
      code: 'INC-2026-00004', type: 'hang_loi', refType: 'receipt', refId: rc15._id,
      status: 'approved',
      note: 'Toàn bộ 3000 cái FST-CAP-100U25V lô RC-015 có ESR vượt ngưỡng 0.1Ω quy định (đo được 0.6–0.8Ω). Đề nghị từ chối toàn lô và yêu cầu NCC TW Capacitor hoàn hàng.',
      createdByUserId: qc._id,
      approvedByUserId: manager._id,
      approvedAt: daysAgo(18)
    });
    await IncidentItem.create({ incidentId: inc4._id, productId: p7._id, quantity: 3000, reason: 'ESR quá cao (0.6–0.8Ω). Tụ không đạt tiêu chuẩn lọc nguồn cho PCB laptop.' });
    await setDates('Incidents', inc4._id, 20, 18);

    // INC-005: NVK phát hiện thiếu hàng khi nhận RC-013 (pending)
    const inc5 = await Incident.create({
      code: 'INC-2026-00005', type: 'hang_thieu', refType: 'receipt', refId: rc13._id,
      status: 'pending_approval',
      note: 'Kiểm đếm RC-2026-00013: hoá đơn 500 cái STM32G030 nhưng thực nhận chỉ 478 cái. Thiếu 22 cái. Nghi do đóng gói nhầm tại nhà máy ST Microelectronics.',
      createdByUserId: staff1._id
    });
    await IncidentItem.create({ incidentId: inc5._id, productId: p10._id, quantity: 22, reason: 'Thiếu hàng so với hoá đơn – nghi đóng gói thiếu tại NCC.' });
    await setDates('Incidents', inc5._id, 25, 24);

    // INC-006: IC DRV8833 bị tĩnh điện làm hỏng trong quá trình nhập kho RC-008 (approved)
    const inc6 = await Incident.create({
      code: 'INC-2026-00006', type: 'hang_loi', refType: 'receipt', refId: rc8._id,
      status: 'approved',
      note: 'Kiểm tra ngẫu nhiên lô RC-2026-00008: phát hiện 8 cái DRV8833 bị lỗi kích hoạt quá nhiệt (thermal shutdown liên tục ở 40°C). Nguyên nhân: tĩnh điện trong quá trình vận chuyển, không đủ túi chống tĩnh điện.',
      createdByUserId: qc._id,
      approvedByUserId: manager._id,
      approvedAt: daysAgo(65)
    });
    await IncidentItem.create({ incidentId: inc6._id, productId: p11._id, quantity: 8, reason: 'Lỗi ESD – IC bị lão hóa do tĩnh điện. Không thể sử dụng, cần hủy.' });
    await setDates('Incidents', inc6._id, 68, 65);

    // INC-007: Cáp FPC bị nhăn mặt, không đạt QC (approved, 45 ngày trước)
    const inc7 = await Incident.create({
      code: 'INC-2026-00007', type: 'hang_loi', refType: 'receipt', refId: rc10._id,
      status: 'approved',
      note: 'Kiểm tra mẫu lô RC-2026-00010: 120 cái cáp FPC-30P bị nhăn mặt do cuộn sai chiều trong quá trình vận chuyển. Tỷ lệ 2.4% – chấp nhận lô nhưng ghi nhận theo dõi.',
      createdByUserId: qc._id,
      approvedByUserId: manager._id,
      approvedAt: daysAgo(47)
    });
    await IncidentItem.create({ incidentId: inc7._id, productId: p13._id, quantity: 120, reason: 'Cáp bị nhăn, không đạt yêu cầu lắp ráp tự động. Cần xử lý thủ công hoặc hủy.' });
    await setDates('Incidents', inc7._id, 49, 47);

    // INC-008: Lô Flash memory thiếu 30 cái (rejected – NCC đã bồi thường)
    const inc8 = await Incident.create({
      code: 'INC-2026-00008', type: 'hang_thieu', refType: 'receipt', refId: rc9._id,
      status: 'approved',
      rejectNote: null,
      note: 'Kiểm đếm lô RC-2026-00009: 1800 cái W25Q64 nhưng thực nhận 1770. Thiếu 30 cái (tương đương ~1.7%). NCC Winbond đã xác nhận và cam kết bổ sung trong lô tiếp theo.',
      createdByUserId: staff2._id,
      approvedByUserId: manager._id,
      approvedAt: daysAgo(57)
    });
    await IncidentItem.create({ incidentId: inc8._id, productId: p12._id, quantity: 30, reason: 'Thiếu 30 cái – nghi đóng gói sai số lượng tại Winbond. NCC đã xác nhận bổ sung.' });
    await setDates('Incidents', inc8._id, 59, 57);

    console.log('✓ Incidents mới (5): INC-004→008 | pending×1, approved×4');

    // ══════════════════════════════════════════════════════════════
    // THẺ KHO BỔ SUNG (StockCards)
    // ══════════════════════════════════════════════════════════════
    let scCount = await StockCard.count();

    const mkSC = async (code, productId, nodeId, refCode, type, before, change, after, note, daysAgoN, userId) => {
      const sc = await StockCard.create({
        code, productId, warehouseNodeId: nodeId, refCode, type,
        qtyBefore: before, qtyChange: change, qtyAfter: after,
        note, recordedAt: daysAgo(daysAgoN), createdByUserId: userId
      });
      await sequelize.query(
        `UPDATE StockCards SET createdAt=DATE_SUB(NOW(),INTERVAL ? DAY), updatedAt=DATE_SUB(NOW(),INTERVAL ? DAY) WHERE _id=?`,
        { replacements: [daysAgoN, daysAgoN, sc._id] }
      );
      return sc;
    };

    // Nhập RC-006 (tụ điện)
    await mkSC('SC-RC006-P7a', p7._id, binD101._id, 'RC-2026-00006', 'import', 0,    8000, 8000, 'Nhập lô tụ 100µF tháng 2', 85, staff1._id);
    await mkSC('SC-RC006-P8',  p8._id, binD103._id, 'RC-2026-00006', 'import', 0,    4000, 4000, 'Nhập lô tụ 10µF tháng 2',  85, staff1._id);
    // Nhập RC-007 (điện trở)
    await mkSC('SC-RC007-P9',  p9._id, binD201._id, 'RC-2026-00007', 'import', 0,   18000, 18000,'Nhập điện trở 10kΩ lô lớn', 80, staff2._id);
    // Nhập RC-008 (IC)
    await mkSC('SC-RC008-P10', p10._id,binE101._id, 'RC-2026-00008', 'import', 0,    1200, 1200, 'Nhập STM32G030 tháng 3',   70, staff1._id);
    await mkSC('SC-RC008-P11', p11._id,binE102._id, 'RC-2026-00008', 'import', 0,    900,  900,  'Nhập DRV8833 tháng 3',     70, staff1._id);
    // Nhập RC-009 (Flash)
    await mkSC('SC-RC009-P12', p12._id,binE201._id, 'RC-2026-00009', 'import', 0,    1800, 1800, 'Nhập W25Q64 tháng 3',      60, staff2._id);
    // Nhập RC-010 (FPC)
    await mkSC('SC-RC010-P13', p13._id,binE202._id, 'RC-2026-00010', 'import', 0,    5000, 5000, 'Nhập FPC 30P tháng 4',     50, staff1._id);
    await mkSC('SC-RC010-P14', p14._id,binE301._id, 'RC-2026-00010', 'import', 0,    4000, 4000, 'Nhập FPC 51P tháng 4',     50, staff1._id);
    // Nhập RC-011 (FFC + tụ bổ sung)
    await mkSC('SC-RC011-P15', p15._id,binE302._id, 'RC-2026-00011', 'import', 0,    5000, 5000, 'Nhập FFC 20P tháng 4',     40, staff2._id);
    // Xuất DL-015 Sony
    await mkSC('SC-DL015-P13', p13._id,binE202._id, 'DL-2026-00015', 'export', 5000, -800, 4200, 'Xuất Sony Q1',             80, staff1._id);
    // Xuất DL-016 Intel
    await mkSC('SC-DL016-P10', p10._id,binE101._id, 'DL-2026-00016', 'export', 1200, -200, 1000, 'Xuất Intel tháng 3',       65, accountant1._id);
    await mkSC('SC-DL016-P11', p11._id,binE102._id, 'DL-2026-00016', 'export', 900,  -150, 750,  'Xuất Intel tháng 3',       65, accountant1._id);
    // Xuất DL-017 Foxconn
    await mkSC('SC-DL017-P7',  p7._id, binD101._id, 'DL-2026-00017', 'export', 8000, -2000,6000, 'Xuất Foxconn tụ điện',     55, staff2._id);
    await mkSC('SC-DL017-P8',  p8._id, binD103._id, 'DL-2026-00017', 'export', 4000, -1500,2500, 'Xuất Foxconn tụ 10µF',     55, staff2._id);
    // Xuất DL-018 VinFast
    await mkSC('SC-DL018-P13', p13._id,binE202._id, 'DL-2026-00018', 'export', 4200, -1200,3000, 'Xuất VinFast cáp FPC',     45, accountant2._id);
    await mkSC('SC-DL018-P15', p15._id,binE302._id, 'DL-2026-00018', 'export', 5000, -1000,4000, 'Xuất VinFast cáp FFC',     45, accountant2._id);
    // Xuất DL-019 Việt Hoa
    await mkSC('SC-DL019-P9',  p9._id, binD201._id, 'DL-2026-00019', 'export', 18000,-5000,13000,'Xuất Việt Hoa điện trở',   38, staff1._id);
    // Xuất DL-020 Bosch
    await mkSC('SC-DL020-P12', p12._id,binE201._id, 'DL-2026-00020', 'export', 1800, -400, 1400, 'Xuất Bosch Flash W25Q64',  30, staff2._id);
    await mkSC('SC-DL020-P14', p14._id,binE301._id, 'DL-2026-00020', 'export', 4000, -600, 3400, 'Xuất Bosch FPC 51P',       30, staff2._id);
    // Điều chỉnh ADJ-003 (tụ thiếu 50)
    await mkSC('SC-ADJ003-P7', p7._id, binD101._id, 'ADJ-ST-2026-00003', 'adjustment', 6000, -50, 5950, 'Điều chỉnh sau kiểm kê Zone D', 60, accountant1._id);
    // Điều chỉnh ADJ-004 (IC hỏng 20)
    await mkSC('SC-ADJ004-P10',p10._id,binE101._id, 'ADJ-2026-00004',    'adjustment', 1000, -20, 980,  'Ghi nhận IC bị ẩm hỏng',       15, accountant1._id);

    console.log('✓ StockCards mới (21 dòng): import×9, export×11, adjustment×2');

    // ══════════════════════════════════════════════════════════════
    // TÓM TẮT
    // ══════════════════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  FOSITEK Seed Extra — Hoàn tất!');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  Dữ liệu bổ sung:');
    console.log('    ◆ Customers : +5 (Sony, Intel, VinFast, Việt Hoa, Bosch)');
    console.log('    ◆ Categories: +3 (Passive, IC/Chip, FPC/FFC)');
    console.log('    ◆ Products  : +9 (p7–p15: tụ, điện trở, IC, cáp FPC/FFC)');
    console.log('    ◆ Warehouse : +2 zone, +4 aisle, +6 rack, +13 bin');
    console.log('    ◆ Inventory : +12 dòng tồn kho mới');
    console.log('    ◆ Receipts  : +12 (RC-006→017)');
    console.log('    ◆ Deliveries: +15 (DL-015→029)');
    console.log('    ◆ DelivReq  : +8 (YCX-018→025)');
    console.log('    ◆ Stocktakes: +4 (ST-006→009) + 3 BB + 2 BC');
    console.log('    ◆ Adjustments: +3 (ADJ-003→005)');
    console.log('    ◆ Incidents : +5 (INC-004→008)');
    console.log('    ◆ StockCards: +21');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  Dashboard sau khi seed:');
    console.log('    ◆ Tồn kho thấp : STM32G030 (800, minStock 200), DRV8833 (600, minStock 150)');
    console.log('    ◆ Tồn lâu ngày : Tụ 10µF@VT-D1-03 (80d), Tụ 10µF@VT-D3-01 (55d)');
    console.log('    ◆ Phiếu chờ    : 1 shipping (DL-027), 1 approved (DL-028), 1 draft (DL-029)');
    console.log('    ◆ Sự cố mở     : INC-005 (pending – thiếu STM32)');
    console.log('    ◆ Kiểm kê      : ST-009 đang đếm, ST-008 chờ duyệt biên bản');
    console.log('══════════════════════════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('Seed extra thất bại:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedExtra();
