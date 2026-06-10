import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/auth.context.jsx';
import {
  Users, Package, Warehouse, ShoppingBag, Database,
  ArrowDownLeft, ArrowUpRight, LogOut, ClipboardList,
  ArrowLeftRight, LayoutDashboard, AlertTriangle, History,
  BarChart2, ScanLine, KeyRound, ChevronRight, Mail, // [THÊM MỚI] Mail
} from 'lucide-react';

const ROLE_LABELS = {
  Admin:       'Quản trị viên',
  QuanLyKho:   'Quản lý kho',
  KeToanKho:   'Kế toán kho',
  NhanVienKho: 'Nhân viên kho',
  QC:          'QC – Kiểm tra CL',
  Sale:        'Sale – Kinh doanh',
};

// ── Nav group definitions ────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Tổng quan',
    items: [
      { path: '/',     label: 'Tổng quan',  icon: LayoutDashboard, permission: null, exact: true },
      { path: '/scanner', label: 'Quét mã vạch', icon: ScanLine, permission: null },
    ],
  },
  {
    label: 'Nghiệp vụ kho',
    items: [
      { path: '/inventory',   label: 'Tồn kho',          icon: Database,      permission: 'inventory:read'  },
      { path: '/receipts',    label: 'Phiếu nhập kho',   icon: ArrowDownLeft, permission: 'receipt:read'    },
      { path: '/deliveries',  label: 'Phiếu xuất kho',   icon: ArrowUpRight,  permission: 'delivery:read'   },
      { path: '/stocktakes',  label: 'Kiểm kê kho',      icon: ClipboardList, permission: 'stocktake:read'  },
      { path: '/adjustments', label: 'Điều chỉnh tồn',   icon: ArrowLeftRight,permission: 'adjustment:read' },
      { path: '/incidents',   label: 'Báo cáo sự cố',    icon: AlertTriangle, permission: 'incident:read'   },
    ],
  },
  {
    label: 'Danh mục',
    items: [
      { path: '/products',  label: 'Sản phẩm',     icon: Package,    permission: 'product:read'   },
      { path: '/warehouse', label: 'Sơ đồ kho',    icon: Warehouse,  permission: 'warehouse:read' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { path: '/reports',    label: 'Báo cáo',          icon: BarChart2, permission: null         },
      { path: '/users',      label: 'Tài khoản & Phân quyền', icon: Users, permission: 'user:manage'},
      { path: '/audit-logs',  label: 'Nhật ký hoạt động', icon: History, permission: 'audit:read'  },
      { path: '/email-logs',  label: 'Nhật ký Email',      icon: Mail,    permission: 'user:manage' }, // [THÊM MỚI]
    ],
  },
];

// flatten for title lookup
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

export const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (item) => item.exact
    ? location.pathname === item.path
    : (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));

  const pageTitle = location.pathname === '/profile'
    ? 'Hồ sơ cá nhân'
    : ALL_NAV.find(item => isActive(item))?.label || 'Tổng quan';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f7f5f2' }}>

      {/* ── Sidebar ── Dark Warm Ink ──────────────────────────── */}
      <aside
        className="w-60 flex flex-col shrink-0"
        style={{ background: '#1e1919' }}
      >
        {/* Wordmark */}
        <div
          className="h-14 shrink-0 flex items-center px-5 gap-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <svg width="20" height="18" viewBox="0 0 40 36" fill="none">
            <path d="M20 6.5L10 13 20 19.5 10 26l-10-6.5L10 13 0 6.5 10 0z" fill="#0061fe"/>
            <path d="M20 6.5L30 0l10 6.5L30 13l10 6.5-10 6.5-10-6.5L30 13z" fill="#0061fe"/>
            <path d="M10 27.85L20 21.35l10 6.5-10 6.5z" fill="#0061fe"/>
          </svg>
          <span
            className="font-semibold text-sm"
            style={{ color: '#f7f5f2', letterSpacing: '-0.01em' }}
          >
            MVC Warehouse
          </span>
        </div>

        {/* Nav groups */}
        <nav className="sidebar-nav flex-1 overflow-y-auto min-h-0 py-4 px-3 space-y-5">
          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(i => !i.permission || hasPermission(i.permission));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                {/* Group label */}
                <p
                  className="px-3 mb-1 text-[10px] font-semibold uppercase"
                  style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.07em' }}
                >
                  {group.label}
                </p>
                <div className="space-y-px">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors duration-100"
                        style={active
                          ? { background: '#0061fe', color: '#ffffff', borderRadius: '8px' }
                          : { color: 'rgba(255,255,255,0.55)', borderRadius: '8px' }
                        }
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; }}}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div
          className="shrink-0 p-3 space-y-px"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 transition-colors duration-100"
            style={{ borderRadius: '8px', color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#f7f5f2' }}
            >
              {(user?.fullName || user?.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-none mb-0.5" style={{ color: '#f7f5f2' }}>
                {user?.fullName || user?.username}
              </p>
              <p className="text-[10px] truncate leading-none" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
            <KeyRound className="w-3 h-3 shrink-0 opacity-25" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors duration-100"
            style={{ borderRadius: '8px', color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header — White with stronger bottom border */}
        <header
          className="h-14 shrink-0 flex items-center justify-between px-8"
          style={{ background: '#ffffff', borderBottom: '1px solid #d9d3cb' }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-medium"
              style={{ color: '#b8b2aa', letterSpacing: '0.04em' }}
            >
              MVC WAREHOUSE
            </span>
            <ChevronRight className="w-3 h-3" style={{ color: '#c9c3bb' }} />
            <h1 className="text-sm font-semibold" style={{ color: '#1e1919' }}>
              {pageTitle}
            </h1>
          </div>

          {/* Role pill */}
          <span
            className="px-3 py-1 text-[11px] font-medium"
            style={{
              background:    '#f7f5f2',
              color:         '#716b61',
              border:        '1px solid #d9d3cb',
              borderRadius:  '16px',
              letterSpacing: '0.02em',
            }}
          >
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </header>

        {/* Page canvas — Cream Paper */}
        <div
          className="flex-1 overflow-y-auto p-8"
          style={{ background: '#f7f5f2' }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
