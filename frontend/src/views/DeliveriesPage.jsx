import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DeliveryModel } from '../models/delivery.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { CategoryModel } from '../models/category.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import { IncidentModel } from '../models/incident.model.js';
import toast from 'react-hot-toast';
import { Plus, Eye, CheckCircle2, X, Clipboard, Truck, PackageCheck, CircleDot, Search, Calendar, PenLine, Send } from 'lucide-react';

const STATUS_CONFIG = {
  preparing: { label: 'Đang soạn',       color: 'bg-violet-100 text-violet-700 border-violet-200', step: 1 },
  draft:     { label: 'Chờ phê duyệt',   color: 'bg-slate-100 text-slate-700 border-slate-200',   step: 2 },
  approved:  { label: 'Đã phê duyệt',    color: 'bg-blue-100 text-blue-700 border-blue-200',      step: 3 },
  shipping:  { label: 'Đang vận chuyển', color: 'bg-amber-100 text-amber-700 border-amber-200',   step: 4 },
  completed: { label: 'Hoàn tất',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', step: 5 },
  rejected:  { label: 'Từ chối',         color: 'bg-red-100 text-red-700 border-red-200',         step: 0 },
  cancelled: { label: 'Đã hủy',         color: 'bg-gray-100 text-gray-600 border-gray-200',      step: 0 },
};

const WORKFLOW_STEPS = [
  { key: 'preparing', label: 'Soạn phiếu', icon: PenLine },
  { key: 'draft',     label: 'Chờ duyệt',  icon: Clipboard },
  { key: 'approved',  label: 'Đã duyệt',   icon: CheckCircle2 },
  { key: 'shipping',  label: 'Xuất hàng',  icon: Truck },
  { key: 'completed', label: 'Hoàn tất',   icon: PackageCheck },
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
  const { hasPermission, user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Bộ lọc & tìm kiếm ────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [showSugg, setShowSugg]         = useState(false);
  const searchRef = useRef(null);
  const [filterWarehouse, setFilterWarehouse] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null); // null = tạo mới, object = sửa phiếu
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('damage');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentItems, setIncidentItems] = useState([]);

  const [tenKhachHang, setTenKhachHang] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '', _category: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dData, pData, wData, catData] = await Promise.all([
        DeliveryModel.getAll(),
        ProductModel.getAll(),
        WarehouseModel.getAll(),
        CategoryModel.getAll()
      ]);
      setDeliveries(dData);
      setProducts(pData);
      setBins(wData.filter(n => n.type === 'bin'));
      setAllNodes(wData);
      setCategories(catData);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu phiếu xuất: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return deliveries.filter(d =>
      d.code?.toLowerCase().includes(q) ||
      d.tenKhachHang?.toLowerCase().includes(q) ||
      d.items?.some(i =>
        i.product?.name?.toLowerCase().includes(q) ||
        i.product?.sku?.toLowerCase().includes(q)
      )
    ).slice(0, 6);
  }, [searchQuery, deliveries]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let validBinCodes = null;
    if (filterWarehouse) {
      validBinCodes = new Set();
      const bfsQ = [parseInt(filterWarehouse)], bfsSeen = new Set();
      while (bfsQ.length) {
        const id = bfsQ.shift();
        if (bfsSeen.has(id)) continue;
        bfsSeen.add(id);
        allNodes.forEach(n => {
          const pid = n.parentId ?? n.parent?._id;
          if (pid === id) { if (n.type === 'bin') validBinCodes.add(n.code); else bfsQ.push(n._id); }
        });
      }
    }
    return deliveries.filter(d => {
      const matchQ = !q ||
        d.code?.toLowerCase().includes(q) ||
        d.tenKhachHang?.toLowerCase().includes(q) ||
        d.items?.some(i =>
          i.product?.name?.toLowerCase().includes(q) ||
          i.product?.sku?.toLowerCase().includes(q)
        );
      const matchSt  = !filterStatus || d.status === filterStatus;
      const matchFr  = !filterFrom   || new Date(d.createdAt) >= new Date(filterFrom);
      const matchTo_ = !filterTo     || new Date(d.createdAt) <= new Date(filterTo + 'T23:59:59');
      const matchWH  = !validBinCodes || d.items?.some(i => validBinCodes.has(i.warehouseNode?.code));
      return matchQ && matchSt && matchFr && matchTo_ && matchWH;
    });
  }, [deliveries, searchQuery, filterStatus, filterFrom, filterTo, filterWarehouse, allNodes]);

  const handleAddItemRow = () => setItems([...items, { product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '', _category: '' }]);
  const handleRemoveItemRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const handleItemChange = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    if (field === 'product') {
      const prod = products.find(p => p._id === val);
      if (prod) newItems[idx].price = prod.priceOut;
    }
    if (field === '_category') { newItems[idx].product = ''; }
    if (field === '_zone') { newItems[idx]._rack = ''; newItems[idx].warehouseNode = ''; }
    if (field === '_rack') { newItems[idx].warehouseNode = ''; }
    setItems(newItems);
  };

  // Mở modal sửa — chỉ gọi khi phiếu đang ở trạng thái nháp
  const openEditModal = (delivery) => {
    setEditingDelivery(delivery);
    setTenKhachHang(delivery.tenKhachHang);
    setItems(delivery.items?.map(i => ({
      product: i.product?._id || i.productId,
      quantity: i.quantity,
      price: i.price,
      warehouseNode: i.warehouseNode?._id || i.warehouseNodeId,
      _zone: '',
      _rack: ''
    })) || [{ product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '', _category: '' }]);
    setShowAddModal(true);
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (!tenKhachHang.trim()) return toast.error('Vui lòng nhập tên khách hàng');
    if (items.some(item => !item.product || item.quantity <= 0 || !item.warehouseNode))
      return toast.error('Vui lòng điền đầy đủ sản phẩm, số lượng và khay lấy hàng');

    try {
      if (editingDelivery) {
        // Sửa phiếu — chỉ khi đang preparing (backend cũng kiểm tra lại)
        await DeliveryModel.update(editingDelivery._id, {
          tenKhachHang: tenKhachHang.trim(),
          items: items.map(item => ({
            product: item.product,
            quantity: Number(item.quantity),
            price: Number(item.price),
            warehouseNode: item.warehouseNode
          }))
        });
        toast.success('Đã cập nhật phiếu xuất kho');
      } else {
        // Tạo mới
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
      }
      setShowAddModal(false);
      setEditingDelivery(null);
      setTenKhachHang('');
      setItems([{ product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '', _category: '' }]);
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  const handleTransitionStatus = async (deliveryId, targetStatus, extra = {}) => {
    const labels = {
      draft:     'Đã gửi phiếu xuất để Quản lý phê duyệt',
      approved:  'Đã phê duyệt phiếu xuất',
      shipping:  'Đã xác nhận xuất hàng – đang vận chuyển',
      completed: 'Hoàn tất xuất kho – đã trừ tồn kho',
      rejected:  'Đã từ chối phiếu xuất',
    };
    try {
      let res;
      if (targetStatus === 'draft')     res = await DeliveryModel.submit(deliveryId);
      else if (targetStatus === 'approved')  res = await DeliveryModel.approve(deliveryId);
      else if (targetStatus === 'rejected')  res = await DeliveryModel.reject(deliveryId, extra.rejectNote);
      else if (targetStatus === 'shipping')  res = await DeliveryModel.ship(deliveryId);
      else if (targetStatus === 'completed') res = await DeliveryModel.complete(deliveryId);
      toast.success(labels[targetStatus] || 'Đã cập nhật trạng thái');
      const updatedDelivery = res?.delivery || res;
      setSelectedDelivery(updatedDelivery);
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
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
          <h2 className="text-xl font-bold text-slate-800">Quản lý Phiếu Xuất kho</h2>
          <p className="text-sm text-slate-500">Tạo và theo dõi quy trình xuất hàng theo từng bước phê duyệt</p>
        </div>
        <PermissionGuard permission="delivery:create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4 h-4" /> Lập phiếu xuất
          </button>
        </PermissionGuard>
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
              placeholder="Tìm theo mã phiếu, tên khách hàng, sản phẩm..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
            />
            {showSugg && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                {suggestions.map(d => (
                  <button key={d._id} type="button"
                    onMouseDown={() => { setSearchQuery(d.code); setShowSugg(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-slate-50 last:border-0 transition-colors flex items-center gap-2"
                  >
                    <span className="font-mono font-bold text-slate-900 text-sm">{d.code}</span>
                    {d.tenKhachHang && <span className="text-xs text-slate-400 truncate flex-1">— {d.tenKhachHang}</span>}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[d.status]?.color}`}>{STATUS_CONFIG[d.status]?.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 min-w-[170px]">
            <option value="">Tất cả trạng thái</option>
            <option value="preparing">Đang soạn</option>
            <option value="draft">Chờ phê duyệt</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="shipping">Đang vận chuyển</option>
            <option value="completed">Hoàn tất</option>
            <option value="rejected">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 min-w-[140px]">
            <option value="">Tất cả kho</option>
            {allNodes.filter(n => n.type === 'warehouse').map(n => (
              <option key={n._id} value={n._id}>{n.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400" />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400" />
          </div>
          {(searchQuery || filterStatus || filterWarehouse || filterFrom || filterTo) && (
            <button onClick={() => { setSearchQuery(''); setFilterStatus(''); setFilterWarehouse(''); setFilterFrom(''); setFilterTo(''); }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors">
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
            {filtered.length} / {deliveries.length} phiếu
          </span>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2">Đang tải danh sách phiếu xuất...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {deliveries.length === 0 ? 'Chưa có phiếu xuất kho nào được tạo' : 'Không tìm thấy phiếu phù hợp với bộ lọc'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide">
                  <th className="px-5 py-3.5">Mã phiếu</th>
                  <th className="px-5 py-3.5">Khách hàng</th>
                  <th className="px-5 py-3.5">Hàng hóa</th>
                  <th className="px-5 py-3.5">Từ yêu cầu</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Ngày tạo</th>
                  <th className="px-5 py-3.5 text-right">Tổng tiền</th>
                  <th className="px-5 py-3.5">Người lập</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filtered.map(d => {
                  const itemCount = d.items?.length || 0;
                  const itemSummary = d.items?.slice(0, 2).map(i => i.product?.name || '').filter(Boolean).join(', ');
                  const createdDate = d.createdAt
                    ? new Date(d.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—';
                  const createdTime = d.createdAt
                    ? new Date(d.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                  <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Mã phiếu */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {d.code}
                      </span>
                    </td>
                    {/* Khách hàng */}
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800">{d.tenKhachHang}</span>
                    </td>
                    {/* Hàng hóa */}
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 text-xs font-medium truncate max-w-[160px]" title={itemSummary}>
                        {itemSummary || '—'}
                        {itemCount > 2 && <span className="text-slate-400"> +{itemCount - 2}</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{itemCount} sản phẩm</p>
                    </td>
                    {/* Từ yêu cầu */}
                    <td className="px-5 py-3.5">
                      {d.fromRequest ? (
                        <span className="font-mono text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded">
                          {d.fromRequest.code}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    {/* Trạng thái */}
                    <td className="px-5 py-3.5">
                      {renderStatusBadge(d.status)}
                    </td>
                    {/* Ngày tạo */}
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 text-xs font-medium">{createdDate}</p>
                      <p className="text-[10px] text-slate-400">{createdTime}</p>
                    </td>
                    {/* Tổng tiền */}
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(d.totalAmount)}
                    </td>
                    {/* Người lập */}
                    <td className="px-5 py-3.5 text-slate-500">
                      <p className="font-medium text-xs">{d.createdByUser?.fullName || d.createdByUser?.username}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{d.createdByUser?.role}</p>
                    </td>
                    {/* Thao tác */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedDelivery(d)}
                        className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                      </button>
                    </td>
                  </tr>
                  );
                })}
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
                {editingDelivery ? `Sửa phiếu ${editingDelivery.code}` : 'Lập Phiếu Xuất Kho'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingDelivery(null); setTenKhachHang(''); setItems([{ product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '', _category: '' }]); }} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
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
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sản phẩm *</div>
                  <div className="w-28 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-center">Số lượng</div>
                  <div className="w-32 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Đơn giá xuất (đ)</div>
                  <div className="w-7"></div>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 px-3.5 py-3 rounded-xl border border-slate-200 space-y-2.5">
                      {/* Dòng 1: Sản phẩm + Số lượng + Đơn giá + Xóa */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <select value={item._category} onChange={(e) => handleItemChange(idx, '_category', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500">
                            <option value="">-- Tất cả danh mục --</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                          <select required value={item.product} onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                            disabled={!item._category}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed">
                            <option value="" disabled>-- Chọn sản phẩm --</option>
                            {products.filter(p => !item._category || p.categoryId === parseInt(item._category)).map(p => (
                              <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-28 relative">
                          <input type="number" required min="1" value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 text-center" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 pointer-events-none select-none">
                            {products.find(p => p._id == item.product)?.unit || 'cái'}
                          </span>
                        </div>
                        <div className="w-32 relative">
                          <input type="number" required min="0" value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg pl-2 pr-5 py-1.5 text-xs text-slate-700 text-right" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 pointer-events-none select-none">đ</span>
                        </div>
                        <button type="button" disabled={items.length <= 1} onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg disabled:opacity-50">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Dòng 2: Phân cấp vị trí */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">Khu vực</p>
                          <select value={item._zone} onChange={(e) => handleItemChange(idx, '_zone', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500">
                            <option value="">-- Tất cả --</option>
                            {allNodes.filter(n => n.type === 'zone').map(z => (
                              <option key={z._id} value={z._id}>{z.code} – {z.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">Kệ chứa</p>
                          <select value={item._rack} onChange={(e) => handleItemChange(idx, '_rack', e.target.value)}
                            disabled={!item._zone}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed">
                            <option value="">-- Tất cả --</option>
                            {getDescOfType(item._zone, 'rack').map(r => (
                              <option key={r._id} value={r._id}>{r.code} – {r.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1"><span className="text-red-400 mr-0.5">*</span> Khay (Bin)</p>
                          <select required value={item.warehouseNode} onChange={(e) => handleItemChange(idx, 'warehouseNode', e.target.value)}
                            disabled={!item._rack}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed">
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
                  Tổng dự kiến:{' '}
                  <strong className="text-slate-900">{formatCurrency(items.reduce((s, i) => s + (Number(i.quantity) * Number(i.price) || 0), 0))}</strong>
                </span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowAddModal(false); setEditingDelivery(null); setTenKhachHang(''); setItems([{ product: '', quantity: 1, price: 0, warehouseNode: '', _zone: '', _rack: '', _category: '' }]); }} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">Hủy</button>
                  <button type="submit" className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/10">
                    {editingDelivery ? 'Lưu thay đổi' : 'Tạo phiếu'}
                  </button>
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

              {/* Lý do từ chối — hiển thị khi phiếu bị rejected */}
              {selectedDelivery.status === 'rejected' && selectedDelivery.rejectNote && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1">Lý do từ chối</p>
                  <p className="text-sm text-red-700">{selectedDelivery.rejectNote}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Tổng: <strong className="text-slate-900 text-base">{formatCurrency(selectedDelivery.totalAmount)}</strong>
                </span>

                <div className="flex flex-wrap gap-2">
                  {/* Sửa nội dung — CHỈ khi đang soạn (preparing) */}
                  {selectedDelivery.status === 'preparing' && (
                    <PermissionGuard permission="delivery:update">
                      <button
                        onClick={() => { setSelectedDelivery(null); openEditModal(selectedDelivery); }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <PenLine className="w-3.5 h-3.5" /> Sửa phiếu
                      </button>
                    </PermissionGuard>
                  )}

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

                  {/* Gửi phê duyệt — CHỈ khi đang soạn (preparing), KeToanKho */}
                  {selectedDelivery.status === 'preparing' && (
                    <PermissionGuard permission="delivery:create">
                      <button
                        onClick={() => handleTransitionStatus(selectedDelivery._id, 'draft')}
                        className="px-3.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Gửi phê duyệt
                      </button>
                    </PermissionGuard>
                  )}

                  {/* Từ chối — CHỈ khi chờ phê duyệt (draft), QuanLyKho */}
                  {selectedDelivery.status === 'draft' && (
                    <PermissionGuard permission="delivery:approve">
                      <button
                        onClick={() => { setRejectNote(''); setShowRejectModal(true); }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold"
                      >
                        ✕ Từ chối
                      </button>
                    </PermissionGuard>
                  )}

                  {/* Duyệt phiếu — CHỈ khi chờ phê duyệt (draft), QuanLyKho */}
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

                  {/* Xác nhận xuất hàng — CHỈ khi approved, NhanVienKho */}
                  {selectedDelivery.status === 'approved' && (
                    <PermissionGuard permission="delivery:ship">
                      <button
                        onClick={() => handleTransitionStatus(selectedDelivery._id, 'shipping')}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> Xác nhận xuất hàng
                      </button>
                    </PermissionGuard>
                  )}

                  {/* Hoàn tất xuất kho — CHỈ khi shipping, QuanLyKho */}
                  {selectedDelivery.status === 'shipping' && (
                    <PermissionGuard permission="delivery:complete">
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

      {/* Reject Reason Modal */}
      {showRejectModal && selectedDelivery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Từ chối phiếu xuất</h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Vui lòng ghi rõ lý do để Kế toán kho biết và điều chỉnh:
              </p>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                rows="3"
                placeholder="Ví dụ: Số lượng vượt hạn mức cho phép, sản phẩm không khớp yêu cầu..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-red-400 text-sm resize-none"
              />
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!rejectNote.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
                    handleTransitionStatus(selectedDelivery._id, 'rejected', { rejectNote: rejectNote.trim() });
                    setShowRejectModal(false);
                    setRejectNote('');
                  }}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold"
                >
                  Xác nhận từ chối
                </button>
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
