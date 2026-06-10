import { RolePermission } from '../models/rolePermission.model.js';
import { UserPermission } from '../models/userPermission.model.js';
import { Permission } from '../models/permission.model.js';

// ——— Danh mục quyền hạn (nguồn dữ liệu chính xác — tương đương config/permissions.php) ———
export const PERMISSION_CATALOG = [
  // Sản phẩm & Danh mục
  { code: 'product:read',       name: 'Xem sản phẩm',                    group: 'Sản phẩm & Danh mục' },
  { code: 'product:create',     name: 'Thêm sản phẩm',                   group: 'Sản phẩm & Danh mục' },
  { code: 'product:update',     name: 'Sửa sản phẩm',                    group: 'Sản phẩm & Danh mục' },
  { code: 'product:delete',     name: 'Xóa sản phẩm',                    group: 'Sản phẩm & Danh mục' },
  { code: 'category:read',      name: 'Xem danh mục',                    group: 'Sản phẩm & Danh mục' },
  { code: 'category:create',    name: 'Thêm danh mục',                   group: 'Sản phẩm & Danh mục' },
  { code: 'category:update',    name: 'Sửa danh mục',                    group: 'Sản phẩm & Danh mục' },
  { code: 'category:delete',    name: 'Xóa danh mục',                    group: 'Sản phẩm & Danh mục' },

  // Cấu trúc Kho & Đối tác
  { code: 'warehouse:read',     name: 'Xem sơ đồ kho',                   group: 'Cấu trúc Kho & Đối tác' },
  { code: 'warehouse:create',   name: 'Tạo vị trí kho',                  group: 'Cấu trúc Kho & Đối tác' },
  { code: 'warehouse:update',   name: 'Sửa vị trí kho',                  group: 'Cấu trúc Kho & Đối tác' },
  { code: 'warehouse:delete',   name: 'Xóa vị trí kho',                  group: 'Cấu trúc Kho & Đối tác' },
  { code: 'partner:read',       name: 'Xem đối tác',                     group: 'Cấu trúc Kho & Đối tác' },
  { code: 'partner:create',     name: 'Thêm đối tác',                    group: 'Cấu trúc Kho & Đối tác' },
  { code: 'partner:update',     name: 'Sửa đối tác',                     group: 'Cấu trúc Kho & Đối tác' },
  { code: 'partner:delete',     name: 'Xóa đối tác',                     group: 'Cấu trúc Kho & Đối tác' },

  // Vận hành Nhập & Xuất
  { code: 'receipt:read',       name: 'Xem phiếu nhập',                  group: 'Vận hành Nhập & Xuất' },
  { code: 'receipt:create',     name: 'Tạo phiếu nhập',                  group: 'Vận hành Nhập & Xuất' },
  { code: 'receipt:update',     name: 'Sửa phiếu nhập',                  group: 'Vận hành Nhập & Xuất' },
  { code: 'receipt:approve',    name: 'Duyệt phiếu nhập',                group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:read',      name: 'Xem phiếu xuất',                  group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:create',    name: 'Tạo phiếu xuất',                  group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:update',    name: 'Sửa phiếu xuất',                  group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:approve',   name: 'Duyệt phiếu xuất',                group: 'Vận hành Nhập & Xuất' },

  // Kiểm kê & Điều chỉnh
  { code: 'stocktake:read',     name: 'Xem phiếu kiểm kê',               group: 'Kiểm kê & Điều chỉnh' },
  { code: 'stocktake:create',   name: 'Tạo / Sửa phiếu kiểm kê',        group: 'Kiểm kê & Điều chỉnh' },
  { code: 'stocktake:approve',  name: 'Phê duyệt phiếu kiểm kê',        group: 'Kiểm kê & Điều chỉnh' },
  { code: 'adjustment:read',    name: 'Xem phiếu điều chỉnh',            group: 'Kiểm kê & Điều chỉnh' },
  { code: 'adjustment:create',  name: 'Tạo phiếu điều chỉnh',            group: 'Kiểm kê & Điều chỉnh' },
  { code: 'adjustment:approve', name: 'Duyệt phiếu điều chỉnh',          group: 'Kiểm kê & Điều chỉnh' },
  { code: 'incident:read',      name: 'Xem báo cáo sự cố',               group: 'Kiểm kê & Điều chỉnh' },
  { code: 'incident:create',    name: 'Tạo / Sửa báo cáo sự cố',        group: 'Kiểm kê & Điều chỉnh' },

  // Báo cáo & Hệ thống
  { code: 'inventory:read',     name: 'Xem tồn kho thực tế',             group: 'Báo cáo & Hệ thống' },
  { code: 'user:manage',        name: 'Quản lý tài khoản & Phân quyền',  group: 'Báo cáo & Hệ thống' },
  { code: 'audit:read',         name: 'Xem nhật ký hoạt động',           group: 'Báo cáo & Hệ thống' },
];

// ——— Quyền mặc định của từng vai trò (VaiTro_Quyen) ———
// Admin = null → bypass toàn bộ kiểm tra quyền (Quản trị viên hệ thống — superadmin)
// QuanLyKho   → Quản lý kho (phê duyệt được, chỉ kho được phân công)
// KeToanKho   → Kế toán kho (lập phiếu, không phê duyệt; chỉ kho được phân công)
// NhanVienKho → Nhân viên kho (thao tác cơ bản; chỉ kho được phân công)
export const ROLE_DEFAULTS = {
  Admin: null,

  QuanLyKho: [
    // Sản phẩm & Danh mục
    'product:read', 'product:create', 'product:update', 'product:delete',
    'category:read', 'category:create', 'category:update', 'category:delete',
    // Kho & Đối tác
    'warehouse:read', 'warehouse:create', 'warehouse:update', 'warehouse:delete',
    'partner:read', 'partner:create', 'partner:update', 'partner:delete',
    // Nhập kho
    'receipt:read', 'receipt:create', 'receipt:update', 'receipt:approve',
    // Xuất kho
    'delivery:read', 'delivery:create', 'delivery:update', 'delivery:approve',
    // Kiểm kê & Điều chỉnh
    'stocktake:read', 'stocktake:create', 'stocktake:approve',
    'adjustment:read', 'adjustment:create', 'adjustment:approve',
    // Sự cố
    'incident:read', 'incident:create',
    // Báo cáo
    'inventory:read',
    // audit:read và user:manage chỉ dành cho Admin — không gán cho vai trò khác
  ],

  KeToanKho: [
    // Sản phẩm & Danh mục (xem)
    'product:read',
    'category:read',
    // Kho & Đối tác
    'warehouse:read',
    'partner:read', 'partner:create', 'partner:update',
    // Nhập kho (lập + sửa, không phê duyệt)
    'receipt:read', 'receipt:create', 'receipt:update',
    // Xuất kho (lập + sửa, không phê duyệt)
    'delivery:read', 'delivery:create', 'delivery:update',
    // Kiểm kê & Điều chỉnh (lập, không phê duyệt)
    'stocktake:read', 'stocktake:create',
    'adjustment:read', 'adjustment:create',
    // Sự cố
    'incident:read', 'incident:create',
    // Báo cáo
    'inventory:read',
  ],

  NhanVienKho: [
    // Xem cơ bản
    'product:read',
    'category:read',
    'warehouse:read',
    // Nhập/xuất (chỉ lập)
    'receipt:read', 'receipt:create',
    'delivery:read', 'delivery:create',
    // Kiểm kê (chỉ xem)
    'stocktake:read',
    // Sự cố
    'incident:read', 'incident:create',
    // Tồn kho
    'inventory:read',
  ],

  // VT005 — QC (Kiểm tra chất lượng): chỉ xem tồn kho và báo cáo sự cố
  QC: [
    'product:read',
    'category:read',
    'warehouse:read',
    'inventory:read',
    'incident:read', 'incident:create',
  ],

  // VT006 — Sale (Kinh doanh): tạo yêu cầu xuất kho + xem tồn kho
  Sale: [
    'product:read',
    'category:read',
    'warehouse:read',
    'inventory:read',
    'delivery:read', 'delivery:create',
    'incident:read',
  ],
};

/**
 * Tính toán quyền hiệu lực của một người dùng tại runtime.
 * Ưu tiên: NguoiDung_Quyen (ghi đè cá nhân) > VaiTro_Quyen (mặc định vai trò).
 *
 * @returns {string[]|null} Mảng mã quyền hiệu lực. null nếu vai trò là Admin (toàn quyền).
 */
export const getEffectivePermissions = async (userId, userRole) => {
  if (userRole === 'Admin') return null; // Admin bypass — null = toàn quyền

  // Lấy quyền mặc định của vai trò từ DB
  const rolePerms = await RolePermission.findAll({ where: { roleCode: userRole } });
  const basePerms = new Set(rolePerms.map(rp => rp.permissionCode));

  // Lấy ghi đè cá nhân từ DB và áp dụng
  const overrides = await UserPermission.findAll({ where: { userId } });
  for (const o of overrides) {
    if (o.type === 'grant') basePerms.add(o.permissionCode);
    else if (o.type === 'revoke') basePerms.delete(o.permissionCode);
  }

  return Array.from(basePerms);
};

/**
 * Seeder — chạy 1 lần khi khởi động server.
 * Đảm bảo bảng Permission và RolePermission luôn có dữ liệu cơ sở.
 */
export const seedPermissionsAndRoleDefaults = async () => {
  try {
    // Seed danh mục quyền
    for (const perm of PERMISSION_CATALOG) {
      await Permission.findOrCreate({
        where: { code: perm.code },
        defaults: { code: perm.code, name: perm.name, group: perm.group }
      });
    }

    // Seed quyền mặc định theo vai trò
    for (const [roleCode, permCodes] of Object.entries(ROLE_DEFAULTS)) {
      if (!permCodes) continue; // Admin = null, bỏ qua
      for (const code of permCodes) {
        await RolePermission.findOrCreate({
          where: { roleCode, permissionCode: code },
          defaults: { roleCode, permissionCode: code }
        });
      }
    }

    console.log('Permission catalog and role defaults seeded successfully.');
  } catch (err) {
    console.error('Seed permissions error:', err.message);
  }
};
