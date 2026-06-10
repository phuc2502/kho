import { sequelize, connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Receipt, ReceiptItem } from '../models/receipt.model.js';

const seed = async () => {
  try {
    await connectDB();
    console.log('Syncing database (force: true) for seeding...');
    await sequelize.sync({ force: true });
    console.log('Database synced. All tables cleared.');

    // ── 1. USERS ────────────────────────────────────────────────
    const admin = await User.create({
      username: 'admin',
      email: 'admin@fositek.vn',
      password: 'admin123',
      role: 'Admin',
      fullName: 'Nguyễn Thành Đạt',
      phone: '0836417501',
    });
    const manager = await User.create({
      username: 'quanly',
      email: 'hoang.vu@fositek.vn',
      password: 'quanly123',
      role: 'QuanLyKho',
      fullName: 'Vũ Xuân Hoàng',
      phone: '0836417502',
    });
    const accountant1 = await User.create({
      username: 'ketoan1',
      email: 'lananh.tran@fositek.vn',
      password: 'ketoan123',
      role: 'KeToanKho',
      fullName: 'Trần Thị Lan Anh',
      phone: '0836417503',
    });
    const staff1 = await User.create({
      username: 'nhanvien1',
      email: 'tuan.pham@fositek.vn',
      password: 'nhanvien123',
      role: 'NhanVienKho',
      fullName: 'Phạm Văn Tuấn',
      phone: '0836417504',
    });
    const staff2 = await User.create({
      username: 'nhanvien2',
      email: 'hung.le@fositek.vn',
      password: 'nhanvien123',
      role: 'NhanVienKho',
      fullName: 'Lê Quang Hưng',
      phone: '0836417505',
    });
    const qc = await User.create({
      username: 'qc',
      email: 'ngoc.do@fositek.vn',
      password: 'qc123456',
      role: 'NhanVienKho',
      fullName: 'Đỗ Thị Ngọc',
      phone: '0836417506',
    });
    const accountant2 = await User.create({
      username: 'ketoan2',
      email: 'hang.bui@fositek.vn',
      password: 'ketoan123',
      role: 'KeToanKho',
      fullName: 'Bùi Thị Hằng',
      phone: '0836417508',
    });

    console.log('✓ Seeded Users (7):');
    console.log('  Admin     : admin@fositek.vn          / admin123');
    console.log('  QuanLyKho : hoang.vu@fositek.vn       / quanly123');
    console.log('  KeToanKho : lananh.tran@fositek.vn    / ketoan123');
    console.log('  KeToanKho : hang.bui@fositek.vn       / ketoan123');
    console.log('  NhanVienKho: tuan.pham@fositek.vn     / nhanvien123');
    console.log('  NhanVienKho: hung.le@fositek.vn       / nhanvien123');
    console.log('  NhanVienKho: ngoc.do@fositek.vn       / qc123456');

    // ── 2. CATEGORIES ───────────────────────────────────────────
    const catHinge = await Category.create({
      name: 'Trục xoay máy tính (Bản lề)',
      description: 'Linh kiện trục xoay (hinge) dùng cho màn hình laptop: loại 360° cho 2-in-1 convertible và 180° cho laptop thông thường. Vật liệu: hợp kim kẽm ZA-8, thép không gỉ SUS304.'
    });
    const catSlide = await Category.create({
      name: 'Thanh trượt máy tính (Slide Rail)',
      description: 'Thanh ray dẫn hướng và cơ cấu trượt định vị dùng trong cụm bàn phím và khung màn hình laptop. Vật liệu: thép không gỉ SUS301, nhôm hợp kim 6061-T6.'
    });
    const catMIM = await Category.create({
      name: 'Linh kiện MIM (Kim loại đúc áp lực)',
      description: 'Các chi tiết kim loại chính xác cao sản xuất bằng công nghệ Metal Injection Molding (MIM): giá đỡ bản lề, khung viền camera. Quản lý theo serial do giá trị cao và yêu cầu truy xuất nguồn gốc.'
    });

    console.log('✓ Seeded Categories: Trục xoay / Thanh trượt / MIM');

    // ── 3. PRODUCTS ─────────────────────────────────────────────
    const p1 = await Product.create({
      sku: 'FST-H360-14',
      name: 'Trục xoay 360° FST-H360-14',
      description: 'Trục xoay (hinge) 360° cho laptop convertible/2-in-1 màn hình 14". Vật liệu: ZA-8 + SUS304. Mô-men xoắn: 1.8 N·m. Độ bền: 30.000 chu kỳ. Khách hàng: Samsung Galaxy Book Flex, HP Envy x360.',
      priceIn: 18000,
      priceOut: 30000,
      unit: 'Cái',
      categoryId: catHinge._id
    });
    const p2 = await Product.create({
      sku: 'FST-H180-156',
      name: 'Trục xoay 180° FST-H180-156',
      description: 'Trục xoay (hinge) 180° cho laptop thông thường màn hình 15.6". Vật liệu: ZA-8. Mô-men xoắn: 1.2 N·m. Độ bền: 20.000 chu kỳ. Khách hàng: Dell Inspiron 15, Asus VivoBook 15.',
      priceIn: 13500,
      priceOut: 22000,
      unit: 'Cái',
      categoryId: catHinge._id
    });
    const p3 = await Product.create({
      sku: 'FST-SLK-380',
      name: 'Thanh ray dẫn hướng FST-SLK-380',
      description: 'Thanh ray dẫn hướng (keyboard slide rail) dài 380mm dùng trong cụm bàn phím laptop. Vật liệu: SUS301. Hành trình: 8mm. Lực trượt: 0.3–0.5N. Độ bền: 50.000 chu kỳ.',
      priceIn: 28000,
      priceOut: 46000,
      unit: 'Bộ',
      categoryId: catSlide._id
    });
    const p4 = await Product.create({
      sku: 'FST-SL2IN1-135',
      name: 'Cơ cấu trượt 2-in-1 FST-SL2IN1-135',
      description: 'Cơ cấu trượt và định vị góc cho laptop 2-in-1 tháo rời bàn phím. Vật liệu: nhôm 6061-T6. Góc dừng: 0°–135°. Lực giữ: 2.5N. Độ bền: 100.000 chu kỳ. Khách hàng: Dell XPS, HP Elite.',
      priceIn: 58000,
      priceOut: 92000,
      unit: 'Bộ',
      categoryId: catSlide._id
    });
    const p5 = await Product.create({
      sku: 'FST-MIM-HB14',
      name: 'Giá đỡ bản lề MIM FST-MIM-HB14',
      description: 'Chi tiết giá đỡ hinge bracket nối trục xoay vào khung máy laptop 14", sản xuất bằng MIM. Vật liệu: thép 17-4PH (H900). Kích thước: 38×22×4mm. Dung sai: ±0.05mm.',
      priceIn: 105000,
      priceOut: 162000,
      unit: 'Cái',
      categoryId: catMIM._id
    });
    const p6 = await Product.create({
      sku: 'FST-MIM-CB01',
      name: 'Khung viền camera MIM FST-MIM-CB01',
      description: 'Khung gắn và bảo vệ module camera laptop (camera bezel frame), sản xuất bằng MIM. Vật liệu: thép 316L. Kích thước: 25×8×3mm. Xử lý bề mặt: electropolish + PVD đen.',
      priceIn: 88000,
      priceOut: 136000,
      unit: 'Cái',
      categoryId: catMIM._id
    });

    console.log('✓ Seeded Products (6): FST-H360-14, FST-H180-156, FST-SLK-380, FST-SL2IN1-135, FST-MIM-HB14, FST-MIM-CB01');

    // ── 4. WAREHOUSE NODES ──────────────────────────────────────
    const wh = await WarehouseNode.create({
      name: 'Kho thành phẩm FOSITEK – Hà Nam',
      code: 'WH-FST-HN',
      type: 'warehouse'
    });
    const zoneA = await WarehouseNode.create({
      name: 'Khu A – Trục xoay',
      code: 'ZONE-A',
      type: 'zone',
      parentId: wh._id
    });
    const zoneB = await WarehouseNode.create({
      name: 'Khu B – Thanh trượt',
      code: 'ZONE-B',
      type: 'zone',
      parentId: wh._id
    });
    const zoneC = await WarehouseNode.create({
      name: 'Khu C – MIM',
      code: 'ZONE-C',
      type: 'zone',
      parentId: wh._id
    });

    // Khu A – Trục xoay (3 vị trí bin)
    const binA101 = await WarehouseNode.create({ name: 'Kệ A1, Hàng 1', code: 'VT-A1-01', type: 'bin', parentId: zoneA._id });
    const binA102 = await WarehouseNode.create({ name: 'Kệ A1, Hàng 2', code: 'VT-A1-02', type: 'bin', parentId: zoneA._id });
    const binA201 = await WarehouseNode.create({ name: 'Kệ A2, Hàng 1', code: 'VT-A2-01', type: 'bin', parentId: zoneA._id });

    // Khu B – Thanh trượt (3 vị trí bin)
    const binB101 = await WarehouseNode.create({ name: 'Kệ B1, Hàng 1', code: 'VT-B1-01', type: 'bin', parentId: zoneB._id });
    const binB102 = await WarehouseNode.create({ name: 'Kệ B1, Hàng 2', code: 'VT-B1-02', type: 'bin', parentId: zoneB._id });
    const binB201 = await WarehouseNode.create({ name: 'Kệ B2, Hàng 1', code: 'VT-B2-01', type: 'bin', parentId: zoneB._id });

    // Khu C – MIM (2 vị trí bin)
    const binC101 = await WarehouseNode.create({ name: 'Kệ C1, Hàng 1', code: 'VT-C1-01', type: 'bin', parentId: zoneC._id });
    const binC102 = await WarehouseNode.create({ name: 'Kệ C1, Hàng 2', code: 'VT-C1-02', type: 'bin', parentId: zoneC._id });

    console.log('✓ Seeded Warehouse: WH-FST-HN → Khu A/B/C → 8 vị trí bin');

    // ── 5. INVENTORY ────────────────────────────────────────────
    await Inventory.create({ productId: p1._id, warehouseNodeId: binA101._id, quantity: 97 });
    await Inventory.create({ productId: p1._id, warehouseNodeId: binA102._id, quantity: 200 });
    await Inventory.create({ productId: p2._id, warehouseNodeId: binA201._id, quantity: 200 });
    await Inventory.create({ productId: p3._id, warehouseNodeId: binB101._id, quantity: 300 });
    await Inventory.create({ productId: p3._id, warehouseNodeId: binB102._id, quantity: 400 });
    await Inventory.create({ productId: p4._id, warehouseNodeId: binB201._id, quantity: 200 });
    await Inventory.create({ productId: p5._id, warehouseNodeId: binC101._id, quantity: 7 });
    await Inventory.create({ productId: p6._id, warehouseNodeId: binC102._id, quantity: 5 });

    console.log('✓ Seeded Inventory:');
    console.log('  FST-H360-14  : 97 (VT-A1-01) + 200 (VT-A1-02) = 297 cái');
    console.log('  FST-H180-156 : 200 (VT-A2-01) cái');
    console.log('  FST-SLK-380  : 300 (VT-B1-01) + 400 (VT-B1-02) = 700 bộ');
    console.log('  FST-SL2IN1-135: 200 (VT-B2-01) bộ');
    console.log('  FST-MIM-HB14 : 7 (VT-C1-01) cái');
    console.log('  FST-MIM-CB01 : 5 (VT-C1-02) cái');

    // ── 6. RECEIPTS (5 phiếu mẫu) ───────────────────────────────
    // PNK-0001: Lô trục xoay tháng 1 – Đã hoàn thành
    const rc1 = await Receipt.create({
      code: 'RC-2026-00001',
      ghiChu: 'Lô nhập tháng 1/2026 – Trục xoay 360° và 180°',
      totalAmount: (500 * 18000) + (300 * 13500),
      createdByUserId: staff1._id,
      status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc1._id, productId: p1._id, quantity: 500, price: 18000, warehouseNodeId: binA101._id });
    await ReceiptItem.create({ receiptId: rc1._id, productId: p2._id, quantity: 300, price: 13500, warehouseNodeId: binA201._id });

    // PNK-0002: Lô thanh trượt tháng 2 – Đã hoàn thành
    const rc2 = await Receipt.create({
      code: 'RC-2026-00002',
      ghiChu: 'Lô nhập tháng 2/2026 – Thanh ray và cơ cấu trượt',
      totalAmount: (700 * 28000) + (200 * 58000),
      createdByUserId: staff1._id,
      status: 'completed'
    });
    await ReceiptItem.create({ receiptId: rc2._id, productId: p3._id, quantity: 700, price: 28000, warehouseNodeId: binB101._id });
    await ReceiptItem.create({ receiptId: rc2._id, productId: p4._id, quantity: 200, price: 58000, warehouseNodeId: binB201._id });

    // PNK-0003: Lô MIM tháng 3 – Đã duyệt (chờ hoàn thành)
    const rc3 = await Receipt.create({
      code: 'RC-2026-00003',
      ghiChu: 'Lô nhập tháng 3/2026 – Linh kiện MIM (HB14 + CB01)',
      totalAmount: (10 * 105000) + (5 * 88000),
      createdByUserId: staff2._id,
      status: 'approved'
    });
    await ReceiptItem.create({ receiptId: rc3._id, productId: p5._id, quantity: 10, price: 105000, warehouseNodeId: binC101._id });
    await ReceiptItem.create({ receiptId: rc3._id, productId: p6._id, quantity: 5, price: 88000, warehouseNodeId: binC102._id });

    // PNK-0004: Lô bổ sung tháng 5 – Nháp (chờ duyệt)
    const rc4 = await Receipt.create({
      code: 'RC-2026-00004',
      ghiChu: 'Lô bổ sung tháng 5/2026 – Bù trục xoay và thanh ray',
      totalAmount: (200 * 18000) + (300 * 28000),
      createdByUserId: staff1._id,
      status: 'draft'
    });
    await ReceiptItem.create({ receiptId: rc4._id, productId: p1._id, quantity: 200, price: 18000, warehouseNodeId: binA102._id });
    await ReceiptItem.create({ receiptId: rc4._id, productId: p3._id, quantity: 300, price: 28000, warehouseNodeId: binB102._id });

    // PNK-0005: Lô bị từ chối tháng 4
    const rc5 = await Receipt.create({
      code: 'RC-2026-00005',
      ghiChu: 'Lô nhập tháng 4/2026 – Bị từ chối do QC không đạt',
      totalAmount: (150 * 13500),
      createdByUserId: staff2._id,
      status: 'rejected'
    });
    await ReceiptItem.create({ receiptId: rc5._id, productId: p2._id, quantity: 150, price: 13500, warehouseNodeId: binA201._id });

    console.log('✓ Seeded Receipts (5): completed×2, approved×1, draft×1, rejected×1');

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  FOSITEK Seed hoàn tất! Đăng nhập:');
    console.log('  admin@fositek.vn     / admin123');
    console.log('  hoang.vu@fositek.vn  / quanly123');
    console.log('  lananh.tran@fositek.vn / ketoan123');
    console.log('══════════════════════════════════════════════════════════\n');

    await sequelize.close();
  } catch (error) {
    console.error('Lỗi trong quá trình seed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seed();
