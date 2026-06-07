import React, { useState, useEffect } from 'react';
import { StocktakeModel } from '../models/stocktake.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit, Trash2, X, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';

export const StocktakesPage = () => {
  const { hasPermission } = useAuth();
  const [stocktakes, setStocktakes] = useState([]);
  const [products, setProducts] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStocktake, setSelectedStocktake] = useState(null);

  // Form States
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ productId: '', warehouseNodeId: '', systemQty: 0, countedQty: 0 }]);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = (isEdit = false) => {
    const newRow = { productId: '', warehouseNodeId: '', systemQty: 0, countedQty: 0 };
    if (isEdit) {
      setSelectedStocktake({
        ...selectedStocktake,
        items: [...selectedStocktake.items, newRow]
      });
    } else {
      setItems([...items, newRow]);
    }
  };

  const handleRemoveItemRow = (idx, isEdit = false) => {
    if (isEdit) {
      const updated = selectedStocktake.items.filter((_, i) => i !== idx);
      setSelectedStocktake({ ...selectedStocktake, items: updated });
    } else {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleItemChange = async (idx, field, val, isEdit = false) => {
    const targetItems = isEdit ? [...selectedStocktake.items] : [...items];
    targetItems[idx][field] = val;

    const productId = targetItems[idx].productId;
    const warehouseNodeId = targetItems[idx].warehouseNodeId;

    if ((field === 'productId' || field === 'warehouseNodeId') && productId && warehouseNodeId) {
      try {
        const stockData = await InventoryModel.getStock(productId, warehouseNodeId);
        if (stockData && stockData.length > 0) {
          targetItems[idx].systemQty = stockData[0].quantity;
        } else {
          targetItems[idx].systemQty = 0;
        }
      } catch (err) {
        targetItems[idx].systemQty = 0;
      }
    }

    if (isEdit) {
      setSelectedStocktake({ ...selectedStocktake, items: targetItems });
    } else {
      setItems(targetItems);
    }
  };

  const handleCreateStocktake = async (e) => {
    e.preventDefault();
    const invalid = items.some(item => !item.productId || !item.warehouseNodeId || item.countedQty < 0);
    if (invalid) {
      toast.error('Vui lòng nhập đầy đủ thông tin sản phẩm, vị trí và số lượng đếm');
      return;
    }

    try {
      await StocktakeModel.create({
        note,
        date,
        items: items.map(item => ({
          productId: Number(item.productId),
          warehouseNodeId: Number(item.warehouseNodeId),
          countedQty: Number(item.countedQty)
        }))
      });
      toast.success('Tạo phiếu kiểm kê thành công');
      setShowAddModal(false);
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setItems([{ productId: '', warehouseNodeId: '', systemQty: 0, countedQty: 0 }]);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lập phiếu kiểm kê: ' + error.message);
    }
  };

  const handleUpdateStocktake = async (e) => {
    e.preventDefault();
    const invalid = selectedStocktake.items.some(
      item => !item.productId || !item.warehouseNodeId || item.countedQty < 0
    );
    if (invalid) {
      toast.error('Vui lòng điền đầy đủ thông tin dòng kiểm kê');
      return;
    }

    try {
      await StocktakeModel.update(selectedStocktake._id, {
        note: selectedStocktake.note,
        date: selectedStocktake.date,
        items: selectedStocktake.items.map(item => ({
          productId: Number(item.productId),
          warehouseNodeId: Number(item.warehouseNodeId),
          systemQty: Number(item.systemQty),
          countedQty: Number(item.countedQty)
        }))
      });
      toast.success('Cập nhật phiếu kiểm kê thành công');
      setShowEditModal(false);
      setSelectedStocktake(null);
      fetchData();
    } catch (error) {
      toast.error('Cập nhật thất bại: ' + error.message);
    }
  };

  const handleDeleteStocktake = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu kiểm kê này?')) return;
    try {
      await StocktakeModel.delete(id);
      toast.success('Đã xóa phiếu kiểm kê');
      fetchData();
    } catch (error) {
      toast.error('Xóa thất bại: ' + error.message);
    }
  };

  const renderStatusBadge = (status) => {
    const styles = {
      pass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      diff: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    const labels = {
      pass: 'Khớp số lượng',
      diff: 'Chênh lệch'
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
          <h2 className="text-xl font-bold text-slate-800">Quản lý Kiểm kê kho (Stocktake)</h2>
          <p className="text-sm text-slate-500">So sánh số lượng thực tế tại vị trí và số lượng tồn hệ thống</p>
        </div>
        <PermissionGuard permission="stocktake:create">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            Lập phiếu kiểm kê
          </button>
        </PermissionGuard>
      </div>

      {/* Stocktakes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải danh sách kiểm kê...</p>
          </div>
        ) : stocktakes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có phiếu kiểm kê nào được lập</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-6 py-4">Mã phiếu</th>
                  <th className="px-6 py-4">Ngày kiểm</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ghi chú</th>
                  <th className="px-6 py-4">Người lập</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {stocktakes.map(st => (
                  <tr key={st._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{st.code}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(st.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4">{renderStatusBadge(st.status)}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{st.note || '-'}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <div>
                        <p className="font-semibold text-slate-800">{st.createdByUser?.username}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{st.createdByUser?.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedStocktake(st);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem
                        </button>
                        <PermissionGuard permission="stocktake:create">
                          <button
                            onClick={() => {
                              setSelectedStocktake({
                                ...st,
                                date: st.date ? st.date.split('T')[0] : '',
                                items: st.items.map(item => ({
                                  _id: item._id,
                                  productId: item.productId,
                                  warehouseNodeId: item.warehouseNodeId,
                                  systemQty: item.systemQty,
                                  countedQty: item.countedQty
                                }))
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteStocktake(st._id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        </PermissionGuard>
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
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-500" />
                Lập Phiếu Kiểm Kê Kho
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStocktake} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ngày kiểm kê *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú đợt kiểm kê..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách sản phẩm kiểm kê</h4>
                  <button
                    type="button"
                    onClick={() => handleAddItemRow(false)}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng mới
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Sản phẩm</label>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value, false)}
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
                          onChange={(e) => handleItemChange(idx, 'warehouseNodeId', e.target.value, false)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
                        >
                          <option value="" disabled>-- Chọn vị trí --</option>
                          {bins.map(b => (
                            <option key={b._id} value={b._id}>{b.code} ({b.name})</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200 h-[46px] flex flex-col justify-center">
                        <label className="block text-[9px] text-slate-400 font-semibold uppercase leading-none">Hệ thống</label>
                        <span className="text-sm font-bold text-slate-800 mt-0.5">{item.systemQty}</span>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Đếm thực tế</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.countedQty}
                          onChange={(e) => handleItemChange(idx, 'countedQty', e.target.value, false)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 text-center font-bold"
                        />
                      </div>

                      <div className="col-span-1 text-center mt-4">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItemRow(idx, false)}
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
                  Hoàn thành lập phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStocktake && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-500" />
                  Chỉnh Sửa Phiếu Kiểm Kê
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Mã phiếu: {selectedStocktake.code}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStocktake} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ngày kiểm kê *</label>
                  <input
                    type="date"
                    required
                    value={selectedStocktake.date}
                    onChange={(e) => setSelectedStocktake({ ...selectedStocktake, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú</label>
                  <input
                    type="text"
                    value={selectedStocktake.note || ''}
                    onChange={(e) => setSelectedStocktake({ ...selectedStocktake, note: e.target.value })}
                    placeholder="Ghi chú đợt kiểm kê..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm">Danh sách sản phẩm kiểm kê</h4>
                  <button
                    type="button"
                    onClick={() => handleAddItemRow(true)}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng mới
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {selectedStocktake.items?.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Sản phẩm</label>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value, true)}
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
                          onChange={(e) => handleItemChange(idx, 'warehouseNodeId', e.target.value, true)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
                        >
                          <option value="" disabled>-- Chọn vị trí --</option>
                          {bins.map(b => (
                            <option key={b._id} value={b._id}>{b.code} ({b.name})</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200 h-[46px] flex flex-col justify-center">
                        <label className="block text-[9px] text-slate-400 font-semibold uppercase leading-none">Hệ thống</label>
                        <span className="text-sm font-bold text-slate-800 mt-0.5">{item.systemQty}</span>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">Đếm thực tế</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.countedQty}
                          onChange={(e) => handleItemChange(idx, 'countedQty', e.target.value, true)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 text-center font-bold"
                        />
                      </div>

                      <div className="col-span-1 text-center mt-4">
                        <button
                          type="button"
                          disabled={selectedStocktake.items.length <= 1}
                          onClick={() => handleRemoveItemRow(idx, true)}
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
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-500/10"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedStocktake && !showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Chi tiết Phiếu Kiểm Kê</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mã phiếu: {selectedStocktake.code}</p>
              </div>
              <button onClick={() => setSelectedStocktake(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Ngày kiểm kê</p>
                  <p className="font-bold text-slate-800 mt-1">{new Date(selectedStocktake.date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Trạng thái chênh lệch</p>
                  <p className="mt-1">{renderStatusBadge(selectedStocktake.status)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-semibold">Người lập phiếu</p>
                  <p className="font-bold text-slate-850 mt-1">{selectedStocktake.createdByUser?.username || 'Hệ thống'}</p>
                </div>
              </div>

              {selectedStocktake.note && (
                <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl flex gap-2 text-xs text-slate-700">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Ghi chú:</span> {selectedStocktake.note}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Danh sách dòng kiểm kê</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3">Vị trí khay (Bin)</th>
                        <th className="px-4 py-3 text-center">Tồn hệ thống</th>
                        <th className="px-4 py-3 text-center">Đếm thực tế</th>
                        <th className="px-4 py-3 text-right">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedStocktake.items?.map((item, idx) => {
                        const diff = Number(item.countedQty) - Number(item.systemQty);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/20">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900">{item.product?.name}</span>
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku}</span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-primary-600">
                              {item.warehouseNode?.code}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-500">
                              {item.systemQty}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-900">
                              {item.countedQty}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {diff === 0 ? (
                                <span className="font-bold text-slate-400">0</span>
                              ) : diff > 0 ? (
                                <span className="font-bold text-emerald-600">+{diff}</span>
                              ) : (
                                <span className="font-bold text-red-600">{diff}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedStocktake(null)}
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
