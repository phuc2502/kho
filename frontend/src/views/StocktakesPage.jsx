import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StocktakeModel } from '../models/stocktake.model.js';
import { AdjustmentModel } from '../models/adjustment.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import {
  Plus, Eye, Trash2, X, ClipboardList, CheckCircle2,
  AlertCircle, Search, ArrowLeftRight, Pencil
} from 'lucide-react';

const STATUS_CONFIG = {
  pending_approval: { label: 'Chờ phê duyệt', color: 'bg-slate-100 text-slate-700 border-slate-200', step: 1 },
  counting: { label: 'Đang kiểm kê', color: 'bg-blue-100 text-blue-700 border-blue-200', step: 2 },
  pass: { label: 'Khớp số lượng', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', step: 3 },
  diff: { label: 'Có chênh lệch', color: 'bg-amber-100 text-amber-700 border-amber-200', step: 3 },
};

const WORKFLOW_STEPS = [
  { key: 'pending_approval', label: 'Lập phiếu' },
  { key: 'counting', label: 'Kiểm kê' },
  { key: 'done', label: 'Hoàn tất' },
];

const WorkflowBar = ({ currentStatus }) => {
  const stepMap = { pending_approval: 1, counting: 2, pass: 3, diff: 3 };
  const currentStep = stepMap[currentStatus] || 1;
  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        const isFinal = stepNum === 3;
        let activeColor = 'bg-primary-500 text-white border-primary-500 shadow shadow-primary-500/20';
        if (isFinal && isActive) {
          activeColor = currentStatus === 'pass'
            ? 'bg-emerald-500 text-white border-emerald-500 shadow shadow-emerald-500/20'
            : 'bg-amber-500 text-white border-amber-500 shadow shadow-amber-500/20';
        }
        const label = isFinal && isActive
          ? (currentStatus === 'pass' ? 'Khớp' : 'Chênh lệch')
          : step.label;

        return (
          <React.Fragment key={step.key}>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all
              ${isDone ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : isActive ? activeColor
                  : 'bg-slate-100 text-slate-400 border-slate-200'}`}
            >
              {label}
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div className={`w-4 h-0.5 rounded ${currentStep > stepNum ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const renderStatusBadge = (status) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

export const StocktakesPage = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [stocktakes, setStocktakes] = useState([]);
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStocktake, setSelectedStocktake] = useState(null);
  const [editingCounts, setEditingCounts] = useState([]);
  const [savingCounts, setSavingCounts] = useState(false);

  const [formNote, setFormNote] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formItems, setFormItems] = useState([{ productId: '', warehouseNodeId: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stData, pData, wData] = await Promise.all([
        StocktakeModel.getAll(),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setStocktakes(stData);
      setProducts(pData);
      setBins(wData.filter(n => n.type === 'bin'));
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu kiểm kê: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openDetail = useCallback((st) => {
    setSelectedStocktake(st);
    if (st.status === 'counting') {
      setEditingCounts(
        (st.items || []).map(item => ({
          _id: item._id,
          productId: item.productId || item.product?._id,
          warehouseNodeId: item.warehouseNodeId || item.warehouseNode?._id,
          product: item.product,
          warehouseNode: item.warehouseNode,
          systemQty: item.systemQty,
          countedQty: item.countedQty ?? 0
        }))
      );
    }
  }, []);

  const handleAddFormRow = () => setFormItems([...formItems, { productId: '', warehouseNodeId: '' }]);
  const handleRemoveFormRow = (idx) => setFormItems(formItems.filter((_, i) => i !== idx));
  const handleFormItemChange = (idx, field, val) => {
    const next = [...formItems];
    next[idx][field] = val;
    setFormItems(next);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formItems.some(item => !item.productId || !item.warehouseNodeId))
      return toast.error('Vui lòng chọn sản phẩm và vị trí cho mỗi dòng kiểm kê');
    try {
      await StocktakeModel.create({
        note: formNote,
        date: formDate,
        items: formItems.map(item => ({
          productId: Number(item.productId),
          warehouseNodeId: Number(item.warehouseNodeId)
        }))
      });
      toast.success('Đã lập phiếu kiểm kê – chờ quản lý phê duyệt');
      setShowAddModal(false);
      setFormNote('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormItems([{ productId: '', warehouseNodeId: '' }]);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lập phiếu: ' + error.message);
    }
  };

  const handleApprove = async (stocktakeId) => {
    try {
      const updated = await StocktakeModel.approve(stocktakeId);
      toast.success('Phê duyệt thành công – bắt đầu giai đoạn kiểm đếm');
      openDetail(updated);
      fetchData();
    } catch (error) {
      toast.error('Phê duyệt thất bại: ' + error.message);
    }
  };

  const handleSaveCounts = async () => {
    setSavingCounts(true);
    try {
      const updated = await StocktakeModel.update(selectedStocktake._id, {
        items: editingCounts.map(item => ({
          _id: item._id,
          productId: Number(item.productId),
          warehouseNodeId: Number(item.warehouseNodeId),
          countedQty: Number(item.countedQty)
        }))
      });
      toast.success('Đã lưu số liệu đếm');
      setSelectedStocktake(updated);
      setEditingCounts(
        (updated.items || []).map(item => ({
          _id: item._id,
          productId: item.productId || item.product?._id,
          warehouseNodeId: item.warehouseNodeId || item.warehouseNode?._id,
          product: item.product,
          warehouseNode: item.warehouseNode,
          systemQty: item.systemQty,
          countedQty: item.countedQty ?? 0
        }))
      );
      fetchData();
    } catch (error) {
      toast.error('Lưu thất bại: ' + error.message);
    } finally {
      setSavingCounts(false);
    }
  };

  const handleComplete = async () => {
    try {
      const updated = await StocktakeModel.complete(selectedStocktake._id);
      const hasDiff = updated.status === 'diff';
      toast.success(hasDiff
        ? 'Kiểm kê hoàn tất – phát hiện chênh lệch tồn kho'
        : 'Kiểm kê hoàn tất – số lượng khớp hoàn toàn');
      setSelectedStocktake(updated);
      fetchData();
    } catch (error) {
      toast.error('Hoàn tất thất bại: ' + error.message);
    }
  };

  const handleCreateAdjustment = async () => {
    if (!selectedStocktake || selectedStocktake.status !== 'diff') return;
    const diffItems = selectedStocktake.items
      .filter(item => Number(item.countedQty) !== Number(item.systemQty))
      .map(item => ({
        productId: item.productId || item.product?._id,
        warehouseNodeId: item.warehouseNodeId || item.warehouseNode?._id,
        systemQty: Number(item.systemQty),
        delta: Number(item.countedQty) - Number(item.systemQty)
      }));
    if (diffItems.length === 0) return toast.error('Không có dòng nào có chênh lệch');
    try {
      await AdjustmentModel.create({
        reason: 'count_correction',
        note: `Tạo từ kiểm kê ${selectedStocktake.code}`,
        stocktakeId: selectedStocktake._id,
        items: diffItems
      });
      toast.success('Đã tạo phiếu điều chỉnh tồn kho – chờ phê duyệt');
      setSelectedStocktake(null);
      navigate('/adjustments');
    } catch (error) {
      toast.error('Lỗi khi tạo phiếu điều chỉnh: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa phiếu kiểm kê đang chờ duyệt này?')) return;
    try {
      await StocktakeModel.delete(id);
      toast.success('Đã xóa phiếu kiểm kê');
      setSelectedStocktake(null);
      fetchData();
    } catch (error) {
      toast.error('Xóa thất bại: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Kiểm kê kho</h2>
          <p className="text-sm text-slate-500">Quy trình: Lập phiếu → Phê duyệt → Kiểm đếm thực tế → Hoàn tất</p>
        </div>
        <PermissionGuard permission="stocktake:create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4 h-4" />
            Lập phiếu kiểm kê
          </button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2">Đang tải danh sách kiểm kê...</p>
          </div>
        ) : stocktakes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có phiếu kiểm kê nào được lập</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-5 py-4">Mã phiếu</th>
                  <th className="px-5 py-4">Ngày kiểm</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Ghi chú</th>
                  <th className="px-5 py-4">Người lập</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {stocktakes.map(st => (
                  <tr key={st._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{st.code}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(st.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-5 py-4">
                      {renderStatusBadge(st.status)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate">{st.note || '—'}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{st.createdByUser?.username}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{st.createdByUser?.role}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDetail(st)}
                          className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem
                        </button>
                        {st.status === 'pending_approval' && (
                          <PermissionGuard permission="stocktake:create">
                            <button
                              onClick={() => handleDelete(st._id)}
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

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-500" />
                Lập Phiếu Kiểm Kê Kho
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>Chỉ cần chọn sản phẩm và vị trí. Số lượng thực tế sẽ được nhập trong giai đoạn kiểm đếm sau khi quản lý phê duyệt.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ngày kiểm kê *</label>
                  <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú</label>
                  <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Ví dụ: Kiểm kê định kỳ tháng 6..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Sản phẩm & Vị trí cần kiểm kê</h4>
                  <button type="button" onClick={handleAddFormRow} className="text-xs font-semibold text-primary-500 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng
                  </button>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-11 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="col-span-5">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Sản phẩm *</label>
                        <select required value={item.productId} onChange={(e) => handleFormItemChange(idx, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500">
                          <option value="" disabled>-- Chọn sản phẩm --</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-5">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Vị trí (Bin) *</label>
                        <select required value={item.warehouseNodeId} onChange={(e) => handleFormItemChange(idx, 'warehouseNodeId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500">
                          <option value="" disabled>-- Chọn khay --</option>
                          {bins.map(b => <option key={b._id} value={b._id}>{b.code} ({b.name})</option>)}
                        </select>
                      </div>
                      <div className="col-span-1 pt-4 text-center">
                        <button type="button" disabled={formItems.length <= 1} onClick={() => handleRemoveFormRow(idx)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg disabled:opacity-50">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/10">
                  Gửi chờ phê duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Action Modal */}
      {selectedStocktake && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Phiếu Kiểm Kê</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{selectedStocktake.code}</p>
              </div>
              <button onClick={() => setSelectedStocktake(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Workflow */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Tiến trình kiểm kê</p>
                <div className="flex justify-center">
                  <WorkflowBar currentStatus={selectedStocktake.status} />
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Ngày kiểm kê</p>
                  <p className="font-bold text-slate-800 mt-1">{new Date(selectedStocktake.date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase">Người lập</p>
                  <p className="font-bold text-slate-800 mt-1">{selectedStocktake.createdByUser?.username}</p>
                </div>
                {selectedStocktake.approvedByUser && (
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase">Người duyệt</p>
                    <p className="font-bold text-slate-800 mt-1">{selectedStocktake.approvedByUser?.username}</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedStocktake.approvedAt ? new Date(selectedStocktake.approvedAt).toLocaleString('vi-VN') : ''}
                    </p>
                  </div>
                )}
              </div>

              {selectedStocktake.note && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-slate-700">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Ghi chú:</strong> {selectedStocktake.note}</span>
                </div>
              )}

              {/* Items — editable if counting */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách kiểm kê</h4>
                  {selectedStocktake.status === 'counting' && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                      <Pencil className="w-3 h-3 inline-block mr-1 -mt-0.5" />Nhập số lượng đếm thực tế
                    </span>
                  )}
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                        <th className="px-4 py-2.5">Sản phẩm</th>
                        <th className="px-4 py-2.5">Bin</th>
                        <th className="px-4 py-2.5 text-center">Tồn HT</th>
                        <th className="px-4 py-2.5 text-center">
                          {selectedStocktake.status === 'counting' ? 'Đếm thực tế ✏️' : 'Đếm thực tế'}
                        </th>
                        {(selectedStocktake.status === 'pass' || selectedStocktake.status === 'diff') && (
                          <th className="px-4 py-2.5 text-right">Chênh lệch</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStocktake.status === 'counting'
                        ? editingCounts.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20">
                            <td className="px-4 py-2.5">
                              <p className="font-semibold text-slate-900">{item.product?.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">{item.product?.sku}</p>
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-primary-600">{item.warehouseNode?.code}</td>
                            <td className="px-4 py-2.5 text-center font-bold text-slate-500">{item.systemQty}</td>
                            <td className="px-4 py-2.5 text-center">
                              <input
                                type="number" min="0"
                                value={item.countedQty}
                                onChange={(e) => {
                                  const next = [...editingCounts];
                                  next[idx].countedQty = e.target.value;
                                  setEditingCounts(next);
                                }}
                                className="w-20 bg-white border border-primary-300 rounded-lg px-2 py-1 text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                              />
                            </td>
                          </tr>
                        ))
                        : (selectedStocktake.items || []).map((item, idx) => {
                          const diff = Number(item.countedQty) - Number(item.systemQty);
                          const showDiff = selectedStocktake.status === 'pass' || selectedStocktake.status === 'diff';
                          return (
                            <tr key={idx} className={showDiff && diff !== 0 ? 'bg-amber-50/30' : 'hover:bg-slate-50/20'}>
                              <td className="px-4 py-2.5">
                                <p className="font-semibold text-slate-900">{item.product?.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{item.product?.sku}</p>
                              </td>
                              <td className="px-4 py-2.5 font-mono font-bold text-primary-600">{item.warehouseNode?.code}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-slate-500">{item.systemQty}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-slate-900">{item.countedQty ?? '—'}</td>
                              {showDiff && (
                                <td className="px-4 py-2.5 text-right font-bold">
                                  {diff === 0
                                    ? <span className="text-slate-400">0</span>
                                    : diff > 0
                                      ? <span className="text-emerald-600">+{diff}</span>
                                      : <span className="text-red-600">{diff}</span>}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap justify-end gap-2 bg-slate-50/50 shrink-0">
              {/* pending_approval → approve */}
              {selectedStocktake.status === 'pending_approval' && (
                <PermissionGuard permission="stocktake:approve">
                  <button
                    onClick={() => handleApprove(selectedStocktake._id)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt để bắt đầu kiểm kê
                  </button>
                </PermissionGuard>
              )}

              {/* counting → save counts */}
              {selectedStocktake.status === 'counting' && (
                <>
                  <button
                    onClick={handleSaveCounts}
                    disabled={savingCounts}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {savingCounts ? 'Đang lưu...' : 'Lưu số liệu đếm'}
                  </button>
                  <PermissionGuard permission="stocktake:create">
                    <button
                      onClick={handleComplete}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất kiểm kê
                    </button>
                  </PermissionGuard>
                </>
              )}

              {/* diff → create adjustment */}
              {selectedStocktake.status === 'diff' && (
                <PermissionGuard permission="adjustment:create">
                  <button
                    onClick={handleCreateAdjustment}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Tạo phiếu điều chỉnh tồn kho
                  </button>
                </PermissionGuard>
              )}

              <button
                onClick={() => setSelectedStocktake(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
