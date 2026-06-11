import React, { useState, useEffect, useRef } from 'react';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import toast from 'react-hot-toast';
import {
  ScanLine, Package, MapPin, Clock, X, Loader,
  Search, ChevronRight, RefreshCw, Info
} from 'lucide-react';

const NODE_TYPE_LABEL = {
  warehouse: 'Kho',
  zone:      'Khu vực',
  aisle:     'Dãy kệ',
  rack:      'Kệ chứa',
  bin:       'Khay (Bin)',
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

export const ScannerPage = () => {
  const [query, setQuery]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [dataReady, setDataReady]   = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [history, setHistory]       = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allNodes, setAllNodes]       = useState([]);

  const inputRef = useRef(null);

  // ── Preload products + nodes ──────────────────────────────
  const loadData = async () => {
    setDataReady(false);
    try {
      const [products, nodes] = await Promise.all([
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setAllProducts(products);
      setAllNodes(nodes);
      setDataReady(true);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu: ' + err.message);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Auto-focus input when data is ready
  useEffect(() => {
    if (dataReady) {
      inputRef.current?.focus();
      const refocus = () => inputRef.current?.focus();
      window.addEventListener('focus', refocus);
      return () => window.removeEventListener('focus', refocus);
    }
  }, [dataReady]);

  // ── Scan handler ──────────────────────────────────────────
  const handleScan = async (e) => {
    e.preventDefault();
    const code = query.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Tìm sản phẩm theo SKU
      const product = allProducts.find(p => p.sku?.toUpperCase() === code);
      if (product) {
        const stockData = await InventoryModel.getStock(product._id, '');
        const totalQty  = stockData.reduce((sum, s) => sum + s.quantity, 0);
        const found = { type: 'product', data: product, stock: stockData, totalQty };
        setResult(found);
        addToHistory({ type: 'product', label: product.name, code: product.sku });
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }

      // 2. Tìm vị trí kho theo mã
      const node = allNodes.find(n => n.code?.toUpperCase() === code);
      if (node) {
        const stockData = await InventoryModel.getStock('', node._id);
        const found = { type: 'node', data: node, stock: stockData };
        setResult(found);
        addToHistory({ type: 'node', label: node.name, code: node.code });
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }

      setError(`Không tìm thấy sản phẩm hoặc vị trí kho với mã "${code}"`);
    } catch (err) {
      setError('Lỗi khi tra cứu: ' + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const addToHistory = (item) => {
    setHistory(prev => {
      const deduped = prev.filter(h => h.code !== item.code);
      return [{ ...item, time: new Date().toLocaleTimeString('vi-VN') }, ...deduped].slice(0, 10);
    });
  };

  const scanFromHistory = (item) => {
    setQuery(item.code);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary-500" />
          Tra cứu bằng mã vạch
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Quét mã SKU sản phẩm hoặc mã vị trí kho để xem thông tin và tồn kho tức thời.
        </p>
      </div>

      {/* Scan input area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleScan}>
          <div className="relative max-w-2xl mx-auto">
            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              className="w-full pl-14 pr-28 py-4 text-xl font-mono rounded-2xl border-2 border-primary-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 bg-primary-50 text-slate-900 placeholder:font-sans placeholder:text-base placeholder:text-slate-400 disabled:opacity-60 transition-all"
              placeholder="Quét mã vạch hoặc nhập SKU / mã Bin..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(null); }}
              disabled={loading || !dataReady}
              autoComplete="off"
            />
            {query && !loading && (
              <button
                type="button"
                onClick={() => { setQuery(''); setError(null); inputRef.current?.focus(); }}
                className="absolute right-16 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim() || !dataReady}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl disabled:opacity-40 transition-colors"
            >
              {loading
                ? <Loader className="w-5 h-5 animate-spin" />
                : <Search className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-center mt-3 space-y-1">
            <p className="text-xs text-slate-400">
              Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Enter</kbd> để tra cứu · Hỗ trợ SKU sản phẩm và mã vị trí kho
            </p>
            {dataReady ? (
              <p className="text-xs text-slate-400">
                Đã tải: <strong className="text-slate-600">{allProducts.length}</strong> sản phẩm ·{' '}
                <strong className="text-slate-600">{allNodes.length}</strong> vị trí kho
                <button type="button" onClick={loadData} className="ml-2 text-primary-400 hover:text-primary-600 inline-flex items-center gap-0.5">
                  <RefreshCw className="w-3 h-3" /> Tải lại
                </button>
              </p>
            ) : (
              <p className="text-xs text-primary-500 flex items-center justify-center gap-1">
                <span className="w-3 h-3 border border-primary-400 border-t-transparent rounded-full animate-spin"></span>
                Đang tải dữ liệu...
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 shadow-sm">
          <X className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* ── Product result ─────────────────────────────── */}
          {result.type === 'product' && (
            <>
              <div className="h-1.5 bg-indigo-500" />
              <div className="p-6">
                {/* Product header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <Package className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Sản phẩm
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1 leading-tight">{result.data.name}</h2>
                    <p className="font-mono text-sm text-slate-500">{result.data.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Tổng tồn kho</p>
                    <p className={`text-3xl font-bold leading-none mt-1 ${
                      result.totalQty === 0 ? 'text-red-500' :
                      result.totalQty < 5  ? 'text-amber-500' : 'text-emerald-600'
                    }`}>
                      {result.totalQty.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{result.data.unit || 'Cái'}</p>
                  </div>
                </div>

                {/* Product info grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Danh mục</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">
                      {result.data.category?.name || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Giá nhập</p>
                    <p className="font-semibold text-red-500 text-sm mt-0.5">
                      {formatCurrency(result.data.priceIn)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Giá bán</p>
                    <p className="font-semibold text-emerald-600 text-sm mt-0.5">
                      {formatCurrency(result.data.priceOut)}
                    </p>
                  </div>
                </div>

                {/* Stock by location */}
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Phân bổ tồn theo vị trí ({result.stock.length} vị trí)
                </h4>
                {result.stock.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500">Mã vị trí</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500">Tên vị trí</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500">Số lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.stock.map(s => (
                          <tr key={s._id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-mono font-bold text-primary-600">
                              {s.warehouseNode?.code || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">{s.warehouseNode?.name || '—'}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                              {s.quantity.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-100">
                    Sản phẩm chưa có tồn kho tại bất kỳ vị trí nào
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Node (location) result ─────────────────────── */}
          {result.type === 'node' && (
            <>
              <div className="h-1.5 bg-emerald-500" />
              <div className="p-6">
                {/* Node header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {NODE_TYPE_LABEL[result.data.type] || result.data.type}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1 leading-tight">{result.data.name}</h2>
                    <p className="font-mono text-sm text-slate-500">{result.data.code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Loại hàng tại đây</p>
                    <p className="text-3xl font-bold text-slate-800 leading-none mt-1">
                      {result.stock.length}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">SKU</p>
                  </div>
                </div>

                {/* Node info grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Loại vị trí</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">
                      {NODE_TYPE_LABEL[result.data.type] || result.data.type}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Vị trí cha</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">
                      {result.data.parent?.name || 'Cấp cao nhất'}
                    </p>
                  </div>
                </div>

                {/* Stock at this location */}
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Hàng hóa tại vị trí này ({result.stock.length} loại)
                </h4>
                {result.stock.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500">SKU</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500">Tên sản phẩm</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500">Số lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.stock.map(s => (
                          <tr key={s._id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                              {s.product?.sku || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">{s.product?.name || '—'}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                              {s.quantity.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-100">
                    Vị trí này chưa có hàng hóa nào
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Scan history */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Lịch sử quét gần đây
            </h3>
            <button
              onClick={() => setHistory([])}
              className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
            >
              Xóa lịch sử
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => scanFromHistory(h)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  h.type === 'product' ? 'bg-indigo-100' : 'bg-emerald-100'
                }`}>
                  {h.type === 'product'
                    ? <Package className="w-4 h-4 text-indigo-600" />
                    : <MapPin className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate text-sm">{h.label}</p>
                  <p className="text-xs text-slate-500 font-mono">{h.code}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-slate-400">{h.time}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no history */}
      {!result && !error && history.length === 0 && dataReady && (
        <div className="text-center py-12 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ScanLine className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-500">Sẵn sàng quét mã vạch</p>
          <p className="text-sm mt-1">Quét mã SKU sản phẩm hoặc mã Bin để xem kết quả</p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              SKU sản phẩm: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">ABC-001</code>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Mã vị trí: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">BIN-A1-1</code>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
