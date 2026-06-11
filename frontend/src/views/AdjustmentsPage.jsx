import React, { useState, useEffect } from 'react';
import { AdjustmentModel } from '../models/adjustment.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import { Plus, Eye, Trash2, X, ArrowLeftRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export const AdjustmentsPage = () => {
  const { hasPermission } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);

  // Form states
  const [reason, setReason] = useState('count_correction');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ productId: '', warehouseNodeId: '', systemQty: 0, delta: 0 }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adjData, pData, wData] = await Promise.all([
        AdjustmentModel.getAll(),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setAdjustments(adjData);
      setProducts(pData);
      setBins(wData.filter(n => n.type === 'bin'));
    } catch (error) {
      toast.error('Lỗi khi tải phiếu điều chỉnh: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setItems([...items, { productId: '', warehouseNodeId: '', systemQty: 0, delta: 0 }]);
  };

  const handleRemoveItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = async (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;

    const productId = newItems[idx].productId;
    const warehouseNodeId = newItems[idx].warehouseNodeId;

    if ((field === 'productId' || field === 'warehouseNodeId') && productId && warehouseNodeId) {
      try {
        const stockData = await InventoryModel.getStock(productId, warehouseNodeId);
        if (stockData && stockData.length > 0) {
          newItems[idx].systemQty = stockData[0].quantity;
        } else {
          newItems[idx].systemQty = 0;
        }
      } catch (err) {
        newItems[idx].systemQty = 0;
      }
    }
    setItems(newItems);
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    const invalid = items.some(item => !item.productId || !item.warehouseNodeId || Number(item.delta) === 0);
    if (invalid) {
      toast.error('Vui lòng chọn sản phẩm, vị trí và số lượng thay đổi khác 0');
      return;
    }

    try {
      await AdjustmentModel.create({
        reason,
        note,
        items: items.map(item => ({
          productId: Number(item.productId),
          warehouseNodeId: Number(item.warehouseNodeId),
          delta: Number(item.delta)
        }))
      });
      toast.success('Tạo phiếu điều chỉnh nháp thành công');
      setShowAddModal(false);
      setReason('count_correction');
      setNote('');
      setItems([{ productId: '', warehouseNodeId: '', systemQty: 0, delta: 0 }]);
      fetchData();
    } catch (error) {
      toast.error('Lập phiếu điều chỉnh thất bại: ' + error.message);
    }
  };

  const handleApproveAdjustment = async (id) => {
    try {
      await AdjustmentModel.approve(id);
      toast.success('Duyệt và hoàn tất điều chỉnh tồn kho thành công');
      setSelectedAdjustment(null);
      fetchData();
    } catch (error) {
      toast.error('Duyệt phiếu thất bại: ' + error.message);
    }
  };

  const handleDeleteAdjustment = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu điều chỉnh nháp này?')) return;
    try {
      await AdjustmentModel.delete(id);
      toast.success('Đã xóa phiếu điều chỉnh');
      fetchData();
    } catch (error) {
      toast.error('Xóa thất bại: ' + error.message);
    }
  };

  const renderReasonText = (reasonCode) => {
    const reasonsMap = {
      count_correction: 'Hiệu chỉnh sai số đếm',
      damaged: 'Hàng hư hỏng',
      expired: 'Hàng hết hạn',
      lost: 'Thất thoát / Mất mát',
      found: 'Tìm thấy hàng thừa',
      return_supplier: 'Trả hàng cho nhà cung cấp',
      other: 'Lý do khác'
    };
    return reasonsMap[reasonCode] || reasonCode;
  };

  const renderStatusBadge = (status) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    const labels = {
      draft: 'Bản nháp',
      completed: 'Đã hoàn tất'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Điều chỉnh tồn kho</h2>
          <p className="text-sm text-slate-500">Tăng/giảm trực tiếp tồn kho của từng sản phẩm tại vị trí cụ thể</p>
        </div>
        <PermissionGuard permission="adjustment:create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            Lập phiếu điều chỉnh
          </button>
        </PermissionGuard>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải danh sách điều chỉnh...</p>
          </div>
        ) : adjustments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có phiếu điều chỉnh tồn kho nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-6 py-4">Mã phiếu</th>
                  <th className="px-6 py-4">Lý do</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Người lập</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {adjustments.map(adj => (
                  <tr key={adj._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{adj.code}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{renderReasonText(adj.reason)}</td>
                    <td className="px-6 py-4">{renderStatusBadge(adj.status)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <div>
                        <p>{adj.createdByUser?.username}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{adj.createdByUser?.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(adj.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedAdjustment(adj)}
                          className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                        {adj.status === 'draft' && (
                          <PermissionGuard permission="adjustment:create">
                            <button
                              onClick={() => handleDeleteAdjustment(adj._id)}
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
                <ArrowLeftRight className="w-5 h-5 text-primary-500" />
                Lập Phiếu Điều Chỉnh Tồn Kho
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lý do điều chỉnh *</label>
                  <select
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="count_correction">Hiệu chỉnh sai số đếm</option>
                    <option value="damaged">Hàng bị hư hỏng</option>
                    <option value="expired">Hàng hết hạn</option>
                    <option value="lost">Thất thoát / Mất mát</option>
                    <option value="found">Tìm thấy hàng thừa</option>
                    <option value="return_supplier">Trả hàng nhà cung cấp</option>
                    <option value="other">Lý do khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú chi tiết</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú diễn giải lý do..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách dòng điều chỉnh</h4>
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
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Sản phẩm</label>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
                        >
                          <option value="" disabled>-- Chọn sản phẩm --</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Vị trí (Bin)</label>
                        <select
                          required
                          value={item.warehouseNodeId}
                          onChange={(e) => handleItemChange(idx, 'warehouseNodeId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
                        >
                          <option value="" disabled>-- Chọn vị trí --</option>
                          {bins.map(b => (
                            <option key={b._id} value={b._id}>{b.code} ({b.name})</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200 h-[46px] flex flex-col justify-center">
                        <label className="block text-[9px] text-slate-400 font-semibold uppercase leading-none">Tồn kho</label>
                        <span className="text-sm font-bold text-slate-800 mt-0.5">{item.systemQty}</span>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Thay đổi (+/-)</label>
                        <input
                          type="number"
                          required
                          placeholder="Delta"
                          value={item.delta === 0 ? '' : item.delta}
                          onChange={(e) => handleItemChange(idx, 'delta', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 text-center font-bold"
                        />
                      </div>

                      <div className="col-span-1 text-center mt-4">
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
                  Lập phiếu nháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedAdjustment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Phiếu Điều Chỉnh</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mã phiếu: {selectedAdjustment.code}</p>
              </div>
              <button onClick={() => setSelectedAdjustment(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Lý do điều chỉnh</p>
                  <p className="font-bold text-slate-800 mt-1">{renderReasonText(selectedAdjustment.reason)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Trạng thái phiếu</p>
                  <p className="mt-1">{renderStatusBadge(selectedAdjustment.status)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Người lập phiếu</p>
                  <p className="font-bold text-slate-800 mt-1">{selectedAdjustment.createdByUser?.username}</p>
                </div>
                {selectedAdjustment.approvedByUser && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-semibold">Người phê duyệt</p>
                    <p className="font-bold text-slate-850 mt-1">{selectedAdjustment.approvedByUser?.username}</p>
                  </div>
                )}
                {selectedAdjustment.approvedAt && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-semibold">Ngày phê duyệt</p>
                    <p className="text-slate-800 mt-1">{new Date(selectedAdjustment.approvedAt).toLocaleString('vi-VN')}</p>
                  </div>
                )}
              </div>

              {selectedAdjustment.note && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Ghi chú diễn giải:</span> {selectedAdjustment.note}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Danh sách dòng sản phẩm điều chỉnh</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3">Khay chứa (Bin)</th>
                        <th className="px-4 py-3 text-right">Lượng Thay đổi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedAdjustment.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900">{item.product?.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-primary-600">
                            {item.warehouseNode?.code}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.delta > 0 ? (
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+{item.delta}</span>
                            ) : (
                              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{item.delta}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                {selectedAdjustment.status === 'draft' && (
                  <PermissionGuard permission="adjustment:approve">
                    <button
                      onClick={() => handleApproveAdjustment(selectedAdjustment._id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Duyệt & Hoàn tất
                    </button>
                  </PermissionGuard>
                )}
                <button
                  onClick={() => setSelectedAdjustment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
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
