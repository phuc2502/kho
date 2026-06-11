import React, { useState, useEffect, useMemo } from 'react';
import { ReceiptModel } from '../models/receipt.model.js';
import { DeliveryModel } from '../models/delivery.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { exportToCSV } from '../utils/exportCSV.js';
import toast from 'react-hot-toast';
import {
  BarChart2, Download, ArrowDownLeft, ArrowUpRight,
  Package, TrendingUp, TrendingDown, AlertTriangle
} from 'lucide-react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

const SummaryCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
    <p className="text-sm font-semibold text-slate-700 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const TABS = ['Tổng quan', 'Nhập kho', 'Xuất kho', 'Tồn kho'];

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('Tổng quan');
  const [receipts, setReceipts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [r, d, inv] = await Promise.all([
          ReceiptModel.getAll().catch(() => []),
          DeliveryModel.getAll().catch(() => []),
          InventoryModel.getStock().catch(() => []),
        ]);
        setReceipts(Array.isArray(r) ? r : []);
        setDeliveries(Array.isArray(d) ? d : []);
        setInventory(Array.isArray(inv) ? inv : []);
      } catch (err) {
        toast.error('Lỗi khi tải dữ liệu báo cáo');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const isInRange = (dateStr) => {
    if (!dateStr) return false;
    const d = dateStr.split('T')[0];
    return d >= dateFrom && d <= dateTo;
  };

  // Filtered data in date range
  const filteredReceipts = useMemo(() =>
    receipts.filter(r => r.status === 'completed' && isInRange(r.createdAt)), [receipts, dateFrom, dateTo]);

  const filteredDeliveries = useMemo(() =>
    deliveries.filter(d => d.status === 'completed' && isInRange(d.createdAt)), [deliveries, dateFrom, dateTo]);

  // Summary stats
  const totalReceiptValue = filteredReceipts.reduce((s, r) => s + (parseFloat(r.totalAmount) || 0), 0);
  const totalDeliveryValue = filteredDeliveries.reduce((s, d) => s + (parseFloat(d.totalAmount) || 0), 0);
  const totalInventoryQty = inventory.reduce((s, i) => s + (i.quantity || 0), 0);
  const zeroStockCount = inventory.filter(i => i.quantity === 0).length;

  // --- Export functions ---
  const exportReceipts = () => {
    const headers = ['Mã phiếu', 'Nhà cung cấp', 'Ngày lập', 'Số sản phẩm', 'Tổng tiền (VND)', 'Trạng thái'];
    const rows = receipts.map(r => [
      r.code,
      r.partner?.name || '',
      r.createdAt?.split('T')[0] || '',
      r.items?.length || 0,
      r.totalAmount || 0,
      r.status
    ]);
    exportToCSV('phieu_nhap_kho', headers, rows);
    toast.success('Đã xuất file phiếu nhập kho');
  };

  const exportDeliveries = () => {
    const headers = ['Mã phiếu', 'Khách hàng', 'Ngày lập', 'Số sản phẩm', 'Tổng tiền (VND)', 'Trạng thái'];
    const rows = deliveries.map(d => [
      d.code,
      d.partner?.name || '',
      d.createdAt?.split('T')[0] || '',
      d.items?.length || 0,
      d.totalAmount || 0,
      d.status
    ]);
    exportToCSV('phieu_xuat_kho', headers, rows);
    toast.success('Đã xuất file phiếu xuất kho');
  };

  const exportInventory = () => {
    const headers = ['Sản phẩm', 'SKU', 'Vị trí (Bin)', 'Mã vị trí', 'Số lượng tồn'];
    const rows = inventory.map(i => [
      i.product?.name || '',
      i.product?.sku || '',
      i.warehouseNode?.name || '',
      i.warehouseNode?.code || '',
      i.quantity || 0,
    ]);
    exportToCSV('ton_kho_thuc_te', headers, rows);
    toast.success('Đã xuất file tồn kho');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary-500" />
            Báo cáo & Thống kê kho
          </h2>
          <p className="text-sm text-slate-500">Tổng hợp số liệu nhập - xuất - tồn kho theo kỳ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Date filter (not for inventory tab) */}
      {activeTab !== 'Tồn kho' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Từ ngày</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Đến ngày</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-primary-500" />
          </div>
          <span className="text-xs text-slate-500 italic">* Chỉ tính phiếu đã hoàn tất trong khoảng thời gian này</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
          <p className="mt-2 text-sm">Đang tải dữ liệu báo cáo...</p>
        </div>
      ) : (
        <>
          {/* === TÁB TỔNG QUAN === */}
          {activeTab === 'Tổng quan' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={ArrowDownLeft} label="Giá trị nhập kho" value={formatCurrency(totalReceiptValue)}
                  sub={`${filteredReceipts.length} phiếu hoàn tất`} color="bg-emerald-100 text-emerald-600" />
                <SummaryCard icon={ArrowUpRight} label="Giá trị xuất kho" value={formatCurrency(totalDeliveryValue)}
                  sub={`${filteredDeliveries.length} phiếu hoàn tất`} color="bg-purple-100 text-purple-600" />
                <SummaryCard icon={Package} label="Tổng tồn kho" value={totalInventoryQty.toLocaleString('vi-VN')}
                  sub="Tổng số lượng hiện tại" color="bg-blue-100 text-blue-600" />
                <SummaryCard icon={AlertTriangle} label="Vị trí hết hàng" value={zeroStockCount}
                  sub="Số lượng = 0" color={zeroStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'} />
              </div>

              {/* Xuất nhập tồn summary table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">Bảng Xuất - Nhập - Tồn (trong kỳ)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-600 text-xs font-bold uppercase">
                        <th className="px-5 py-3">Chỉ tiêu</th>
                        <th className="px-5 py-3 text-right">Số lượng phiếu</th>
                        <th className="px-5 py-3 text-right">Tổng giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/30">
                        <td className="px-5 py-3 flex items-center gap-2 font-semibold text-emerald-700">
                          <ArrowDownLeft className="w-4 h-4" /> Phiếu nhập hoàn tất
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">{filteredReceipts.length}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatCurrency(totalReceiptValue)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/30">
                        <td className="px-5 py-3 flex items-center gap-2 font-semibold text-purple-700">
                          <ArrowUpRight className="w-4 h-4" /> Phiếu xuất hoàn tất
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">{filteredDeliveries.length}</td>
                        <td className="px-5 py-3 text-right font-bold text-purple-700">{formatCurrency(totalDeliveryValue)}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="px-5 py-3 text-slate-700">Chênh lệch (Nhập - Xuất)</td>
                        <td className="px-5 py-3 text-right">—</td>
                        <td className={`px-5 py-3 text-right ${(totalReceiptValue - totalDeliveryValue) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(totalReceiptValue - totalDeliveryValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === TAB NHẬP KHO === */}
          {activeTab === 'Nhập kho' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">
                  Phiếu nhập kho hoàn tất — {filteredReceipts.length} phiếu / {formatCurrency(totalReceiptValue)}
                </h3>
                <button onClick={exportReceipts}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10">
                  <Download className="w-3.5 h-3.5" /> Xuất CSV
                </button>
              </div>
              {filteredReceipts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">Không có phiếu nhập hoàn tất trong khoảng thời gian này</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-600 text-xs font-bold uppercase">
                        <th className="px-5 py-3">Mã phiếu</th>
                        <th className="px-5 py-3">Nhà cung cấp</th>
                        <th className="px-5 py-3">Ngày lập</th>
                        <th className="px-5 py-3 text-center">Số SP</th>
                        <th className="px-5 py-3 text-right">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReceipts.map(r => (
                        <tr key={r._id} className="hover:bg-slate-50/40">
                          <td className="px-5 py-3 font-mono font-bold text-slate-900">{r.code}</td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{r.partner?.name}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{r.createdAt?.split('T')[0]}</td>
                          <td className="px-5 py-3 text-center">{r.items?.length || 0}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatCurrency(r.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t border-emerald-100 font-bold">
                        <td colSpan="4" className="px-5 py-3 text-slate-700">Tổng cộng ({filteredReceipts.length} phiếu)</td>
                        <td className="px-5 py-3 text-right text-emerald-700">{formatCurrency(totalReceiptValue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* === TAB XUẤT KHO === */}
          {activeTab === 'Xuất kho' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">
                  Phiếu xuất kho hoàn tất — {filteredDeliveries.length} phiếu / {formatCurrency(totalDeliveryValue)}
                </h3>
                <button onClick={exportDeliveries}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/10">
                  <Download className="w-3.5 h-3.5" /> Xuất CSV
                </button>
              </div>
              {filteredDeliveries.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">Không có phiếu xuất hoàn tất trong khoảng thời gian này</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-600 text-xs font-bold uppercase">
                        <th className="px-5 py-3">Mã phiếu</th>
                        <th className="px-5 py-3">Khách hàng</th>
                        <th className="px-5 py-3">Ngày lập</th>
                        <th className="px-5 py-3 text-center">Số SP</th>
                        <th className="px-5 py-3 text-right">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDeliveries.map(d => (
                        <tr key={d._id} className="hover:bg-slate-50/40">
                          <td className="px-5 py-3 font-mono font-bold text-slate-900">{d.code}</td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{d.partner?.name}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{d.createdAt?.split('T')[0]}</td>
                          <td className="px-5 py-3 text-center">{d.items?.length || 0}</td>
                          <td className="px-5 py-3 text-right font-bold text-purple-700">{formatCurrency(d.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-purple-50 border-t border-purple-100 font-bold">
                        <td colSpan="4" className="px-5 py-3 text-slate-700">Tổng cộng ({filteredDeliveries.length} phiếu)</td>
                        <td className="px-5 py-3 text-right text-purple-700">{formatCurrency(totalDeliveryValue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* === TAB TỒN KHO === */}
          {activeTab === 'Tồn kho' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">
                  Tồn kho thực tế — {inventory.length} vị trí / tổng {totalInventoryQty.toLocaleString('vi-VN')} sản phẩm
                </h3>
                <button onClick={exportInventory}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10">
                  <Download className="w-3.5 h-3.5" /> Xuất CSV
                </button>
              </div>
              {inventory.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">Chưa có dữ liệu tồn kho</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-600 text-xs font-bold uppercase">
                        <th className="px-5 py-3">Sản phẩm</th>
                        <th className="px-5 py-3">SKU</th>
                        <th className="px-5 py-3">Vị trí lưu kho</th>
                        <th className="px-5 py-3 text-center">Số lượng tồn</th>
                        <th className="px-5 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventory
                        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
                        .map(i => (
                          <tr key={i._id} className={`hover:bg-slate-50/40 ${i.quantity === 0 ? 'bg-red-50/20' : ''}`}>
                            <td className="px-5 py-3 font-semibold text-slate-800">{i.product?.name}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{i.product?.sku}</td>
                            <td className="px-5 py-3">
                              <span className="font-mono font-bold text-primary-600">{i.warehouseNode?.code}</span>
                              <span className="text-slate-400 text-xs ml-1">({i.warehouseNode?.name})</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-lg font-bold ${i.quantity === 0 ? 'text-red-500' : i.quantity < 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                                {i.quantity}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {i.quantity === 0 ? (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">Hết hàng</span>
                              ) : i.quantity < 5 ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">Sắp hết</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">Còn hàng</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
