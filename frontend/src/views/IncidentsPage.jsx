import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IncidentModel } from '../models/incident.model.js';
import { ProductModel } from '../models/product.model.js';
import { ReceiptModel } from '../models/receipt.model.js';
import { CategoryModel } from '../models/category.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import { Plus, Eye, Trash2, X, AlertTriangle, CheckCircle2, XCircle, Search, Calendar, Download, Info } from 'lucide-react';
import { exportToCSV } from '../utils/exportCSV.js';

const TYPE_LABELS = {
  hang_loi:   'Hàng lỗi (QC)',
  hang_thieu: 'Hàng thiếu (NVK)',
};
const TYPE_STYLES = {
  hang_loi:   'bg-red-50 text-red-700 border-red-200',
  hang_thieu: 'bg-amber-50 text-amber-700 border-amber-200',
};
const STATUS_CONFIG = {
  pending_approval: { label: 'Chờ phê duyệt', style: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved:         { label: 'Đã phê duyệt',  style: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected:         { label: 'Từ chối',        style: 'bg-red-100 text-red-700 border-red-200' },
};

export const IncidentsPage = () => {
  const { hasPermission, user } = useAuth();
  const [incidents, setIncidents]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [receipts, setReceipts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);

  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [showSugg, setShowSugg]         = useState(false);
  const searchRef = useRef(null);

  const [showAddModal, setShowAddModal]         = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showRejectModal, setShowRejectModal]   = useState(false);
  const [rejectNote, setRejectNote]             = useState('');
  const [rejectTargetId, setRejectTargetId]     = useState(null);

  // Create form state
  const [formType, setFormType]   = useState('hang_loi');
  const [formRefId, setFormRefId] = useState('');
  const [formNote, setFormNote]   = useState('');
  const [formItems, setFormItems] = useState([{ productId: '', quantity: 1, reason: '', _category: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incData, pData, rData, catData] = await Promise.all([
        IncidentModel.getAll(),
        ProductModel.getAll(),
        ReceiptModel.getAll(),
        CategoryModel.getAll()
      ]);
      setIncidents(incData);
      setProducts(pData);
      setReceipts(rData);
      setCategories(catData);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu sự cố: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return incidents.filter(inc =>
      inc.code?.toLowerCase().includes(q) ||
      inc.note?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, incidents]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return incidents.filter(inc => {
      const matchQ  = !q || inc.code?.toLowerCase().includes(q) || inc.note?.toLowerCase().includes(q);
      const matchSt = !filterStatus || inc.status === filterStatus;
      const matchTy = !filterType   || inc.type   === filterType;
      const matchFr = !filterFrom   || new Date(inc.createdAt) >= new Date(filterFrom);
      const matchTo = !filterTo     || new Date(inc.createdAt) <= new Date(filterTo + 'T23:59:59');
      return matchQ && matchSt && matchTy && matchFr && matchTo;
    });
  }, [incidents, searchQuery, filterStatus, filterType, filterFrom, filterTo]);

  const getRefDocCode = (rType, rId) => {
    if (!rType || !rId) return '—';
    if (rType === 'receipt') {
      const rec = receipts.find(r => r._id === rId);
      return rec ? rec.code : `Phiếu nhập #${rId}`;
    }
    return `#${rId}`;
  };

  const renderTypeBadge = (t) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${TYPE_STYLES[t] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {TYPE_LABELS[t] || t}
    </span>
  );

  const renderStatusBadge = (s) => {
    const cfg = STATUS_CONFIG[s] || { label: s, style: 'bg-slate-100 text-slate-600 border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.style}`}>
        {cfg.label}
      </span>
    );
  };

  const addItemRow = () => setFormItems([...formItems, { productId: '', quantity: 1, reason: '', _category: '' }]);
  const removeItemRow = (idx) => setFormItems(formItems.filter((_, i) => i !== idx));
  const changeItem = (idx, field, val) => {
    const next = [...formItems];
    next[idx][field] = val;
    if (field === '_category') next[idx].productId = '';
    setFormItems(next);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formItems.some(item => !item.productId || item.quantity <= 0)) {
      toast.error('Vui lòng chọn sản phẩm và nhập số lượng lớn hơn 0');
      return;
    }
    try {
      await IncidentModel.create({
        type: formType,
        refType: 'receipt',
        refId: formRefId ? Number(formRefId) : null,
        note: formNote,
        items: formItems.map(item => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          reason: item.reason || null
        }))
      });
      toast.success('Lập báo cáo sự cố thành công');
      setShowAddModal(false);
      setFormType('hang_loi');
      setFormRefId('');
      setFormNote('');
      setFormItems([{ productId: '', quantity: 1, reason: '', _category: '' }]);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lập báo cáo: ' + error.message);
    }
  };

  const handleApprove = async (incidentId) => {
    try {
      await IncidentModel.approve(incidentId);
      toast.success('Đã phê duyệt báo cáo sự cố');
      setSelectedIncident(null);
      fetchData();
    } catch (error) {
      toast.error('Phê duyệt thất bại: ' + error.message);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectNote.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    try {
      await IncidentModel.reject(rejectTargetId, rejectNote.trim());
      toast.success('Đã từ chối báo cáo sự cố');
      setShowRejectModal(false);
      setRejectNote('');
      setRejectTargetId(null);
      setSelectedIncident(null);
      fetchData();
    } catch (error) {
      toast.error('Từ chối thất bại: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa báo cáo sự cố này?')) return;
    try {
      await IncidentModel.delete(id);
      toast.success('Đã xóa báo cáo sự cố');
      fetchData();
    } catch (error) {
      toast.error('Xóa thất bại: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo Sự cố Nhập kho</h2>
          <p className="text-sm text-slate-500">Ghi nhận hàng lỗi (QC) và hàng thiếu (NVK) khi nhận lô hàng</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const headers = ['Mã sự cố', 'Loại', 'Phiếu liên kết', 'Người báo cáo', 'Trạng thái', 'Ngày tạo'];
              const rows = filtered.map(inc => [
                inc.code,
                TYPE_LABELS[inc.type] || inc.type,
                getRefDocCode(inc.refType, inc.refId),
                inc.createdByUser?.username || '',
                STATUS_CONFIG[inc.status]?.label || inc.status,
                inc.createdAt ? new Date(inc.createdAt).toLocaleDateString('vi-VN') : ''
              ]);
              exportToCSV('danh_sach_su_co_kho', headers, rows);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
          <PermissionGuard permission="incident:create">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
            >
              <Plus className="w-4 h-4" /> Lập báo cáo sự cố
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSugg(true); }}
              onFocus={() => setShowSugg(true)}
              onBlur={() => setTimeout(() => setShowSugg(false), 200)}
              placeholder="Tìm theo mã sự cố, ghi chú..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
            />
            {showSugg && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                {suggestions.map(inc => (
                  <button key={inc._id} type="button"
                    onMouseDown={() => { setSearchQuery(inc.code); setShowSugg(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-slate-50 last:border-0 flex items-center gap-2"
                  >
                    <span className="font-mono font-bold text-slate-900 text-sm">{inc.code}</span>
                    <span className="text-xs text-slate-400 truncate flex-1">— {TYPE_LABELS[inc.type]}</span>
                    {renderStatusBadge(inc.status)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 min-w-[170px]">
            <option value="">Tất cả trạng thái</option>
            <option value="pending_approval">Chờ phê duyệt</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 min-w-[170px]">
            <option value="">Tất cả loại sự cố</option>
            <option value="hang_loi">Hàng lỗi (QC)</option>
            <option value="hang_thieu">Hàng thiếu (NVK)</option>
          </select>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400" />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400" />
          </div>
          {(searchQuery || filterStatus || filterType || filterFrom || filterTo) && (
            <button onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterType(''); setFilterFrom(''); setFilterTo(''); }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold">
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
            {filtered.length} / {incidents.length} sự cố
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {incidents.length === 0 ? 'Chưa có báo cáo sự cố nào' : 'Không tìm thấy sự cố phù hợp'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-6 py-4">Mã sự cố</th>
                  <th className="px-6 py-4">Loại sự cố</th>
                  <th className="px-6 py-4">Phiếu liên kết</th>
                  <th className="px-6 py-4">Người báo cáo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filtered.map(inc => (
                  <tr key={inc._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{inc.code}</td>
                    <td className="px-6 py-4">{renderTypeBadge(inc.type)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-primary-600 font-bold">
                      {getRefDocCode(inc.refType, inc.refId)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{inc.createdByUser?.username}</p>
                        <p className="text-[10px] text-slate-400">{inc.createdByUser?.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderStatusBadge(inc.status)}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {inc.createdAt ? new Date(inc.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                        {inc.status === 'pending_approval' && hasPermission('incident:create') && (
                          <button
                            onClick={() => handleDelete(inc._id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-600 transition-colors"
                            title="Xóa báo cáo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Lập Báo Cáo Sự Cố Nhập Kho
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Hàng lỗi</strong> do QC phát hiện khi kiểm tra chất lượng. &nbsp;
                  <strong>Hàng thiếu</strong> do Nhân viên kho phát hiện khi kiểm đếm thực tế.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại sự cố *</label>
                  <select
                    required value={formType} onChange={e => setFormType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="hang_loi">Hàng lỗi (QC kiểm tra chất lượng)</option>
                    <option value="hang_thieu">Hàng thiếu (NVK kiểm đếm số lượng)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Liên kết Phiếu Nhập *</label>
                  <select
                    required value={formRefId} onChange={e => setFormRefId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="">-- Chọn phiếu nhập --</option>
                    {receipts.map(r => (
                      <option key={r._id} value={r._id}>{r.code}{r.ghiChu ? ` – ${r.ghiChu}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả chi tiết</label>
                <textarea
                  value={formNote} onChange={e => setFormNote(e.target.value)}
                  placeholder="Mô tả diễn biến, bối cảnh phát hiện sự cố..."
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách sản phẩm</h4>
                  <button type="button" onClick={addItemRow}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng
                  </button>
                </div>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <select value={item._category} onChange={e => changeItem(idx, '_category', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none">
                            <option value="">-- Tất cả danh mục --</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                          <select required value={item.productId} onChange={e => changeItem(idx, 'productId', e.target.value)}
                            disabled={!item._category}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none disabled:opacity-50 disabled:bg-slate-100">
                            <option value="" disabled>-- Chọn sản phẩm --</option>
                            {products.filter(p => !item._category || p.categoryId === parseInt(item._category)).map(p => (
                              <option key={p._id} value={p._id}>{p.sku} – {p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input type="number" required min="1" placeholder="SL"
                            value={item.quantity} onChange={e => changeItem(idx, 'quantity', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 text-center font-bold focus:outline-none" />
                        </div>
                        <button type="button" disabled={formItems.length <= 1} onClick={() => removeItemRow(idx)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg disabled:opacity-30">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {formType === 'hang_loi' && (
                        <input
                          type="text"
                          value={item.reason}
                          onChange={e => changeItem(idx, 'reason', e.target.value)}
                          placeholder="Nguyên nhân / mô tả lỗi (tùy chọn)..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 focus:outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold">Hủy</button>
                <button type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/10">
                  Gửi Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Báo Cáo Sự Cố</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedIncident.code}</p>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Loại sự cố</p>
                  <div className="mt-1">{renderTypeBadge(selectedIncident.type)}</div>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Trạng thái</p>
                  <div className="mt-1">{renderStatusBadge(selectedIncident.status)}</div>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Phiếu liên kết</p>
                  <p className="font-mono font-bold text-primary-600 mt-1">
                    {getRefDocCode(selectedIncident.refType, selectedIncident.refId)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Người báo cáo</p>
                  <p className="font-semibold text-slate-800 mt-1">{selectedIncident.createdByUser?.username}
                    <span className="text-slate-400 font-normal text-xs ml-1">({selectedIncident.createdByUser?.role})</span>
                  </p>
                </div>
                {selectedIncident.approvedByUser && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-semibold">
                      {selectedIncident.status === 'rejected' ? 'Người từ chối' : 'Người phê duyệt'}
                    </p>
                    <p className="font-semibold text-slate-800 mt-1">{selectedIncident.approvedByUser?.username}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs uppercase font-semibold">Ngày lập</p>
                  <p className="text-slate-700 mt-1">
                    {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}
                  </p>
                </div>
              </div>

              {selectedIncident.note && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-2 text-xs text-slate-700">
                  <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                  <div><span className="font-bold">Mô tả:</span> {selectedIncident.note}</div>
                </div>
              )}

              {selectedIncident.status === 'rejected' && selectedIncident.rejectNote && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-xs text-red-700">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div><span className="font-bold">Lý do từ chối:</span> {selectedIncident.rejectNote}</div>
                </div>
              )}

              {/* Items table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Danh sách sản phẩm</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3 text-center">Số lượng</th>
                        {selectedIncident.type === 'hang_loi' && (
                          <th className="px-4 py-3">Nguyên nhân</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedIncident.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900">{item.product?.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-red-600">
                            {item.quantity} {item.product?.unit || 'Cái'}
                          </td>
                          {selectedIncident.type === 'hang_loi' && (
                            <td className="px-4 py-3 text-slate-500">{item.reason || <span className="italic text-slate-300">—</span>}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50/50">
              {selectedIncident.status === 'pending_approval' && hasPermission('incident:approve') && (
                <>
                  <button
                    onClick={() => {
                      setRejectTargetId(selectedIncident._id);
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(selectedIncident._id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Phê duyệt
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedIncident(null)}
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" /> Từ chối Báo Cáo Sự Cố
              </h3>
              <button onClick={() => { setShowRejectModal(false); setRejectNote(''); }} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lý do từ chối *</label>
                <textarea
                  required
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Nhập lý do từ chối báo cáo sự cố..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowRejectModal(false); setRejectNote(''); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold">Hủy</button>
                <button type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
