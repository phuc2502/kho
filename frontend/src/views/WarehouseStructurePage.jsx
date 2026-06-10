import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WarehouseModel } from '../models/warehouse.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import toast from 'react-hot-toast';
import {
  Plus, Edit3, Trash2, X, ChevronDown, ChevronRight,
  Warehouse, LayoutGrid, AlignJustify, Layers, Package,
  ScanLine, LayoutDashboard
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  warehouse: {
    label: 'Kho', icon: Warehouse,
    row:    'bg-indigo-50 border-indigo-200',
    badge:  'bg-indigo-100 text-indigo-700 border-indigo-200',
    grid:   'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  zone: {
    label: 'Khu vực', icon: LayoutGrid,
    row:    'bg-cyan-50 border-cyan-200',
    badge:  'bg-cyan-100 text-cyan-700 border-cyan-200',
    grid:   'bg-cyan-50 border-cyan-200 text-cyan-700',
  },
  aisle: {
    label: 'Dãy kệ', icon: AlignJustify,
    row:    'bg-emerald-50 border-emerald-200',
    badge:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    grid:   'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  rack: {
    label: 'Kệ chứa', icon: Layers,
    row:    'bg-amber-50 border-amber-200',
    badge:  'bg-amber-100 text-amber-700 border-amber-200',
    grid:   'bg-amber-50 border-amber-200 text-amber-700',
  },
  bin: {
    label: 'Khay (Bin)', icon: Package,
    row:    'bg-rose-50 border-rose-200',
    badge:  'bg-rose-100 text-rose-700 border-rose-200',
    grid:   'bg-rose-50 border-rose-200 text-rose-700',
  },
};

// next type when adding child
const NEXT_TYPE = {
  warehouse: 'zone',
  zone:      'aisle',
  aisle:     'rack',
  rack:      'bin',
  bin:       'bin',
};

// ──────────────────────────────────────────────────────────────
// Build tree from flat list
// ──────────────────────────────────────────────────────────────
function buildTree(nodes) {
  const map = {};
  nodes.forEach(n => { map[n._id] = { ...n, children: [] }; });
  const roots = [];
  nodes.forEach(n => {
    // parentId is the FK integer; parent._id also works after backend fix
    const parentId = n.parentId ?? n.parent?._id ?? null;
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[n._id]);
    } else {
      roots.push(map[n._id]);
    }
  });
  return roots;
}

// ──────────────────────────────────────────────────────────────
// TypeBadge
// ──────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || { label: type, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────
// WarehouseNodeRow — một dòng trong cây, actions luôn hiển thị
// ──────────────────────────────────────────────────────────────
const WarehouseNodeRow = ({
  node, depth, expandedIds, onToggle,
  onAddChild, onEdit, onDelete, onViewGrid, highlightId
}) => {
  const hasChildren = node.children?.length > 0;
  const isExpanded  = expandedIds.has(node._id);
  const isHighlight = highlightId === node._id;
  const cfg = TYPE_CONFIG[node.type] || {};
  const Icon = cfg.icon || Package;

  return (
    <div id={`wnode-${node._id}`}>
      {/* Row */}
      <div
        className={`flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-slate-100 transition-colors
          ${isHighlight ? 'ring-2 ring-inset ring-indigo-400 bg-indigo-50/60' : 'hover:bg-slate-50/60'}`}
        style={{ paddingLeft: `${depth * 22 + 12}px` }}
      >
        {/* Expand toggle */}
        <div className="w-6 shrink-0 flex items-center justify-center">
          {hasChildren ? (
            <button
              onClick={() => onToggle(node._id)}
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-100 text-slate-500"
            >
              {isExpanded
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-auto" />
          )}
        </div>

        {/* Type icon */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${cfg.badge || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>

        {/* Code + type + name */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-slate-900 text-sm">{node.code}</span>
          <TypeBadge type={node.type} />
          <span className="text-sm text-slate-600 truncate">{node.name}</span>
          {hasChildren && (
            <span className="text-[10px] text-slate-400 font-semibold">
              {node.children.length} mục con
            </span>
          )}
        </div>

        {/* Action buttons — always visible (không ẩn hover) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Sơ đồ lưới (chỉ hiện với warehouse/zone/aisle/rack) */}
          {node.type !== 'bin' && (
            <button
              onClick={() => onViewGrid(node)}
              title="Xem sơ đồ lưới"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-teal-300 text-teal-600 text-xs font-medium hover:bg-teal-50 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Sơ đồ
            </button>
          )}

          {/* Thêm mục con */}
          {node.type !== 'bin' && (
            <PermissionGuard permission="warehouse:create">
              <button
                onClick={() => onAddChild(node)}
                title="Thêm mục con"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-indigo-300 text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm con
              </button>
            </PermissionGuard>
          )}

          {/* Sửa */}
          <PermissionGuard permission="warehouse:update">
            <button
              onClick={() => onEdit(node)}
              title="Sửa"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Sửa
            </button>
          </PermissionGuard>

          {/* Xóa */}
          <PermissionGuard permission="warehouse:delete">
            <button
              onClick={() => onDelete(node._id, node.name)}
              title="Xóa"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-300 text-rose-600 text-xs font-medium hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <WarehouseNodeRow
              key={child._id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewGrid={onViewGrid}
              highlightId={highlightId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Visual Grid Modal — hiển thị các con trực quan như sơ đồ kho
// ──────────────────────────────────────────────────────────────
const VisualGridModal = ({ node, allNodes, onClose }) => {
  if (!node) return null;

  // Lấy tất cả con trực tiếp của node này
  const children = allNodes.filter(n => {
    const pid = n.parentId ?? n.parent?._id;
    return pid === node._id;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${TYPE_CONFIG[node.type]?.row || 'bg-slate-50'}`}>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Sơ đồ cấu trúc</p>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              {React.createElement(TYPE_CONFIG[node.type]?.icon || Package, { className: 'w-5 h-5' })}
              {node.name}
              <span className="font-mono text-sm text-slate-500 font-normal">({node.code})</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4">
          {Object.entries(TYPE_CONFIG).filter(([t]) => t !== 'warehouse').map(([type, cfg]) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-3 h-3 rounded border ${cfg.badge}`}></span>
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {children.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Chưa có vị trí con nào bên trong</p>
              <p className="text-sm mt-1">Nhấn <strong>"Thêm con"</strong> trên dòng này để thêm vị trí con</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 font-semibold mb-3 uppercase">
                {children.length} vị trí con · {TYPE_CONFIG[NEXT_TYPE[node.type]]?.label || ''}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                {children.map(child => {
                  const childCfg = TYPE_CONFIG[child.type] || {};
                  const ChildIcon = childCfg.icon || Package;
                  // Count grandchildren
                  const grandchildren = allNodes.filter(n => {
                    const pid = n.parentId ?? n.parent?._id;
                    return pid === child._id;
                  });

                  return (
                    <div
                      key={child._id}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 min-h-[90px] text-center cursor-default transition-all hover:shadow-md hover:scale-105
                        ${childCfg.grid || 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      <ChildIcon className="w-5 h-5 mb-1.5 opacity-70" />
                      <p className="font-bold text-xs font-mono leading-tight">{child.code}</p>
                      <p className="text-[10px] opacity-70 truncate w-full leading-tight mt-0.5">{child.name}</p>
                      {grandchildren.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-black/10 text-[9px] font-bold">
                          {grandchildren.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────
export const WarehouseStructurePage = () => {
  const [nodes,      setNodes]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Expand/collapse — per node, Set<_id>
  const [expandedIds,         setExpandedIds]         = useState(new Set());
  const [hasInitialExpand,    setHasInitialExpand]    = useState(false);

  // Barcode search / highlight
  const [searchCode,   setSearchCode]   = useState('');
  const [highlightId,  setHighlightId]  = useState(null);
  const searchRef = useRef(null);

  // Visual grid modal
  const [gridNode, setGridNode] = useState(null);

  // Add/Edit modal
  const [showModal,    setShowModal]    = useState(false);
  const [editingNode,  setEditingNode]  = useState(null);
  const [fName,  setFName]  = useState('');
  const [fCode,  setFCode]  = useState('');
  const [fType,  setFType]  = useState('warehouse');
  const [fParent, setFParent] = useState('');
  const [parentLabel, setParentLabel] = useState('');

  // ── Data ──────────────────────────────────────────────────
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

  useEffect(() => { fetchNodes(); }, []);

  // ── Tree ──────────────────────────────────────────────────
  const tree = useMemo(() => buildTree(nodes), [nodes]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const c = {};
    nodes.forEach(n => { c[n.type] = (c[n.type] || 0) + 1; });
    return c;
  }, [nodes]);

  // ── Auto-expand warehouses on first load ─────────────────
  useEffect(() => {
    if (!hasInitialExpand && tree.length > 0) {
      setExpandedIds(new Set(tree.map(n => n._id)));
      setHasInitialExpand(true);
    }
  }, [tree, hasInitialExpand]);

  // ── Expand helpers ────────────────────────────────────────
  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const collectAllIds = (list) => {
    const ids = [];
    const walk = (items) => items.forEach(n => { ids.push(n._id); if (n.children?.length) walk(n.children); });
    walk(list);
    return ids;
  };

  const expandAll  = () => setExpandedIds(new Set(collectAllIds(tree)));
  const collapseAll = () => setExpandedIds(new Set());

  // ── Barcode search ────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const code = searchCode.trim().toUpperCase();
    if (!code) return;

    const found = nodes.find(n => n.code?.toUpperCase() === code);
    if (found) {
      // Expand all ancestors + the node itself
      setExpandedIds(new Set(collectAllIds(tree))); // easiest: expand all first
      setHighlightId(found._id);
      setTimeout(() => {
        document.getElementById(`wnode-${found._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => setHighlightId(null), 3000);
    } else {
      toast.error(`Không tìm thấy vị trí với mã "${code}"`);
    }
    setSearchCode('');
  };

  // ── Form / Modal ──────────────────────────────────────────
  const openAddRoot = () => {
    setEditingNode(null);
    setFName(''); setFCode(''); setFType('warehouse'); setFParent(''); setParentLabel('');
    setShowModal(true);
  };

  const openAddChild = (parentNode) => {
    setEditingNode(null);
    setFName(''); setFCode('');
    setFType(NEXT_TYPE[parentNode.type] || 'bin');
    setFParent(String(parentNode._id));
    setParentLabel(`${parentNode.code} — ${parentNode.name}`);
    setShowModal(true);
  };

  const openEdit = (node) => {
    setEditingNode(node);
    setFName(node.name);
    setFCode(node.code);
    setFType(node.type);
    setFParent(String(node.parentId ?? node.parent?._id ?? ''));
    setParentLabel(node.parent ? `${node.parent.code} — ${node.parent.name}` : '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fName || !fCode || !fType) return toast.error('Vui lòng điền đầy đủ thông tin');
    const payload = { name: fName, code: fCode.toUpperCase(), type: fType, parent: fParent || null };
    try {
      if (editingNode) {
        await WarehouseModel.update(editingNode._id, payload);
        toast.success('Đã cập nhật vị trí kho');
      } else {
        await WarehouseModel.create(payload);
        toast.success('Đã thêm vị trí kho mới');
      }
      setShowModal(false);
      fetchNodes();
    } catch (error) {
      toast.error('Lỗi khi lưu: ' + error.message);
    }
  };

  const handleDelete = async (id, nodeName) => {
    if (!window.confirm(`Xóa vị trí "${nodeName}"?\nLưu ý: chỉ xóa được nếu không có vị trí con.`)) return;
    try {
      await WarehouseModel.delete(id);
      toast.success('Đã xóa vị trí kho');
      fetchNodes();
    } catch (error) {
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const warehouses = tree.filter(n => n.type === 'warehouse');
  const orphans    = tree.filter(n => n.type !== 'warehouse');

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sơ đồ Kho hàng</h2>
          <p className="text-sm text-slate-500 mt-0.5">Cấu trúc phân cấp: Kho → Khu vực → Dãy kệ → Kệ → Khay (Bin)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Barcode search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <ScanLine className="w-4 h-4 text-primary-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                placeholder="Quét / nhập mã vị trí..."
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-primary-400 w-52"
              />
            </div>
            <button type="submit"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200">
              Tìm
            </button>
          </form>

          {/* Expand/Collapse */}
          <button onClick={expandAll}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200">
            Mở rộng tất cả
          </button>
          <button onClick={collapseAll}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200">
            Thu gọn tất cả
          </button>

          {/* Add root */}
          <PermissionGuard permission="warehouse:create">
            <button onClick={openAddRoot}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/10">
              <Plus className="w-4 h-4" />
              Thêm vị trí
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={type} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${cfg.badge}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-lg font-bold leading-none">{stats[type] || 0}</p>
                <p className="text-[10px] font-semibold mt-0.5">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tree */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block" />
          <p className="mt-2 text-sm">Đang tải sơ đồ kho...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Chưa có vị trí kho nào. Nhấn <strong>"Thêm vị trí"</strong> để bắt đầu.
        </div>
      ) : (
        <div className="space-y-4">

          {/* Warehouses */}
          {warehouses.map(wh => (
            <div key={wh._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Warehouse header row */}
              <WarehouseNodeRow
                node={wh}
                depth={0}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                onAddChild={openAddChild}
                onEdit={openEdit}
                onDelete={handleDelete}
                onViewGrid={setGridNode}
                highlightId={highlightId}
              />
              {/* Children */}
              {wh.children?.length > 0 && expandedIds.has(wh._id) && (
                <div>
                  {wh.children.map(child => (
                    <WarehouseNodeRow
                      key={child._id}
                      node={child}
                      depth={1}
                      expandedIds={expandedIds}
                      onToggle={toggleExpanded}
                      onAddChild={openAddChild}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onViewGrid={setGridNode}
                      highlightId={highlightId}
                    />
                  ))}
                </div>
              )}
              {wh.children?.length === 0 && (
                <div className="px-10 py-3 text-xs text-slate-400 italic border-b border-slate-100">
                  Kho này chưa có khu vực con — nhấn <strong>"Thêm con"</strong> để thêm
                </div>
              )}
            </div>
          ))}

          {/* Orphan nodes */}
          {orphans.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 text-amber-700 text-sm font-bold flex items-center gap-2">
                ⚠️ Vị trí không có kho cha ({orphans.length})
              </div>
              {orphans.map(n => (
                <WarehouseNodeRow
                  key={n._id}
                  node={n}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggle={toggleExpanded}
                  onAddChild={openAddChild}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onViewGrid={setGridNode}
                  highlightId={highlightId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visual Grid Modal */}
      {gridNode && (
        <VisualGridModal
          node={gridNode}
          allNodes={nodes}
          onClose={() => setGridNode(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">
                  {editingNode ? `Sửa: ${editingNode.code}` : 'Thêm vị trí kho mới'}
                </h3>
                {parentLabel && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    📂 Vị trí cha: <strong className="text-slate-600">{parentLabel}</strong>
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại vị trí *</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Object.entries(TYPE_CONFIG).map(([t, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFType(t)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-[10px] font-bold transition-all ${
                          fType === t
                            ? `${cfg.badge} border-current scale-105 shadow-sm`
                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mã vị trí * <span className="text-slate-400 font-normal">(dùng làm mã vạch khi dán nhãn)</span>
                </label>
                <input
                  type="text" required value={fCode}
                  onChange={e => setFCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 uppercase font-mono focus:outline-none focus:border-primary-500 text-sm"
                  placeholder="VD: WH-A, ZONE-01, BIN-A1-01"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên vị trí *</label>
                <input
                  type="text" required value={fName}
                  onChange={e => setFName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                  placeholder="VD: Kho thành phẩm A, Khu A, Khay 1-1"
                />
              </div>

              {/* Parent */}
              {fType !== 'warehouse' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Thuộc vị trí cha</label>
                  <select
                    value={fParent}
                    onChange={e => setFParent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                  >
                    <option value="">— Không có cha (cấp cao nhất) —</option>
                    {nodes
                      .filter(n => !editingNode || n._id !== editingNode._id)
                      .filter(n => n.type !== 'bin')
                      .map(n => (
                        <option key={n._id} value={n._id}>
                          {n.code} — {n.name} [{TYPE_CONFIG[n.type]?.label || n.type}]
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">
                  Hủy
                </button>
                <button type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/10">
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
