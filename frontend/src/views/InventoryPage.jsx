import React, { useState, useEffect } from 'react';
import { InventoryModel } from '../models/inventory.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { BarcodeInput } from '../components/BarcodeInput.jsx';
import { exportToCSV } from '../utils/exportCSV.js';
import toast from 'react-hot-toast';
import { Database, MapPin, Layers, Download, ScanLine } from 'lucide-react';

export const InventoryPage = () => {
  const [stock, setStock] = useState([]);
  const [allStock, setAllStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockData, productsData, nodesData] = await Promise.all([
        InventoryModel.getStock(selectedProduct, selectedNode),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setStock(stockData);
      setAllStock(stockData);
      setProducts(productsData);
      setNodes(nodesData.filter(n => n.type === 'bin'));
    } catch (error) {
      toast.error('Lỗi khi tải tồn kho: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedProduct, selectedNode]);

  // Barcode scan → filter by SKU or bin code
  const handleBarcodeScan = (scannedCode) => {
    const code = scannedCode.toUpperCase();
    const found = allStock.filter(item =>
      item.product?.sku?.toUpperCase() === code ||
      item.warehouseNode?.code?.toUpperCase() === code
    );
    if (found.length > 0) {
      setStock(found);
      setBarcodeSearch(code);
      toast.success(`Tìm thấy ${found.length} kết quả cho "${code}"`);
    } else {
      toast.error(`Không tìm thấy tồn kho cho mã "${code}"`);
    }
  };

  const clearBarcodeSearch = () => {
    setBarcodeSearch('');
    setStock(allStock);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Tên sản phẩm', 'Mã vị trí (Bin)', 'Tên vị trí', 'Đơn vị', 'Số lượng tồn'];
    const rows = stock.map(item => [
      item.product?.sku || '',
      item.product?.name || '',
      item.warehouseNode?.code || '',
      item.warehouseNode?.name || '',
      item.product?.unit || 'Cái',
      item.quantity
    ]);
    exportToCSV('ton_kho', headers, rows);
    toast.success('Đã xuất file tồn kho CSV');
  };

  const totalSkuCount = new Set(stock.map(item => item.product?._id)).size;
  const totalQuantity = stock.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">SKU độc nhất</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalSkuCount} SKU</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Tổng tồn kho</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalQuantity.toLocaleString()} đơn vị</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Barcode row */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5 text-primary-500" /> Quét mã vạch (SKU hoặc mã Bin)
            </label>
            {barcodeSearch && (
              <button onClick={clearBarcodeSearch} className="text-xs text-primary-500 font-semibold hover:underline">
                ✕ Xoá bộ lọc quét ("{barcodeSearch}")
              </button>
            )}
          </div>
          <BarcodeInput
            onScan={handleBarcodeScan}
            placeholder="Quét mã sản phẩm hoặc mã khay để tìm tồn kho..."
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lọc theo sản phẩm</label>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500">
              <option value="">Tất cả sản phẩm</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lọc theo vị trí (Bin)</label>
            <select value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500">
              <option value="">Tất cả khay chứa</option>
              {nodes.map(n => <option key={n._id} value={n._id}>{n.code} ({n.name})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs text-slate-500 font-semibold">{stock.length} vị trí hiển thị</span>
          <button
            onClick={handleExportCSV}
            disabled={stock.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold disabled:opacity-40 shadow-md shadow-blue-500/10"
          >
            <Download className="w-3.5 h-3.5" /> Xuất CSV
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2 text-sm">Đang truy vấn tồn kho...</p>
          </div>
        ) : stock.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy tồn kho theo bộ lọc hiện tại</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-5 py-4">Mã SKU</th>
                  <th className="px-5 py-4">Tên sản phẩm</th>
                  <th className="px-5 py-4">Vị trí (Bin)</th>
                  <th className="px-5 py-4">Đơn vị</th>
                  <th className="px-5 py-4 text-right">Số lượng tồn</th>
                  <th className="px-5 py-4">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {stock.map(item => (
                  <tr key={item._id} className={`hover:bg-slate-50/50 ${item.quantity === 0 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{item.product?.sku || 'N/A'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{item.product?.name || 'Đã bị xóa'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-bold">{item.warehouseNode?.code || 'N/A'}</span>
                        <span className="text-slate-400">({item.warehouseNode?.name})</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{item.product?.unit || 'Cái'}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-bold text-base ${item.quantity === 0 ? 'text-red-500' : item.quantity < 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.quantity === 0
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">Hết hàng</span>
                        : item.quantity < 5
                          ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">Sắp hết</span>
                          : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">Còn hàng</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
