import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptModel }   from '../models/receipt.model.js';
import { DeliveryModel }  from '../models/delivery.model.js';
import { StocktakeModel } from '../models/stocktake.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { AuditLogModel }  from '../models/auditLog.model.js';
import { IncidentModel }  from '../models/incident.model.js';
import { useAuth } from '../controllers/auth.context.jsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  ArrowDownLeft, ArrowUpRight, ClipboardList, AlertTriangle,
  Database, TrendingUp, Clock, ChevronRight, Activity, Package,
} from 'lucide-react';

// ── Chart helpers ────────────────────────────────────────────────
const buildChartData = (receipts, deliveries) => {
  const slots = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    slots.push({
      key:  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      name: d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
      'Nhập kho': 0,
      'Xuất kho': 0,
    });
  }
  receipts.forEach(r => {
    if (!r.createdAt) return;
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const s = slots.find(x => x.key === key);
    if (s) s['Nhập kho']++;
  });
  deliveries.forEach(d => {
    if (!d.createdAt) return;
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const s = slots.find(x => x.key === key);
    if (s) s['Xuất kho']++;
  });
  return slots;
};

// Dropbox Blue + Emerald + Amber + Magenta
const PIE_COLORS = ['#0061fe', '#10b981', '#f59e0b', '#cd2f7b'];

// ── MetricCard — Dropbox style: white on cream, sand border, flat ─
const ICON_COLORS = {
  blue:   'color:#0061fe; background:#eff5ff',
  emerald:'color:#059669; background:#ecfdf5',
  purple: 'color:#7c3aed; background:#f5f3ff',
  amber:  'color:#d97706; background:#fffbeb',
  red:    'color:#dc2626; background:#fef2f2',
  stone:  'color:#716b61; background:#f7f5f2',
};

const MetricCard = ({ icon: Icon, label, value, sub, trend, trendUp, color = 'stone', onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const colorStr = ICON_COLORS[color] || ICON_COLORS.stone;
  const iconStyle = Object.fromEntries(colorStr.split(';').map(s => {
    const [k, v] = s.split(':');
    return [k?.trim(), v?.trim()];
  }).filter(([k]) => k));

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left w-full transition-colors duration-150 p-5"
      style={{
        background:   '#ffffff',
        border:       '1px solid #eee9e2',
        borderRadius: '8px',
        transform:    hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon badge */}
        <div
          className="w-10 h-10 flex items-center justify-center flex-shrink-0"
          style={{ borderRadius: '8px', background: iconStyle.background, color: iconStyle.color }}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Trend badge */}
        {trend && (
          <span
            className="text-[10px] font-medium px-2 py-1"
            style={{
              background:   trendUp ? '#ecfdf5' : '#fef2f2',
              color:        trendUp ? '#059669' : '#dc2626',
              borderRadius: '9999px',
            }}
          >
            {trend}
          </span>
        )}
      </div>

      <p
        className="text-2xl font-semibold leading-none"
        style={{ color: '#1e1919', letterSpacing: '-0.02em' }}
      >
        {value}
      </p>
      <p className="text-sm mt-1.5" style={{ color: '#1e1919', fontWeight: 500 }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#b8b2aa' }}>{sub}</p>}
    </button>
  );
};

// ── Recent activity labels ────────────────────────────────────────
const ACTION_LABELS = {
  'receipt.create':    { text: 'Tạo phiếu nhập',    bg: '#eff5ff', color: '#0061fe' },
  'receipt.approve':   { text: 'Duyệt phiếu nhập',  bg: '#f5f3ff', color: '#7c3aed' },
  'receipt.complete':  { text: 'Hoàn tất nhập kho', bg: '#ecfdf5', color: '#059669' },
  'receipt.reject':    { text: 'Từ chối nhập kho',  bg: '#fef2f2', color: '#dc2626' },
  'delivery.create':   { text: 'Tạo phiếu xuất',    bg: '#fdf4ff', color: '#9333ea' },
  'delivery.approve':  { text: 'Duyệt phiếu xuất',  bg: '#f5f3ff', color: '#7c3aed' },
  'delivery.complete': { text: 'Hoàn tất xuất kho', bg: '#ecfdf5', color: '#059669' },
  'delivery.reject':   { text: 'Từ chối xuất kho',  bg: '#fef2f2', color: '#dc2626' },
  'stocktake.create':  { text: 'Tạo phiếu kiểm kê', bg: '#fffbeb', color: '#d97706' },
  'stocktake.complete':{ text: 'Hoàn tất kiểm kê',  bg: '#ecfdf5', color: '#059669' },
  'adjustment.create': { text: 'Điều chỉnh tồn kho',bg: '#fff7ed', color: '#ea580c' },
  'adjustment.approve':{ text: 'Duyệt điều chỉnh',  bg: '#ecfdf5', color: '#059669' },
  'incident.create':   { text: 'Báo cáo sự cố',     bg: '#fef2f2', color: '#dc2626' },
  'user.create':       { text: 'Tạo tài khoản',     bg: '#eff5ff', color: '#0061fe' },
  'user.deactivate':   { text: 'Vô hiệu hóa TK',    bg: '#fef2f2', color: '#dc2626' },
  'user.reactivate':   { text: 'Kích hoạt TK',       bg: '#ecfdf5', color: '#059669' },
  'auth.login':        { text: 'Đăng nhập',          bg: '#f7f5f2', color: '#716b61' },
};

// ── Main component ────────────────────────────────────────────────
export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingReceipts: 0, pendingDeliveries: 0, pendingStocktakes: 0,
    openIncidents: 0, totalInventoryItems: 0,
  });
  const [chartData, setChartData]   = useState([]);
  const [pieData, setPieData]       = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [receipts, deliveries, stocktakes, incidents, inventory, logsRes] = await Promise.all([
          ReceiptModel.getAll().catch(() => []),
          DeliveryModel.getAll().catch(() => []),
          StocktakeModel.getAll().catch(() => []),
          IncidentModel.getAll().catch(() => []),
          InventoryModel.getStock().catch(() => []),
          AuditLogModel.getAll({ limit: 10 }).catch(() => ({ data: [], total: 0 })),
        ]);

        const rcArr  = Array.isArray(receipts)   ? receipts   : [];
        const dlArr  = Array.isArray(deliveries)  ? deliveries : [];
        const stArr  = Array.isArray(stocktakes)  ? stocktakes : [];
        const incArr = Array.isArray(incidents)   ? incidents  : [];
        const invArr = Array.isArray(inventory)   ? inventory  : [];

        setStats({
          pendingReceipts:     rcArr.filter(r => ['draft','approved'].includes(r.status)).length,
          pendingDeliveries:   dlArr.filter(d => ['draft','approved','shipping'].includes(d.status)).length,
          pendingStocktakes:   stArr.filter(s => s.status === 'pending_approval').length,
          openIncidents:       incArr.filter(i => i.status === 'open').length,
          totalInventoryItems: invArr.reduce((sum, i) => sum + (i.quantity || 0), 0),
        });

        setChartData(buildChartData(rcArr, dlArr));

        const pieRaw = [
          { name: 'Phiếu nhập', value: rcArr.length  },
          { name: 'Phiếu xuất', value: dlArr.length  },
          { name: 'Kiểm kê',    value: stArr.length  },
          { name: 'Sự cố',      value: incArr.length },
        ].filter(d => d.value > 0);
        setPieData(pieRaw.length > 0 ? pieRaw : [{ name: 'Chưa có dữ liệu', value: 1 }]);

        setRecentLogs((logsRes?.data || []).slice(0, 8));
      } catch (_) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const totalPending = stats.pendingReceipts + stats.pendingDeliveries;

  // Shared card style
  const cardStyle = {
    background:   '#ffffff',
    border:       '1px solid #eee9e2',
    borderRadius: '8px',
  };

  return (
    <div className="space-y-6">

      {/* ── Hero — Dropbox Blue, flat, editorial ────────────── */}
      <div
        className="p-8"
        style={{ background: '#0061fe', borderRadius: '8px' }}
      >
        {/* Eyebrow */}
        <p
          className="text-xs font-medium uppercase mb-3"
          style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.07em' }}
        >
          MVC Warehouse · Hệ thống quản lý kho
        </p>

        {/* Heading */}
        <h1
          className="font-medium"
          style={{ color: '#ffffff', fontSize: '28px', lineHeight: 1.25, letterSpacing: '-0.01em' }}
        >
          {greeting()}, {user?.fullName || user?.username}
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
          {totalPending > 0
            ? `Có ${totalPending} phiếu đang chờ xử lý hôm nay.`
            : 'Tất cả phiếu đã được xử lý — kho đang hoạt động ổn định.'}
        </p>

        {/* Mini stat row */}
        <div
          className="flex flex-wrap gap-px mt-6 overflow-hidden"
          style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          {[
            { label: 'Nhập kho chờ',  value: stats.pendingReceipts   },
            { label: 'Xuất kho chờ',  value: stats.pendingDeliveries },
            { label: 'Kiểm kê chờ',   value: stats.pendingStocktakes },
            { label: 'Sự cố đang mở', value: stats.openIncidents     },
          ].map((item, i) => (
            <div
              key={item.label}
              className="flex-1 min-w-[100px] px-5 py-3 text-center"
              style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              }}
            >
              <p
                className="text-xl font-semibold leading-none"
                style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
              >
                {loading ? '—' : item.value}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse"
              style={{ background: '#eee9e2', borderRadius: '8px' }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            icon={Database}
            label="Tổng tồn kho"
            value={stats.totalInventoryItems.toLocaleString('vi-VN')}
            sub="Tổng số lượng hàng hóa"
            color="blue"
            onClick={() => navigate('/inventory')}
          />
          <MetricCard
            icon={ArrowDownLeft}
            label="Nhập kho chờ"
            value={stats.pendingReceipts}
            trend={stats.pendingReceipts > 0 ? 'Cần xử lý' : 'Đã xong'}
            trendUp={stats.pendingReceipts === 0}
            color={stats.pendingReceipts > 0 ? 'amber' : 'stone'}
            onClick={() => navigate('/receipts')}
          />
          <MetricCard
            icon={ArrowUpRight}
            label="Xuất kho chờ"
            value={stats.pendingDeliveries}
            trend={stats.pendingDeliveries > 0 ? 'Cần xử lý' : 'Đã xong'}
            trendUp={stats.pendingDeliveries === 0}
            color={stats.pendingDeliveries > 0 ? 'purple' : 'stone'}
            onClick={() => navigate('/deliveries')}
          />
          <MetricCard
            icon={ClipboardList}
            label="Kiểm kê chờ"
            value={stats.pendingStocktakes}
            trend={stats.pendingStocktakes > 0 ? 'Cần duyệt' : 'Đã xong'}
            trendUp={stats.pendingStocktakes === 0}
            color={stats.pendingStocktakes > 0 ? 'amber' : 'stone'}
            onClick={() => navigate('/stocktakes')}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Sự cố đang mở"
            value={stats.openIncidents}
            trend={stats.openIncidents > 0 ? 'Khẩn cấp' : 'Không có'}
            trendUp={stats.openIncidents === 0}
            color={stats.openIncidents > 0 ? 'red' : 'stone'}
            onClick={() => navigate('/incidents')}
          />
        </div>
      )}

      {/* ── Charts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Area Chart */}
        <div className="lg:col-span-2 p-6" style={cardStyle}>
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium" style={{ color: '#1e1919' }}>
                Biến động nhập / xuất kho
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#b8b2aa' }}>
                Số phiếu tạo theo tháng — 6 tháng gần nhất
              </p>
            </div>
            <button
              onClick={() => navigate('/receipts')}
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: '#0061fe' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0052d9'}
              onMouseLeave={e => e.currentTarget.style.color = '#0061fe'}
            >
              Chi tiết <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-56">
            {loading ? (
              <div className="h-full animate-pulse" style={{ background: '#f7f5f2', borderRadius: '6px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNhap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0061fe" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0061fe" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gXuat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee9e2" />
                  <XAxis dataKey="name" stroke="#b8b2aa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#b8b2aa" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background:   '#ffffff',
                      border:       '1px solid #eee9e2',
                      borderRadius: '8px',
                      fontSize:     '12px',
                      color:        '#1e1919',
                      boxShadow:    'none',
                    }}
                  />
                  <Area type="monotone" dataKey="Nhập kho" stroke="#0061fe" strokeWidth={2} fill="url(#gNhap)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#0061fe' }} />
                  <Area type="monotone" dataKey="Xuất kho" stroke="#10b981" strokeWidth={2} fill="url(#gXuat)" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-5 mt-4 justify-center">
            {[
              { label: 'Phiếu nhập kho', color: '#0061fe' },
              { label: 'Phiếu xuất kho', color: '#10b981' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-4 h-px" style={{ background: l.color, height: '2px' }} />
                <span className="text-xs" style={{ color: '#716b61' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 flex flex-col" style={cardStyle}>
          <div className="mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#1e1919' }}>
              Phân bổ hoạt động
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#b8b2aa' }}>
              Tỷ lệ các loại phiếu
            </p>
          </div>

          <div className="h-44">
            {loading ? (
              <div className="h-full animate-pulse" style={{ background: '#f7f5f2', borderRadius: '6px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff', border: '1px solid #eee9e2',
                      borderRadius: '8px', fontSize: '12px', boxShadow: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ color: '#716b61' }}>{entry.name}</span>
                </div>
                <span className="font-medium" style={{ color: '#1e1919' }}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions + Recent Activity ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Actions */}
        <div className="p-6" style={cardStyle}>
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: '#1e1919' }}>
            <TrendingUp className="w-4 h-4" style={{ color: '#0061fe' }} />
            Truy cập nhanh
          </h3>
          <div className="space-y-1">
            {[
              { label: 'Tồn kho thực tế',    path: '/inventory',   icon: Database      },
              { label: 'Lập phiếu nhập kho', path: '/receipts',    icon: ArrowDownLeft },
              { label: 'Lập phiếu xuất kho', path: '/deliveries',  icon: ArrowUpRight  },
              { label: 'Kiểm kê kho',        path: '/stocktakes',  icon: ClipboardList },
              { label: 'Điều chỉnh tồn kho', path: '/adjustments', icon: Package       },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-left transition-colors duration-100"
                  style={{ borderRadius: '8px', color: '#716b61' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f7f5f2'; e.currentTarget.style.color = '#1e1919'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#716b61'; }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: '#1e1919' }}>
              <Activity className="w-4 h-4" style={{ color: '#0061fe' }} />
              Hoạt động gần đây
            </h3>
            <button
              onClick={() => navigate('/audit-logs')}
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: '#0061fe' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0052d9'}
              onMouseLeave={e => e.currentTarget.style.color = '#0061fe'}
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse" style={{ background: '#f7f5f2', borderRadius: '6px' }} />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#b8b2aa' }}>
              <Clock className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Chưa có hoạt động nào được ghi nhận</p>
            </div>
          ) : (
            <div>
              {recentLogs.map((log, idx) => {
                const act = ACTION_LABELS[log.action] || { text: log.action, bg: '#f7f5f2', color: '#716b61' };
                return (
                  <div
                    key={log._id || idx}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: idx < recentLogs.length - 1 ? '1px solid #f7f5f2' : 'none' }}
                  >
                    <span
                      className="shrink-0 text-[10px] font-medium px-2 py-1 whitespace-nowrap"
                      style={{ background: act.bg, color: act.color, borderRadius: '6px' }}
                    >
                      {act.text}
                    </span>
                    <span className="text-xs font-medium flex-1 truncate" style={{ color: '#1e1919' }}>
                      {log.username}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums" style={{ color: '#b8b2aa' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN', {
                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
