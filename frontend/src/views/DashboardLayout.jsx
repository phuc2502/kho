import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/auth.context.jsx';
import { UserModel } from '../models/user.model.js';
import { NotificationBell } from '../components/NotificationBell.jsx';
import {
  Users, Package, Warehouse, ShoppingBag, Database,
  ArrowDownLeft, ArrowUpRight, LogOut, ClipboardList,
  ArrowLeftRight, LayoutDashboard, AlertTriangle, History,
  BarChart2, ScanLine, KeyRound, ChevronRight, Mail, FileText,
  Menu, X,
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
      { path: '/inventory',          label: 'Tồn kho',               icon: Database,      permission: 'inventory:read'         },
      { path: '/receipts',           label: 'Phiếu nhập kho',        icon: ArrowDownLeft, permission: 'receipt:read'            },
      { path: '/stock-cards',        label: 'Thẻ kho',               icon: History,       permission: 'inventory:read'         },
      { path: '/delivery-requests',  label: 'Yêu cầu xuất kho',      icon: FileText,      permission: 'delivery-request:read'  },
      { path: '/deliveries',         label: 'Phiếu xuất kho',        icon: ArrowUpRight,  permission: 'delivery:read'          },
      { path: '/stocktakes',          label: 'Kiểm kê kho',           icon: ClipboardList, permission: 'stocktake:read'         },
      { path: '/stocktake-minutes',  label: 'Biên bản kiểm kê',      icon: FileText,      permission: 'stocktake:read'         },
      { path: '/stocktake-reports',  label: 'Báo cáo kiểm kê',       icon: BarChart2,     permission: 'stocktake:read'         },
      { path: '/adjustments',        label: 'Điều chỉnh tồn',        icon: ArrowLeftRight,permission: 'adjustment:read'        },
      { path: '/incidents',          label: 'Báo cáo sự cố',         icon: AlertTriangle, permission: 'incident:read'          },
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
      { path: '/email-logs',  label: 'Nhật ký Email',      icon: Mail,    permission: 'emaillog:read' }, // [THÊM MỚI]
    ],
  },
];

// flatten for title lookup
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

// localStorage key lưu số yêu cầu đã xem
const SEEN_KEY = 'resetRequestsSeenCount';

// Label ghi đè theo role — key là path (có thể mở rộng sau)
const ROLE_LABEL_OVERRIDES = {};

export const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [resetCount, setResetCount] = useState(0);
  const [seenCount, setSeenCount]   = useState(() => parseInt(localStorage.getItem(SEEN_KEY) || '0'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Fetch số yêu cầu reset MK (chỉ Admin mới gọi)
  const fetchResetCount = useCallback(async () => {
    if (!hasPermission('user:manage')) return;
    try {
      const { count } = await UserModel.getResetRequestsCount();
      setResetCount(count);
    } catch { /* silent */ }
  }, [hasPermission]);

  useEffect(() => { fetchResetCount(); }, [fetchResetCount]);

  // Poll mỗi 30 giây
  useEffect(() => {
    const timer = setInterval(fetchResetCount, 30000);
    return () => clearInterval(timer);
  }, [fetchResetCount]);

  // Khi admin vào trang Users → đánh dấu đã xem
  useEffect(() => {
    if (location.pathname === '/users' && resetCount > 0) {
      localStorage.setItem(SEEN_KEY, String(resetCount));
      setSeenCount(resetCount);
    }
  }, [location.pathname, resetCount]);

  // Badge hiện khi có yêu cầu mới chưa xem
  const showBadge = resetCount > 0 && resetCount > seenCount;

  const isActive = (item) => item.exact
    ? location.pathname === item.path
    : (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));

  const pageTitle = location.pathname === '/profile'
    ? 'Hồ sơ cá nhân'
    : ALL_NAV.find(item => isActive(item))?.label || 'Tổng quan';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f7f5f2' }}>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── Dark Warm Ink ──────────────────────────── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col shrink-0 transition-transform duration-300 transform md:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#1e1919' }}
      >
        {/* Wordmark */}
        <div
          className="h-14 shrink-0 flex items-center justify-between px-5 gap-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2.5">
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
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
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
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors duration-100"
                        style={active
                          ? { background: '#0061fe', color: '#ffffff', borderRadius: '8px' }
                          : { color: 'rgba(255,255,255,0.55)', borderRadius: '8px' }
                        }
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; }}}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">
                          {ROLE_LABEL_OVERRIDES[user?.role]?.[item.path] || item.label}
                        </span>
                        {/* Badge đỏ — chỉ hiện trên mục Users khi có yêu cầu reset MK mới */}
                        {item.path === '/users' && showBadge && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                            {resetCount}
                          </span>
                        )}
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
            onClick={() => setIsSidebarOpen(false)}
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
            onClick={() => {
              setIsSidebarOpen(false);
              handleLogout();
            }}
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
          className="h-14 shrink-0 flex items-center justify-between px-4 md:px-8"
          style={{ background: '#ffffff', borderBottom: '1px solid #d9d3cb' }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded-md text-[#1e1919] hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span
              className="text-[11px] font-medium hidden sm:inline"
              style={{ color: '#b8b2aa', letterSpacing: '0.04em' }}
            >
              MVC WAREHOUSE
            </span>
            <ChevronRight className="w-3 h-3 hidden sm:inline" style={{ color: '#c9c3bb' }} />
            <h1 className="text-sm font-semibold truncate max-w-[180px] xs:max-w-none" style={{ color: '#1e1919' }}>
              {pageTitle}
            </h1>
          </div>

          {/* Right: notification + role pill */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span
              className="px-3 py-1 text-[11px] font-medium truncate max-w-[120px] sm:max-w-none"
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
          </div>
        </header>

        {/* Page canvas — Cream Paper */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-8"
          style={{ background: '#f7f5f2' }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
