import React, { useState, useEffect, useMemo } from 'react';
import { InventoryModel } from '../models/inventory.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { CategoryModel } from '../models/category.model.js';
import { BarcodeInput } from '../components/BarcodeInput.jsx';
import { exportToCSV } from '../utils/exportCSV.js';
import toast from 'react-hot-toast';
import { Database, MapPin, Layers, Download, ScanLine, Search, X, Package, Tag, Warehouse } from 'lucide-react';

export const InventoryPage = () => {
  const [stock, setStock] = useState([]);
  const [allStock, setAllStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'out' | 'low' | 'ok'
  const [detailProduct, setDetailProduct] = useState(null); // product object for detail modal
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockData, productsData, nodesData, categoriesData] = await Promise.all([
        InventoryModel.getStock('', ''),
        ProductModel.getAll(),
        WarehouseModel.getAll(),
        CategoryModel.getAll()
      ]);
      setStock(stockData);
      setAllStock(stockData);
      setProducts(productsData);
      setAllNodes(nodesData);
      setNodes(nodesData.filter(n => n.type === 'bin'));
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Lỗi khi tải tồn kho: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const isDescendant = (nodeId, ancestorId) => {
    if (!nodeId || !ancestorId) return false;
    let current = allNodes.find(n => n._id === parseInt(nodeId));
    while (current) {
      const pId = current.parentId ?? current.parent?._id;
      if (pId === parseInt(ancestorId)) return true;
      current = allNodes.find(n => n._id === pId);
    }
    return false;
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

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedProduct('');
  };

  const handleWarehouseChange = (e) => {
    setSelectedWarehouse(e.target.value);
    setSelectedZone('');
    setSelectedRack('');
    setSelectedNode('');
  };

  const handleZoneChange = (e) => {
    setSelectedZone(e.target.value);
    setSelectedRack('');
    setSelectedNode('');
  };

  const handleRackChange = (e) => {
    setSelectedRack(e.target.value);
    setSelectedNode('');
  };

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
    const rows = displayedStock.map(item => [
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

  const totalSkuCount = new Set(stock.map(item => item.product?.sku).filter(Boolean)).size;
  const totalQuantity = stock.reduce((sum, item) => sum + item.quantity, 0);

  // Client-side filtering: tìm kiếm theo tên/SKU và lọc theo tình trạng tồn
  const displayedStock = useMemo(() => {
    let result = allStock;
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(item =>
        item.product?.name?.toLowerCase().includes(q) ||
        item.product?.sku?.toLowerCase().includes(q)
      );
    }
    if (filterStatus === 'out') result = result.filter(item => item.quantity === 0);
    if (filterStatus === 'low') result = result.filter(item => item.quantity > 0 && item.quantity < (item.minStock || 5));
    if (filterStatus === 'ok') result = result.filter(item => item.quantity >= (item.minStock || 5));

    // Lọc theo Danh mục
    if (selectedCategory) {
      result = result.filter(item => {
        const catId = item.product?.categoryId ?? item.product?.category?._id;
        return String(catId) === String(selectedCategory);
      });
    }

    // Lọc theo Sản phẩm
    if (selectedProduct) {
      result = result.filter(item => String(item.product?._id || item.product) === String(selectedProduct));
    }

    // Lọc theo Kho
    if (selectedWarehouse) {
      result = result.filter(item => {
        const binId = item.warehouseNode?._id;
        return isDescendant(binId, selectedWarehouse);
      });
    }

    // Lọc theo Khu vực
    if (selectedZone) {
      result = result.filter(item => {
        const binId = item.warehouseNode?._id;
        return isDescendant(binId, selectedZone);
      });
    }

    // Lọc theo Kệ chứa
    if (selectedRack) {
      result = result.filter(item => {
        const binId = item.warehouseNode?._id;
        return isDescendant(binId, selectedRack);
      });
    }

    // Lọc theo Khay (Bin)
    if (selectedNode) {
      result = result.filter(item => String(item.warehouseNode?._id) === String(selectedNode));
    }

    return result;
  }, [allStock, searchText, filterStatus, selectedCategory, selectedProduct, selectedWarehouse, selectedZone, selectedRack, selectedNode, allNodes]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const suggestions = searchText.trim() ? products.filter(p =>
    p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchText.toLowerCase())
  ).slice(0, 8).map(p => ({ label: p.name, code: p.sku, id: p._id })) : [];

  const selectSuggestion = (item) => {
    setSearchText(item.code);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

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
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value);
                setShowSuggestions(true);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-500 transition-colors"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && searchText.trim().length > 0 && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50">
                <div className="py-2 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {suggestions.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectSuggestion(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-sm transition-colors ${
                          isActive ? 'bg-primary-50 text-primary-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate flex-1 mr-4">{item.label}</span>
                        <span className="font-mono text-xs text-slate-400 shrink-0">{item.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="sm:w-52">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả tình trạng</option>
              <option value="ok">Còn hàng</option>
              <option value="low">Sắp hết</option>
              <option value="out">Hết hàng</option>
            </select>
          </div>
          {(searchText || filterStatus || selectedCategory || selectedProduct || selectedWarehouse || selectedZone || selectedRack || selectedNode) && (
            <button
              onClick={() => {
                setSearchText('');
                setFilterStatus('');
                setSelectedCategory('');
                setSelectedProduct('');
                setSelectedWarehouse('');
                setSelectedZone('');
                setSelectedRack('');
                setSelectedNode('');
              }}
              className="px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
            >
              ✕ Xoá bộ lọc
            </button>
          )}
        </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Lọc theo sản phẩm: Danh mục -> Sản phẩm */}
          <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" /> Lọc theo sản phẩm
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Danh mục</label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sản phẩm</label>
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Tất cả sản phẩm</option>
                  {products.filter(p => !selectedCategory || p.categoryId === parseInt(selectedCategory) || p.category?._id === parseInt(selectedCategory)).map(p => (
                    <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lọc theo vị trí kho: Kho -> Khu vực -> Kệ -> Khay */}
          <div className="lg:col-span-8 bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Warehouse className="w-3 h-3 text-slate-400" /> Lọc theo vị trí kho
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kho</label>
                <select
                  value={selectedWarehouse}
                  onChange={handleWarehouseChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
                >
                  <option value="">Tất cả kho</option>
                  {allNodes.filter(n => n.type === 'warehouse').map(w => (
                    <option key={w._id} value={w._id}>{w.code} - {w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Khu vực</label>
                <select
                  value={selectedZone}
                  onChange={handleZoneChange}
                  disabled={!selectedWarehouse}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Tất cả khu vực</option>
                  {getDescOfType(selectedWarehouse, 'zone').map(z => (
                    <option key={z._id} value={z._id}>{z.code} - {z.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kệ chứa</label>
                <select
                  value={selectedRack}
                  onChange={handleRackChange}
                  disabled={!selectedZone}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Tất cả kệ</option>
                  {getDescOfType(selectedZone, 'rack').map(r => (
                    <option key={r._id} value={r._id}>{r.code} - {r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Khay chứa (Bin)</label>
                <select
                  value={selectedNode}
                  onChange={e => setSelectedNode(e.target.value)}
                  disabled={!selectedRack}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Tất cả khay</option>
                  {getDescOfType(selectedRack, 'bin').map(b => (
                    <option key={b._id} value={b._id}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs text-slate-500 font-semibold">
            {displayedStock.length < stock.length
              ? `${displayedStock.length} / ${stock.length} vị trí`
              : `${stock.length} vị trí hiển thị`}
          </span>
          <button
            onClick={handleExportCSV}
            disabled={displayedStock.length === 0}
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
        ) : displayedStock.length === 0 ? (
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
                  <th className="px-5 py-4 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {displayedStock.map(item => (
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
                      <span className={`font-bold text-base ${item.quantity === 0 ? 'text-red-500' : item.quantity < (item.minStock || 5) ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.quantity === 0
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">Hết hàng</span>
                        : item.quantity < (item.minStock || 5)
                          ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">Sắp hết</span>
                          : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">Còn hàng</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => {
                          const prod = products.find(p => p._id === (item.product?._id || item.product));
                          setDetailProduct({ product: { ...item.product, ...(prod || {}) }, stockRow: item });
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1 mx-auto"
                      >
                        <Package className="w-3.5 h-3.5" /> Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Stock Row Detail Modal */}
      {detailProduct && (() => {
        const p = detailProduct.product;
        const row = detailProduct.stockRow;
        const qty = row.quantity;
        const threshold = row.minStock || 5;
        const statusBadge = qty === 0
          ? <span className="px-2.5 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold">Hết hàng</span>
          : qty < threshold
            ? <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">Sắp hết</span>
            : <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">Còn hàng</span>;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{p.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</p>
                  </div>
                </div>
                <button onClick={() => setDetailProduct(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Thông tin sản phẩm */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Thông tin sản phẩm
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Danh mục</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{p.category?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Đơn vị tính</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{p.unit || 'Cái'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Giá sản xuất</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(p.priceIn)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Giá bán ra</p>
                      <p className="font-bold text-emerald-700 mt-0.5">{formatCurrency(p.priceOut)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Tồn kho tối thiểu</p>
                      <p className={`font-bold mt-0.5 ${qty <= (row.minStock || 0) ? 'text-red-600' : 'text-slate-800'}`}>
                        {row.minStock != null ? `${row.minStock} ${p.unit || 'cái'}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Cập nhật tồn kho</p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
                    </div>
                    {p.description && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Mô tả</p>
                        <p className="text-slate-600 mt-0.5">{p.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vị trí & tồn kho */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Vị trí lưu kho
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-mono font-bold text-sm">
                        {row.warehouseNode?.code || '—'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{row.warehouseNode?.name || '—'}</p>
                        {row.warehouseNode?.parent && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {row.warehouseNode.parent.name} › {row.warehouseNode.name}
                          </p>
                        )}
                        {row.warehouseNode?.type && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase">
                            {row.warehouseNode.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${qty === 0 ? 'text-red-500' : qty < threshold ? 'text-amber-600' : 'text-slate-900'}`}>
                        {qty.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">{p.unit || 'cái'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">{statusBadge}</div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setDetailProduct(null)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
