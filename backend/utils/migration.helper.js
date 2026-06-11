import { sequelize } from '../config/db.js';
import { DataTypes } from 'sequelize';

/**
 * Chạy migration an toàn — kiểm tra trước khi thay đổi.
 * Thứ tự: 1) Thêm cột mới, 2) Đổi ENUM vai trò, 3) Cập nhật dữ liệu cũ.
 */
export const runMigrations = async () => {
  const qi = sequelize.getQueryInterface();

  // ——— 1. Thêm cột vô hiệu hóa vào Users (nếu chưa có) ———
  try {
    const tableDesc = await qi.describeTable('Users');

    if (!tableDesc.deactivationReason) {
      await qi.addColumn('Users', 'deactivationReason', {
        type: DataTypes.STRING(500), allowNull: true, after: 'createdBy'
      });
      console.log('Migration: Added Users.deactivationReason');
    }
    if (!tableDesc.deactivatedBy) {
      await qi.addColumn('Users', 'deactivatedBy', {
        type: DataTypes.INTEGER, allowNull: true, after: 'deactivationReason'
      });
      console.log('Migration: Added Users.deactivatedBy');
    }
    if (!tableDesc.deactivatedAt) {
      await qi.addColumn('Users', 'deactivatedAt', {
        type: DataTypes.DATE, allowNull: true, after: 'deactivatedBy'
      });
      console.log('Migration: Added Users.deactivatedAt');
    }
  } catch (err) {
    console.warn('Migration warning (addColumn):', err.message);
  }

  // ——— 2. Đổi ENUM vai trò: Manager→QuanLyKho, Staff→NhanVienKho ———
  // Thứ tự đúng: expand ENUM trước → UPDATE data → shrink ENUM
  try {
    const [[roleRow]] = await sequelize.query(
      "SHOW COLUMNS FROM Users WHERE Field='role'"
    );
    const currentEnum = roleRow?.Type || '';

    if (currentEnum.includes('Manager') || currentEnum.includes('Staff')) {
      // Bước 1: Expand ENUM để bao gồm cả giá trị cũ lẫn mới
      await sequelize.query(
        "ALTER TABLE Users MODIFY COLUMN role ENUM('Admin','Manager','Staff','QuanLyKho','KeToanKho','NhanVienKho') DEFAULT 'NhanVienKho'"
      );

      // Bước 2: Cập nhật dữ liệu cũ sang giá trị mới
      await sequelize.query("UPDATE Users SET role='QuanLyKho' WHERE role='Manager'");
      await sequelize.query("UPDATE Users SET role='NhanVienKho' WHERE role='Staff'");
      // Fix empty roles (nếu có)
      await sequelize.query("UPDATE Users SET role='NhanVienKho' WHERE role='' OR role IS NULL");

      // Bước 3: Shrink ENUM — chỉ còn giá trị mới
      await sequelize.query(
        "ALTER TABLE Users MODIFY COLUMN role ENUM('Admin','QuanLyKho','KeToanKho','NhanVienKho') NOT NULL DEFAULT 'NhanVienKho'"
      );

      // Xóa RolePermissions cũ — seeder sẽ tạo lại với role codes mới
      await sequelize.query("DELETE FROM RolePermissions WHERE roleCode IN ('Manager', 'Staff')");

      console.log('Migration: Updated role ENUM (Manager→QuanLyKho, Staff→NhanVienKho)');
    }
  } catch (err) {
    console.warn('Migration warning (role ENUM):', err.message);
  }

  // ——— 3. Xóa quyền admin-only khỏi các vai trò không phải Admin ———
  // audit:read và user:manage chỉ thuộc về Admin; không được gán cho bất kỳ vai trò nào khác
  try {
    await sequelize.query(
      "DELETE FROM RolePermissions WHERE permissionCode IN ('audit:read','user:manage','emaillog:read') AND roleCode != 'Admin'"
    );
    // Xóa cả ghi đè cá nhân (UserPermissions) nếu có grant admin-only cho user không phải Admin
    await sequelize.query(
      "DELETE up FROM UserPermissions up JOIN Users u ON up.userId = u._id WHERE up.permissionCode IN ('audit:read','user:manage','emaillog:read') AND u.role != 'Admin'"
    );
    console.log('Migration: Removed admin-only permissions from non-Admin roles');
  } catch (err) {
    console.warn('Migration warning (admin-only cleanup):', err.message);
  }

  // ——— 4. Mở rộng ENUM vai trò: thêm QC và Sale ———
  try {
    const [[roleRow3]] = await sequelize.query(
      "SHOW COLUMNS FROM Users WHERE Field='role'"
    );
    const currentEnum3 = roleRow3?.Type || '';

    if (!currentEnum3.includes("'QC'") || !currentEnum3.includes("'Sale'")) {
      await sequelize.query(
        "ALTER TABLE Users MODIFY COLUMN role ENUM('Admin','QuanLyKho','KeToanKho','NhanVienKho','QC','Sale') NOT NULL DEFAULT 'NhanVienKho'"
      );
      console.log('Migration: Added QC and Sale to role ENUM');
    }
  } catch (err) {
    console.warn('Migration warning (QC/Sale ENUM):', err.message);
  }

  // ——— 5. Thêm cột reset password vào Users ———
  try {
    const tableDesc5 = await qi.describeTable('Users');
    if (!tableDesc5.resetPasswordToken) {
      await qi.addColumn('Users', 'resetPasswordToken', {
        type: DataTypes.STRING(255), allowNull: true
      });
      console.log('Migration: Added Users.resetPasswordToken');
    }
    if (!tableDesc5.resetPasswordExpires) {
      await qi.addColumn('Users', 'resetPasswordExpires', {
        type: DataTypes.DATE, allowNull: true
      });
      console.log('Migration: Added Users.resetPasswordExpires');
    }
  } catch (err) {
    console.warn('Migration warning (resetPassword):', err.message);
  }

  // ——— 6. [THÊM MỚI] Tạo bảng EmailLogs nếu chưa có ———
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS EmailLogs (
        _id         INT AUTO_INCREMENT PRIMARY KEY,
        type        ENUM('welcome','adminReset','forgotPassword') NOT NULL
                    COMMENT 'welcome=tạo TK, adminReset=admin đặt lại MK, forgotPassword=quên MK',
        recipient   VARCHAR(255) NOT NULL COMMENT 'Email người nhận',
        subject     VARCHAR(500) NOT NULL COMMENT 'Tiêu đề email',
        status      ENUM('success','failed') NOT NULL DEFAULT 'success' COMMENT 'Kết quả gửi',
        errorMessage TEXT NULL                COMMENT 'Mô tả lỗi khi thất bại',
        userId      INT NULL                  COMMENT 'FK tới Users._id (nullable)',
        sentBy      VARCHAR(255) NULL         COMMENT 'Người trigger: email admin hoặc system',
        createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_logs_status    (status),
        INDEX idx_email_logs_type      (type),
        INDEX idx_email_logs_createdAt (createdAt),
        INDEX idx_email_logs_recipient (recipient)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Migration: EmailLogs table ready');
  } catch (err) {
    console.warn('Migration warning (EmailLogs):', err.message);
  }

  // ——— 7. Đồng bộ quyền QC: xóa set cũ → seeder sẽ re-seed đúng theo ROLE_DEFAULTS ———
  // QC cũ chỉ có 6 quyền; nay phải bằng NhanVienKho (11 quyền) + incident:create
  try {
    const [[{ qcCount }]] = await sequelize.query(
      "SELECT COUNT(*) AS qcCount FROM RolePermissions WHERE roleCode = 'QC'"
    );
    // Xóa nếu thiếu quyền (< 11) — seeder sẽ tạo lại đủ từ ROLE_DEFAULTS
    if (Number(qcCount) < 11) {
      await sequelize.query("DELETE FROM RolePermissions WHERE roleCode = 'QC'");
      console.log('Migration: Cleared old QC role permissions — seeder will re-seed');
    }
    // Bảo đảm các quyền admin-only không bao giờ nằm trong role khác
    await sequelize.query(
      "DELETE FROM RolePermissions WHERE permissionCode IN ('audit:read','user:manage','emaillog:read') AND roleCode != 'Admin'"
    );
  } catch (err) {
    console.warn('Migration warning (QC re-seed):', err.message);
  }

  // ——— 8. Thêm cột passwordResetRequested + mustChangePassword vào Users ———
  try {
    const tableDesc8a = await qi.describeTable('Users');
    if (!tableDesc8a.passwordResetRequested) {
      await qi.addColumn('Users', 'passwordResetRequested', {
        type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, after: 'isActive'
      });
      console.log('Migration: Added Users.passwordResetRequested');
    }
  } catch (err) {
    console.warn('Migration warning (passwordResetRequested):', err.message);
  }

  // ——— (tiếp 8) mustChangePassword ———
  try {
    const tableDesc8 = await qi.describeTable('Users');
    if (!tableDesc8.mustChangePassword) {
      await qi.addColumn('Users', 'mustChangePassword', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        after: 'isActive'
      });
      console.log('Migration: Added Users.mustChangePassword');
    }
  } catch (err) {
    console.warn('Migration warning (mustChangePassword):', err.message);
  }

  // ——— 9. Tạo bảng DeliveryRequests và DeliveryRequestItems ———
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS DeliveryRequests (
        _id          INT AUTO_INCREMENT PRIMARY KEY,
        code         VARCHAR(50) NOT NULL UNIQUE,
        tenKhachHang VARCHAR(200) NOT NULL DEFAULT '',
        status       ENUM('pending','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
        note         TEXT NULL,
        totalAmount  DECIMAL(15,2) NOT NULL DEFAULT 0,
        createdByUser INT NOT NULL,
        createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dr_status (status),
        INDEX idx_dr_createdByUser (createdByUser),
        INDEX idx_dr_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS DeliveryRequestItems (
        _id               INT AUTO_INCREMENT PRIMARY KEY,
        deliveryRequest   INT NOT NULL,
        product           INT NOT NULL,
        quantity          INT NOT NULL,
        priceEstimate     DECIMAL(15,2) NOT NULL DEFAULT 0,
        INDEX idx_dri_request (deliveryRequest),
        INDEX idx_dri_product (product)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Migration: DeliveryRequests & DeliveryRequestItems tables ready');
  } catch (err) {
    console.warn('Migration warning (DeliveryRequests):', err.message);
  }

  // ——— 10. Thêm cột requestId vào Deliveries ———
  try {
    const delivDesc = await qi.describeTable('Deliveries');
    if (!delivDesc.requestId) {
      await qi.addColumn('Deliveries', 'requestId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        after: 'createdByUser'
      });
      console.log('Migration: Added Deliveries.requestId');
    }
  } catch (err) {
    console.warn('Migration warning (Deliveries.requestId):', err.message);
  }

  // ——— 11. Cập nhật quyền Sale: xóa delivery:read/create, thêm delivery-request:read/create ———
  try {
    // Xóa quyền delivery cũ của Sale
    await sequelize.query(
      "DELETE FROM RolePermissions WHERE roleCode = 'Sale' AND permissionCode IN ('delivery:read','delivery:create')"
    );
    console.log('Migration: Removed delivery:read/create from Sale role');
  } catch (err) {
    console.warn('Migration warning (Sale delivery cleanup):', err.message);
  }

  // ——— 12. Seed quyền delivery-request mới vào catalog ———
  // Lưu ý: bảng Permissions có timestamps: false — không có cột createdAt/updatedAt
  try {
    await sequelize.query(`
      INSERT IGNORE INTO Permissions (code, name, \`group\`)
      VALUES
        ('delivery-request:read',   'Xem yêu cầu xuất kho',          'Vận hành Nhập & Xuất'),
        ('delivery-request:create', 'Tạo yêu cầu xuất kho (Sale)',   'Vận hành Nhập & Xuất')
    `);
    console.log('Migration: Seeded delivery-request permissions');
  } catch (err) {
    console.warn('Migration warning (delivery-request permissions):', err.message);
  }

  // ——— 13. Thêm Dãy kệ + Kệ chứa vào cấu trúc kho (nếu chưa có) ———
  // Cấu trúc hiện tại: Kho → Khu vực → Khay (Bin) — bỏ qua 2 cấp giữa.
  // Migration này thêm: Dãy kệ (aisle) và Kệ chứa (rack), rồi gán lại cha cho các Khay.
  try {
    // Tạo Dãy kệ (aisle) cho mỗi Khu vực
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'DA-A', 'Dãy A', 'aisle', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'ZONE-A'
    `);
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'DA-B', 'Dãy B', 'aisle', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'ZONE-B'
    `);
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'DA-C', 'Dãy C', 'aisle', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'ZONE-C'
    `);

    // Tạo Kệ chứa (rack) cho mỗi Dãy kệ
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'KE-A1', 'Kệ A1', 'rack', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'DA-A'
    `);
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'KE-A2', 'Kệ A2', 'rack', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'DA-A'
    `);
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'KE-B1', 'Kệ B1', 'rack', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'DA-B'
    `);
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'KE-B2', 'Kệ B2', 'rack', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'DA-B'
    `);
    await sequelize.query(`
      INSERT IGNORE INTO WarehouseNodes (code, name, type, parent, createdAt, updatedAt)
      SELECT 'KE-C1', 'Kệ C1', 'rack', _id, NOW(), NOW()
      FROM WarehouseNodes WHERE code = 'DA-C'
    `);

    // Gán lại cha cho Khay (Bin) → thuộc về Kệ chứa tương ứng
    await sequelize.query(`
      UPDATE WarehouseNodes t1
      JOIN WarehouseNodes t2 ON t2.code = 'KE-A1'
      SET t1.parent = t2._id, t1.updatedAt = NOW()
      WHERE t1.code IN ('VT-A1-01', 'VT-A1-02')
    `);
    await sequelize.query(`
      UPDATE WarehouseNodes t1
      JOIN WarehouseNodes t2 ON t2.code = 'KE-A2'
      SET t1.parent = t2._id, t1.updatedAt = NOW()
      WHERE t1.code IN ('VT-A2-01')
    `);
    await sequelize.query(`
      UPDATE WarehouseNodes t1
      JOIN WarehouseNodes t2 ON t2.code = 'KE-B1'
      SET t1.parent = t2._id, t1.updatedAt = NOW()
      WHERE t1.code IN ('VT-B1-01', 'VT-B1-02')
    `);
    await sequelize.query(`
      UPDATE WarehouseNodes t1
      JOIN WarehouseNodes t2 ON t2.code = 'KE-B2'
      SET t1.parent = t2._id, t1.updatedAt = NOW()
      WHERE t1.code IN ('VT-B2-01')
    `);
    await sequelize.query(`
      UPDATE WarehouseNodes t1
      JOIN WarehouseNodes t2 ON t2.code = 'KE-C1'
      SET t1.parent = t2._id, t1.updatedAt = NOW()
      WHERE t1.code IN ('VT-C1-01', 'VT-C1-02')
    `);

    console.log('Migration: Warehouse structure expanded with aisle + rack levels');
  } catch (err) {
    console.warn('Migration warning (warehouse structure):', err.message);
  }

  // ——— 14. Tạo / cập nhật bảng SoSerial với cột Han_bao_hanh (v2.0) ———
  // Nếu bảng chưa tồn tại → CREATE TABLE đầy đủ.
  // Nếu bảng đã có nhưng thiếu cột Han_bao_hanh → ALTER TABLE ADD COLUMN.
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS SoSerial (
        _id           INT AUTO_INCREMENT PRIMARY KEY,
        Ma_serial     VARCHAR(100)  NOT NULL UNIQUE        COMMENT 'Mã số serial ghi trên linh kiện',
        Ma_san_pham   INT           NOT NULL               COMMENT 'FK → Products._id',
        Han_bao_hanh  DATETIME      NULL                   COMMENT 'Ngày hết hạn bảo hành',
        Ngay_nhap     DATETIME      NULL                   COMMENT 'Ngày nhập kho',
        So_phieu_nhap VARCHAR(50)   NULL                   COMMENT 'Mã phiếu nhập liên quan',
        createdAt     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ss_product      (Ma_san_pham),
        INDEX idx_ss_han_bao_hanh (Han_bao_hanh)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Bảng số serial linh kiện điện tử (v2.0)'
    `);

    // Bảo đảm cột Han_bao_hanh tồn tại ngay cả khi bảng đã được tạo từ trước
    const ssDesc = await qi.describeTable('SoSerial');
    if (!ssDesc.Han_bao_hanh) {
      await qi.addColumn('SoSerial', 'Han_bao_hanh', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Ngày hết hạn bảo hành'
      });
      console.log('Migration: Added SoSerial.Han_bao_hanh');
    }
    console.log('Migration: SoSerial table with Han_bao_hanh ready (v2.0)');
  } catch (err) {
    console.warn('Migration warning (SoSerial):', err.message);
  }

  // ——— 15. Thêm cột minStock vào Inventories ———
  try {
    const invDesc = await qi.describeTable('Inventories');
    if (!invDesc.minStock) {
      await qi.addColumn('Inventories', 'minStock', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        after: 'quantity'
      });
      console.log('Migration: Added Inventories.minStock');
    }
  } catch (err) {
    console.warn('Migration warning (Inventories.minStock):', err.message);
  }

  console.log('Migrations completed.');
};
