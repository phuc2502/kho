import React, { useState, useEffect } from 'react';
import { DeliveryModel } from '../models/delivery.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import { IncidentModel } from '../models/incident.model.js';
import toast from 'react-hot-toast';
import { Plus, Eye, CheckCircle2, X, Clipboard, Truck, PackageCheck, CircleDot } from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Chờ phê duyệt', color: 'bg-slate-100 text-slate-700 border-slate-200', step: 1 },
  approved: { label: 'Đã phê duyệt', color: 'bg-blue-100 text-blue-700 border-blue-200', step: 2 },
  shipping: { label: 'Đang vận chuyển', color: 'bg-amber-100 text-amber-700 border-amber-200', step: 3 },
  completed: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', step: 4 },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-200', step: 0 },
  cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-600 border-gray-200', step: 0 },
};

const WORKFLOW_STEPS = [
  { key: 'draft', label: 'Lập phiếu', icon: Clipboard },
  { key: 'approved', label: 'Phê duyệt', icon: CheckCircle2 },
  { key: 'shipping', label: 'Xuất hàng', icon: Truck },
  { key: 'completed', label: 'Hoàn tất', icon: PackageCheck },
];

const WorkflowBar = ({ currentStatus }) => {
  const currentStep = STATUS_CONFIG[currentStatus]?.step || 0;
  const isTerminal = currentStatus === 'rejected' || currentStatus === 'cancelled';

  if (isTerminal) {
    return (
      <div className={`px-3 py-2 rounded-xl text-xs font-semibold ${STATUS_CONFIG[currentStatus]?.color} border`}>
        {STATUS_CONFIG[currentStatus]?.label}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all
              ${isDone ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : isActive ? 'bg-primary-500 text-white border-primary-500 shadow shadow-primary-500/20'
                  : 'bg-slate-100 text-slate-400 border-slate-200'}`}
            >
              <Icon className="w-3 h-3" />
              {step.label}
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

export const DeliveriesPage = () => {
  const { hasPermission } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('damage');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentItems, setIncidentItems] = useState([]);

  const [tenKhachHang, setTenKhachHang] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1, price: 0, warehouseNode: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dData, pData, wData] = await Promise.all([
        DeliveryModel.getAll(),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setDeliveries(dData);
      setProducts(pData);
      setBins(wData.filter(n => n.type === 'bin'));
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu phiếu xuất: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddItemRow = () => setItems([...items, { product: '', quantity: 1, price: 0, warehouseNode: '' }]);
  const handleRemoveItemRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const handleItemChange = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    if (field === 'product') {
      const prod = products.find(p => p._id === val);
      if (prod) newItems[idx].price = prod.priceOut;
    }
    setItems(newItems);
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (!tenKhachHang.trim()) return toast.error('Vui lòng nhập tên khách hàng');
    if (items.some(item => !item.product || item.quantity <= 0 || !item.warehouseNode))
      return toast.error('Vui lòng điền đầy đủ sản phẩm, số lượng và khay lấy hàng');

    try {
      await DeliveryModel.create({
        tenKhachHang: tenKhachHang.trim(),
        items: items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity),
          price: Number(item.price),
          warehouseNode: item.warehouseNode
        }))
      });
      toast.success('Lập phiếu xuất kho nháp thành công');
      setShowAddModal(false);
      setTenKhachHang('');
      setItems([{ product: '', quantity: 1, price: 0, warehouseNode: '' }]);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lập phiếu xuất: ' + error.message);
    }
  };

  const handleTransitionStatus = async (deliveryId, targetStatus) => {
    const labels = {
      approved: 'Đã phê duyệt phiếu xuất',
      shipping: 'Đã xác nhận xuất hàng – đang vận chuyển',
      completed: 'Hoàn tất xuất kho – đã trừ tồn kho',
      rejected: 'Đã từ chối phiếu xuất',
    };
    try {
      const updated = await DeliveryModel.update(deliveryId, { status: targetStatus });
      toast.success(labels[targetStatus] || `Đã cập nhật trạng thái`);
      setSelectedDelivery(updated);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + error.message);
    }
  };

  const handleSubmitQuickIncident = async (e) => {
    e.preventDefault();
    const checkedItems = incidentItems.filter(item => item.checked);
    if (checkedItems.length === 0) return toast.error('Vui lòng chọn ít nhất một sản phẩm gặp sự cố');
    if (checkedItems.some(item => item.quantity <= 0 || item.quantity > item.maxQty))
      return toast.error('Số lượng sự cố không hợp lệ');
    try {
      await IncidentModel.create({
        type: incidentType,
        refType: 'delivery',
        refId: selectedDelivery._id,
        note: incidentNote,
        items: checkedItems.map(item => ({ productId: item.productId, quantity: Number(item.quantity) }))
      });
      toast.success('Báo cáo sự cố thành công');
      setShowIncidentModal(false);
    } catch (error) {
      toast.error('Lỗi khi báo cáo sự cố: ' + error.message);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const renderStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Phiếu Xuất kho</h2>
          <p className="text-sm text-slate-500">Tạo và theo dõi quy trình xuất hàng theo từng bước phê duyệt</p>
        </div>
        <PermissionGuard permission="delivery:create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4 h-4" />
            Lập phiếu xuất
          </button>
        </PermissionGuard>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2">Đang tải danh sách phiếu xuất...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có phiếu xuất kho nào được tạo</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-5 py-4">Mã phiếu</th>
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Quy trình</th>
                  <th className="px-5 py-4 text-right">Tổng tiền</th>
                  <th className="px-5 py-4">Người lập</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {deliveries.map(d => (
                  <tr key={d._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{d.code}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{d.tenKhachHang}</td>
                    <td className="px-5 py-4">
                      <WorkflowBar currentStatus={d.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">{formatCurrency(d.totalAmount)}</td>
                    <td className="px-5 py-4 text-slate-500">
                      <p className="font-medium">{d.createdByUser?.username}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{d.createdByUser?.role}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedDelivery(d)}
                        className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                      </button>
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
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-primary-500" />
                Lập Phiếu Xuất Kho
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateDelivery} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={tenKhachHang}
                  onChange={(e) => setTenKhachHang(e.target.value)}
                  placeholder="Ví dụ: Samsung Electronics Vietnam Co., Ltd"
                  className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách mặt hàng xuất</h4>
                  <button type="button" onClick={handleAddItemRow} className="text-xs font-semibold text-primary-500 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng mới
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 px-1">
                  <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sản phẩm *</div>
                  <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-center">Số lượng</div>
                  <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Đơn giá xuất (đ)</div>
                  <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Khay lấy hàng *</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <select required value={item.product} onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500">
                          <option value="" disabled>-- Chọn sản phẩm --</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2 relative">
                        <input type="number" required min="1" value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 text-center" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 pointer-events-none select-none">
                          {products.find(p => p._id == item.product)?.unit || 'cái'}
                        </span>
                      </div>
                      <div className="col-span-2 relative">
                        <input type="number" required min="0" value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-2 pr-5 py-1.5 text-xs text-slate-700 text-right" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 pointer-events-none select-none">đ</span>
                      </div>
                      <div className="col-span-3">
                        <select required value={item.warehouseNode} onChange={(e) => handleItemChange(idx, 'warehouseNode', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500">
                          <option value="" disabled>-- Chọn khay --</option>
                          {bins.map(b => <option key={b._id} value={b._id}>{b.code} ({b.name})</option>)}
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        <button type="button" disabled={items.length <= 1} onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg disabled:opacity-50">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">
                  Tổng dự kiến:{' '}
                  <strong className="text-slate-900">{formatCurrency(items.reduce((s, i) => s + (Number(i.quantity) * Number(i.price) || 0), 0))}</strong>
                </span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">Hủy</button>
                  <button type="submit" className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/10">Tạo phiếu</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Phiếu Xuất Kho</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{selectedDelivery.code}</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Workflow */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Quy trình xuất kho</p>
                <div className="flex justify-center">
                  <WorkflowBar currentStatus={selectedDelivery.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Khách hàng</p>
                  <p className="font-bold text-slate-800 mt-1">{selectedDelivery.tenKhachHang}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Người lập phiếu</p>
                  <p className="font-bold text-slate-800 mt-1">{selectedDelivery.createdByUser?.username}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase mb-2 flex items-center gap-1.5">
                  <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Danh sách sản phẩm
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                        <th className="px-4 py-2.5">Sản phẩm</th>
                        <th className="px-4 py-2.5">Khay (Bin)</th>
                        <th className="px-4 py-2.5 text-center">SL</th>
                        <th className="px-4 py-2.5 text-right">Đơn giá</th>
                        <th className="px-4 py-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDelivery.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40">
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-slate-900">{item.product?.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">{item.product?.sku}</span>
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-primary-600">{item.warehouseNode?.code}</td>
                          <td className="px-4 py-2.5 text-center font-bold">{item.quantity} {item.product?.unit}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(item.quantity * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Tổng: <strong className="text-slate-900 text-base">{formatCurrency(selectedDelivery.totalAmount)}</strong>
                </span>

                <div className="flex flex-wrap gap-2">
                  <PermissionGuard permission="incident:create">
                    <button
                      onClick={() => {
                        setIncidentItems(selectedDelivery.items.map(item => ({
                          productId: item.product?._id || item.product,
                          name: item.product?.name || '',
                          sku: item.product?.sku || '',
                          maxQty: item.quantity,
                          quantity: item.quantity,
                          checked: false
                        })));
                        setIncidentType('damage');
                        setIncidentNote('');
                        setShowIncidentModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold"
                    >
                      ⚠️ Báo sự cố
                    </button>
                  </PermissionGuard>

                  {(selectedDelivery.status === 'draft' || selectedDelivery.status === 'approved') && (
                    <PermissionGuard permission="delivery:approve">
                      <button
                        onClick={() => handleTransitionStatus(selectedDelivery._id, 'rejected')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold"
                      >
                        ✕ Từ chối
                      </button>
                    </PermissionGuard>
                  )}

                  {selectedDelivery.status === 'draft' && (
                    <PermissionGuard permission="delivery:approve">
                      <button
                        onClick={() => handleTransitionStatus(selectedDelivery._id, 'approved')}
                        className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt phiếu
                      </button>
                    </PermissionGuard>
                  )}

                  {selectedDelivery.status === 'approved' && (
                    <PermissionGuard permission="delivery:update">
                      <button
                        onClick={() => handleTransitionStatus(selectedDelivery._id, 'shipping')}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> Xác nhận xuất hàng
                      </button>
                    </PermissionGuard>
                  )}

                  {selectedDelivery.status === 'shipping' && (
                    <PermissionGuard permission="delivery:approve">
                      <button
                        onClick={() => handleTransitionStatus(selectedDelivery._id, 'completed')}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <PackageCheck className="w-3.5 h-3.5" /> Hoàn tất xuất kho
                      </button>
                    </PermissionGuard>
                  )}

                  <button onClick={() => setSelectedDelivery(null)} className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">Đóng</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Incident Modal */}
      {showIncidentModal && selectedDelivery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Báo cáo Sự cố</h3>
                <p className="text-xs text-slate-500 mt-0.5">Phiếu xuất: {selectedDelivery.code}</p>
              </div>
              <button onClick={() => setShowIncidentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitQuickIncident} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại sự cố *</label>
                <select required value={incidentType} onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 text-sm">
                  <option value="damage">Hàng bị hư hỏng</option>
                  <option value="shortage">Thiếu hụt số lượng</option>
                  <option value="wrong_product">Sai sản phẩm</option>
                  <option value="expired">Hàng hết hạn</option>
                  <option value="other">Sự cố khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả / Ghi chú</label>
                <textarea value={incidentNote} onChange={(e) => setIncidentNote(e.target.value)}
                  rows="3" placeholder="Nhập mô tả sự cố..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Chọn sản phẩm gặp sự cố *</label>
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead><tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase"><th className="px-3 py-2 w-8">✓</th><th className="px-3 py-2">Sản phẩm</th><th className="px-3 py-2 text-right">SL sự cố</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {incidentItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={item.checked}
                              onChange={(e) => { const n = [...incidentItems]; n[idx].checked = e.target.checked; setIncidentItems(n); }}
                              className="rounded border-slate-300 text-primary-600" />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku} (max: {item.maxQty})</p>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input type="number" min="1" max={item.maxQty} disabled={!item.checked} value={item.quantity}
                              onChange={(e) => { const n = [...incidentItems]; n[idx].quantity = e.target.value; setIncidentItems(n); }}
                              className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center text-xs" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">Hủy</button>
                <button type="submit" className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-500/10">Gửi báo cáo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
