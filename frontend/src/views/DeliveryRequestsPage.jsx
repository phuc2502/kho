import React, { useState, useEffect } from 'react';
import { DeliveryRequestModel } from '../models/deliveryRequest.model.js';
import { DeliveryModel } from '../models/delivery.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import { Plus, Eye, X, PackagePlus, Loader2, ClipboardList, CheckCircle2, Truck, Ban, Clock } from 'lucide-react';

// ── Trạng thái yêu cầu ────────────────────────────────────────
const REQ_STATUS = {
  pending:    { label: 'Chờ xử lý',    color: 'bg-amber-100 text-amber-700 border-amber-200'   },
  processing: { label: 'Đang xử lý',   color: 'bg-blue-100 text-blue-700 border-blue-200'      },
  completed:  { label: 'Đã hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:  { label: 'Đã hủy',       color: 'bg-slate-100 text-slate-500 border-slate-200'   },
};

const StatusBadge = ({ status }) => {
  const cfg = REQ_STATUS[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(val) || 0);

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';
const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  : '';

// ═══════════════════════════════════════════════════════════════
export const DeliveryRequestsPage = () => {
  const { user, hasPermission } = useAuth();
  const isSale = user?.role === 'Sale';

  const [requests, setRequests]         = useState([]);
  const [products, setProducts]         = useState([]);
  const [bins, setBins]                 = useState([]);
  const [allNodes, setAllNodes]         = useState([]);
  const [loading, setLoading]           = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [selectedRequest, setSelectedRequest]   = useState(null);
  const [showFulfillModal, setShowFulfillModal] = useState(null); // { request }

  // Form tạo yêu cầu (Sale)
  const [form, setForm] = useState({ tenKhachHang: '', note: '' });
  const [formItems, setFormItems] = useState([{ productId: '', quantity: 1, priceEstimate: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  // Form tạo phiếu từ yêu cầu (kho)
  const [fulfillItems, setFulfillItems] = useState([]);
  const [fulfilling, setFulfilling]     = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rData, pData, wData] = await Promise.all([
        DeliveryRequestModel.getAll(),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setRequests(rData);
      setProducts(pData);
      setBins(wData.filter(n => n.type === 'bin'));
      setAllNodes(wData);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Tạo yêu cầu (Sale) ────────────────────────────────────
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!form.tenKhachHang.trim()) return toast.error('Vui lòng nhập tên khách hàng');
    if (formItems.some(i => !i.productId || i.quantity <= 0))
      return toast.error('Vui lòng chọn đủ sản phẩm và số lượng');

    setSubmitting(true);
    try {
      await DeliveryRequestModel.create({
        tenKhachHang: form.tenKhachHang.trim(),
        note: form.note.trim() || undefined,
        items: formItems.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          priceEstimate: Number(i.priceEstimate) || 0
        }))
      });
      toast.success('Tạo yêu cầu xuất kho thành công');
      setShowCreateModal(false);
      setForm({ tenKhachHang: '', note: '' });
      setFormItems([{ productId: '', quantity: 1, priceEstimate: 0 }]);
      fetchData();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addFormItem = () => setFormItems([...formItems, { productId: '', quantity: 1, priceEstimate: 0 }]);
  const removeFormItem = (i) => setFormItems(formItems.filter((_, idx) => idx !== i));
  const changeFormItem = (i, field, val) => {
    const next = [...formItems];
    next[i][field] = val;
    if (field === 'productId') {
      const prod = products.find(p => String(p._id) === String(val));
      if (prod) next[i].priceEstimate = prod.priceOut || 0;
    }
    setFormItems(next);
  };

  // ── Hủy yêu cầu (Sale) ────────────────────────────────────
  const handleCancel = async (req) => {
    if (!window.confirm(`Hủy yêu cầu ${req.code}?`)) return;
    try {
      await DeliveryRequestModel.cancel(req._id);
      toast.success('Đã hủy yêu cầu');
      if (selectedRequest?._id === req._id) setSelectedRequest(null);
      fetchData();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // ── Mở modal tạo phiếu từ yêu cầu (kho) ──────────────────
  const openFulfillModal = (req) => {
    setFulfillItems(req.items.map(i => ({
      requestItemId: i._id,
      productId: i.product?._id,
      productName: i.product?.name || '',
      productSku: i.product?.sku || '',
      productUnit: i.product?.unit || '',
      quantity: i.quantity,
      price: i.priceEstimate || 0,
      warehouseNode: '',
      _zone: '',
      _rack: ''
    })));
    setShowFulfillModal(req);
  };

  // ── Tạo phiếu xuất kho từ yêu cầu (kho) ──────────────────
  const handleFulfill = async (e) => {
    e.preventDefault();
    if (fulfillItems.some(i => !i.warehouseNode))
      return toast.error('Vui lòng chọn khay lấy hàng cho tất cả sản phẩm');

    setFulfilling(true);
    try {
      await DeliveryModel.create({
        tenKhachHang: showFulfillModal.tenKhachHang,
        requestId: showFulfillModal._id,
        items: fulfillItems.map(i => ({
          product: i.productId,
          quantity: Number(i.quantity),
          price: Number(i.price),
          warehouseNode: i.warehouseNode
        }))
      });
      // Đánh dấu yêu cầu đang xử lý
      await DeliveryRequestModel.updateStatus(showFulfillModal._id, 'processing');
      toast.success('Tạo phiếu xuất kho thành công từ yêu cầu ' + showFulfillModal.code);
      setShowFulfillModal(null);
      if (selectedRequest?._id === showFulfillModal._id) setSelectedRequest(null);
      fetchData();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setFulfilling(false);
    }
  };

  // ── Thống kê ──────────────────────────────────────────────
  const stats = {
    total:      requests.length,
    pending:    requests.filter(r => r.status === 'pending').length,
    processing: requests.filter(r => r.status === 'processing').length,
    completed:  requests.filter(r => r.status === 'completed').length,
  };

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

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isSale ? 'Yêu cầu xuất kho của tôi' : 'Danh sách yêu cầu xuất kho'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isSale
              ? 'Tạo và theo dõi yêu cầu xuất hàng. Kho sẽ xử lý và tạo phiếu xuất kho tương ứng.'
              : 'Xem và xử lý yêu cầu từ bộ phận kinh doanh. Tạo phiếu xuất kho tương ứng khi duyệt.'}
          </p>
        </div>
        {isSale && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4 h-4" /> Tạo yêu cầu mới
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng yêu cầu',   value: stats.total,      icon: ClipboardList, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Chờ xử lý',      value: stats.pending,    icon: Clock,         color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Đang xử lý',     value: stats.processing, icon: Truck,         color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Hoàn thành',     value: stats.completed,  icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-slate-100`}>
            <div className="flex items-center gap-2.5">
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {isSale ? 'Bạn chưa tạo yêu cầu xuất kho nào' : 'Chưa có yêu cầu xuất kho nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide">
                  <th className="px-5 py-3.5">Mã yêu cầu</th>
                  <th className="px-5 py-3.5">Khách hàng</th>
                  <th className="px-5 py-3.5">Sản phẩm</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Ngày tạo</th>
                  <th className="px-5 py-3.5 text-right">Tổng ước tính</th>
                  {!isSale && <th className="px-5 py-3.5">Người tạo</th>}
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {requests.map(req => {
                  const itemCount = req.items?.length || 0;
                  const itemSummary = req.items?.slice(0, 2).map(i => i.product?.name || '').filter(Boolean).join(', ');
                  return (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Mã */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {req.code}
                        </span>
                      </td>
                      {/* Khách hàng */}
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{req.tenKhachHang}</td>
                      {/* Sản phẩm */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-700 font-medium truncate max-w-[160px]" title={itemSummary}>
                          {itemSummary || '—'}
                          {itemCount > 2 && <span className="text-slate-400"> +{itemCount - 2}</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{itemCount} sản phẩm</p>
                      </td>
                      {/* Trạng thái */}
                      <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                      {/* Ngày tạo */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-700 font-medium">{fmtDate(req.createdAt)}</p>
                        <p className="text-[10px] text-slate-400">{fmtTime(req.createdAt)}</p>
                      </td>
                      {/* Tổng ước tính */}
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(req.totalAmount)}
                      </td>
                      {/* Người tạo — chỉ hiện với non-Sale */}
                      {!isSale && (
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-medium">{req.createdByUser?.fullName || req.createdByUser?.username}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400">{req.createdByUser?.role}</p>
                        </td>
                      )}
                      {/* Thao tác */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                          </button>
                          {/* Nút Tạo phiếu — chỉ kho, khi request đang pending */}
                          {!isSale && req.status === 'pending' && (
                            <button
                              onClick={() => openFulfillModal(req)}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
                            >
                              <PackagePlus className="w-3.5 h-3.5" /> Tạo phiếu
                            </button>
                          )}
                          {/* Nút Hủy — Sale, khi pending */}
                          {isSale && req.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(req)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
                            >
                              <Ban className="w-3.5 h-3.5" /> Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Chi tiết ────────────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Chi tiết yêu cầu xuất kho</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedRequest.code}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Thông tin chung */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Khách hàng</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedRequest.tenKhachHang}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Trạng thái</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Người tạo</p>
                  <p className="text-sm text-slate-700">
                    {selectedRequest.createdByUser?.fullName || selectedRequest.createdByUser?.username}
                    <span className="ml-1 text-xs text-slate-400">({selectedRequest.createdByUser?.role})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ngày tạo</p>
                  <p className="text-sm text-slate-700">{fmtDate(selectedRequest.createdAt)} {fmtTime(selectedRequest.createdAt)}</p>
                </div>
                {selectedRequest.note && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ghi chú</p>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2">{selectedRequest.note}</p>
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Sản phẩm yêu cầu</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-xs text-slate-500 font-bold uppercase">
                        <th className="px-4 py-2.5 text-left">Sản phẩm</th>
                        <th className="px-4 py-2.5 text-right">Số lượng</th>
                        <th className="px-4 py-2.5 text-right">Giá ước tính</th>
                        <th className="px-4 py-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRequest.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{item.product?.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.product?.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-right">{item.quantity} {item.product?.unit}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.priceEstimate)}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency((parseFloat(item.priceEstimate) || 0) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-100">
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase">Tổng ước tính</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(selectedRequest.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Nút Tạo phiếu — kho/QL khi pending */}
              {!isSale && selectedRequest.status === 'pending' && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setSelectedRequest(null); openFulfillModal(selectedRequest); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    <PackagePlus className="w-4 h-4" /> Tạo phiếu xuất kho từ yêu cầu này
                  </button>
                </div>
              )}

              {/* Nút Hủy — Sale khi pending */}
              {isSale && selectedRequest.status === 'pending' && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { handleCancel(selectedRequest); setSelectedRequest(null); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Ban className="w-4 h-4" /> Hủy yêu cầu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tạo yêu cầu (Sale) ──────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Tạo yêu cầu xuất kho</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-5">
              {/* Tên khách hàng */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tenKhachHang}
                  onChange={e => setForm({ ...form, tenKhachHang: e.target.value })}
                  placeholder="Nhập tên khách hàng..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Mô tả thêm về yêu cầu (thời gian cần, đặc biệt...)..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none"
                />
              </div>

              {/* Sản phẩm */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Sản phẩm yêu cầu <span className="text-red-500">*</span>
                  </label>
                  <button type="button" onClick={addFormItem}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
                  </button>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-50 rounded-xl p-3">
                      {/* Sản phẩm */}
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Sản phẩm</label>
                        <select
                          value={item.productId}
                          onChange={e => changeFormItem(idx, 'productId', e.target.value)}
                          required
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>
                      {/* Số lượng */}
                      <div className="w-24">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Số lượng</label>
                        <input
                          type="number" min="1"
                          value={item.quantity}
                          onChange={e => changeFormItem(idx, 'quantity', e.target.value)}
                          required
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-center"
                        />
                      </div>
                      {/* Giá ước tính */}
                      <div className="w-32">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Giá ước tính</label>
                        <input
                          type="number" min="0"
                          value={item.priceEstimate}
                          onChange={e => changeFormItem(idx, 'priceEstimate', e.target.value)}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-right"
                        />
                      </div>
                      {/* Xóa */}
                      {formItems.length > 1 && (
                        <button type="button" onClick={() => removeFormItem(idx)}
                          className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Tạo phiếu từ yêu cầu (kho) ───────────────────── */}
      {showFulfillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Tạo phiếu xuất kho</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Từ yêu cầu <span className="font-mono font-bold">{showFulfillModal.code}</span> — {showFulfillModal.tenKhachHang}
                </p>
              </div>
              <button onClick={() => setShowFulfillModal(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleFulfill} className="p-6 space-y-5">
              <p className="text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                Chọn <strong>khay lấy hàng</strong> cho từng sản phẩm. Phiếu sẽ được tạo ở trạng thái <em>Chờ phê duyệt</em>.
              </p>

              <div className="space-y-3">
                {fulfillItems.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{item.productName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.productSku}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                        {item.quantity} {item.productUnit}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Vị trí lấy hàng (cascade) */}
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Vị trí lấy hàng <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">Khu vực</p>
                            <select value={item._zone}
                              onChange={e => {
                                const next = [...fulfillItems];
                                next[idx]._zone = e.target.value;
                                next[idx]._rack = '';
                                next[idx].warehouseNode = '';
                                setFulfillItems(next);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400">
                              <option value="">-- Tất cả --</option>
                              {allNodes.filter(n => n.type === 'zone').map(z => (
                                <option key={z._id} value={z._id}>{z.code} – {z.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">Kệ chứa</p>
                            <select value={item._rack}
                              onChange={e => {
                                const next = [...fulfillItems];
                                next[idx]._rack = e.target.value;
                                next[idx].warehouseNode = '';
                                setFulfillItems(next);
                              }}
                              disabled={!item._zone}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed">
                              <option value="">-- Tất cả --</option>
                              {getDescOfType(item._zone, 'rack').map(r => (
                                <option key={r._id} value={r._id}>{r.code} – {r.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1"><span className="text-red-400 mr-0.5">*</span> Khay (Bin)</p>
                            <select required value={item.warehouseNode}
                              onChange={e => {
                                const next = [...fulfillItems];
                                next[idx].warehouseNode = e.target.value;
                                setFulfillItems(next);
                              }}
                              disabled={!item._rack}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed">
                              <option value="">-- Chọn khay --</option>
                              {getDescOfType(item._rack || item._zone || null, 'bin').map(b => (
                                <option key={b._id} value={b._id}>{b.code} · {b.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      {/* Đơn giá */}
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Đơn giá</label>
                        <input
                          type="number" min="0"
                          value={item.price}
                          onChange={e => {
                            const next = [...fulfillItems];
                            next[idx].price = e.target.value;
                            setFulfillItems(next);
                          }}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowFulfillModal(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button type="submit" disabled={fulfilling}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {fulfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
                  Tạo phiếu xuất kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
