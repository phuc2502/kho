import React, { useState, useEffect } from 'react';
import { AuditLogModel } from '../models/auditLog.model.js';
import toast from 'react-hot-toast';
import { History, Search, Info, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const limit = itemsPerPage;
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await AuditLogModel.getAll();
      // AuditLog controller returns { data, total }
      setLogs(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error('Lỗi khi tải nhật ký hoạt động: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const toggleExpandLog = (id) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('create') || action.includes('add')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('delete') || action.includes('remove') || action.includes('reject')) return 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('approve') || action.includes('complete')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatActionText = (action) => {
    const actionsMap = {
      'auth.login': 'Đăng nhập hệ thống',
      'auth.register': 'Đăng ký tài khoản',
      'product.create': 'Tạo sản phẩm mới',
      'product.update': 'Cập nhật sản phẩm',
      'product.delete': 'Xóa sản phẩm',
      'category.create': 'Tạo danh mục mới',
      'category.update': 'Cập nhật danh mục',
      'category.delete': 'Xóa danh mục',
      'warehouse.create': 'Thiết lập nút kho',
      'warehouse.update': 'Cập nhật nút kho',
      'warehouse.delete': 'Xóa nút kho',
      'partner.create': 'Thêm đối tác mới',
      'partner.update': 'Cập nhật đối tác',
      'partner.delete': 'Xóa đối tác',
      'receipt.create': 'Lập phiếu nhập kho',
      'receipt.update': 'Cập nhật phiếu nhập',
      'receipt.approve': 'Phê duyệt phiếu nhập',
      'receipt.complete': 'Hoàn tất nhập kho',
      'delivery.create': 'Lập phiếu xuất kho',
      'delivery.update': 'Cập nhật phiếu xuất',
      'delivery.approve': 'Phê duyệt phiếu xuất',
      'delivery.complete': 'Hoàn tất xuất kho',
      'stocktake.create': 'Lập phiếu kiểm kê',
      'stocktake.update': 'Cập nhật kiểm kê',
      'stocktake.delete': 'Xóa phiếu kiểm kê',
      'adjustment.create': 'Tạo phiếu điều chỉnh',
      'adjustment.approve': 'Duyệt điều chỉnh tồn',
      'adjustment.delete': 'Xóa phiếu điều chỉnh',
      'incident.create': 'Báo cáo sự cố',
      'incident.update': 'Cập nhật sự cố',
      'incident.delete': 'Xóa sự cố'
    };
    return actionsMap[action] || action;
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.username && log.username.toLowerCase().includes(searchString)) ||
      (log.action && log.action.toLowerCase().includes(searchString)) ||
      (log.entity && log.entity.toLowerCase().includes(searchString));
    
    const matchesAction = filterAction ? log.action.startsWith(filterAction) : true;
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5.5 h-5.5 text-indigo-650" />
            Nhật ký Hoạt động Hệ thống (Audit Log)
          </h2>
          <p className="text-sm text-slate-500">Xem lại toàn bộ lịch sử thao tác dữ liệu của các tài khoản trên hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tìm kiếm</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tài khoản, bảng, hành động..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lọc nhóm hoạt động</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả hoạt động</option>
            <option value="auth">Đăng nhập / Đăng ký (Auth)</option>
            <option value="product">Sản phẩm (Product)</option>
            <option value="partner">Đối tác (Partner)</option>
            <option value="receipt">Phiếu Nhập (Receipt)</option>
            <option value="delivery">Phiếu Xuất (Delivery)</option>
            <option value="stocktake">Kiểm kê (Stocktake)</option>
            <option value="adjustment">Điều chỉnh (Adjustment)</option>
            <option value="incident">Sự cố (Incident)</option>
          </select>
        </div>
      </div>

      {/* Table & Stream View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải nhật ký hệ thống...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy dữ liệu hoạt động nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-6 py-4 w-10"></th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Tài khoản</th>
                  <th className="px-6 py-4">Hành động</th>
                  <th className="px-6 py-4">Bảng / ID</th>
                  <th className="px-6 py-4 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-50/50 cursor-pointer" onClick={() => toggleExpandLog(log._id)}>
                        <td className="px-6 py-4 text-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          <div>
                            <p>{log.username || 'System'}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">{log.user?.role || 'Hệ thống'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getActionBadgeColor(log.action)}`}>
                            {formatActionText(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-650">
                          {log.entity ? (
                            <span>
                              {log.entity} <strong className="text-slate-900">#{log.entityId}</strong>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandLog(log._id);
                            }}
                            className="text-xs text-primary-500 hover:text-primary-600 font-bold"
                          >
                            {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan="6" className="px-8 py-4 border-t border-b border-slate-200">
                            <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner max-w-4xl">
                              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-400">
                                <Terminal className="w-4 h-4 text-emerald-500" />
                                <span>Action Details: {log.action}</span>
                              </div>
                              <pre>{JSON.stringify(log.payload, null, 2) || '{}'}</pre>
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

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <span>Trang <strong>{currentPage}</strong> trên <strong>{totalPages}</strong> (Tổng {total} dòng ghi chép)</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              Trước
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
