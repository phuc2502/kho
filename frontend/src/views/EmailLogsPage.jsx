// [THÊM MỚI] — Trang nhật ký gửi email hệ thống
import React, { useState, useEffect, useCallback } from 'react';
import { Mail, CheckCircle, XCircle, RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { EmailLogModel } from '../models/email-log.model.js';

// ——— Config loại email ———
const TYPE_CONFIG = {
  welcome:         { label: 'Tạo tài khoản', color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  adminReset:      { label: 'Đặt lại MK',    color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500'  },
  forgotPassword:  { label: 'Quên mật khẩu', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

const TYPE_OPTIONS = [
  { value: 'all',           label: 'Tất cả loại' },
  { value: 'welcome',       label: 'Tạo tài khoản' },
  { value: 'adminReset',    label: 'Đặt lại MK' },
  { value: 'forgotPassword',label: 'Quên mật khẩu' },
];

const STATUS_OPTIONS = [
  { value: 'all',     label: 'Tất cả kết quả' },
  { value: 'success', label: 'Thành công' },
  { value: 'failed',  label: 'Thất bại' },
];

// ——— Format thời gian ———
const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ——— Component trang ———
export const EmailLogsPage = () => {
  const [stats,        setStats]        = useState({ success: 0, failed: 0, total: 0 });
  const [logs,         setLogs]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page,         setPage]         = useState(1);
  const [deletingId,   setDeletingId]   = useState(null);
  const LIMIT = 20;

  // ——— Fetch stats ———
  const fetchStats = useCallback(async () => {
    try {
      const data = await EmailLogModel.getStats();
      setStats(data);
    } catch { /* silent */ }
  }, []);

  // ——— Fetch logs ———
  const fetchLogs = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await EmailLogModel.getLogs({ type: typeFilter, status: statusFilter, page: p, limit: LIMIT });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || 'Không thể tải nhật ký email');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchStats();
    fetchLogs(1);
    setPage(1);
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  // ——— Refresh ———
  const handleRefresh = () => {
    fetchStats();
    fetchLogs(page);
  };

  // ——— Xóa email thất bại ———
  const handleDeleteFailed = async () => {
    if (!window.confirm('Xóa tất cả bản ghi email thất bại?')) return;
    const tid = toast.loading('Đang xóa...');
    try {
      const result = await EmailLogModel.deleteFailedLogs();
      toast.dismiss(tid);
      toast.success(result.message);
      fetchStats();
      fetchLogs(1);
      setPage(1);
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.message || 'Không thể xóa');
    }
  };

  // ——— Xóa 1 bản ghi ———
  const handleDeleteOne = async (logId) => {
    setDeletingId(logId);
    try {
      await EmailLogModel.deleteLog(logId);
      toast.success('Đã xóa bản ghi');
      fetchStats();
      fetchLogs(page);
    } catch (err) {
      toast.error(err.message || 'Không thể xóa');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Hệ thống</p>
          <h1 className="text-2xl font-bold text-slate-900">Nhật ký gửi Email</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Lịch sử tạo tài khoản, đặt lại mật khẩu và link khôi phục đã gửi
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Thành công 24h */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">GỬI THÀNH CÔNG (24H)</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-emerald-600">{stats.success}</span>
            <CheckCircle className="w-6 h-6 text-emerald-400 mb-1" />
          </div>
        </div>

        {/* Thất bại 24h */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">GỬI THẤT BẠI (24H)</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-red-500">{stats.failed}</span>
            <XCircle className="w-6 h-6 text-red-400 mb-1" />
          </div>
        </div>

        {/* Tổng tất cả */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">TỔNG BẢN GHI</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-slate-700">{stats.total}</span>
            <Mail className="w-6 h-6 text-slate-400 mb-1" />
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Lịch sử email hệ thống</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông tin tài khoản, link kích hoạt và đặt lại mật khẩu đã gửi
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter loại */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-primary-400"
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {/* Filter kết quả */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-primary-400"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {/* Xóa thất bại */}
            {stats.failed > 0 && (
              <button
                onClick={handleDeleteFailed}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa email thất bại ({stats.failed})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Mail className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Chưa có email nào được ghi nhận</p>
            <p className="text-xs mt-1">Email sẽ xuất hiện ở đây sau khi tạo tài khoản hoặc đặt lại mật khẩu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['THỜI GIAN', 'LOẠI', 'NGƯỜI NHẬN', 'TIÊU ĐỀ', 'NGƯỜI GỬI', 'KẾT QUẢ', 'THAO TÁC'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const typeConf = TYPE_CONFIG[log.type] || { label: log.type, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
                  const isSuccess = log.status === 'success';
                  return (
                    <tr key={log._id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                      {/* Thời gian */}
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                        {formatTime(log.createdAt)}
                      </td>

                      {/* Loại */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConf.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeConf.dot}`} />
                          {typeConf.label}
                        </span>
                      </td>

                      {/* Người nhận */}
                      <td className="px-4 py-3 text-slate-700 font-medium max-w-[180px] truncate">
                        {log.recipient}
                      </td>

                      {/* Tiêu đề */}
                      <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate" title={log.subject}>
                        {log.subject}
                      </td>

                      {/* Người gửi */}
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {log.sentBy || '—'}
                      </td>

                      {/* Kết quả */}
                      <td className="px-4 py-3">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" /> Thành công
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold cursor-help"
                            title={log.errorMessage || 'Lỗi không xác định'}
                          >
                            <XCircle className="w-3 h-3" /> Thất bại
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteOne(log._id)}
                          disabled={deletingId === log._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Xóa bản ghi này"
                        >
                          {deletingId === log._id
                            ? <span className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin block" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Hiển thị {(page-1)*LIMIT + 1}–{Math.min(page*LIMIT, total)} / {total} bản ghi</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i-1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...'
                    ? <span key={`dots-${i}`} className="px-1 text-slate-300">…</span>
                    : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          p === page ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    )
                )
              }
              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
