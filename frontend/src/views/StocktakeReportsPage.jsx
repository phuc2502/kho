import React, { useState, useEffect, useMemo } from 'react';
import { StocktakeReportModel } from '../models/stocktakeReport.model.js';
import toast from 'react-hot-toast';
import {
  Eye, X, Search, AlertCircle, BarChart2,
  CheckCircle2, TrendingDown, TrendingUp, Printer, Download
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCSV.js';

export const StocktakeReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await StocktakeReportModel.getAll();
      setReports(data);
    } catch (error) {
      toast.error('Lỗi khi tải báo cáo kiểm kê: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(r =>
      r.code?.toLowerCase().includes(q) ||
      r.stocktake?.code?.toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  const openDetail = async (report) => {
    try {
      const detail = await StocktakeReportModel.getById(report._id);
      setSelected(detail);
    } catch (error) {
      toast.error('Không thể tải chi tiết báo cáo: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo Kiểm kê</h2>
          <p className="text-sm text-slate-500">Báo cáo tổng hợp kết quả kiểm kê sau khi biên bản được phê duyệt</p>
        </div>
        <button
          onClick={() => {
            const headers = ['Mã báo cáo', 'Phiếu kiểm kê', 'Tổng SP', 'Khớp', 'Lệch', 'Tổng giá trị lệch', 'Ngày tạo'];
            const rows = filtered.map(r => [
              r.code,
              r.stocktake?.code || '',
              r.summary?.totalItems || 0,
              r.summary?.matchedItems || 0,
              r.summary?.mismatchedItems || 0,
              r.summary?.totalDiffValue || 0,
              r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''
            ]);
            exportToCSV('danh_sach_bao_cao_kiem_ke', headers, rows);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã báo cáo, mã phiếu kiểm kê..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
            />
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors">
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
            {filtered.length} / {reports.length} báo cáo
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2">Đang tải báo cáo kiểm kê...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {reports.length === 0 ? 'Chưa có báo cáo kiểm kê nào' : 'Không tìm thấy báo cáo phù hợp'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-5 py-4">Mã báo cáo</th>
                  <th className="px-5 py-4">Phiếu kiểm kê</th>
                  <th className="px-5 py-4 text-center">Tổng SP</th>
                  <th className="px-5 py-4 text-center">Khớp</th>
                  <th className="px-5 py-4 text-center">Chênh lệch</th>
                  <th className="px-5 py-4 text-center">Thiếu</th>
                  <th className="px-5 py-4 text-center">Thừa</th>
                  <th className="px-5 py-4">Phiếu ĐC</th>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filtered.map(r => (
                  <tr key={r._id} className={`hover:bg-slate-50/50 ${r.discrepancyItems > 0 ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{r.code}</td>
                    <td className="px-5 py-4 font-mono text-primary-600 font-semibold">
                      {r.stocktake?.code || '—'}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700">{r.totalItems}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-emerald-600 font-bold">{r.matchedItems}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {r.discrepancyItems > 0
                        ? <span className="text-amber-600 font-bold">{r.discrepancyItems}</span>
                        : <span className="text-slate-400">0</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-center">
                      {r.totalShortage > 0
                        ? <span className="text-red-600 font-bold">-{r.totalShortage}</span>
                        : <span className="text-slate-400">0</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-center">
                      {r.totalSurplus > 0
                        ? <span className="text-emerald-600 font-bold">+{r.totalSurplus}</span>
                        : <span className="text-slate-400">0</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      {r.adjustment
                        ? <span className="font-mono text-xs text-slate-700">{r.adjustment.code}</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => openDetail(r)}
                        className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary-500" />
                  Chi tiết Báo cáo Kiểm kê
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{selected.code}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Tổng SP kiểm</p>
                  <p className="text-2xl font-bold text-slate-800">{selected.totalItems}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-emerald-600 uppercase mb-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Khớp
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">{selected.matchedItems}</p>
                </div>
                <div className={`border rounded-xl p-3 text-center ${selected.discrepancyItems > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-xs font-semibold uppercase mb-1 flex items-center justify-center gap-1 ${selected.discrepancyItems > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    <AlertCircle className="w-3 h-3" /> Chênh lệch
                  </p>
                  <p className={`text-2xl font-bold ${selected.discrepancyItems > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                    {selected.discrepancyItems}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-red-600 font-semibold">
                      <TrendingDown className="w-3 h-3" /> Thiếu
                    </span>
                    <span className="font-bold text-red-600">{selected.totalShortage > 0 ? `-${selected.totalShortage}` : '0'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <TrendingUp className="w-3 h-3" /> Thừa
                    </span>
                    <span className="font-bold text-emerald-600">{selected.totalSurplus > 0 ? `+${selected.totalSurplus}` : '0'}</span>
                  </div>
                </div>
              </div>

              {/* Report info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Phiếu kiểm kê</p>
                  <p className="font-mono font-bold text-primary-600">{selected.stocktake?.code}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selected.stocktake?.date ? new Date(selected.stocktake.date).toLocaleDateString('vi-VN') : ''}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Người tạo báo cáo</p>
                  <p className="font-bold text-slate-800">{selected.generatedByUser?.username}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{selected.generatedByUser?.role}</p>
                </div>
                {selected.adjustment && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Phiếu điều chỉnh</p>
                    <p className="font-mono font-bold text-amber-600">{selected.adjustment.code}</p>
                    <p className="text-[10px] text-slate-400">Trạng thái: {selected.adjustment.status}</p>
                  </div>
                )}
                {selected.createdAt && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ngày lập báo cáo</p>
                    <p className="font-bold text-slate-800">{new Date(selected.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                )}
              </div>

              {selected.note && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-slate-700">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Ghi chú:</strong> {selected.note}</span>
                </div>
              )}

              {/* Items table */}
              {selected.stocktake?.items && selected.stocktake.items.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2">Chi tiết sản phẩm</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                          <th className="px-4 py-2.5">Sản phẩm</th>
                          <th className="px-4 py-2.5">Bin</th>
                          <th className="px-4 py-2.5 text-center">Tồn HT</th>
                          <th className="px-4 py-2.5 text-center">Đếm thực tế</th>
                          <th className="px-4 py-2.5 text-right">Chênh lệch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selected.stocktake.items.map((item, idx) => {
                          const diff = Number(item.countedQty) - Number(item.systemQty);
                          return (
                            <tr key={idx} className={diff !== 0 ? 'bg-amber-50/40' : 'hover:bg-slate-50/20'}>
                              <td className="px-4 py-2.5">
                                <p className="font-semibold text-slate-900">{item.product?.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{item.product?.sku}</p>
                              </td>
                              <td className="px-4 py-2.5 font-mono font-bold text-primary-600">{item.warehouseNode?.code}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-slate-500">{item.systemQty}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-slate-900">{item.countedQty}</td>
                              <td className="px-4 py-2.5 text-right font-bold">
                                {diff === 0
                                  ? <span className="text-slate-400">0</span>
                                  : diff > 0
                                    ? <span className="text-emerald-600">+{diff}</span>
                                    : <span className="text-red-600">{diff}</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50 shrink-0">
              <button
                onClick={() => {
                  const headers = ['Mã sản phẩm (SKU)', 'Tên sản phẩm', 'Khay chứa (Bin)', 'Tồn HT', 'Đếm thực tế', 'Chênh lệch'];
                  const rows = selected.stocktake?.items?.map(item => {
                    const diff = Number(item.countedQty) - Number(item.systemQty);
                    return [
                      item.product?.sku || '',
                      item.product?.name || '',
                      item.warehouseNode?.code || '',
                      item.systemQty || 0,
                      item.countedQty || 0,
                      diff || 0
                    ];
                  });
                  exportToCSV(`chi_tiet_bao_cao_kiem_ke_${selected.code}`, headers, rows);
                }}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Xuất CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> In Báo Cáo
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CSS Styles for Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide standard layout */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          /* Show print section only */
          #stocktake-report-print-canvas, #stocktake-report-print-canvas * {
            visibility: visible;
          }
          #stocktake-report-print-canvas {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #000 !important;
            background: #fff !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 13px !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
          }
        }
      `}} />

      {/* Stocktake Reports Printable Canvas */}
      {selected && (
        <div id="stocktake-report-print-canvas" className="hidden p-8 bg-white text-black font-serif">
          <div className="flex justify-between items-start mb-6">
            <div className="text-left font-serif">
              <p className="font-bold uppercase text-xs">ĐƠN VỊ: MVC WAREHOUSE SYSTEM</p>
              <p className="text-xs">Địa chỉ: Khu công nghệ cao, TP. Hồ Chí Minh</p>
            </div>
            <div className="text-right font-serif max-w-[280px]">
              <p className="font-bold text-xs">Mẫu số 06-VT</p>
              <p className="italic text-[10px] leading-tight">
                (Ban hành theo Thông tư số 200/2014/TT-BTC<br/>
                Ngày 22/12/2014 của Bộ Tài chính)
              </p>
            </div>
          </div>

          <div className="text-center my-6 font-serif">
            <h2 className="text-xl font-bold uppercase tracking-wide">BÁO CÁO KẾT QUẢ KIỂM KÊ KHO HÀNG</h2>
            <p className="italic mt-1 text-xs">Ngày lập: {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('vi-VN') : '—'}</p>
            <p className="text-xs font-mono mt-0.5">Mã báo cáo: {selected.code}</p>
          </div>

          <div className="space-y-1 mb-6 font-serif text-xs">
            <p><span className="font-bold">Phiếu kiểm kê liên kết:</span> {selected.stocktake?.code}</p>
            <p><span className="font-bold">Người lập báo cáo:</span> {selected.generatedByUser?.username}</p>
            {selected.adjustment && (
              <p><span className="font-bold">Phiếu điều chỉnh liên kết:</span> {selected.adjustment.code} (Trạng thái: {selected.adjustment.status})</p>
            )}
            <p><span className="font-bold">Tổng sản phẩm:</span> {selected.summary?.totalItems} | <span className="font-bold">Khớp:</span> {selected.summary?.matchedItems} | <span className="font-bold">Lệch:</span> {selected.summary?.mismatchedItems}</p>
            <p><span className="font-bold">Tổng giá trị chênh lệch:</span> {selected.summary?.totalDiffValue?.toLocaleString('vi-VN')} đ</p>
          </div>

          <table className="w-full text-left font-serif text-xs border border-collapse border-black text-black">
            <thead>
              <tr className="text-center font-bold bg-slate-50">
                <th className="border border-black px-2 py-1.5 w-10">STT</th>
                <th className="border border-black px-2 py-1.5">Mã sản phẩm (SKU)</th>
                <th className="border border-black px-2 py-1.5">Tên sản phẩm</th>
                <th className="border border-black px-2 py-1.5">Khay chứa (Bin)</th>
                <th className="border border-black px-2 py-1.5 text-center">Tồn hệ thống</th>
                <th className="border border-black px-2 py-1.5 text-center">Đếm thực tế</th>
                <th className="border border-black px-2 py-1.5 text-center">Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {selected.stocktake?.items?.map((item, idx) => {
                const diff = Number(item.countedQty) - Number(item.systemQty);
                return (
                  <tr key={idx}>
                    <td className="border border-black text-center">{idx + 1}</td>
                    <td className="border border-black font-mono">{item.product?.sku}</td>
                    <td className="border border-black">{item.product?.name}</td>
                    <td className="border border-black font-mono font-bold text-center">{item.warehouseNode?.code}</td>
                    <td className="border border-black text-center">{item.systemQty}</td>
                    <td className="border border-black text-center font-bold">{item.countedQty}</td>
                    <td className="border border-black text-center font-bold">
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="grid grid-cols-2 text-center mt-12 text-xs font-serif">
            <div>
              <p className="font-bold">Người lập báo cáo</p>
              <p className="italic text-[10px] text-slate-500">(Ký, họ tên)</p>
            </div>
            <div>
              <p className="font-bold">Ban Giám Đốc / Trưởng bộ phận</p>
              <p className="italic text-[10px] text-slate-500">(Ký, đóng dấu)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
