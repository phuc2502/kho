import React, { useState, useEffect, useMemo } from 'react';
import { StocktakeMinutesModel } from '../models/stocktakeMinutes.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import {
  Eye, X, CheckCircle2, XCircle, ClipboardList, Search, Calendar,
  AlertCircle, FileText
} from 'lucide-react';

const STATUS_CONFIG = {
  pending_approval: { label: 'Chờ phê duyệt', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  approved:         { label: 'Đã phê duyệt',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected:         { label: 'Từ chối',        color: 'bg-red-100 text-red-700 border-red-200' },
};

const renderStatusBadge = (status) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

export const StocktakeMinutesPage = () => {
  const { hasPermission } = useAuth();
  const [minutes, setMinutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await StocktakeMinutesModel.getAll();
      setMinutes(data);
    } catch (error) {
      toast.error('Lỗi khi tải biên bản kiểm kê: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return minutes.filter(m => {
      const matchQ = !q ||
        m.code?.toLowerCase().includes(q) ||
        m.stocktake?.code?.toLowerCase().includes(q);
      const matchSt = !filterStatus || m.status === filterStatus;
      return matchQ && matchSt;
    });
  }, [minutes, searchQuery, filterStatus]);

  const handleApprove = async (id) => {
    try {
      await StocktakeMinutesModel.approve(id);
      toast.success('Đã phê duyệt biên bản – tự động tạo báo cáo kiểm kê');
      setSelected(null);
      fetchData();
    } catch (error) {
      toast.error('Phê duyệt thất bại: ' + error.message);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) return toast.error('Vui lòng nhập lý do từ chối');
    try {
      await StocktakeMinutesModel.reject(selected._id, rejectNote.trim());
      toast.success('Đã từ chối biên bản kiểm kê');
      setShowRejectModal(false);
      setRejectNote('');
      setSelected(null);
      fetchData();
    } catch (error) {
      toast.error('Từ chối thất bại: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Biên bản Kiểm kê</h2>
          <p className="text-sm text-slate-500">Xem xét và phê duyệt biên bản sau khi nhân viên hoàn tất kiểm đếm</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã biên bản, mã phiếu kiểm kê..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 min-w-[170px]">
            <option value="">Tất cả trạng thái</option>
            <option value="pending_approval">Chờ phê duyệt</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
          {(searchQuery || filterStatus) && (
            <button onClick={() => { setSearchQuery(''); setFilterStatus(''); }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors">
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
            {filtered.length} / {minutes.length} biên bản
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2">Đang tải biên bản kiểm kê...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {minutes.length === 0 ? 'Chưa có biên bản kiểm kê nào' : 'Không tìm thấy biên bản phù hợp'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-5 py-4">Mã biên bản</th>
                  <th className="px-5 py-4">Phiếu kiểm kê</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Có chênh lệch</th>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4">Người tạo</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filtered.map(m => (
                  <tr key={m._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{m.code}</td>
                    <td className="px-5 py-4 font-mono text-primary-600 font-semibold">
                      {m.stocktake?.code || '—'}
                    </td>
                    <td className="px-5 py-4">{renderStatusBadge(m.status)}</td>
                    <td className="px-5 py-4">
                      {m.stocktake?.hasDiff
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200">Có chênh lệch</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200">Khớp</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{m.createdByUser?.username}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{m.createdByUser?.role}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelected(m)}
                        className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  Chi tiết Biên bản Kiểm kê
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{selected.code}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Trạng thái biên bản</p>
                  {renderStatusBadge(selected.status)}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Phiếu kiểm kê</p>
                  <span className="font-mono font-bold text-primary-600">{selected.stocktake?.code}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Kết quả đếm</p>
                  {selected.stocktake?.hasDiff
                    ? <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200">Có chênh lệch</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200">Khớp</span>
                  }
                </div>
              </div>

              {/* Summary */}
              {selected.summary && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Nội dung biên bản</p>
                  <p className="text-sm text-slate-700">{selected.summary}</p>
                </div>
              )}

              {/* Rejection note */}
              {selected.status === 'rejected' && selected.rejectNote && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">Lý do từ chối</p>
                    <p className="text-sm text-red-700">{selected.rejectNote}</p>
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Người lập biên bản</p>
                  <p className="font-bold text-slate-800">{selected.createdByUser?.username}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{selected.createdByUser?.role}</p>
                </div>
                {selected.approvedByUser && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                      {selected.status === 'approved' ? 'Người phê duyệt' : 'Người xử lý'}
                    </p>
                    <p className="font-bold text-slate-800">{selected.approvedByUser?.username}</p>
                    {selected.approvedAt && (
                      <p className="text-[10px] text-slate-400">
                        {new Date(selected.approvedAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Stocktake note */}
              {selected.stocktake?.note && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-slate-700">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Ghi chú phiếu kiểm kê:</strong> {selected.stocktake.note}</span>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap justify-end gap-2 bg-slate-50/50 shrink-0">
              {selected.status === 'pending_approval' && (
                <PermissionGuard permission="stocktake:approve">
                  <>
                    <button
                      onClick={() => { setShowRejectModal(true); }}
                      className="px-4 py-2 border border-red-300 bg-white hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                    <button
                      onClick={() => handleApprove(selected._id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt biên bản
                    </button>
                  </>
                </PermissionGuard>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Từ chối biên bản kiểm kê
            </h4>
            <p className="text-sm text-slate-500">Nhập lý do từ chối biên bản <span className="font-mono font-bold text-slate-700">{selected?.code}</span></p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Nhập lý do từ chối (bắt buộc)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-red-400 resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowRejectModal(false); setRejectNote(''); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold">
                Hủy
              </button>
              <button onClick={handleReject}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/10">
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
