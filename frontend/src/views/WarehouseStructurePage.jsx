import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WarehouseModel } from '../models/warehouse.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import toast from 'react-hot-toast';
import {
  Plus, Edit3, Trash2, X, ChevronDown, ChevronRight,
  Warehouse, LayoutGrid, AlignJustify, Layers, Package,
  ScanLine, LayoutDashboard, Filter
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
  bin:       null,
};

// required parent type for each node type
const PARENT_TYPE = {
  warehouse: null,
  zone:      'warehouse',
  aisle:     'zone',
  rack:      'aisle',
  bin:       'rack',
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
// Interactive 2D Warehouse Map — drill-down 5 cấp, layout riêng theo cấp
// ──────────────────────────────────────────────────────────────

// Action popup hiện khi hover trên từng ô trong bản đồ
const MapCellActions = ({ node, onAddChild, onEdit, onDelete }) => (
  <div
    className="flex gap-0.5 bg-white rounded-lg shadow-lg border border-slate-100 p-0.5 z-20"
    onClick={e => e.stopPropagation()}
  >
    {node.type !== 'bin' && (
      <PermissionGuard permission="warehouse:create">
        <button
          onClick={e => { e.stopPropagation(); onAddChild(node); }}
          className="p-1 rounded text-indigo-500 hover:bg-indigo-50 transition-colors"
          title={`Thêm ${TYPE_CONFIG[NEXT_TYPE[node.type]]?.label}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </PermissionGuard>
    )}
    <PermissionGuard permission="warehouse:update">
      <button
        onClick={e => { e.stopPropagation(); onEdit(node); }}
        className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors"
        title="Sửa"
      >
        <Edit3 className="w-3 h-3" />
      </button>
    </PermissionGuard>
    <PermissionGuard permission="warehouse:delete">
      <button
        onClick={e => { e.stopPropagation(); onDelete(node._id, node.name); }}
        className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
        title="Xóa"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </PermissionGuard>
  </div>
);

// Cấp 1→2: Zone cards (warehouse hiển thị các khu vực)
const ZoneCard = ({ zone, allNodes, onDrill, onAddChild, onEdit, onDelete }) => {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CONFIG.zone;
  const Icon = cfg.icon;
  const childCount = allNodes.filter(n => (n.parentId ?? n.parent?._id) === zone._id).length;
  return (
    <div
      className={`relative rounded-xl border-2 ${cfg.grid} cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all min-h-[130px] flex flex-col justify-between p-4 select-none`}
      onClick={() => onDrill(zone)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div>
        <Icon className="w-7 h-7 opacity-30 mb-2" />
        <p className="font-bold font-mono text-sm">{zone.code}</p>
        <p className="text-xs opacity-60 mt-0.5 line-clamp-2 leading-snug">{zone.name}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold opacity-45">{childCount} dãy kệ</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-25" />
      </div>
      {hov && (
        <div className="absolute top-1.5 right-1.5">
          <MapCellActions node={zone} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
};

// Cấp 2→3: Aisle rows (zone hiển thị các dãy kệ như hành lang)
const AisleRow = ({ aisle, allNodes, onDrill, onAddChild, onEdit, onDelete }) => {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CONFIG.aisle;
  const Icon = cfg.icon;
  const childCount = allNodes.filter(n => (n.parentId ?? n.parent?._id) === aisle._id).length;
  return (
    <div
      className={`relative flex items-center gap-3 rounded-xl border-2 ${cfg.grid} cursor-pointer hover:shadow-md active:scale-[0.99] transition-all px-4 py-3 select-none`}
      onClick={() => onDrill(aisle)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Trụ bên trái — mô phỏng cột kệ đầu dãy */}
      <div className="w-1.5 shrink-0 flex flex-col gap-0.5">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-current opacity-25" />)}
      </div>
      <Icon className="w-4 h-4 opacity-50 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-bold font-mono text-sm">{aisle.code}</span>
        <span className="ml-2 text-xs opacity-60">{aisle.name}</span>
      </div>
      {/* Mini biểu đồ kệ */}
      <div className="hidden sm:flex items-end gap-0.5 h-7 shrink-0 opacity-30">
        {[...Array(Math.min(Math.max(childCount, 1), 8))].map((_, i) => (
          <div key={i} className="w-2 rounded-t-sm bg-current" style={{ height: `${40 + (i % 3) * 20}%` }} />
        ))}
      </div>
      <span className="text-[10px] font-semibold opacity-45 shrink-0">{childCount} kệ</span>
      <ChevronRight className="w-3.5 h-3.5 opacity-25 shrink-0" />
      {/* Trụ bên phải */}
      <div className="w-1.5 shrink-0 flex flex-col gap-0.5">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-current opacity-25" />)}
      </div>
      {hov && (
        <div className="absolute top-1.5 right-12 z-10">
          <MapCellActions node={aisle} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
};

// Cấp 3→4: Rack units (aisle hiển thị kệ như giá đỡ đứng)
const RackUnit = ({ rack, allNodes, onDrill, onAddChild, onEdit, onDelete }) => {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CONFIG.rack;
  const childCount = allNodes.filter(n => (n.parentId ?? n.parent?._id) === rack._id).length;
  const displayShelves = Math.min(Math.max(childCount, 3), 8);
  return (
    <div
      className={`relative flex flex-col rounded-xl border-2 ${cfg.grid} cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all select-none`}
      style={{ width: 86 }}
      onClick={() => onDrill(rack)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Thanh nóc kệ */}
      <div className="h-2 bg-current opacity-30 rounded-t-[10px]" />
      {/* Các tầng kệ */}
      <div className="flex-1 px-2 py-2 space-y-1.5">
        {[...Array(displayShelves)].map((_, i) => (
          <div key={i} className="h-2.5 rounded-sm bg-current opacity-[0.15] border border-current/20" />
        ))}
        {childCount > 8 && <p className="text-[9px] text-center font-bold opacity-35">+{childCount - 8}</p>}
      </div>
      {/* Nhãn */}
      <div className="px-2 pb-2.5 text-center border-t border-current/10 pt-1.5">
        <p className="font-bold font-mono text-[10px]">{rack.code}</p>
        <p className="text-[9px] opacity-50 truncate">{rack.name}</p>
        <p className="text-[9px] opacity-35 mt-0.5">{childCount} khay</p>
      </div>
      {hov && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <MapCellActions node={rack} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
};

// Cấp 4→5: Bin cells (rack hiển thị khay như ô lưới)
const BinCell = ({ bin, onEdit, onDelete }) => {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CONFIG.bin;
  return (
    <div
      className={`relative rounded-lg border-2 ${cfg.grid} p-2 text-center transition-all hover:shadow-md select-none`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Package className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-40" />
      <p className="font-bold font-mono text-[10px] leading-tight">{bin.code}</p>
      <p className="text-[9px] opacity-50 truncate mt-0.5">{bin.name}</p>
      {hov && (
        <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/5">
          <PermissionGuard permission="warehouse:update">
            <button
              onClick={e => { e.stopPropagation(); onEdit(bin); }}
              className="p-1 bg-white rounded-md shadow text-slate-600 hover:text-slate-900 transition-colors"
              title="Sửa"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission="warehouse:delete">
            <button
              onClick={e => { e.stopPropagation(); onDelete(bin._id, bin.name); }}
              className="p-1 bg-white rounded-md shadow text-rose-500 hover:text-rose-700 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </PermissionGuard>
        </div>
      )}
    </div>
  );
};

// ── InteractiveWarehouseMap — modal chính ────────────────────
const InteractiveWarehouseMap = ({ rootNode, allNodes, onClose, onAddChild, onEdit, onDelete }) => {
  const [path, setPath] = useState([rootNode]);

  // Đồng bộ path với dữ liệu mới nhất khi allNodes thay đổi (CRUD)
  useEffect(() => {
    setPath(prev => {
      const updated = prev.map(n => allNodes.find(a => a._id === n._id));
      let validLen = updated.length;
      while (validLen > 0 && !updated[validLen - 1]) validLen--;
      if (validLen === 0) return [prev[0]]; // giữ gốc dù đã xóa
      return updated.slice(0, validLen);
    });
  }, [allNodes]);

  const currentNode = path[path.length - 1];
  const childType = NEXT_TYPE[currentNode.type];
  const childCfg  = childType ? TYPE_CONFIG[childType] : null;
  const children  = allNodes.filter(n => (n.parentId ?? n.parent?._id) === currentNode._id);

  const drillDown = (node) => { if (node.type !== 'bin') setPath(p => [...p, node]); };
  const goTo = (idx) => setPath(p => p.slice(0, idx + 1));

  const renderMap = () => {
    if (children.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${childCfg?.badge || 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
            {childCfg
              ? React.createElement(childCfg.icon, { className: 'w-7 h-7 opacity-60' })
              : <Package className="w-7 h-7" />}
          </div>
          <p className="font-semibold text-slate-600">Chưa có {childCfg?.label || 'vị trí con'} nào</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Thêm {childCfg?.label || 'vị trí con'} để xem sơ đồ tương tác ở cấp này
          </p>
          {childType && (
            <PermissionGuard permission="warehouse:create">
              <button
                onClick={() => onAddChild(currentNode)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm {childCfg?.label}
              </button>
            </PermissionGuard>
          )}
        </div>
      );
    }

    const p = { allNodes, onDrill: drillDown, onAddChild, onEdit, onDelete };

    switch (currentNode.type) {
      case 'warehouse':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {children.map(z => <ZoneCard key={z._id} zone={z} {...p} />)}
          </div>
        );
      case 'zone':
        return (
          <div className="space-y-2.5">
            {children.map(a => <AisleRow key={a._id} aisle={a} {...p} />)}
          </div>
        );
      case 'aisle':
        return (
          <div className="flex flex-wrap gap-3 items-end">
            {children.map(r => <RackUnit key={r._id} rack={r} {...p} />)}
          </div>
        );
      case 'rack':
        return (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {children.map(b => <BinCell key={b._id} bin={b} onEdit={onEdit} onDelete={onDelete} />)}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className={`px-6 py-3.5 border-b border-slate-100 flex justify-between items-center ${TYPE_CONFIG[currentNode.type]?.row || 'bg-slate-50'}`}>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sơ đồ kho 2D tương tác</p>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mt-0.5">
              {React.createElement(TYPE_CONFIG[currentNode.type]?.icon || Package, { className: 'w-4 h-4' })}
              {currentNode.name}
              <span className="font-mono text-xs text-slate-500 font-normal bg-white/60 px-1.5 py-0.5 rounded-md">
                {currentNode.code}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb điều hướng */}
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1 flex-wrap min-h-[38px]">
          {path.map((n, idx) => {
            const BcIcon = TYPE_CONFIG[n.type]?.icon || Package;
            const isCurrent = idx === path.length - 1;
            return (
              <React.Fragment key={n._id}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                <button
                  onClick={() => !isCurrent && goTo(idx)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium transition-colors ${
                    isCurrent
                      ? 'bg-white border border-slate-200 text-slate-700 shadow-sm cursor-default'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-white hover:border hover:border-slate-200 cursor-pointer'
                  }`}
                >
                  <BcIcon className="w-3 h-3" />
                  <span className="font-mono font-bold">{n.code}</span>
                  {isCurrent && (
                    <span className="hidden sm:inline text-slate-500 font-normal ml-0.5">— {n.name}</span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
          {childCfg && children.length > 0 && (
            <span className="ml-auto text-[10px] text-slate-400 font-medium hidden sm:block shrink-0">
              {children.length} {childCfg.label}
            </span>
          )}
        </div>

        {/* Toolbar: hướng dẫn + nút thêm */}
        {childType && (
          <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <p className="text-xs text-slate-400">
              {children.length > 0
                ? 'Di chuột vào ô để sửa / xóa · Nhấn vào ô để khám phá bên trong'
                : `Chưa có ${childCfg?.label} nào trong ${TYPE_CONFIG[currentNode.type]?.label} này`}
            </p>
            <PermissionGuard permission="warehouse:create">
              <button
                onClick={() => onAddChild(currentNode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-500/20 transition-colors shrink-0 ml-4"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm {childCfg?.label}
              </button>
            </PermissionGuard>
          </div>
        )}

        {/* Vùng bản đồ */}
        <div className="flex-1 overflow-y-auto p-5">
          {renderMap()}
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

  // Hierarchical filter selects
  const [filterWh,    setFilterWh]    = useState('');
  const [filterZone,  setFilterZone]  = useState('');
  const [filterAisle, setFilterAisle] = useState('');
  const [filterRack,  setFilterRack]  = useState('');

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

  // ── Hierarchical filter helpers ───────────────────────────
  const getDescOfType = (parentId, type) => {
    if (!parentId) return nodes.filter(n => n.type === type);
    const pid = parseInt(parentId);
    const result = [];
    const queue = [pid];
    const visited = new Set();
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      nodes.forEach(n => {
        const nPid = n.parentId ?? n.parent?._id;
        if (nPid === id) {
          if (n.type === type) result.push(n);
          else queue.push(n._id);
        }
      });
    }
    return result;
  };

  const applyHierarchyFilter = () => {
    const targetId = parseInt(filterRack || filterAisle || filterZone || filterWh) || null;
    if (!targetId) return;
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n._id] = n; });
    const toExpand = new Set();
    let cur = nodeMap[targetId];
    while (cur) {
      toExpand.add(cur._id);
      cur = cur.parentId ? nodeMap[cur.parentId] : null;
    }
    setExpandedIds(toExpand);
    setHighlightId(targetId);
    setTimeout(() => {
      document.getElementById(`wnode-${targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightId(null), 3000);
  };

  const clearHierarchyFilter = () => {
    setFilterWh(''); setFilterZone(''); setFilterAisle(''); setFilterRack('');
    setExpandedIds(new Set(tree.map(n => n._id)));
  };

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
    setFType(NEXT_TYPE[parentNode.type]);
    setFParent(String(parentNode._id));
    setParentLabel(`${parentNode.code} — ${parentNode.name}`);
    setShowModal(true);
  };

  const handleTypeChange = (t) => {
    setFType(t);
    if (fParent) {
      const parentNode = nodes.find(n => n._id === parseInt(fParent));
      if (parentNode && parentNode.type !== PARENT_TYPE[t]) {
        setFParent('');
        setParentLabel('');
      }
    }
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

      {/* Hierarchical filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide self-center shrink-0">
            <Filter className="w-3.5 h-3.5" /> Lọc theo phân cấp
          </div>

          {/* Kho */}
          <div className="space-y-1 min-w-[150px]">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Kho</p>
            <select
              value={filterWh}
              onChange={e => { setFilterWh(e.target.value); setFilterZone(''); setFilterAisle(''); setFilterRack(''); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
            >
              <option value="">Tất cả kho</option>
              {nodes.filter(n => n.type === 'warehouse').map(n => (
                <option key={n._id} value={n._id}>{n.code} – {n.name}</option>
              ))}
            </select>
          </div>

          {/* Khu vực */}
          <div className="space-y-1 min-w-[150px]">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Khu vực</p>
            <select
              value={filterZone}
              onChange={e => { setFilterZone(e.target.value); setFilterAisle(''); setFilterRack(''); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
            >
              <option value="">Tất cả</option>
              {getDescOfType(filterWh, 'zone').map(n => (
                <option key={n._id} value={n._id}>{n.code} – {n.name}</option>
              ))}
            </select>
          </div>

          {/* Dãy kệ */}
          <div className="space-y-1 min-w-[150px]">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Dãy kệ</p>
            <select
              value={filterAisle}
              onChange={e => { setFilterAisle(e.target.value); setFilterRack(''); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
            >
              <option value="">Tất cả</option>
              {getDescOfType(filterZone || filterWh, 'aisle').map(n => (
                <option key={n._id} value={n._id}>{n.code} – {n.name}</option>
              ))}
            </select>
          </div>

          {/* Kệ chứa */}
          <div className="space-y-1 min-w-[150px]">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Kệ chứa</p>
            <select
              value={filterRack}
              onChange={e => setFilterRack(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-primary-400"
            >
              <option value="">Tất cả</option>
              {getDescOfType(filterAisle || filterZone || filterWh, 'rack').map(n => (
                <option key={n._id} value={n._id}>{n.code} – {n.name}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 self-end">
            <button
              onClick={applyHierarchyFilter}
              disabled={!filterWh && !filterZone && !filterAisle && !filterRack}
              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Điều hướng
            </button>
            {(filterWh || filterZone || filterAisle || filterRack) && (
              <button
                onClick={clearHierarchyFilter}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
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

      {/* Interactive 2D Warehouse Map */}
      {gridNode && (
        <InteractiveWarehouseMap
          rootNode={gridNode}
          allNodes={nodes}
          onClose={() => setGridNode(null)}
          onAddChild={openAddChild}
          onEdit={openEdit}
          onDelete={handleDelete}
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
                    const isChildMode = !editingNode && fParent !== '';
                    const isDisabled = isChildMode && t !== fType;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && handleTypeChange(t)}
                        title={isDisabled ? `Khi thêm con, loại phải là "${TYPE_CONFIG[fType]?.label}"` : undefined}
                        className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-[10px] font-bold transition-all ${
                          fType === t
                            ? `${cfg.badge} border-current scale-105 shadow-sm`
                            : isDisabled
                              ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                              : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                {!editingNode && fParent !== '' && (
                  <p className="text-[10px] text-amber-600 mt-1.5">
                    Loại đã được cố định theo cấp bậc phân cấp kho.
                  </p>
                )}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Thuộc vị trí cha
                    {PARENT_TYPE[fType] && (
                      <span className="ml-1 text-slate-400 font-normal">
                        (chỉ chọn được: {TYPE_CONFIG[PARENT_TYPE[fType]]?.label})
                      </span>
                    )}
                  </label>
                  <select
                    value={fParent}
                    onChange={e => setFParent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                  >
                    <option value="">— Không có cha (cấp cao nhất) —</option>
                    {nodes
                      .filter(n => !editingNode || n._id !== editingNode._id)
                      .filter(n => PARENT_TYPE[fType] && n.type === PARENT_TYPE[fType])
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
