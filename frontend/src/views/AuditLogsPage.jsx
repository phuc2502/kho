import React, { useState, useEffect } from 'react';
import { AuditLogModel } from '../models/auditLog.model.js';
import toast from 'react-hot-toast';
import { History, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Action labels
// ──────────────────────────────────────────────────────────────
const ACTION_MAP = {
  'auth.login':           'Đăng nhập hệ thống',
  'auth.register':        'Đăng ký tài khoản',
  'product.create':       'Tạo sản phẩm mới',
  'product.update':       'Cập nhật sản phẩm',
  'product.delete':       'Xóa sản phẩm',
  'category.create':      'Tạo danh mục mới',
  'category.update':      'Cập nhật danh mục',
  'category.delete':      'Xóa danh mục',
  'warehouse.create':     'Thiết lập vị trí kho',
  'warehouse.update':     'Cập nhật vị trí kho',
  'warehouse.delete':     'Xóa vị trí kho',
  'partner.create':       'Thêm đối tác mới',
  'partner.update':       'Cập nhật đối tác',
  'partner.delete':       'Xóa đối tác',
  'receipt.create':       'Lập phiếu nhập kho',
  'receipt.update':       'Cập nhật phiếu nhập',
  'receipt.approve':      'Phê duyệt phiếu nhập',
  'receipt.complete':     'Hoàn tất nhập kho',
  'receipt.reject':       'Từ chối phiếu nhập',
  'delivery.create':      'Lập phiếu xuất kho',
  'delivery.update':      'Cập nhật phiếu xuất',
  'delivery.approve':     'Phê duyệt phiếu xuất',
  'delivery.shipping':    'Xác nhận xuất hàng',
  'delivery.complete':    'Hoàn tất xuất kho',
  'delivery.reject':      'Từ chối phiếu xuất',
  'stocktake.create':     'Lập phiếu kiểm kê',
  'stocktake.approve':    'Duyệt bắt đầu kiểm kê',
  'stocktake.update':     'Cập nhật số liệu kiểm kê',
  'stocktake.complete':   'Hoàn tất kiểm kê',
  'stocktake.delete':     'Xóa phiếu kiểm kê',
  'adjustment.create':    'Tạo phiếu điều chỉnh tồn',
  'adjustment.approve':   'Duyệt điều chỉnh tồn kho',
  'adjustment.delete':    'Xóa phiếu điều chỉnh',
  'incident.create':      'Báo cáo sự cố',
  'incident.update':      'Cập nhật sự cố',
  'incident.delete':      'Xóa sự cố',
  // ——— Quản lý tài khoản ———
  'user.create':            'Tạo tài khoản mới',
  'user.update':            'Cập nhật tài khoản',
  'user.deactivate':        'Vô hiệu hóa tài khoản',
  'user.reactivate':        'Kích hoạt lại tài khoản',
  'user.updatePermissions': 'Cập nhật phân quyền',
  'user.resetPermissions':  'Reset phân quyền mặc định',
  'user.assignWarehouse':   'Phân công kho',
  'user.removeWarehouse':   'Bỏ phân công kho',
};

const getActionBadgeColor = (action) => {
  if (!action) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (action.includes('.deactivate') || action.includes('.removeWarehouse')) return 'bg-red-50 text-red-700 border-red-200';
  if (action.includes('.reactivate') || action.includes('.assignWarehouse')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (action.includes('.resetPermissions')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (action.includes('.create') || action.includes('.register')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (action.includes('.update') || action.includes('.shipping') || action.includes('.updatePermissions')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (action.includes('.delete') || action.includes('.reject')) return 'bg-red-50 text-red-700 border-red-200';
  if (action.includes('.approve') || action.includes('.complete')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (action.includes('.login')) return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

// ──────────────────────────────────────────────────────────────
// Entity info — loại đối tượng bị tác động
// ──────────────────────────────────────────────────────────────
const ENTITY_MAP = {
  receipt:    { label: 'Phiếu nhập',  color: 'bg-blue-50 text-blue-700' },
  delivery:   { label: 'Phiếu xuất',  color: 'bg-violet-50 text-violet-700' },
  product:    { label: 'Sản phẩm',    color: 'bg-emerald-50 text-emerald-700' },
  category:   { label: 'Danh mục',    color: 'bg-amber-50 text-amber-700' },
  stocktake:  { label: 'Kiểm kê',     color: 'bg-indigo-50 text-indigo-700' },
  adjustment: { label: 'Điều chỉnh',  color: 'bg-rose-50 text-rose-700' },
  incident:   { label: 'Sự cố',       color: 'bg-orange-50 text-orange-700' },
  warehouse:  { label: 'Vị trí kho',  color: 'bg-cyan-50 text-cyan-700' },
  partner:    { label: 'Đối tác',     color: 'bg-slate-100 text-slate-600' },
  user:       { label: 'Tài khoản',   color: 'bg-purple-50 text-purple-700' },
};

// Lấy mã / tên đối tượng để hiển thị thay cho ID số thuần
const getEntityIdentifier = (log) => {
  if (!log.payload) return `#${log.entityId}`;
  // Tài khoản: hiển thị tên đăng nhập thay vì ID
  if (log.entity === 'user') {
    return log.payload.username || log.payload.targetUsername || `#${log.entityId}`;
  }
  const { code, name, sku } = log.payload;
  return code || name || sku || `#${log.entityId}`;
};

// ──────────────────────────────────────────────────────────────
// Chi tiết thao tác — nhãn tiếng Việt cho từng trường payload
// ──────────────────────────────────────────────────────────────
const FIELD_LABELS = {
  code:               'Mã phiếu',
  name:               'Tên',
  sku:                'Mã SKU',
  totalAmount:        'Tổng giá trị',
  itemCount:          'Số dòng hàng',
  status:             'Trạng thái',
  newStatus:          'Trạng thái mới',
  quantity:           'Số lượng',
  note:               'Ghi chú',
  username:           'Tài khoản',
  targetUsername:     'Tài khoản tác động',
  role:               'Vai trò',
  description:        'Mô tả',
  type:               'Loại',
  unit:               'Đơn vị',
  reason:             'Lý do',
  deactivationReason: 'Lý do vô hiệu hóa',
  isActive:           'Trạng thái hoạt động',
  warehouseId:        'Mã kho',
  warehouseName:      'Kho phụ trách',
  grants:             'Quyền được thêm',
  revokes:            'Quyền bị thu hồi',
};

const formatFieldValue = (key, value) => {
  if (value === null || value === undefined) return '—';
  if (
    (key === 'totalAmount' || key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')) &&
    typeof value === 'number'
  ) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
  if (key === 'itemCount') return `${value} dòng`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const ITEMS_PER_PAGE = 25;

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await AuditLogModel.getAll({ limit: ITEMS_PER_PAGE, offset });
      setLogs(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error('Lỗi khi tải nhật ký: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(currentPage); }, [currentPage]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const filteredLogs = logs.filter(log => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !s ||
      log.username?.toLowerCase().includes(s) ||
      log.action?.toLowerCase().includes(s) ||
      log.entity?.toLowerCase().includes(s) ||
      (ACTION_MAP[log.action] || '').toLowerCase().includes(s);
    const matchesAction = !filterAction || log.action?.startsWith(filterAction);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          Nhật ký Hoạt động Hệ thống
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Toàn bộ lịch sử thao tác dữ liệu của người dùng. Tổng: <strong>{total}</strong> bản ghi
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tài khoản, hành động..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả loại hoạt động</option>
            <option value="auth">Đăng nhập / Tài khoản</option>
            <option value="product">Sản phẩm</option>
            <option value="category">Danh mục</option>
            <option value="receipt">Phiếu Nhập kho</option>
            <option value="delivery">Phiếu Xuất kho</option>
            <option value="stocktake">Kiểm kê</option>
            <option value="adjustment">Điều chỉnh tồn kho</option>
            <option value="incident">Sự cố</option>
            <option value="user">Quản lý tài khoản</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2 text-sm">Đang tải nhật ký hệ thống...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy bản ghi nào phù hợp</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Tài khoản</th>
                  <th className="px-4 py-3">Hành động</th>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log._id;
                  const hasPayload = log.payload && Object.keys(log.payload).length > 0;
                  const entityInfo = ENTITY_MAP[log.entity];

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        className={`hover:bg-slate-50/50 ${hasPayload ? 'cursor-pointer' : ''}`}
                        onClick={() => hasPayload && setExpandedLogId(isExpanded ? null : log._id)}
                      >
                        {/* Expand toggle */}
                        <td className="px-4 py-3 text-center">
                          {hasPayload ? (
                            isExpanded
                              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : <span />}
                        </td>

                        {/* Thời gian */}
                        <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>

                        {/* Tài khoản */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{log.username || 'System'}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400">{log.user?.role || '—'}</p>
                        </td>

                        {/* Hành động */}
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getActionBadgeColor(log.action)}`}>
                            {ACTION_MAP[log.action] || log.action}
                          </span>
                        </td>

                        {/* Đối tượng — hiển thị loại + mã/tên thay vì chỉ ID */}
                        <td className="px-4 py-3">
                          {log.entity ? (
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${entityInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                                {entityInfo?.label || log.entity}
                              </span>
                              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                                {getEntityIdentifier(log)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Chi tiết */}
                        <td className="px-4 py-3">
                          {hasPayload ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedLogId(isExpanded ? null : log._id); }}
                              className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                                isExpanded ? 'text-slate-400' : 'text-primary-500 hover:text-primary-600'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded detail row — card layout thay vì terminal */}
                      {isExpanded && hasPayload && (
                        <tr className="bg-primary-50/20">
                          <td colSpan="6" className="px-8 py-5 border-t border-primary-100/60">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Thông tin ghi nhận · {ACTION_MAP[log.action] || log.action}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-w-3xl">
                              {Object.entries(log.payload).map(([key, value]) => (
                                <div key={key} className="bg-white rounded-xl border border-slate-200 px-3 py-2.5 shadow-sm">
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                    {FIELD_LABELS[key] || key}
                                  </p>
                                  <p
                                    className="text-sm font-bold text-slate-800 mt-0.5 truncate"
                                    title={String(value ?? '—')}
                                  >
                                    {formatFieldValue(key, value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <span>Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> · tổng {total} bản ghi</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Trước
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              Sau <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
