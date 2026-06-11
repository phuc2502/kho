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

  console.log('Migrations completed.');
};
