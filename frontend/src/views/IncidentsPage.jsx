import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IncidentModel } from '../models/incident.model.js';
import { ProductModel } from '../models/product.model.js';
import { ReceiptModel } from '../models/receipt.model.js';
import { CategoryModel } from '../models/category.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import { Plus, Eye, Trash2, X, AlertTriangle, CheckCircle, Info, Search, Calendar, Printer, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportCSV.js';

export const IncidentsPage = () => {
  const { hasPermission } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [products, setProducts] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Bộ lọc & tìm kiếm ────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [showSugg, setShowSugg]         = useState(false);
  const searchRef = useRef(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Form States
  const [type, setType] = useState('shortage');
  const [refId, setRefId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, _category: '' }]);

  // Detail/Edit States
  const [editStatus, setEditStatus] = useState('open');
  const [editAction, setEditAction] = useState('pending');
  const [editNote, setEditNote] = useState('');

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

  useEffect(() => {
    fetchData();
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return incidents.filter(inc =>
      inc.code?.toLowerCase().includes(q) ||
      inc.note?.toLowerCase().includes(q) ||
      inc.type?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, incidents]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return incidents.filter(inc => {
      const matchQ = !q ||
        inc.code?.toLowerCase().includes(q) ||
        inc.note?.toLowerCase().includes(q) ||
        inc.type?.toLowerCase().includes(q);
      const matchSt   = !filterStatus || inc.status === filterStatus;
      const matchType = !filterType   || inc.type === filterType;
      const matchFr   = !filterFrom   || new Date(inc.createdAt) >= new Date(filterFrom);
      const matchTo_  = !filterTo     || new Date(inc.createdAt) <= new Date(filterTo + 'T23:59:59');
      return matchQ && matchSt && matchType && matchFr && matchTo_;
    });
  }, [incidents, searchQuery, filterStatus, filterType, filterFrom, filterTo]);

  const handleAddItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, _category: '' }]);
  };

  const handleRemoveItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    if (field === '_category') { newItems[idx].productId = ''; }
    setItems(newItems);
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    const invalid = items.some(item => !item.productId || item.quantity <= 0);
    if (invalid) {
      toast.error('Vui lòng chọn sản phẩm và nhập số lượng sự cố lớn hơn 0');
      return;
    }

    try {
      await IncidentModel.create({
        type,
        refType: 'receipt',
        refId: refId ? Number(refId) : null,
        note,
        items: items.map(item => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity)
        }))
      });
      toast.success('Báo cáo sự cố thành công');
      setShowAddModal(false);
      setType('shortage');
      setRefId('');
      setNote('');
      setItems([{ productId: '', quantity: 1, _category: '' }]);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi báo cáo sự cố: ' + error.message);
    }
  };

  const handleUpdateIncidentStatus = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      await IncidentModel.update(selectedIncident._id, {
        status: editStatus,
        action: editAction,
        note: editNote
      });
      toast.success('Cập nhật trạng thái sự cố thành công');
      setSelectedIncident(null);
      fetchData();
    } catch (error) {
      toast.error('Cập nhật thất bại: ' + error.message);
    }
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự cố này?')) return;
    try {
      await IncidentModel.delete(id);
      toast.success('Đã xóa sự cố thành công');
      fetchData();
    } catch (error) {
      toast.error('Xóa thất bại: ' + error.message);
    }
  };

  const renderTypeText = (t) => {
    const typesMap = {
      shortage: 'Thiếu hụt số lượng',
      damage: 'Hàng bị hư hỏng',
      wrong_product: 'Giao sai sản phẩm',
      expired: 'Hàng đã hết hạn',
      other: 'Sự cố khác'
    };
    return typesMap[t] || t;
  };

  const renderActionText = (a) => {
    const actionsMap = {
      reorder: 'Đặt hàng lại',
      dispose: 'Tiêu hủy hàng lỗi',
      return_supplier: 'Trả về nhà cung cấp',
      write_off: 'Khấu trừ tài sản',
      pending: 'Đang chờ xử lý'
    };
    return actionsMap[a] || a;
  };

  const renderStatusBadge = (status) => {
    const styles = {
      open: 'bg-red-100 text-red-700 border-red-200',
      resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      closed: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    const labels = {
      open: 'Đang mở',
      resolved: 'Đã giải quyết',
      closed: 'Đã đóng'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getRefDocCode = (rType, rId) => {
    if (!rType || !rId) return '-';
    if (rType === 'receipt') {
      const rec = receipts.find(r => r._id === rId);
      return rec ? `Phiếu nhập: ${rec.code}` : `Phiếu nhập #${rId}`;
    }
    return `#${rId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo Sự cố Nhập kho</h2>
          <p className="text-sm text-slate-500">Ghi nhận sự cố khi nhận hàng: thiếu hụt số lượng hoặc hàng không đạt chất lượng</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const headers = ['Mã sự cố', 'Loại sự cố', 'Chứng từ liên kết', 'Người báo cáo', 'Trạng thái', 'Ngày tạo'];
              const rows = filtered.map(inc => [
                inc.code,
                renderTypeText(inc.type),
                getRefDocCode(inc.refType, inc.refId),
                inc.createdByUser?.username || '',
                inc.status === 'open' ? 'Đang mở' : inc.status === 'resolved' ? 'Đã giải quyết' : inc.status === 'closed' ? 'Đã đóng' : inc.status,
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
              <Plus className="w-4.5 h-4.5" /> Báo cáo sự cố mới
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* ── Bộ lọc & Tìm kiếm ── */}
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
              placeholder="Tìm theo mã sự cố, loại, ghi chú..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
            />
            {showSugg && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                {suggestions.map(inc => (
                  <button key={inc._id} type="button"
                    onMouseDown={() => { setSearchQuery(inc.code); setShowSugg(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-slate-50 last:border-0 transition-colors flex items-center gap-2"
                  >
                    <span className="font-mono font-bold text-slate-900 text-sm">{inc.code}</span>
                    <span className="text-xs text-slate-400 truncate flex-1">— {renderTypeText(inc.type)}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${{ open: 'bg-red-100 text-red-700 border-red-200', resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200', closed: 'bg-slate-100 text-slate-700 border-slate-200' }[inc.status]}`}>
                      {{ open: 'Đang mở', resolved: 'Đã giải quyết', closed: 'Đã đóng' }[inc.status] || inc.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 min-w-[160px]">
            <option value="">Tất cả trạng thái</option>
            <option value="open">Đang mở</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 min-w-[170px]">
            <option value="">Tất cả loại sự cố</option>
            <option value="shortage">Thiếu hụt số lượng</option>
            <option value="damage">Hàng bị hư hỏng</option>
            <option value="wrong_product">Giao sai sản phẩm</option>
            <option value="expired">Hàng đã hết hạn</option>
            <option value="other">Sự cố khác</option>
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
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors">
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
            {filtered.length} / {incidents.length} sự cố
          </span>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải danh sách sự cố...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {incidents.length === 0 ? 'Chưa có sự cố nào được ghi nhận' : 'Không tìm thấy sự cố phù hợp với bộ lọc'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-6 py-4">Mã sự cố</th>
                  <th className="px-6 py-4">Loại sự cố</th>
                  <th className="px-6 py-4">Liên kết phiếu</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Hướng xử lý</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filtered.map(inc => (
                  <tr key={inc._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{inc.code}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{renderTypeText(inc.type)}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{getRefDocCode(inc.refType, inc.refId)}</td>
                    <td className="px-6 py-4">{renderStatusBadge(inc.status)}</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">{renderActionText(inc.action)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedIncident(inc);
                            setEditStatus(inc.status);
                            setEditAction(inc.action);
                            setEditNote(inc.note || '');
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                        {inc.status === 'open' && (
                          <PermissionGuard permission="incident:create">
                            <button
                              onClick={() => handleDeleteIncident(inc._id)}
                              className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </PermissionGuard>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                Báo Cáo Sự Cố Mới
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Sự cố chỉ được ghi nhận trong quá trình <strong>nhập kho</strong>: thiếu hụt số lượng hoặc hàng không đạt chất lượng khi nhận từ nhà cung cấp.</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại sự cố *</label>
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="shortage">Thiếu hụt số lượng</option>
                    <option value="damage">Hàng bị hư hỏng</option>
                    <option value="wrong_product">Sai sản phẩm</option>
                    <option value="expired">Hàng hết hạn</option>
                    <option value="other">Sự cố khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Liên kết Phiếu Nhập Kho</label>
                  <select
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả chi tiết / Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập mô tả diễn biến sự cố..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách sản phẩm gặp sự cố</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng mới
                  </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="col-span-8 space-y-1">
                        <select value={item._category} onChange={(e) => handleItemChange(idx, '_category', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500">
                          <option value="">-- Tất cả danh mục --</option>
                          {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          disabled={!item._category}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled>-- Chọn sản phẩm --</option>
                          {products.filter(p => !item._category || p.categoryId === parseInt(item._category)).map(p => (
                            <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="SL lỗi"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 text-center font-bold"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
                >
                  Gửi Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View / Update Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Báo Cáo Sự Cố</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mã phiếu: {selectedIncident.code}</p>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Loại sự cố</p>
                  <p className="font-bold text-slate-800 mt-1">{renderTypeText(selectedIncident.type)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Liên kết văn bản</p>
                  <p className="font-mono text-slate-700 mt-1 font-bold">{getRefDocCode(selectedIncident.refType, selectedIncident.refId)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Người báo cáo</p>
                  <p className="font-bold text-slate-850 mt-1">{selectedIncident.createdByUser?.username}</p>
                </div>
              </div>

              {selectedIncident.note && (
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex gap-2 text-xs text-slate-700">
                  <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mô tả sự cố:</span> {selectedIncident.note}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Danh sách sản phẩm gặp sự cố</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3 text-right">Số lượng lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedIncident.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900">{item.product?.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-650">
                            {item.quantity} {item.product?.unit || 'Cái'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Update Form (Resolving incident) */}
              <PermissionGuard permission="incident:approve">
                <form onSubmit={handleUpdateIncidentStatus} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    CẬP NHẬT TRẠNG THÁI & HƯỚNG GIẢI QUYẾT (Xử lý sự cố)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Trạng thái sự cố</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="open">Đang mở</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="closed">Đã đóng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Hướng xử lý hàng hóa</label>
                      <select
                        value={editAction}
                        onChange={(e) => setEditAction(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="pending">Đang chờ xử lý</option>
                        <option value="reorder">Đặt hàng lại</option>
                        <option value="dispose">Tiêu hủy hàng lỗi</option>
                        <option value="return_supplier">Trả lại nhà cung cấp</option>
                        <option value="write_off">Khấu trừ tài sản</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Ghi chú xử lý mới</label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Mô tả kết quả xử lý sự cố..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold shadow"
                    >
                      Lưu cập nhật
                    </button>
                  </div>
                </form>
              </PermissionGuard>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const headers = ['Mã sản phẩm (SKU)', 'Tên sản phẩm', 'Số lượng gặp sự cố'];
                    const rows = selectedIncident.items?.map(item => [
                      item.productId?.sku || item.product?.sku || '',
                      item.productId?.name || item.product?.name || '',
                      item.quantity || 0
                    ]);
                    exportToCSV(`chi_tiet_su_co_${selectedIncident.code}`, headers, rows);
                  }}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> In Báo Cáo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CSS Styles for Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide standard layout */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          /* Show print section only */
          #incident-print-canvas, #incident-print-canvas * {
            visibility: visible;
          }
          #incident-print-canvas {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #000 !important;
            background: #fff !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 13px !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
          }
        }
      `}} />

      {/* Incidents Printable Canvas */}
      {selectedIncident && (
        <div id="incident-print-canvas" className="hidden p-8 bg-white text-black font-serif">
          <div className="flex justify-between items-start mb-6">
            <div className="text-left font-serif">
              <p className="font-bold uppercase text-xs">ĐƠN VỊ: MVC WAREHOUSE SYSTEM</p>
              <p className="text-xs">Địa chỉ: Khu công nghệ cao, TP. Hồ Chí Minh</p>
            </div>
            <div className="text-right font-serif max-w-[280px]">
              <p className="font-bold text-xs">Mẫu số 07-VT</p>
              <p className="italic text-[10px] leading-tight">
                (Ban hành theo Thông tư số 200/2014/TT-BTC<br/>
                Ngày 22/12/2014 của Bộ Tài chính)
              </p>
            </div>
          </div>

          <div className="text-center my-6 font-serif">
            <h2 className="text-xl font-bold uppercase tracking-wide">BIÊN BẢN BÁO CÁO SỰ CỐ KHO HÀNG</h2>
            <p className="italic mt-1 text-xs">Ngày báo cáo: {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleDateString('vi-VN') : '—'}</p>
            <p className="text-xs font-mono mt-0.5">Mã sự cố: {selectedIncident.code}</p>
          </div>

          <div className="space-y-1 mb-6 font-serif text-xs">
            <p><span className="font-bold">Loại sự cố:</span> {renderTypeText(selectedIncident.type)}</p>
            <p><span className="font-bold">Liên kết chứng từ:</span> {getRefDocCode(selectedIncident.refType, selectedIncident.refId)}</p>
            <p><span className="font-bold">Người báo cáo:</span> {selectedIncident.createdByUser?.username}</p>
            <p><span className="font-bold">Mô tả sự cố:</span> {selectedIncident.note || 'Không có'}</p>
            <p><span className="font-bold">Trạng thái sự cố:</span> {selectedIncident.status === 'open' ? 'Đang mở' : selectedIncident.status === 'resolved' ? 'Đã giải quyết' : selectedIncident.status === 'closed' ? 'Đã đóng' : selectedIncident.status}</p>
          </div>

          <table className="w-full text-left font-serif text-xs border border-collapse border-black text-black">
            <thead>
              <tr className="text-center font-bold bg-slate-50">
                <th className="border border-black px-2 py-1.5 w-10">STT</th>
                <th className="border border-black px-2 py-1.5">Mã sản phẩm (SKU)</th>
                <th className="border border-black px-2 py-1.5">Tên sản phẩm</th>
                <th className="border border-black px-2 py-1.5 text-center">Số lượng sự cố</th>
              </tr>
            </thead>
            <tbody>
              {selectedIncident.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-black text-center">{idx + 1}</td>
                  <td className="border border-black font-mono">{item.productId?.sku || item.product?.sku}</td>
                  <td className="border border-black">{item.productId?.name || item.product?.name}</td>
                  <td className="border border-black text-center font-bold text-red-600">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 text-center mt-12 text-xs font-serif">
            <div>
              <p className="font-bold">Người làm báo cáo</p>
              <p className="italic text-[10px] text-slate-500">(Ký, họ tên)</p>
            </div>
            <div>
              <p className="font-bold">Quản lý kho / Người giải quyết</p>
              <p className="italic text-[10px] text-slate-500">(Ký, họ tên)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
