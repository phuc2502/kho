import React, { useState, useEffect } from 'react';
import { IncidentModel } from '../models/incident.model.js';
import { ProductModel } from '../models/product.model.js';
import { ReceiptModel } from '../models/receipt.model.js';
import { CategoryModel } from '../models/category.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import { Plus, Eye, Trash2, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const IncidentsPage = () => {
  const { hasPermission } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [products, setProducts] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <PermissionGuard permission="incident:create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            Báo cáo sự cố mới
          </button>
        </PermissionGuard>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải danh sách sự cố...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có sự cố nào được ghi nhận</div>
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
                {incidents.map(inc => (
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
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
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

              <div className="flex justify-end pt-2">
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
    </div>
  );
};
