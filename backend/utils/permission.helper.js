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
  { code: 'receipt:read',              name: 'Xem phiếu nhập',                   group: 'Vận hành Nhập & Xuất' },
  { code: 'receipt:create',            name: 'Tạo phiếu nhập',                   group: 'Vận hành Nhập & Xuất' },
  { code: 'receipt:update',            name: 'Sửa phiếu nhập',                   group: 'Vận hành Nhập & Xuất' },
  { code: 'receipt:approve',           name: 'Duyệt phiếu nhập',                 group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery-request:read',     name: 'Xem yêu cầu xuất kho',             group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery-request:create',   name: 'Tạo yêu cầu xuất kho (Sale)',      group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:read',             name: 'Xem phiếu xuất',                   group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:create',           name: 'Tạo phiếu xuất',                   group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:update',           name: 'Sửa phiếu xuất',                   group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:approve',          name: 'Duyệt phiếu xuất',                 group: 'Vận hành Nhập & Xuất' },
  { code: 'delivery:ship',             name: 'Xác nhận xuất hàng (Nhân viên kho)', group: 'Vận hành Nhập & Xuất' },

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
  { code: 'emaillog:read',      name: 'Xem nhật ký email',               group: 'Báo cáo & Hệ thống' },
];

// ——— Quyền mặc định của từng vai trò (VaiTro_Quyen) ———
// Admin = null → bypass toàn bộ kiểm tra quyền (Quản trị viên hệ thống — superadmin)
// QuanLyKho   → Quản lý kho (phê duyệt được, chỉ kho được phân công)
// KeToanKho   → Kế toán kho (lập phiếu, không phê duyệt; chỉ kho được phân công)
// NhanVienKho → Nhân viên kho (thao tác cơ bản; chỉ kho được phân công)
export const ROLE_DEFAULTS = {
  Admin: null,

  // QuanLyKho: phê duyệt tất cả phiếu, quản lý sản phẩm + kho (không lập phiếu, không quản lý đối tác)
  QuanLyKho: [
    // Sản phẩm & Danh mục (quản lý đầy đủ)
    'product:read', 'product:create', 'product:update', 'product:delete',
    'category:read', 'category:create', 'category:update', 'category:delete',
    // Cấu trúc kho (quản lý đầy đủ — không có partner vì Admin quản lý)
    'warehouse:read', 'warehouse:create', 'warehouse:update', 'warehouse:delete',
    // Nhập kho (xem + phê duyệt; KeToanKho mới lập phiếu)
    'receipt:read', 'receipt:update', 'receipt:approve',
    // Yêu cầu xuất kho (xem tất cả yêu cầu từ Sale)
    'delivery-request:read',
    // Phiếu xuất kho (xem + phê duyệt; KeToanKho mới lập phiếu)
    'delivery:read', 'delivery:update', 'delivery:approve', 'delivery:ship',
    // Kiểm kê & Điều chỉnh (xem + phê duyệt)
    'stocktake:read', 'stocktake:approve',
    'adjustment:read', 'adjustment:approve',
    // Sự cố (xem + xử lý)
    'incident:read', 'incident:create',
    // Báo cáo tồn kho
    'inventory:read',
    // audit:read và user:manage chỉ dành cho Admin — không gán cho vai trò khác
  ],

  // KeToanKho: lập phiếu nhập/xuất/kiểm kê/điều chỉnh — không phê duyệt, không quản lý đối tác
  KeToanKho: [
    // Sản phẩm & Danh mục (chỉ xem)
    'product:read',
    'category:read',
    // Cấu trúc kho (chỉ xem)
    'warehouse:read',
    // Nhập kho (lập + sửa, không phê duyệt — QuanLyKho phê duyệt)
    'receipt:read', 'receipt:create', 'receipt:update',
    // Yêu cầu xuất kho (xem yêu cầu từ Sale)
    'delivery-request:read',
    // Phiếu xuất kho (lập + sửa + gửi phê duyệt, không phê duyệt — QuanLyKho phê duyệt)
    'delivery:read', 'delivery:create', 'delivery:update',
    // Kiểm kê (lập + đối chiếu, không phê duyệt)
    'stocktake:read', 'stocktake:create',
    // Điều chỉnh tồn kho (lập sau kiểm kê, không phê duyệt)
    'adjustment:read', 'adjustment:create',
    // Sự cố (xem)
    'incident:read',
    // Báo cáo tồn kho
    'inventory:read',
  ],

  // NhanVienKho: thực hiện vật lý nhập/xuất, đếm kiểm kê, báo sự cố khi nhận hàng
  NhanVienKho: [
    // Xem cơ bản
    'product:read',
    'category:read',
    'warehouse:read',
    // Nhập kho (chỉ xem — KeToanKho lập phiếu, NhanVienKho thực hiện nhận hàng vật lý)
    'receipt:read',
    // Yêu cầu xuất kho (xem)
    'delivery-request:read',
    // Phiếu xuất kho: xem + xác nhận xuất hàng vật lý + hoàn tất (theo swimlane)
    'delivery:read', 'delivery:ship',
    // Kiểm kê (chỉ xem — thực hiện đếm theo phiếu đã được tạo)
    'stocktake:read',
    // Sự cố (lập khi phát hiện thiếu/hỏng lúc nhận hàng)
    'incident:read', 'incident:create',
    // Tồn kho
    'inventory:read',
  ],

  // QC: kiểm tra chất lượng hàng nhận, báo sự cố chất lượng/thiếu hụt khi nhập kho
  QC: [
    // Xem cơ bản
    'product:read',
    'category:read',
    'warehouse:read',
    // Nhập kho (chỉ xem — để kiểm tra đối chiếu khi nhận hàng)
    'receipt:read',
    // Phiếu xuất kho (chỉ xem)
    'delivery:read',
    // Kiểm kê (chỉ xem)
    'stocktake:read',
    // Sự cố (chính yếu — lập báo cáo khi hàng nhập không đạt chất lượng hoặc thiếu hụt)
    'incident:read', 'incident:create',
    // Tồn kho
    'inventory:read',
  ],

  // VT006 — Sale: TẠO yêu cầu xuất kho — KHÔNG truy cập phiếu xuất kho
  Sale: [
    'product:read',
    'category:read',
    'warehouse:read',
    'inventory:read',
    'delivery-request:read',
    'delivery-request:create',
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

    // Đồng bộ quyền mặc định theo vai trò: xóa bản cũ rồi tạo lại
    // (dùng destroy + bulkCreate để đảm bảo luôn khớp với ROLE_DEFAULTS hiện tại)
    for (const [roleCode, permCodes] of Object.entries(ROLE_DEFAULTS)) {
      if (!permCodes) continue; // Admin = null, bỏ qua
      // Xóa toàn bộ quyền cũ của vai trò này
      await RolePermission.destroy({ where: { roleCode } });
      // Tạo lại theo danh sách mới
      for (const code of permCodes) {
        await RolePermission.create({ roleCode, permissionCode: code });
      }
    }

    console.log('Permission catalog and role defaults seeded successfully.');
  } catch (err) {
    console.error('Seed permissions error:', err.message);
  }
};
