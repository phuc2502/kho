import React, { useState, useEffect } from 'react';
import { InventoryModel } from '../models/inventory.model.js';
import { ProductModel } from '../models/product.model.js';
import { WarehouseModel } from '../models/warehouse.model.js';
import toast from 'react-hot-toast';
import { Database, Search, MapPin, Layers } from 'lucide-react';

export const InventoryPage = () => {
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedNode, setSelectedNode] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockData, productsData, nodesData] = await Promise.all([
        InventoryModel.getStock(selectedProduct, selectedNode),
        ProductModel.getAll(),
        WarehouseModel.getAll()
      ]);
      setStock(stockData);
      setProducts(productsData);
      // Only show bins for placement
      setNodes(nodesData.filter(n => n.type === 'bin'));
    } catch (error) {
      toast.error('Lỗi khi tải báo cáo tồn kho: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProduct, selectedNode]);

  // Compute stats
  const totalSkuCount = new Set(stock.map(item => item.product?._id)).size;
  const totalQuantity = stock.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xl font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Số lượng SKU độc nhất</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalSkuCount} SKU</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tổng số lượng hàng tồn</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalQuantity.toLocaleString()} đơn vị</h3>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase">Lọc theo sản phẩm</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả sản phẩm</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase">Lọc theo vị trí (Bin)</label>
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả khay chứa (Bin)</option>
            {nodes.map(n => (
              <option key={n._id} value={n._id}>{n.code} ({n.name})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang truy vấn số liệu tồn kho...</p>
          </div>
        ) : stock.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy tồn kho thực tế cho bộ lọc hiện tại</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-6 py-4">Mã SKU</th>
                  <th className="px-6 py-4">Tên sản phẩm</th>
                  <th className="px-6 py-4">Vị trí khay chứa (Bin)</th>
                  <th className="px-6 py-4">Đơn vị</th>
                  <th className="px-6 py-4 text-right">Số lượng tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {stock.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 tracking-wide">
                      {item.product?.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {item.product?.name || 'Sản phẩm đã bị xóa'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <MapPin className="w-3.5 h-3.5 text-primary-500" />
                        <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-bold">
                          {item.warehouseNode?.code || 'N/A'}
                        </span>
                        <span className="text-slate-400">({item.warehouseNode?.name || 'Vị trí đã bị xóa'})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.product?.unit || 'Cái'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-base ${item.quantity > 10 ? 'text-slate-900' : 'text-amber-600'}`}>
                        {item.quantity.toLocaleString()}
                      </span>
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
