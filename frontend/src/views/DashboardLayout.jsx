import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/auth.context.jsx';
import {
  Users,
  Package,
  Warehouse,
  ShoppingBag,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  User as UserIcon
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/inventory', label: 'Tồn kho thực tế', icon: Database, permission: 'inventory:read' },
    { path: '/receipts', label: 'Phiếu Nhập kho', icon: ArrowDownLeft, permission: 'receipt:read' },
    { path: '/deliveries', label: 'Phiếu Xuất kho', icon: ArrowUpRight, permission: 'delivery:read' },
    { path: '/products', label: 'Sản phẩm & Danh mục', icon: Package, permission: 'product:read' },
    { path: '/warehouse', label: 'Sơ đồ Kho hàng', icon: Warehouse, permission: 'warehouse:read' },
    { path: '/partners', label: 'Đối tác liên kết', icon: ShoppingBag, permission: 'partner:read' },
    { path: '/users', label: 'Tài khoản & Phân quyền', icon: Users, permission: 'user:manage' }
  ];

  const filteredItems = navItems.filter(item => hasPermission(item.permission));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
            <span className="text-2xl">📦</span>
            <span className="font-bold text-white text-lg tracking-wider">MVC WAREHOUSE</span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1">
            {filteredItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all-300 gap-3 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary-500 font-bold border border-slate-700">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-medium truncate text-sm">{user?.username}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-slate-800">
            {navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Tổng quan'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Role: <strong className="text-slate-800">{user?.role}</strong>
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
