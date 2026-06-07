import React, { useState, useEffect } from 'react';
import { ReceiptModel } from '../models/receipt.model.js';
import { PartnerModel } from '../models/partner.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import { IncidentModel } from '../models/incident.model.js';
import toast from 'react-hot-toast';
import { Plus, Eye, CheckCircle2, ChevronRight, X, Calendar, Clipboard } from 'lucide-react';

export const ReceiptsPage = () => {
  const { hasPermission } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Quick Incident state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('damage');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentItems, setIncidentItems] = useState([]);

  // Form states
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1, price: 0, warehouseNode: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rData, sData, pData, wData] = await Promise.all([
        ReceiptModel.getAll(),
        PartnerModel.getAll('supplier'),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setReceipts(rData);
      setSuppliers(sData);
      setProducts(pData);
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

    // Automatically fill default priceIn if product is selected
    if (field === 'product') {
      const prod = products.find(p => p._id === val);
      if (prod) {
        newItems[idx].price = prod.priceIn;
      }
    }
    setItems(newItems);
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return;
    }

    const invalidItem = items.some(item => !item.product || item.quantity <= 0 || !item.warehouseNode);
    if (invalidItem) {
      toast.error('Vui lòng điền đầy đủ sản phẩm, số lượng và khay chứa hàng');
      return;
    }

    try {
      await ReceiptModel.create({
        partner: selectedSupplier,
        items: items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity),
          price: Number(item.price),
          warehouseNode: item.warehouseNode
        }))
      });
      toast.success('Lập phiếu nhập kho nháp thành công');
      setShowAddModal(false);
      setSelectedSupplier('');
      setItems([{ product: '', quantity: 1, price: 0, warehouseNode: '' }]);
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

  const renderStatusBadge = (status) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      approved: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Phiếu Nhập kho (Receipts)</h2>
          <p className="text-sm text-slate-500">Tạo phiếu nhập nháp và duyệt nhập kho trực tiếp vào vị trí khay chứa</p>
        </div>
        <PermissionGuard permission="receipt:create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            Lập phiếu nhập
          </button>
        </PermissionGuard>
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
                  <th className="px-6 py-4">Mã phiếu</th>
                  <th className="px-6 py-4">Nhà cung cấp</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4">Người lập</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {receipts.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.code}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{r.partner?.name}</td>
                    <td className="px-6 py-4">{renderStatusBadge(r.status)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-950">{formatCurrency(r.totalAmount)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <div>
                        <p>{r.createdByUser?.username}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{r.createdByUser?.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReceipt(r)}
                          className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-4 h-4" /> Chi tiết
                        </button>
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
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Lập Phiếu Nhập Kho</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateReceipt} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chọn Nhà cung cấp *</label>
                <select
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                >
                  <option value="" disabled>-- Chọn Nhà cung cấp --</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
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

                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <select
                          required
                          value={item.product}
                          onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700"
                        >
                          <option value="" disabled>-- Chọn sản phẩm --</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="SL"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 text-center"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="Giá nhập"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 text-right"
                        />
                      </div>

                      <div className="col-span-3">
                        <select
                          required
                          value={item.warehouseNode}
                          onChange={(e) => handleItemChange(idx, 'warehouseNode', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700"
                        >
                          <option value="" disabled>-- Khay chứa (Bin) --</option>
                          {bins.map(b => (
                            <option key={b._id} value={b._id}>{b.code} ({b.name})</option>
                          ))}
                        </select>
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
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Nhà cung cấp</p>
                  <p className="font-bold text-slate-800 mt-1">{selectedReceipt.partner?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Trạng thái phiếu</p>
                  <p className="mt-1">{renderStatusBadge(selectedReceipt.status)}</p>
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
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors animate-all"
                    >
                      ⚠️ Báo sự cố
                    </button>
                  </PermissionGuard>

                  {(selectedReceipt.status === 'draft' || selectedReceipt.status === 'approved') && (
                    <PermissionGuard permission="receipt:approve">
                      <button
                        onClick={() => handleTransitionStatus(selectedReceipt._id, 'rejected')}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
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
                  <option value="damage">Hàng bị hư hỏng (Damage)</option>
                  <option value="shortage">Thiếu hụt số lượng (Shortage)</option>
                  <option value="wrong_product">Sai sản phẩm (Wrong product)</option>
                  <option value="expired">Hàng hết hạn (Expired)</option>
                  <option value="other">Sự cố khác (Other)</option>
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
