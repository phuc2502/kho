import { sequelize, connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { Partner } from '../models/partner.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { Inventory } from '../models/inventory.model.js';

const seed = async () => {
  try {
    await connectDB();
    console.log('Syncing database (force: true) for seeding...');
    await sequelize.sync({ force: true });
    console.log('Database synced. Cleared existing tables.');

    // 1. Seed Users
    const admin = await User.create({
      username: 'admin',
      email: 'admin@wms.local',
      password: 'admin_password_123',
      role: 'Admin',
      permissions: ['user:manage']
    });

    const managerPermissions = [
      'product:read', 'product:create', 'product:update',
      'category:read', 'category:create', 'category:update',
      'warehouse:read', 'warehouse:create', 'warehouse:update',
      'partner:read', 'partner:create', 'partner:update',
      'receipt:read', 'receipt:create', 'receipt:approve',
      'delivery:read', 'delivery:create', 'delivery:approve',
      'inventory:read'
    ];
    const manager = await User.create({
      username: 'manager',
      email: 'manager@wms.local',
      password: 'manager_password_123',
      role: 'Manager',
      permissions: managerPermissions
    });

    const staffPermissions = [
      'product:read',
      'category:read',
      'warehouse:read',
      'partner:read',
      'receipt:read', 'receipt:create',
      'delivery:read', 'delivery:create',
      'inventory:read'
    ];
    const staff = await User.create({
      username: 'staff',
      email: 'staff@wms.local',
      password: 'staff_password_123',
      role: 'Staff',
      permissions: staffPermissions
    });

    console.log('Seeded Users:');
    console.log(`- Admin: admin@wms.local / admin_password_123`);
    console.log(`- Manager: manager@wms.local / manager_password_123`);
    console.log(`- Staff: staff@wms.local / staff_password_123`);

    // 2. Seed Categories
    const electronics = await Category.create({ name: 'Điện tử', description: 'Thiết bị điện tử gia dụng và linh kiện' });
    const clothes = await Category.create({ name: 'Thời trang', description: 'Quần áo thời trang nam nữ' });
    const foods = await Category.create({ name: 'Thực phẩm', description: 'Đồ khô, nước giải khát đóng chai' });

    console.log('Seeded Categories.');

    // 3. Seed Products
    const phone = await Product.create({
      sku: 'PHONE12',
      name: 'Điện thoại iPhone 12',
      description: 'Phiên bản 64GB màu xanh đen',
      priceIn: 10000000,
      priceOut: 12500000,
      unit: 'Cái',
      categoryId: electronics._id
    });

    const shirt = await Product.create({
      sku: 'SHIRTM',
      name: 'Áo sơ mi nam size M',
      description: 'Áo sơ mi trắng công sở chất liệu cotton',
      priceIn: 150000,
      priceOut: 250000,
      unit: 'Cái',
      categoryId: clothes._id
    });

    const milk = await Product.create({
      sku: 'MILKBOX',
      name: 'Sữa tươi tiệt trùng Vinamilk',
      description: 'Thùng 48 hộp 180ml ít đường',
      priceIn: 300000,
      priceOut: 350000,
      unit: 'Thùng',
      categoryId: foods._id
    });

    console.log('Seeded Products.');

    // 4. Seed Partners
    const partnerSupplier = await Partner.create({
      name: 'Công ty TNHH Nhập khẩu Tân Bình',
      type: 'supplier',
      email: 'info@tanbinh.com',
      phone: '0987654321',
      address: '123 Cộng Hòa, Tân Bình, TP.HCM'
    });

    const partnerCustomer = await Partner.create({
      name: 'Cửa hàng Bán lẻ Gia Hưng',
      type: 'customer',
      email: 'giahung@gmail.com',
      phone: '0123456789',
      address: '456 Lê Lợi, Quận 1, TP.HCM'
    });

    console.log('Seeded Partners.');

    // 5. Seed Warehouse Nodes
    const wh = await WarehouseNode.create({ name: 'Kho trung tâm', code: 'WH-MAIN', type: 'warehouse' });
    const zoneA = await WarehouseNode.create({ name: 'Khu A (Điện tử)', code: 'ZONE-A', type: 'zone', parentId: wh._id });
    const aisleA1 = await WarehouseNode.create({ name: 'Dãy A1', code: 'AISLE-A1', type: 'aisle', parentId: zoneA._id });
    const rackA11 = await WarehouseNode.create({ name: 'Kệ A1.1', code: 'RACK-A1-1', type: 'rack', parentId: aisleA1._id });
    const binA111 = await WarehouseNode.create({ name: 'Khay A1.1.1', code: 'BIN-A1-1-1', type: 'bin', parentId: rackA11._id });

    const zoneB = await WarehouseNode.create({ name: 'Khu B (Thực phẩm)', code: 'ZONE-B', type: 'zone', parentId: wh._id });
    const aisleB1 = await WarehouseNode.create({ name: 'Dãy B1', code: 'AISLE-B1', type: 'aisle', parentId: zoneB._id });
    const rackB11 = await WarehouseNode.create({ name: 'Kệ B1.1', code: 'RACK-B1-1', type: 'rack', parentId: aisleB1._id });
    const binB111 = await WarehouseNode.create({ name: 'Khay B1.1.1', code: 'BIN-B1-1-1', type: 'bin', parentId: rackB11._id });

    console.log('Seeded Warehouse Layout Nodes.');

    // 6. Seed Inventory
    await Inventory.create({
      productId: phone._id,
      warehouseNodeId: binA111._id,
      quantity: 50
    });

    await Inventory.create({
      productId: milk._id,
      warehouseNodeId: binB111._id,
      quantity: 100
    });

    console.log('Seeded initial Inventory.');
    console.log('Seeding process completed successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('Error during seeding:', error);
    await sequelize.close();
  }
};

seed();
