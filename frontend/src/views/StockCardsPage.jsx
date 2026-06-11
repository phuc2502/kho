import React, { useState, useEffect, useMemo } from 'react';
import { StockCardModel } from '../models/stockCard.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import { CategoryModel } from '../models/category.model.js';
import { useAuth } from '../controllers/auth.context.jsx';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import toast from 'react-hot-toast';
import {
  History, Plus, Search, FileText, Printer, Download,
  Edit2, Trash2, X, Filter, Calendar, TrendingUp, TrendingDown,
  Layers, MapPin, Database, ChevronLeft, ChevronRight
} from 'lucide-react';

const TYPE_MAP = {
  import: { label: 'Nhập kho', color: 'bg-emerald-50 text-emerald-700 border-emerald-250' },
  export: { label: 'Xuất kho', color: 'bg-red-50 text-red-700 border-red-250' },
  adjustment: { label: 'Điều chỉnh', color: 'bg-amber-50 text-amber-700 border-amber-250' },
  manual: { label: 'Thủ công', color: 'bg-blue-50 text-blue-700 border-blue-250' }
};

const ITEMS_PER_PAGE = 25;

export const StockCardsPage = () => {
  const { hasPermission, user } = useAuth();
  
  // Data lists
  const [stockCards, setStockCards] = useState([]);
  const [products, setProducts] = useState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [productId, setProductId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedAisle, setSelectedAisle] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [warehouseNodeId, setWarehouseNodeId] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refCode, setRefCode] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Form states (Add/Edit Manual)
  const [formProductId, setFormProductId] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formZone, setFormZone] = useState('');
  const [formAisle, setFormAisle] = useState('');
  const [formRack, setFormRack] = useState('');
  const [formNodeId, setFormNodeId] = useState('');
  const [formQtyChange, setFormQtyChange] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formRecordedAt, setFormRecordedAt] = useState('');

  // Fetch initial lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [pData, wData, cData] = await Promise.all([
          ProductModel.getAll(),
          WarehouseModel.getAll(),
          CategoryModel.getAll()
        ]);
        setProducts(pData || []);
        setAllNodes(wData || []);
        setCategories(cData || []);
      } catch (error) {
        toast.error('Lỗi khi tải danh mục và vị trí kho: ' + error.message);
      }
    };
    fetchLookups();
  }, []);

  // Fetch stock cards based on filters
  const fetchStockCards = async () => {
    try {
      setLoading(true);
      const params = {
        productId,
        warehouseNodeId,
        type,
        refCode,
        startDate: startDate ? new Date(startDate).toISOString() : '',
        endDate: endDate ? new Date(endDate).toISOString() : ''
      };
      const data = await StockCardModel.getAll(params);
      setStockCards(data || []);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Lỗi khi tải thẻ kho: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockCards();
  }, [productId, warehouseNodeId, type, startDate, endDate, refCode]);

  // Hierarchical node filtering helpers
  const getDescOfType = (parentId, nodeType) => {
    if (!parentId) return allNodes.filter(n => n.type === nodeType);
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
          if (n.type === nodeType) result.push(n);
          else queue.push(n._id);
        }
      });
    }
    return result;
  };

  // Filter components changes reset lower-level filters
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setProductId('');
  };

  const handleZoneChange = (e) => {
    setSelectedZone(e.target.value);
    setSelectedAisle('');
    setSelectedRack('');
    setWarehouseNodeId('');
  };

  const handleAisleChange = (e) => {
    setSelectedAisle(e.target.value);
    setSelectedRack('');
    setWarehouseNodeId('');
  };

  const handleRackChange = (e) => {
    setSelectedRack(e.target.value);
    setWarehouseNodeId('');
  };

  // Memoized lists
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(p => p.categoryId === parseInt(selectedCategory));
  }, [products, selectedCategory]);

  const filteredFormProducts = useMemo(() => {
    if (!formCategory) return products;
    return products.filter(p => p.categoryId === parseInt(formCategory));
  }, [products, formCategory]);

  // Statistics calculation for the loaded cards
  const stats = useMemo(() => {
    let totalImport = 0;
    let totalExport = 0;
    
    stockCards.forEach(card => {
      const qty = Number(card.qtyChange);
      if (qty > 0) {
        totalImport += qty;
      } else {
        totalExport += Math.abs(qty);
      }
    });

    // Determine the ending balance of the filtered set if products/bins are specified
    // S08-DN requires opening and ending balances
    const endingBalance = stockCards.length > 0 ? stockCards[0].qtyAfter : 0;
    const openingBalance = stockCards.length > 0 ? stockCards[stockCards.length - 1].qtyBefore : 0;

    return {
      totalImport,
      totalExport,
      openingBalance,
      endingBalance,
      recordCount: stockCards.length
    };
  }, [stockCards]);

  // Pagination calculations
  const totalPages = Math.ceil(stockCards.length / ITEMS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return stockCards.slice(start, start + ITEMS_PER_PAGE);
  }, [stockCards, currentPage]);

  // CRUD actions
  const handleOpenAddModal = () => {
    setFormProductId('');
    setFormCategory('');
    setFormZone('');
    setFormAisle('');
    setFormRack('');
    setFormNodeId('');
    setFormQtyChange('');
    setFormNote('');
    setFormRecordedAt(new Date().toISOString().substring(0, 16));
    setShowAddModal(true);
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!formProductId || !formNodeId || !formQtyChange || Number(formQtyChange) === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin và số lượng thay đổi khác 0');
      return;
    }
    try {
      await StockCardModel.createManual({
        productId: parseInt(formProductId),
        warehouseNodeId: parseInt(formNodeId),
        qtyChange: parseInt(formQtyChange),
        note: formNote || 'Lập thẻ kho thủ công',
        recordedAt: new Date(formRecordedAt).toISOString()
      });
      toast.success('Lập thẻ kho thủ công thành công');
      setShowAddModal(false);
      fetchStockCards();
    } catch (error) {
      toast.error('Lỗi lập thẻ thủ công: ' + error.message);
    }
  };

  const handleOpenEditModal = (card) => {
    setEditingCard(card);
    setFormQtyChange(card.qtyChange);
    setFormNote(card.note || '');
    setFormRecordedAt(new Date(card.recordedAt).toISOString().substring(0, 16));
    setShowEditModal(true);
  };

  const handleUpdateManual = async (e) => {
    e.preventDefault();
    if (!formQtyChange || Number(formQtyChange) === 0) {
      toast.error('Số lượng thay đổi phải khác 0');
      return;
    }
    try {
      await StockCardModel.updateManual(editingCard._id, {
        qtyChange: parseInt(formQtyChange),
        note: formNote,
        recordedAt: new Date(formRecordedAt).toISOString()
      });
      toast.success('Cập nhật thẻ kho thủ công thành công');
      setShowEditModal(false);
      fetchStockCards();
    } catch (error) {
      toast.error('Cập nhật thất bại: ' + error.message);
    }
  };

  const handleDeleteManual = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ kho thủ công này? Điều này sẽ hoàn tác số lượng tồn kho tương ứng.')) {
      return;
    }
    try {
      await StockCardModel.deleteManual(id);
      toast.success('Xóa thẻ kho và hoàn trả tồn kho thành công');
      fetchStockCards();
    } catch (error) {
      toast.error('Xóa thất bại: ' + error.message);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (stockCards.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['Mã thẻ', 'Ngày ghi sổ', 'Sản phẩm SKU', 'Sản phẩm', 'Khay chứa', 'Loại biến động', 'Tồn đầu', 'Thay đổi', 'Tồn cuối', 'Diễn giải', 'Người lập'];
    const rows = stockCards.map(c => [
      c.code,
      new Date(c.recordedAt).toLocaleString('vi-VN'),
      c.product?.sku || '',
      c.product?.name || '',
      c.warehouseNode?.code || '',
      TYPE_MAP[c.type]?.label || c.type,
      c.qtyBefore,
      c.qtyChange,
      c.qtyAfter,
      c.note || '',
      c.createdByUser?.fullName || c.createdByUser?.username || ''
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `the_kho_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print S08-DN handler
  const handlePrintS08 = () => {
    window.print();
  };

  // Get selected details for S08-DN header representation
  const selectedProductObj = useMemo(() => {
    if (!productId) return null;
    return products.find(p => p._id === parseInt(productId));
  }, [products, productId]);

  const selectedNodeObj = useMemo(() => {
    if (!warehouseNodeId) return null;
    return allNodes.find(n => n._id === parseInt(warehouseNodeId));
  }, [allNodes, warehouseNodeId]);

  return (
    <div className="space-y-6">
      {/* CSS Styles for Print S08-DN */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide standard layout */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          /* Show print section only */
          #s08-dn-print-canvas, #s08-dn-print-canvas * {
            visibility: visible;
          }
          #s08-dn-print-canvas {
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            Thẻ kho (Stock Card)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Xem lịch sử xuất nhập tồn, lập thẻ điều chỉnh và xuất báo cáo S08-DN
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-300"
          >
            <Download className="w-4 h-4" /> Xuất Excel/CSV
          </button>
          <button
            onClick={handlePrintS08}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-300"
          >
            <Printer className="w-4 h-4" /> In Thẻ Kho (S08-DN)
          </button>
          <PermissionGuard permission="adjustment:create">
            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
            >
              <Plus className="w-4 h-4" /> Lập thẻ thủ công
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Số giao dịch</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.recordCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase font-mono">Tổng Nhập (+)</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{stats.totalImport}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase font-mono">Tổng Xuất (-)</p>
            <p className="text-lg font-bold text-red-600 mt-0.5">{stats.totalExport}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Tồn cuối kỳ</p>
            <p className="text-lg font-bold text-primary-600 mt-0.5">{stats.endingBalance}</p>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-700 text-sm">Bộ lọc nâng cao</h3>
        </div>

        {/* Sản phẩm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Danh mục sản phẩm</label>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Sản phẩm</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả sản phẩm</option>
              {filteredProducts.map(p => <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Vị trí kho — 4 cấp phân cấp */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Vị trí kho (phân cấp)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Cấp 1: Khu vực (Zone) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">① Khu vực <span className="text-slate-400 font-normal">(Zone)</span></label>
              <select
                value={selectedZone}
                onChange={handleZoneChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">Tất cả khu vực</option>
                {allNodes.filter(n => n.type === 'zone').map(z => (
                  <option key={z._id} value={z._id}>{z.name} ({z.code})</option>
                ))}
              </select>
            </div>

            {/* Cấp 2: Dãy kệ (Aisle) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">② Dãy kệ <span className="text-slate-400 font-normal">(Aisle)</span></label>
              <select
                value={selectedAisle}
                onChange={handleAisleChange}
                disabled={!selectedZone}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-primary-500 disabled:opacity-50"
              >
                <option value="">Tất cả dãy kệ</option>
                {getDescOfType(selectedZone, 'aisle').map(a => (
                  <option key={a._id} value={a._id}>{a.name} ({a.code})</option>
                ))}
              </select>
            </div>

            {/* Cấp 3: Kệ chứa (Rack) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">③ Kệ chứa <span className="text-slate-400 font-normal">(Rack)</span></label>
              <select
                value={selectedRack}
                onChange={handleRackChange}
                disabled={!selectedAisle}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-primary-500 disabled:opacity-50"
              >
                <option value="">Tất cả kệ</option>
                {getDescOfType(selectedAisle, 'rack').map(r => (
                  <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>

            {/* Cấp 4: Khay chứa (Bin) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">④ Khay chứa <span className="text-slate-400 font-normal">(Bin)</span></label>
              <select
                value={warehouseNodeId}
                onChange={(e) => setWarehouseNodeId(e.target.value)}
                disabled={!selectedRack}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-primary-500 disabled:opacity-50"
              >
                <option value="">Tất cả khay</option>
                {getDescOfType(selectedRack, 'bin').map(b => (
                  <option key={b._id} value={b._id}>{b.name || b.code} ({b.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Type Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Loại biến động</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">Tất cả loại</option>
              <option value="import">Nhập kho (import)</option>
              <option value="export">Xuất kho (export)</option>
              <option value="adjustment">Điều chỉnh (adjustment)</option>
              <option value="manual">Thủ công (manual)</option>
            </select>
          </div>

          {/* Reference search */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Mã chứng từ</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="Nhập mã chứng từ..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Date range filters */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Từ ngày</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Đến ngày</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="mt-2 text-sm text-slate-500">Đang tải lịch sử thẻ kho...</p>
          </div>
        ) : paginatedCards.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy bản ghi thẻ kho nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-5 py-4 w-32">Mã thẻ</th>
                  <th className="px-5 py-4">Ngày ghi sổ</th>
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th className="px-5 py-4">Vị trí</th>
                  <th className="px-5 py-4">Biến động</th>
                  <th className="px-5 py-4 text-right">Tồn đầu</th>
                  <th className="px-5 py-4 text-right">Thay đổi</th>
                  <th className="px-5 py-4 text-right">Tồn cuối</th>
                  <th className="px-5 py-4">Chứng từ / Ghi chú</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedCards.map(card => {
                  const badge = TYPE_MAP[card.type] || { label: card.type, color: 'bg-slate-100 text-slate-700 border-slate-200' };
                  return (
                    <tr key={card._id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{card.code}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(card.recordedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{card.product?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{card.product?.sku} · ĐVT: {card.product?.unit || 'cái'}</p>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-primary-600">
                        {card.warehouseNode?.code || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-500">{card.qtyBefore}</td>
                      <td className="px-5 py-4 text-right">
                        {card.qtyChange > 0 ? (
                          <span className="font-bold text-emerald-600 font-mono">+{card.qtyChange}</span>
                        ) : (
                          <span className="font-bold text-red-650 font-mono">{card.qtyChange}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800">{card.qtyAfter}</td>
                      <td className="px-5 py-4">
                        <div className="max-w-[180px]">
                          {card.refCode !== 'MANUAL' ? (
                            <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono font-semibold text-slate-650 mb-0.5">{card.refCode}</span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 bg-blue-50 rounded text-xs font-mono font-semibold text-blue-600 mb-0.5">MANUAL</span>
                          )}
                          <p className="text-xs text-slate-400 truncate" title={card.note}>{card.note}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {card.type === 'manual' ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(card)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-500 rounded-lg transition-colors"
                              title="Sửa thẻ thủ công"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteManual(card._id)}
                              className="p-1.5 bg-slate-100 hover:bg-red-150 hover:text-red-600 text-slate-500 rounded-lg transition-colors"
                              title="Xóa thẻ thủ công"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-350 text-xs font-medium italic select-none">Tự động</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination View */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600 no-print">
          <span>Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> · Tổng số {stockCards.length} giao dịch</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Trước
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Sau <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Add Manual Stock Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <History className="w-5 h-5 text-primary-500" />
                Lập thẻ kho thủ công (Manual Adjust)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateManual} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Danh mục sản phẩm</label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value);
                    setFormProductId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="">-- Tất cả danh mục --</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Sản phẩm *</label>
                <select
                  required
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="" disabled>-- Chọn sản phẩm --</option>
                  {filteredFormProducts.map(p => (
                    <option key={p._id} value={p._id}>{p.sku} - {p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>

              {/* Vị trí kho — 4 cấp phân cấp */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Vị trí lưu kho *
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Cấp 1: Khu vực */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">① Khu vực <span className="text-slate-300 font-normal">(Zone)</span></p>
                      <select
                        required
                        value={formZone}
                        onChange={(e) => {
                          setFormZone(e.target.value);
                          setFormAisle('');
                          setFormRack('');
                          setFormNodeId('');
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500"
                      >
                        <option value="" disabled>-- Chọn khu vực --</option>
                        {allNodes.filter(n => n.type === 'zone').map(z => (
                          <option key={z._id} value={z._id}>{z.name} ({z.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Cấp 2: Dãy kệ */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">② Dãy kệ <span className="text-slate-300 font-normal">(Aisle)</span></p>
                      <select
                        required
                        disabled={!formZone}
                        value={formAisle}
                        onChange={(e) => {
                          setFormAisle(e.target.value);
                          setFormRack('');
                          setFormNodeId('');
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100"
                      >
                        <option value="" disabled>-- Chọn dãy kệ --</option>
                        {getDescOfType(formZone, 'aisle').map(a => (
                          <option key={a._id} value={a._id}>{a.name} ({a.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Cấp 3: Kệ chứa */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">③ Kệ chứa <span className="text-slate-300 font-normal">(Rack)</span></p>
                      <select
                        required
                        disabled={!formAisle}
                        value={formRack}
                        onChange={(e) => {
                          setFormRack(e.target.value);
                          setFormNodeId('');
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100"
                      >
                        <option value="" disabled>-- Chọn kệ --</option>
                        {getDescOfType(formAisle, 'rack').map(r => (
                          <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Cấp 4: Khay chứa */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">④ Khay chứa <span className="text-slate-300 font-normal">(Bin)</span></p>
                      <select
                        required
                        disabled={!formRack}
                        value={formNodeId}
                        onChange={(e) => setFormNodeId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:bg-slate-100"
                      >
                        <option value="" disabled>-- Chọn khay --</option>
                        {getDescOfType(formRack, 'bin').map(b => (
                          <option key={b._id} value={b._id}>{b.name || b.code} ({b.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Thay đổi lượng (+/-) *</label>
                  <input
                    type="number"
                    required
                    value={formQtyChange}
                    onChange={(e) => setFormQtyChange(e.target.value)}
                    placeholder="Ví dụ: 10 hoặc -5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Ngày ghi nhận *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formRecordedAt}
                    onChange={(e) => setFormRecordedAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Ghi chú / Diễn giải lý do</label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Diễn giải cụ thể sự biến động..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                />
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
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Manual Stock Card Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Hiệu chỉnh Thẻ kho thủ công
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Sản phẩm: {editingCard?.product?.name} · Vị trí: {editingCard?.warehouseNode?.code}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateManual} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Thay đổi lượng (+/-) *</label>
                  <input
                    type="number"
                    required
                    value={formQtyChange}
                    onChange={(e) => setFormQtyChange(e.target.value)}
                    placeholder="Ví dụ: 10 hoặc -5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Ngày ghi nhận *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formRecordedAt}
                    onChange={(e) => setFormRecordedAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Ghi chú / Diễn giải lý do</label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Diễn giải cụ thể sự biến động..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-primary-500"
                />
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
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* S08-DN Printable Canvas (Hidden on screen, styled via @media print) */}
      <div id="s08-dn-print-canvas" className="hidden p-8 bg-white text-black font-serif">
        <div className="flex justify-between items-start mb-6">
          <div className="text-left font-serif">
            <p className="font-bold">ĐƠN VỊ: MVC WAREHOUSE SYSTEM</p>
            <p>Địa chỉ: Khu công nghệ cao, TP. Hồ Chí Minh</p>
          </div>
          <div className="text-right font-serif max-w-[280px]">
            <p className="font-bold">Mẫu số S08-DN</p>
            <p className="italic text-[11px] leading-tight">
              (Ban hành theo Thông tư số 200/2014/TT-BTC<br/>
              Ngày 22/12/2014 của Bộ Tài chính)
            </p>
          </div>
        </div>

        <div className="text-center my-6 font-serif">
          <h2 className="text-xl font-bold uppercase tracking-wide">THẺ KHO (SỔ KHO)</h2>
          <p className="italic mt-1">Lập ngày: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div className="space-y-2 mb-6 font-serif text-sm">
          <p><span className="font-bold">Tên, quy cách sản phẩm:</span> {selectedProductObj ? selectedProductObj.name : 'Tất cả sản phẩm'}</p>
          <div className="grid grid-cols-2">
            <p><span className="font-bold">Mã sản phẩm (SKU):</span> {selectedProductObj ? selectedProductObj.sku : 'Tất cả'}</p>
            <p><span className="font-bold">Đơn vị tính:</span> {selectedProductObj ? (selectedProductObj.unit || 'cái') : '—'}</p>
          </div>
          <p><span className="font-bold">Vị trí khay chứa (Bin):</span> {selectedNodeObj ? selectedNodeObj.code : 'Tất cả khay chứa'}</p>
        </div>

        <table className="w-full text-left font-serif text-xs border border-collapse border-black">
          <thead>
            <tr className="text-center font-bold">
              <th rowSpan="2" className="border border-black px-2 py-3 w-10">STT</th>
              <th colSpan="2" className="border border-black px-2 py-1.5">Số hiệu chứng từ</th>
              <th rowSpan="2" className="border border-black px-2 py-3 w-24">Ngày chứng từ</th>
              <th rowSpan="2" className="border border-black px-2 py-3 w-24">Ngày ghi sổ</th>
              <th rowSpan="2" className="border border-black px-2 py-3">Diễn giải</th>
              <th colSpan="3" className="border border-black px-2 py-1.5">Số lượng</th>
              <th rowSpan="2" className="border border-black px-2 py-3 w-20">Ký xác nhận thủ kho</th>
            </tr>
            <tr className="text-center font-bold">
              <th className="border border-black px-2 py-1 w-16">Nhập</th>
              <th className="border border-black px-2 py-1 w-16">Xuất</th>
              <th className="border border-black px-2 py-1 w-16">Nhập</th>
              <th className="border border-black px-2 py-1 w-16">Xuất</th>
              <th className="border border-black px-2 py-1 w-16 font-bold bg-slate-50">Tồn</th>
            </tr>
            <tr className="text-center italic bg-slate-50">
              <td className="border border-black">A</td>
              <td className="border border-black">B</td>
              <td className="border border-black">C</td>
              <td className="border border-black">D</td>
              <td className="border border-black">E</td>
              <td className="border border-black">F</td>
              <td className="border border-black">1</td>
              <td className="border border-black">2</td>
              <td className="border border-black">3</td>
              <td className="border border-black">G</td>
            </tr>
          </thead>
          <tbody>
            {/* Opening row */}
            <tr>
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black font-bold italic">Số dư đầu kỳ</td>
              <td className="border border-black text-right">—</td>
              <td className="border border-black text-right">—</td>
              <td className="border border-black text-right font-bold">{stats.openingBalance}</td>
              <td className="border border-black text-center">—</td>
            </tr>
            {stockCards.slice().reverse().map((card, idx) => {
              const isImport = card.qtyChange > 0;
              return (
                <tr key={card._id}>
                  <td className="border border-black text-center">{idx + 1}</td>
                  <td className="border border-black text-center">{isImport ? card.refCode : '—'}</td>
                  <td className="border border-black text-center">{!isImport ? card.refCode : '—'}</td>
                  <td className="border border-black text-center">
                    {new Date(card.recordedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="border border-black text-center">
                    {new Date(card.recordedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="border border-black text-left">{card.note || 'Biến động kho'}</td>
                  <td className="border border-black text-right">
                    {isImport ? card.qtyChange : '—'}
                  </td>
                  <td className="border border-black text-right">
                    {!isImport ? Math.abs(card.qtyChange) : '—'}
                  </td>
                  <td className="border border-black text-right font-bold">{card.qtyAfter}</td>
                  <td className="border border-black text-center">—</td>
                </tr>
              );
            })}
            {/* Closing row */}
            <tr className="bg-slate-50 font-bold">
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black text-center">—</td>
              <td className="border border-black font-bold uppercase">Cộng cuối kỳ</td>
              <td className="border border-black text-right">{stats.totalImport}</td>
              <td className="border border-black text-right">{stats.totalExport}</td>
              <td className="border border-black text-right font-bold">{stats.endingBalance}</td>
              <td className="border border-black text-center">—</td>
            </tr>
          </tbody>
        </table>

        {/* Print signatures */}
        <div className="mt-12 grid grid-cols-3 text-center font-serif text-sm">
          <div>
            <p className="font-bold">Người lập biểu</p>
            <p className="italic text-xs">(Ký, họ tên)</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-800">{user?.fullName || 'Người lập'}</p>
          </div>
          <div>
            <p className="font-bold">Thủ kho</p>
            <p className="italic text-xs">(Ký, họ tên)</p>
            <div className="h-16"></div>
            <p className="font-bold">................................</p>
          </div>
          <div>
            <p className="font-bold">Kế toán trưởng</p>
            <p className="italic text-xs">(Ký, họ tên)</p>
            <div className="h-16"></div>
            <p className="font-bold">................................</p>
          </div>
        </div>
      </div>
    </div>
  );
};
