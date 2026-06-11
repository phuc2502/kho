import React, { useState, useEffect } from 'react';
import { ReceiptModel } from '../models/receipt.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import { IncidentModel } from '../models/incident.model.js';
import toast from 'react-hot-toast';
import { Plus, Eye, CheckCircle2, X, Calendar, Clipboard, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportCSV.js';

export const ReceiptsPage = () => {
  const { hasPermission } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allNodes, setAllNodes] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Quick Incident state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('shortage');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentItems, setIncidentItems] = useState([]);

  // Form states
  const [ghiChu, setGhiChu] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rData, pData, wData] = await Promise.all([
        ReceiptModel.getAll(),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setReceipts(rData);
      setProducts(pData);
      setAllNodes(wData);
      setBins(wData.filter(n => n.type === 'bin'));
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu phiếu nhập: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setItems([...items, { product: '', quantity: 1, price: 0, warehouseNode: '' }]);
  };

  const handleRemoveItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    if (field === 'product') {
      const prod = products.find(p => p._id === val);
      if (prod) newItems[idx].price = prod.priceIn;
    }
    if (field === '_zone') { newItems[idx]._rack = ''; newItems[idx].warehouseNode = ''; }
    if (field === '_rack') { newItems[idx].warehouseNode = ''; }
    setItems(newItems);
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();

    const invalidItem = items.some(item => !item.product || item.quantity <= 0 || !item.warehouseNode);
    if (invalidItem) {
      toast.error('Vui lòng điền đầy đủ sản phẩm, số lượng và khay chứa hàng');
      return;
    }

    try {
      await ReceiptModel.create({
        ghiChu: ghiChu.trim() || null,
        items: items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity),
          price: Number(item.price),
          warehouseNode: item.warehouseNode
        }))
      });
      toast.success('Lập phiếu nhập kho nháp thành công');
      setShowAddModal(false);
      setGhiChu('');
      setItems([{ product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '' }]);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lập phiếu nhập: ' + error.message);
    }
  };

  const handleTransitionStatus = async (receiptId, targetStatus) => {
    try {
      await ReceiptModel.update(receiptId, { status: targetStatus });
      toast.success(`Đã cập nhật trạng thái sang: ${targetStatus.toUpperCase()}`);
      if (selectedReceipt) setSelectedReceipt(null);
      fetchData();
    } catch (error) {
      toast.error('Cập nhật trạng thái thất bại: ' + error.message);
    }
  };

  const handleSubmitQuickIncident = async (e) => {
    e.preventDefault();
    const checkedItems = incidentItems.filter(item => item.checked);
    if (checkedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm gặp sự cố');
      return;
    }
    const invalidQty = checkedItems.some(item => item.quantity <= 0 || item.quantity > item.maxQty);
    if (invalidQty) {
      toast.error('Số lượng sự cố không hợp lệ (phải lớn hơn 0 và không vượt quá số lượng trong phiếu)');
      return;
    }

    try {
      await IncidentModel.create({
        type: incidentType,
        refType: 'receipt',
        refId: selectedReceipt._id,
        note: incidentNote,
        items: checkedItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity)
        }))
      });
      toast.success('Báo cáo sự cố thành công');
      setShowIncidentModal(false);
    } catch (error) {
      toast.error('Lỗi khi báo cáo sự cố: ' + error.message);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const STATUS_MAP = {
    draft:     { label: 'Nháp',        style: 'bg-slate-100 text-slate-600 border-slate-200' },
    approved:  { label: 'Đã duyệt',   style: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Hoàn thành', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected:  { label: 'Từ chối',    style: 'bg-red-100 text-red-700 border-red-200' },
  };

  const renderStatusBadge = (status) => {
    const s = STATUS_MAP[status] || { label: status, style: 'bg-slate-100 text-slate-600 border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.style}`}>
        {s.label}
      </span>
    );
  };

  // Lấy tất cả nodes con (đệ quy) của parentId có type cho trước
  const getDescOfType = (parentId, type) => {
    if (!parentId) return allNodes.filter(n => n.type === type);
    const pid = parseInt(parentId);
    const result = [];
    const queue = [pid];
    const visited = new Set();
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      allNodes.forEach(n => {
        const nPid = n.parentId ?? n.parent?._id;
        if (nPid === id) {
          if (n.type === type) result.push(n);
          else queue.push(n._id);
        }
      });
    }
    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Phiếu Nhập kho</h2>
          <p className="text-sm text-slate-500">Tạo phiếu nhập nháp và duyệt nhập kho trực tiếp vào vị trí khay chứa</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const headers = ['Mã phiếu', 'Ghi chú', 'Ngày lập', 'Tổng tiền', 'Trạng thái'];
              const rows = receipts.map(r => [r.code, r.ghiChu || '', r.createdAt?.split('T')[0] || '', r.totalAmount || 0, r.status]);
              exportToCSV('phieu_nhap_kho', headers, rows);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
          <PermissionGuard permission="receipt:create">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
            >
              <Plus className="w-4 h-4" />
              Lập phiếu nhập
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải danh sách phiếu nhập...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có phiếu nhập kho nào được tạo</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-5 py-4">Mã phiếu</th>
                  <th className="px-5 py-4">Ghi chú</th>
                  <th className="px-5 py-4">Ngày lập</th>
                  <th className="px-5 py-4 text-center">Mặt hàng</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Tổng tiền</th>
                  <th className="px-5 py-4">Người lập</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {receipts.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{r.code}</td>
                    <td className="px-5 py-4 text-slate-600 max-w-[220px]">
                      <span className="truncate block text-sm">{r.ghiChu || <span className="text-slate-300 italic">—</span>}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        {r.items?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">{renderStatusBadge(r.status)}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-950">{formatCurrency(r.totalAmount)}</td>
                    <td className="px-5 py-4 text-slate-500">
                      <div>
                        <p className="font-medium">{r.createdByUser?.username}</p>
                        <p className="text-[10px] text-slate-400">{r.createdByUser?.role}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedReceipt(r)}
                        className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-4 h-4" /> Chi tiết
                      </button>
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
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-primary-500" />
                Lập Phiếu Nhập Kho
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateReceipt} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ghi chú
                  <span className="text-slate-400 font-normal ml-1">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Ví dụ: Nhập bổ sung tháng 6/2026, hoặc ghi chú đặc biệt về lô hàng..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách mặt hàng nhập</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng mới
                  </button>
                </div>

                {/* Column headers */}
                <div className="flex items-center gap-3 px-1">
                  <div className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sản phẩm *</div>
                  <div className="w-28 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-center">Số lượng</div>
                  <div className="w-32 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Đơn giá (đ)</div>
                  <div className="w-7"></div>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 px-3.5 py-3 rounded-xl border border-slate-200 space-y-2.5">
                      {/* Dòng 1: Sản phẩm + Số lượng + Đơn giá + Xóa */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <select
                            required
                            value={item.product}
                            onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
                          >
                            <option value="" disabled>-- Chọn sản phẩm --</option>
                            {products.map(p => (
                              <option key={p._id} value={p._id}>{p.sku} – {p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-28 relative">
                          <input
                            type="number" required min="1" value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 text-center focus:outline-none focus:border-primary-400"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 pointer-events-none select-none">
                            {products.find(p => p._id == item.product)?.unit || 'cái'}
                          </span>
                        </div>
                        <div className="w-32 relative">
                          <input
                            type="number" required min="0" value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg pl-2 pr-5 py-1.5 text-xs text-slate-700 text-right focus:outline-none focus:border-primary-400"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 pointer-events-none select-none">đ</span>
                        </div>
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Xóa dòng này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dòng 2: Phân cấp vị trí lưu kho */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Khu vực */}
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">Khu vực</p>
                          <select
                            value={item._zone}
                            onChange={(e) => handleItemChange(idx, '_zone', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
                          >
                            <option value="">-- Tất cả --</option>
                            {allNodes.filter(n => n.type === 'zone').map(z => (
                              <option key={z._id} value={z._id}>{z.code} – {z.name}</option>
                            ))}
                          </select>
                        </div>
                        {/* Kệ chứa */}
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">Kệ chứa</p>
                          <select
                            value={item._rack}
                            onChange={(e) => handleItemChange(idx, '_rack', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
                          >
                            <option value="">-- Tất cả --</option>
                            {getDescOfType(item._zone, 'rack').map(r => (
                              <option key={r._id} value={r._id}>{r.code} – {r.name}</option>
                            ))}
                          </select>
                        </div>
                        {/* Khay / Bin */}
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">
                            <span className="text-red-400 mr-0.5">*</span> Khay (Bin)
                          </p>
                          <select
                            required
                            value={item.warehouseNode}
                            onChange={(e) => handleItemChange(idx, 'warehouseNode', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
                          >
                            <option value="" disabled>-- Chọn khay --</option>
                            {getDescOfType(item._rack || item._zone || null, 'bin').map(b => (
                              <option key={b._id} value={b._id}>{b.code} · {b.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">
                  Tổng tiền dự kiến:{' '}
                  <strong className="text-slate-900 text-lg">
                    {formatCurrency(items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price) || 0), 0))}
                  </strong>
                </span>

                <div className="flex gap-3">
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
                    Tạo phiếu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Phiếu Nhập Kho</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mã phiếu: {selectedReceipt.code}</p>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide">Ghi chú</p>
                  <p className="font-semibold text-slate-800 mt-1">{selectedReceipt.ghiChu || <span className="text-slate-400 italic font-normal">Không có ghi chú</span>}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide">Trạng thái</p>
                  <p className="mt-1">{renderStatusBadge(selectedReceipt.status)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide">Người lập</p>
                  <p className="font-semibold text-slate-700 mt-1">{selectedReceipt.createdByUser?.username}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold tracking-wide">Ngày lập</p>
                  <p className="font-semibold text-slate-700 mt-1">
                    {selectedReceipt.createdAt ? new Date(selectedReceipt.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>

              {/* Items details table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4 text-slate-400" /> Danh sách sản phẩm
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3">Khay lưu trữ (Bin)</th>
                        <th className="px-4 py-3 text-center">Số lượng</th>
                        <th className="px-4 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedReceipt.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900">{item.product?.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-primary-600">
                            {item.warehouseNode?.code}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900">
                            {item.quantity} {item.product?.unit || 'Cái'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons inside detail modal */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">
                  Tổng thanh toán:{' '}
                  <strong className="text-slate-900 text-base">{formatCurrency(selectedReceipt.totalAmount)}</strong>
                </span>

                <div className="flex gap-2 items-center">
                  <PermissionGuard permission="incident:create">
                    <button
                      onClick={() => {
                        const items = selectedReceipt.items.map(item => ({
                          productId: item.product?._id || item.product,
                          name: item.product?.name || '',
                          sku: item.product?.sku || '',
                          maxQty: item.quantity,
                          quantity: item.quantity,
                          checked: false
                        }));
                        setIncidentItems(items);
                        setIncidentType('damage');
                        setIncidentNote('');
                        setShowIncidentModal(true);
                      }}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      ⚠️ Báo sự cố
                    </button>
                  </PermissionGuard>

                  {(selectedReceipt.status === 'draft' || selectedReceipt.status === 'approved') && (
                    <PermissionGuard permission="receipt:approve">
                      <button
                        onClick={() => handleTransitionStatus(selectedReceipt._id, 'rejected')}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        ❌ Từ chối
                      </button>
                    </PermissionGuard>
                  )}

                  {selectedReceipt.status === 'draft' && (
                    <PermissionGuard permission="receipt:approve">
                      <button
                        onClick={() => handleTransitionStatus(selectedReceipt._id, 'approved')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Duyệt phiếu
                      </button>
                    </PermissionGuard>
                  )}
                  {selectedReceipt.status === 'approved' && (
                    <PermissionGuard permission="receipt:approve">
                      <button
                        onClick={() => handleTransitionStatus(selectedReceipt._id, 'completed')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Hoàn thành nhập kho
                      </button>
                    </PermissionGuard>
                  )}
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Báo cáo Sự cố</h3>
                <p className="text-xs text-slate-500 mt-0.5">Liên kết Phiếu nhập: {selectedReceipt.code}</p>
              </div>
              <button onClick={() => setShowIncidentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitQuickIncident} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại sự cố *</label>
                <select
                  required
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                >
                  <option value="shortage">Thiếu hụt số lượng</option>
                  <option value="damage">Hàng bị hư hỏng</option>
                  <option value="wrong_product">Sai sản phẩm</option>
                  <option value="expired">Hàng hết hạn</option>
                  <option value="other">Sự cố khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả chi tiết / Ghi chú</label>
                <textarea
                  value={incidentNote}
                  onChange={(e) => setIncidentNote(e.target.value)}
                  placeholder="Nhập mô tả sự cố..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Chọn sản phẩm gặp sự cố *</label>
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="px-3 py-2 w-8">Chọn</th>
                        <th className="px-3 py-2">Sản phẩm</th>
                        <th className="px-3 py-2 text-right">SL Gặp Sự Cố</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {incidentItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => {
                                const newItems = [...incidentItems];
                                newItems[idx].checked = e.target.checked;
                                setIncidentItems(newItems);
                              }}
                              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku} (Tối đa: {item.maxQty})</p>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="1"
                              max={item.maxQty}
                              disabled={!item.checked}
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...incidentItems];
                                newItems[idx].quantity = e.target.value;
                                setIncidentItems(newItems);
                              }}
                              className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shadow-primary-500/10"
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
