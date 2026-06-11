import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptModel }   from '../models/receipt.model.js';
import { DeliveryModel }  from '../models/delivery.model.js';
import { StocktakeModel } from '../models/stocktake.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { IncidentModel }  from '../models/incident.model.js';
import { DashboardModel } from '../models/dashboard.model.js';
import { useAuth } from '../controllers/auth.context.jsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import {
  ArrowDownLeft, ArrowUpRight, ClipboardList, AlertTriangle,
  Database, ChevronRight, TrendingDown, Zap, Clock, ShieldAlert, Trophy,
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

// ── Gap-5 helpers ─────────────────────────────────────────────────

/** Thanh tiến trình % so với max item trong danh sách */
const PctBar = ({ value, max, color = '#0061fe' }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: '#f7f5f2', borderRadius: 4, height: 6, flex: 1, minWidth: 60 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .3s' }} />
    </div>
  );
};

/** Badge màu theo mức độ khẩn */
const Badge = ({ text, type = 'warn' }) => {
  const styles = {
    warn:    { background: '#fffbeb', color: '#d97706' },
    danger:  { background: '#fef2f2', color: '#dc2626' },
    ok:      { background: '#ecfdf5', color: '#059669' },
    info:    { background: '#eff5ff', color: '#0061fe' },
  };
  const s = styles[type] || styles.info;
  return (
    <span style={{ ...s, fontSize: 10, padding: '2px 7px', borderRadius: 9999, fontWeight: 600 }}>
      {text}
    </span>
  );
};

/** Section header dùng chung */
const SectionHeader = ({ icon: Icon, title, sub, iconColor = '#0061fe', iconBg = '#eff5ff' }) => (
  <div className="flex items-center gap-3 mb-4">
    <div style={{ background: iconBg, color: iconColor, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} />
    </div>
    <div>
      <h3 style={{ color: '#1e1919', fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{title}</h3>
      {sub && <p style={{ color: '#b8b2aa', fontSize: 11, marginTop: 1 }}>{sub}</p>}
    </div>
  </div>
);

/** Dòng trống khi không có dữ liệu */
const EmptyRow = ({ text }) => (
  <div className="flex items-center justify-center py-8">
    <p style={{ color: '#b8b2aa', fontSize: 12 }}>{text}</p>
  </div>
);

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

  // ── Gap-5 state ────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    DashboardModel.getStats()
      .then(data => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [receipts, deliveries, stocktakes, incidents, inventory] = await Promise.all([
          ReceiptModel.getAll().catch(() => []),
          DeliveryModel.getAll().catch(() => []),
          StocktakeModel.getAll().catch(() => []),
          IncidentModel.getAll().catch(() => []),
          InventoryModel.getStock().catch(() => []),
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

      {/* ════════════════════════════════════════════════════════════
          GAP 5 — PHÂN TÍCH VẬN HÀNH (v2.0)
          Nguồn: /api/v1/dashboard/stats
      ═════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center gap-2 px-1"
        style={{ borderLeft: '3px solid #0061fe', paddingLeft: 10 }}
      >
        <p style={{ color: '#1e1919', fontSize: 13, fontWeight: 600 }}>Phân tích vận hành kho</p>
        <span style={{ color: '#b8b2aa', fontSize: 11 }}>— cập nhật theo dữ liệu thực tế</span>
      </div>

      {analyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse" style={{ background: '#eee9e2', borderRadius: 8 }} />
          ))}
        </div>
      ) : !analytics ? (
        <div className="p-6 text-center" style={cardStyle}>
          <p style={{ color: '#b8b2aa', fontSize: 12 }}>Không tải được dữ liệu phân tích.</p>
        </div>
      ) : (
        <>
          {/* ── Row 1: Cảnh báo (3 cards) ───────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Widget 1 — Tồn kho dưới ngưỡng
                Nguồn: Inventory WHERE quantity < 20
                Điều kiện: quantity < LOW_STOCK_THRESHOLD (20 đơn vị) */}
            <div className="p-5" style={cardStyle}>
              <SectionHeader
                icon={TrendingDown}
                title="Tồn kho dưới ngưỡng"
                sub={`Dưới ${analytics.lowStock.threshold} đơn vị — cần bổ sung`}
                iconColor="#dc2626" iconBg="#fef2f2"
              />
              {analytics.lowStock.items.length === 0 ? (
                <EmptyRow text="Tất cả mặt hàng đủ tồn kho ✓" />
              ) : (
                <div className="space-y-2.5">
                  {analytics.lowStock.items.map(item => (
                    <div key={`${item.productId}-${item.location}`} className="flex items-center gap-3">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#1e1919', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name || item.sku}
                        </p>
                        <p style={{ color: '#b8b2aa', fontSize: 10 }}>{item.location} · {item.unit}</p>
                      </div>
                      <Badge
                        text={`${item.quantity} còn lại`}
                        type={item.quantity <= 5 ? 'danger' : 'warn'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget 2 — Tốc độ tiêu thụ 30 ngày
                Nguồn: DeliveryItem JOIN Delivery WHERE status='completed'
                        AND updatedAt >= NOW()-30d GROUP BY productId SUM(quantity)
                Điều kiện: chỉ tính phiếu xuất hoàn thành */}
            <div className="p-5" style={cardStyle}>
              <SectionHeader
                icon={Zap}
                title="Tốc độ tiêu thụ 30 ngày"
                sub="Sản phẩm xuất nhiều nhất (phiếu đã hoàn thành)"
                iconColor="#d97706" iconBg="#fffbeb"
              />
              {analytics.consumption30d.items.length === 0 ? (
                <EmptyRow text="Chưa có phiếu xuất hoàn thành trong 30 ngày" />
              ) : (() => {
                const maxQty = Math.max(...analytics.consumption30d.items.map(i => i.qty30d), 1);
                return (
                  <div className="space-y-2.5">
                    {analytics.consumption30d.items.slice(0, 6).map(item => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center justify-between mb-1">
                            <p style={{ color: '#1e1919', fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                              {item.name || item.sku}
                            </p>
                            <span style={{ color: '#716b61', fontSize: 10, flexShrink: 0 }}>
                              {item.qty30d.toLocaleString('vi-VN')} {item.unit}
                            </span>
                          </div>
                          <PctBar value={item.qty30d} max={maxQty} color="#f59e0b" />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Widget 3 — Sắp hết bảo hành
                Nguồn: SoSerial WHERE Han_bao_hanh BETWEEN NOW() AND NOW()+30d
                Điều kiện: cột Han_bao_hanh (v2.0 migration) — hiển thị stub đến khi migrate */}
            <div className="p-5" style={cardStyle}>
              <SectionHeader
                icon={ShieldAlert}
                title="Sắp hết bảo hành"
                sub={`Serial hết hạn trong ${analytics.warrantyExpiring.days} ngày tới`}
                iconColor="#7c3aed" iconBg="#f5f3ff"
              />
              {analytics.warrantyExpiring.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 10, color: '#7c3aed' }}>
                    <ShieldAlert size={20} />
                  </div>
                  <p style={{ color: '#b8b2aa', fontSize: 11, textAlign: 'center', lineHeight: 1.5 }}>
                    Chưa có dữ liệu bảo hành.
                    <br />
                    <span style={{ color: '#7c3aed', fontSize: 10 }}>
                      Cần migrate cột <code>Han_bao_hanh</code> vào bảng SoSerial (v2.0).
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analytics.warrantyExpiring.items.map(item => (
                    <div key={item.serialId} className="flex items-center gap-3">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#1e1919', fontSize: 12, fontWeight: 500 }}>{item.serialCode}</p>
                        <p style={{ color: '#b8b2aa', fontSize: 10 }}>{item.productName}</p>
                      </div>
                      <Badge text={`còn ${item.daysLeft}d`} type={item.daysLeft <= 7 ? 'danger' : 'warn'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Row 2: Phân tích xuất kho (2 cards) ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Widget 4 — Hàng tồn lâu ngày
                Nguồn: Inventory WHERE updatedAt < NOW()-30d AND quantity > 0
                Điều kiện: sắp xếp theo updatedAt ASC (lâu nhất trước) */}
            <div className="p-5" style={cardStyle}>
              <SectionHeader
                icon={Clock}
                title="Hàng tồn lâu ngày"
                sub={`Không xuất trên ${analytics.slowMoving.days} ngày, quantity > 0`}
                iconColor="#716b61" iconBg="#f7f5f2"
              />
              {analytics.slowMoving.items.length === 0 ? (
                <EmptyRow text="Không có hàng tồn kho lâu ngày" />
              ) : (
                <div className="space-y-0">
                  {/* Header row */}
                  <div className="flex gap-2 pb-2 mb-1" style={{ borderBottom: '1px solid #f0ebe3' }}>
                    <span style={{ color: '#b8b2aa', fontSize: 10, flex: 2 }}>Sản phẩm</span>
                    <span style={{ color: '#b8b2aa', fontSize: 10, flex: 1, textAlign: 'center' }}>Số lượng</span>
                    <span style={{ color: '#b8b2aa', fontSize: 10, flex: 1, textAlign: 'right' }}>Tồn kho (ngày)</span>
                  </div>
                  {analytics.slowMoving.items.map(item => (
                    <div key={`${item.productId}-${item.location}`}
                      className="flex items-center gap-2 py-2"
                      style={{ borderBottom: '1px solid #faf8f5' }}
                    >
                      <div style={{ flex: 2, minWidth: 0 }}>
                        <p style={{ color: '#1e1919', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name || item.sku}
                        </p>
                        <p style={{ color: '#b8b2aa', fontSize: 10 }}>{item.location}</p>
                      </div>
                      <span style={{ flex: 1, textAlign: 'center', color: '#1e1919', fontSize: 12, fontWeight: 500 }}>
                        {item.quantity.toLocaleString('vi-VN')} {item.unit}
                      </span>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Badge
                          text={`${item.daysSinceUpdate} ngày`}
                          type={item.daysSinceUpdate > 90 ? 'danger' : item.daysSinceUpdate > 60 ? 'warn' : 'info'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget 5 — Top 10 sản phẩm xuất nhiều nhất
                Nguồn: DeliveryItem JOIN Delivery WHERE status='completed'
                        GROUP BY productId SUM(quantity) DESC LIMIT 10
                Điều kiện: tính tổng cộng tất cả phiếu xuất đã hoàn thành */}
            <div className="p-5" style={cardStyle}>
              <SectionHeader
                icon={Trophy}
                title="Top 10 xuất nhiều nhất"
                sub="Tổng số lượng xuất kho (tất cả thời gian, phiếu hoàn thành)"
                iconColor="#059669" iconBg="#ecfdf5"
              />
              {analytics.top10Deliveries.items.length === 0 ? (
                <EmptyRow text="Chưa có phiếu xuất hoàn thành" />
              ) : (() => {
                const maxQty = Math.max(...analytics.top10Deliveries.items.map(i => i.totalQty), 1);
                const RANK_COLORS = ['#f59e0b', '#b8b2aa', '#cd7c2e'];
                return (
                  <div className="space-y-2">
                    {analytics.top10Deliveries.items.map((item, idx) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        {/* Rank */}
                        <span
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: idx < 3 ? RANK_COLORS[idx] : '#f7f5f2',
                            color:      idx < 3 ? '#ffffff' : '#b8b2aa',
                            fontSize: 10, fontWeight: 700, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >
                          {item.rank}
                        </span>
                        {/* Name + bar */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center justify-between mb-1">
                            <p style={{ color: '#1e1919', fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                              {item.name || item.sku}
                            </p>
                            <span style={{ color: '#716b61', fontSize: 10, flexShrink: 0 }}>
                              {item.totalQty.toLocaleString('vi-VN')} {item.unit}
                            </span>
                          </div>
                          <PctBar value={item.totalQty} max={maxQty} color="#10b981" />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
