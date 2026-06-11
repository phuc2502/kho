import React, { useState, useEffect } from 'react';
import { ProductModel } from '../models/product.model.js';
import { CategoryModel } from '../models/category.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import { useAuth } from '../controllers/auth.context.jsx';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, FolderPlus, X } from 'lucide-react';

export const ProductsPage = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Product Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceIn, setPriceIn] = useState('');
  const [priceOut, setPriceOut] = useState('');
  const [unit, setUnit] = useState('Cái');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Category Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, cData] = await Promise.all([
        ProductModel.getAll(),
        CategoryModel.getAll()
      ]);
      setProducts(pData);
      setCategories(cData);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Handle Product Actions
  const openAddProduct = () => {
    setEditingProduct(null);
    setSku('');
    setName('');
    setDescription('');
    setPriceIn('');
    setPriceOut('');
    setUnit('Cái');
    setSelectedCategory(categories[0]?._id || '');
    setShowProductModal(true);
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setSku(prod.sku);
    setName(prod.name);
    setDescription(prod.description || '');
    setPriceIn(prod.priceIn);
    setPriceOut(prod.priceOut);
    setUnit(prod.unit);
    setSelectedCategory(prod.category?._id || prod.category || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!sku || !name || !priceIn || !priceOut || !selectedCategory) {
      toast.error('Vui lòng điền các trường bắt buộc');
      return;
    }

    if (Number(priceOut) <= Number(priceIn)) {
      toast.error('Giá bán (priceOut) phải lớn hơn giá sản xuất (priceIn)');
      return;
    }

    const payload = {
      sku,
      name,
      description,
      priceIn: Number(priceIn),
      priceOut: Number(priceOut),
      unit,
      category: selectedCategory
    };

    try {
      if (editingProduct) {
        await ProductModel.update(editingProduct._id, payload);
        toast.success('Đã cập nhật sản phẩm thành công');
      } else {
        await ProductModel.create(payload);
        toast.success('Đã tạo sản phẩm mới thành công');
      }
      setShowProductModal(false);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lưu sản phẩm: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    try {
      await ProductModel.delete(id);
      toast.success('Đã xóa sản phẩm');
      fetchData();
    } catch (error) {
      toast.error('Không thể xóa sản phẩm: ' + error.message);
    }
  };

  // Handle Category Actions
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDesc('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName) {
      toast.error('Tên danh mục là bắt buộc');
      return;
    }

    const payload = { name: categoryName, description: categoryDesc };

    try {
      if (editingCategory) {
        await CategoryModel.update(editingCategory._id, payload);
        toast.success('Đã cập nhật danh mục thành công');
      } else {
        await CategoryModel.create(payload);
        toast.success('Đã tạo danh mục mới thành công');
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lưu danh mục: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) return;
    try {
      await CategoryModel.delete(id);
      toast.success('Đã xóa danh mục');
      fetchData();
    } catch (error) {
      toast.error('Không thể xóa danh mục: ' + error.message);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? (p.category?._id === categoryFilter || p.category === categoryFilter) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'products' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sản phẩm
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'categories' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Danh mục
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-1 gap-3">
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-primary-500"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <PermissionGuard permission="product:create">
              <button
                onClick={openAddProduct}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
              >
                <Plus className="w-4.5 h-4.5" />
                Thêm sản phẩm
              </button>
            </PermissionGuard>
          </div>

          {/* Products List Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                <p className="mt-2">Đang tải danh sách sản phẩm...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy sản phẩm nào phù hợp</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                      <th className="px-6 py-4">Mã SKU</th>
                      <th className="px-6 py-4">Tên sản phẩm</th>
                      <th className="px-6 py-4">Danh mục</th>
                      <th className="px-6 py-4">Đơn vị</th>
                      <th className="px-6 py-4 text-right">Giá sản xuất</th>
                      <th className="px-6 py-4 text-right">Giá bán</th>
                      <th className="px-6 py-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredProducts.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900 tracking-wider">{p.sku}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]" title={p.description}>
                              {p.description || 'Không có mô tả'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {p.category?.name || 'Không xác định'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                        <td className="px-6 py-4 text-right text-red-500 font-medium">{formatCurrency(p.priceIn)}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">{formatCurrency(p.priceOut)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <PermissionGuard permission="product:update">
                              <button
                                onClick={() => openEditProduct(p)}
                                className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission="product:delete">
                              <button
                                onClick={() => handleDeleteProduct(p._id)}
                                className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category Add Button */}
          <div className="flex justify-end">
            <PermissionGuard permission="category:create">
              <button
                onClick={openAddCategory}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
              >
                <FolderPlus className="w-4.5 h-4.5" />
                Tạo danh mục mới
              </button>
            </PermissionGuard>
          </div>

          {/* Categories List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(c => (
              <div key={c._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{c.name}</h4>
                  <p className="text-sm text-slate-500 mt-2 min-h-[40px]">{c.description || 'Không có mô tả chi tiết'}</p>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end gap-2">
                  <PermissionGuard permission="category:update">
                    <button
                      onClick={() => openEditCategory(c)}
                      className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Sửa
                    </button>
                  </PermissionGuard>
                  <PermissionGuard permission="category:delete">
                    <button
                      onClick={() => handleDeleteCategory(c._id)}
                      className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </PermissionGuard>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">
                {editingProduct ? 'Sửa thông tin sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mã SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 uppercase focus:outline-none focus:border-primary-500"
                    placeholder="Mã SKU (PHONE12)"
                    disabled={!!editingProduct}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    placeholder="Cái, Thùng, Hộp..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="Điện thoại iPhone 12"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Danh mục hàng hóa *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                >
                  <option value="" disabled>-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Giá sản xuất (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={priceIn}
                    onChange={(e) => setPriceIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    placeholder="10000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={priceOut}
                    onChange={(e) => setPriceOut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    placeholder="12500000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả ngắn</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Nhập thông số mô tả chi tiết của sản phẩm..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
                >
                  {editingProduct ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Add/Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">
                {editingCategory ? 'Sửa thông tin danh mục' : 'Tạo danh mục mới'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="Điện tử, Thời trang..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả danh mục</label>
                <textarea
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Mô tả nhóm sản phẩm..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
                >
                  {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
