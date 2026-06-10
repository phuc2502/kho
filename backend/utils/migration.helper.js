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
      "DELETE FROM RolePermissions WHERE permissionCode IN ('audit:read','user:manage') AND roleCode != 'Admin'"
    );
    // Xóa cả ghi đè cá nhân (UserPermissions) nếu có grant admin-only cho user không phải Admin
    await sequelize.query(
      "DELETE up FROM UserPermissions up JOIN Users u ON up.userId = u._id WHERE up.permissionCode IN ('audit:read','user:manage') AND u.role != 'Admin'"
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

  console.log('Migrations completed.');
};
