import React, { useState, useEffect } from 'react';
import { WarehouseModel } from '../models/warehouse.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, MapPin, X } from 'lucide-react';

export const WarehouseStructurePage = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('warehouse');
  const [parent, setParent] = useState('');

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const data = await WarehouseModel.getAll();
      setNodes(data);
    } catch (error) {
      toast.error('Lỗi khi tải sơ đồ kho: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const openAddNode = () => {
    setEditingNode(null);
    setName('');
    setCode('');
    setType('warehouse');
    setParent('');
    setShowModal(true);
  };

  const openEditNode = (node) => {
    setEditingNode(node);
    setName(node.name);
    setCode(node.code);
    setType(node.type);
    setParent(node.parent?._id || node.parent || '');
    setShowModal(true);
  };

  const handleSaveNode = async (e) => {
    e.preventDefault();
    if (!name || !code || !type) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const payload = {
      name,
      code: code.toUpperCase(),
      type,
      parent: parent || null
    };

    try {
      if (editingNode) {
        await WarehouseModel.update(editingNode._id, payload);
        toast.success('Đã cập nhật vị trí kho thành công');
      } else {
        await WarehouseModel.create(payload);
        toast.success('Đã thêm vị trí kho mới thành công');
      }
      setShowModal(false);
      fetchNodes();
    } catch (error) {
      toast.error('Lỗi khi lưu vị trí kho: ' + error.message);
    }
  };

  const handleDeleteNode = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vị trí này không? Hãy đảm bảo không có vị trí con nào thuộc về vị trí này.')) return;
    try {
      await WarehouseModel.delete(id);
      toast.success('Đã xóa vị trí kho');
      fetchNodes();
    } catch (error) {
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  // Helper to build hierarchy tree representation
  const renderTypeBadge = (t) => {
    const badges = {
      warehouse: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      zone: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      aisle: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rack: 'bg-amber-100 text-amber-700 border-amber-200',
      bin: 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badges[t] || 'bg-slate-100 text-slate-700'}`}>
        {t}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cấu trúc phân cấp Sơ đồ Kho</h2>
          <p className="text-sm text-slate-500">Định nghĩa các khu vực, dãy kệ và khay lưu trữ hàng hóa</p>
        </div>
        <PermissionGuard permission="warehouse:create">
          <button
            onClick={openAddNode}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            Thêm vị trí mới
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="mt-2">Đang tải cấu trúc kho...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có cấu trúc vị trí kho nào được thiết lập</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <th className="px-6 py-4">Mã vị trí</th>
                  <th className="px-6 py-4">Tên vị trí</th>
                  <th className="px-6 py-4">Phân loại</th>
                  <th className="px-6 py-4">Vị trí cha (Parent)</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {nodes.map(n => (
                  <tr key={n._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 tracking-wide">{n.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">{n.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderTypeBadge(n.type)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {n.parent ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {n.parent.code}
                          </span>
                          <span className="text-xs">({n.parent.name})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Cấp cao nhất</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <PermissionGuard permission="warehouse:update">
                          <button
                            onClick={() => openEditNode(n)}
                            className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="warehouse:delete">
                          <button
                            onClick={() => handleDeleteNode(n._id)}
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

      {/* Node Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">
                {editingNode ? 'Sửa vị trí kho' : 'Thêm vị trí kho mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNode} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mã vị trí * (Vết mã vạch)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 uppercase focus:outline-none focus:border-primary-500"
                  placeholder="Ví dụ: BIN-A1-1-1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên vị trí *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="Ví dụ: Khay lưu trữ số 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phân loại vị trí *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  >
                    <option value="warehouse">Warehouse (Kho)</option>
                    <option value="zone">Zone (Khu vực)</option>
                    <option value="aisle">Aisle (Dãy kệ)</option>
                    <option value="rack">Rack (Kệ chứa)</option>
                    <option value="bin">Bin (Khay chứa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vị trí cha (Parent)</label>
                  <select
                    value={parent}
                    onChange={(e) => setParent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">-- Cấp cao nhất --</option>
                    {nodes
                      .filter(n => !editingNode || n._id !== editingNode._id) // Prevent self-referencing
                      .map(n => (
                        <option key={n._id} value={n._id}>{n.code} ({n.name})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
                >
                  {editingNode ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
