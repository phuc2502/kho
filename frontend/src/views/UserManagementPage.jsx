import React, { useState, useEffect, useMemo } from 'react';
import { UserModel } from '../models/user.model.js';
import { api } from '../models/api.js';
import { useAuth } from '../controllers/auth.context.jsx';
import toast, { Toaster } from 'react-hot-toast';
import {
  UserPlus, Shield, Key, KeyRound, Eye, EyeOff,
  ChevronRight, RotateCcw, Check, X, Minus,
  UserCheck, UserX, ShieldAlert, ShieldCheck, AlertTriangle,
  Warehouse, Plus, Trash2, MapPin, Ban, RefreshCw, Users, Search
} from 'lucide-react';

// ——— Cấu hình 6 vai trò ———
const ROLE_CONFIG = {
  Admin: {
    label: 'Quản trị viên',
    short: 'Admin',
    color: 'bg-purple-100 text-purple-700 ring-purple-200',
    desc: 'Toàn quyền hệ thống, quản lý tài khoản & phân quyền',
    icon: '👑'
  },
  QuanLyKho: {
    label: 'Quản lý kho',
    short: 'QL Kho',
    color: 'bg-blue-100 text-blue-700 ring-blue-200',
    desc: 'Phê duyệt phiếu nhập/xuất/kiểm kê trong kho phụ trách',
    icon: '🏭'
  },
  KeToanKho: {
    label: 'Kế toán kho',
    short: 'KT Kho',
    color: 'bg-teal-100 text-teal-700 ring-teal-200',
    desc: 'Lập phiếu nhập/xuất/kiểm kê trong kho phụ trách',
    icon: '📋'
  },
  NhanVienKho: {
    label: 'Nhân viên kho',
    short: 'NV Kho',
    color: 'bg-slate-100 text-slate-600 ring-slate-200',
    desc: 'Thao tác cơ bản: xem và lập phiếu cơ bản',
    icon: '👷'
  },
  QC: {
    label: 'QC – Kiểm tra CL',
    short: 'QC',
    color: 'bg-amber-100 text-amber-700 ring-amber-200',
    desc: 'Chỉ xem tồn kho thực tế và báo cáo sự cố',
    icon: '🔍'
  },
  Sale: {
    label: 'Sale – Kinh doanh',
    short: 'Sale',
    color: 'bg-rose-100 text-rose-700 ring-rose-200',
    desc: 'Tạo yêu cầu xuất kho và theo dõi tồn kho',
    icon: '📦'
  },
};

// Quyền chỉ dành riêng cho Admin — không được gán/hiển thị cho vai trò khác
const ADMIN_ONLY_PERMS = new Set(['audit:read', 'user:manage', 'emaillog:read']);

// Chuẩn hóa chuỗi: bỏ dấu, chuyển thường — hỗ trợ tìm kiếm không dấu
const normalize = (str) =>
  (str ?? '').normalize('NFD')
     .replace(/[̀-ͯ]/g, '')
     .replace(/đ/g, 'd').replace(/Đ/g, 'D')
     .toLowerCase();

const RoleBadge = ({ role, size = 'sm' }) => {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.NhanVienKho;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ring-1 ${cfg.color} ${
      size === 'xs' ? 'text-[10px]' : 'text-xs'
    }`}>
      {cfg.short}
    </span>
  );
};

const Avatar = ({ name, size = 'md' }) => {
  const initials = name ? name.substring(0, 2).toUpperCase() : '??';
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-primary-500/15 text-primary-700 font-bold flex items-center justify-center border border-primary-200 shrink-0`}>
      {initials}
    </div>
  );
};

// ——— Field dùng chung cho các modal (phải khai báo NGOÀI component để tránh mất focus) ———
const ModalField = ({ label, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all" />
  </div>
);

// ——— Modal tạo tài khoản — email làm tên đăng nhập, password tự sinh ———
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ email: '', role: 'NhanVienKho', fullName: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên nhân viên');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Vui lòng nhập email công ty của nhân viên');
      return;
    }
    setLoading(true);
    try {
      const result = await UserModel.createUser(form);
      toast.success(
        result.emailSent
          ? `Đã tạo tài khoản và gửi mật khẩu tới ${form.email}`
          : `Đã tạo tài khoản (email chưa gửi được — kiểm tra cấu hình SMTP)`,
        { duration: 5000 }
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Tạo tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tạo tài khoản mới</h2>
            <p className="text-xs text-slate-500 mt-0.5">Mật khẩu tự động sinh và gửi qua email nhân viên</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email + Vai trò */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin đăng nhập</p>
            <ModalField
              label="Email công ty"
              value={form.email}
              onChange={set('email')}
              type="email"
              placeholder="ten.nhanvien@fositek.vn"
              required
            />
            {/* Info box */}
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3.5 py-2.5 text-xs text-blue-700">
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Email được dùng làm tên đăng nhập. Mật khẩu sẽ được tự động tạo và gửi tới email này.</span>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Vai trò</label>
              <select value={form.role} onChange={set('role')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all">
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label} — {v.desc}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Hồ sơ nhân viên */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Hồ sơ nhân viên</p>
            <ModalField label="Họ và tên" value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn An" required />
            <ModalField label="Số điện thoại" value={form.phone} onChange={set('phone')} placeholder="0912 345 678" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-primary-600 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Đang tạo...' : 'Tạo & Gửi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ——— Modal vô hiệu hóa (bắt buộc nhập lý do) ———
const DeactivateModal = ({ user, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Vui lòng nhập lý do vô hiệu hóa'); return; }
    setLoading(true);
    try {
      await UserModel.deactivateUser(user._id, reason.trim());
      toast.success(`Đã vô hiệu hóa tài khoản "${user.username}"`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Không thể vô hiệu hóa tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Ban className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Vô hiệu hóa tài khoản</h2>
              <p className="text-xs text-slate-500">@{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Tài khoản bị vô hiệu hóa sẽ không thể đăng nhập. Lịch sử hoạt động vẫn được bảo toàn. Có thể kích hoạt lại bất cứ lúc nào.</span>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Lý do vô hiệu hóa <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nhập lý do (VD: Nghỉ việc, Vi phạm nội quy, Tạm nghỉ phép dài hạn...)"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading || !reason.trim()}
              className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Ban className="w-4 h-4" />}
              {loading ? 'Đang xử lý...' : 'Xác nhận vô hiệu hóa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ——— Panel phân quyền chi tiết ———
const PermissionPanel = ({ userId, onClose, onSaved }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localChecked, setLocalChecked] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await UserModel.getUserPermissions(userId);
        setData(result);
        setLocalChecked(new Set(result.effective || []));
      } catch {
        toast.error('Không thể tải thông tin quyền');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const toggle = (code) => {
    if (ADMIN_ONLY_PERMS.has(code)) return; // khóa — chỉ Admin
    setLocalChecked(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const roleDefaultSet = new Set(data.roleDefaults);
      // Lọc bỏ quyền admin-only — không được phép grant/revoke
      const grants = [...localChecked].filter(c => !roleDefaultSet.has(c) && !ADMIN_ONLY_PERMS.has(c));
      const revokes = [...roleDefaultSet].filter(c => !localChecked.has(c) && !ADMIN_ONLY_PERMS.has(c));
      await UserModel.saveUserPermissions(userId, grants, revokes);
      toast.success('Đã lưu phân quyền thành công');
      const result = await UserModel.getUserPermissions(userId);
      setData(result);
      setLocalChecked(new Set(result.effective || []));
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset về quyền mặc định của vai trò?')) return;
    setSaving(true);
    try {
      await UserModel.resetUserPermissions(userId);
      toast.success('Đã reset về quyền mặc định');
      const result = await UserModel.getUserPermissions(userId);
      setData(result);
      setLocalChecked(new Set(result.effective || []));
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Reset thất bại');
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    if (!data?.catalog) return [];
    const map = {};
    for (const p of data.catalog) {
      // Bỏ qua quyền đối tác — chức năng đã bị gỡ bỏ
      if (p.code.startsWith('partner:')) continue;
      if (!map[p.group]) map[p.group] = [];
      map[p.group].push(p);
    }
    // Lọc bỏ các nhóm rỗng (ví dụ nhóm chỉ có quyền đối tác)
    return Object.entries(map).filter(([, perms]) => perms.length > 0);
  }, [data]);

  const getPermSource = (code) => {
    if (!data) return 'none';
    if (data.granted.includes(code)) return 'grant';
    if (data.revoked.includes(code)) return 'revoke';
    if (data.roleDefaults.includes(code)) return 'role';
    return 'none';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary-500" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Phân quyền chi tiết</h3>
            {data && <p className="text-xs text-slate-500 mt-0.5">{data.fullName || data.username}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.isAdmin ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7 text-purple-600" />
          </div>
          <p className="font-bold text-slate-800">Tài khoản Admin</p>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">Tài khoản này có toàn quyền hệ thống. Không cần cấu hình phân quyền riêng.</p>
        </div>
      ) : (
        <>
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RoleBadge role={data.role} size="xs" />
                <span className="text-xs text-slate-400">
                  {data.roleDefaults.length} mặc định
                  {data.granted.length > 0 && <span className="text-emerald-600 ml-1">+{data.granted.length}</span>}
                  {data.revoked.length > 0 && <span className="text-red-500 ml-1">-{data.revoked.length}</span>}
                </span>
              </div>
              <button onClick={handleReset} disabled={saving}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 disabled:opacity-50">
                <RotateCcw className="w-3 h-3" /> Mặc định
              </button>
            </div>
          </div>
          <div className="px-5 py-2 flex items-center gap-3 text-[10px] text-slate-400 border-b border-slate-100 shrink-0">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Vai trò</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Cấp thêm</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Thu hồi</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {grouped.map(([group, perms]) => (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">{group}</p>
                <div className="space-y-1">
                  {perms.map(p => {
                    const isAdminOnly = ADMIN_ONLY_PERMS.has(p.code);
                    const checked = localChecked.has(p.code);
                    const src = getPermSource(p.code);
                    if (isAdminOnly) {
                      return (
                        <div key={p.code}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 opacity-60 cursor-not-allowed select-none">
                          <div className="w-4 h-4 rounded-md border-2 border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                            <Minus className="w-2.5 h-2.5 text-slate-400" strokeWidth={3} />
                          </div>
                          <span className="text-xs flex-1 text-slate-400">{p.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold shrink-0">Chỉ Admin</span>
                        </div>
                      );
                    }
                    return (
                      <label key={p.code}
                        onClick={() => toggle(p.code)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                          checked ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-slate-50'
                        }`}>
                        <div
                          className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                          }`}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs flex-1 ${checked ? 'text-slate-800' : 'text-slate-500'}`}>{p.name}</span>
                        {src === 'role' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500">Vai trò</span>}
                        {src === 'grant' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Cấp thêm</span>}
                        {src === 'revoke' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Thu hồi</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 shrink-0">
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-primary-600 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ——— Panel phân công kho ———
const WarehousePanel = ({ user, onClose, onSaved }) => {
  const [assignments, setAssignments] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignData, warehouseData] = await Promise.all([
        UserModel.getUserWarehouses(user._id),
        api.get('/warehouses')
      ]);
      setAssignments(assignData.warehouses || []);
      const top = (warehouseData || []).filter(w => w.type === 'warehouse');
      setAllWarehouses(top);
    } catch {
      toast.error('Không thể tải dữ liệu kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user._id]);

  const assignedIds = new Set(assignments.map(a => a.warehouseNodeId));
  const available = allWarehouses.filter(w => !assignedIds.has(w._id));

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await UserModel.assignWarehouse(user._id, Number(selectedId));
      toast.success('Đã phân công kho thành công');
      setSelectedId('');
      await loadData();
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Phân công thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (warehouseNodeId) => {
    if (!window.confirm('Bỏ phân công kho này?')) return;
    try {
      await UserModel.removeWarehouse(user._id, warehouseNodeId);
      toast.success('Đã bỏ phân công kho');
      await loadData();
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Không thể bỏ phân công');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Phân công kho</h3>
            <p className="text-xs text-slate-500 mt-0.5">{user.fullName || user.username}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {user.role === 'Admin' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7 text-purple-600" />
          </div>
          <p className="font-bold text-slate-800">Tài khoản Admin</p>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">Admin có quyền truy cập tất cả kho trong hệ thống, không cần phân công riêng.</p>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {available.length > 0 && (
            <div className="p-4 border-b border-slate-100 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Thêm kho phụ trách</p>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all">
                    <option value="">— Chọn kho —</option>
                    {available.map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleAssign} disabled={!selectedId || saving}
                  className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition-colors flex items-center gap-1">
                  {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span className="text-xs font-semibold">Thêm</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MapPin className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Chưa phân công kho nào</p>
                <p className="text-xs text-slate-400 mt-1">
                  {available.length > 0 ? 'Chọn kho ở trên để phân công' : 'Tạo kho trong Sơ đồ Kho hàng trước'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  {assignments.length} kho được phân công
                </p>
                {assignments.map(a => (
                  <div key={a.warehouseNodeId}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 ring-1 ring-blue-100">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Warehouse className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                      <p className="text-[10px] text-slate-400">{a.code}</p>
                    </div>
                    <button onClick={() => handleRemove(a.warehouseNodeId)}
                      className="p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 text-slate-400 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {allWarehouses.length === 0 && (
            <div className="px-4 pb-4 shrink-0">
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Chưa có kho nào trong hệ thống. Tạo kho trước trong trang <strong>Sơ đồ Kho hàng</strong>.</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ——— Trang chính ———
export const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  // Panel bên: 'perm' | 'warehouse' | null
  const [panelMode, setPanelMode] = useState(null);
  const [panelUserId, setPanelUserId] = useState(null);
  // Pending role change: { [userId]: newRole } — phải ấn Xác nhận mới lưu
  const [pendingRole, setPendingRole] = useState({});
  // Tìm kiếm & bộ lọc
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterRole, setFilterRole]     = useState('');   // '' = tất cả
  const [filterStatus, setFilterStatus] = useState('');   // '' | 'active' | 'inactive' | 'reset'
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredUsers = useMemo(() => users.filter(u => {
    if (searchQuery.trim()) {
      const q = normalize(searchQuery.trim());
      const hit =
        normalize(u.fullName).includes(q)  ||
        normalize(u.email).includes(q)     ||
        normalize(u.username).includes(q);
      if (!hit) return false;
    }
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatus === 'active'   && (!u.isActive || u.passwordResetRequested)) return false;
    if (filterStatus === 'inactive' && u.isActive)                return false;
    if (filterStatus === 'reset'    && !u.passwordResetRequested) return false;
    return true;
  }), [users, searchQuery, filterRole, filterStatus]);

  const suggestions = searchQuery.trim() ? users.filter(u => {
    const q = normalize(searchQuery.trim());
    return normalize(u.fullName).includes(q) ||
           normalize(u.email).includes(q) ||
           normalize(u.username).includes(q);
  }).slice(0, 6).map(u => ({ label: u.fullName || u.username, code: u.email || u.username, id: u._id })) : [];

  const selectSuggestion = (item) => {
    setSearchQuery(item.label);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setUsers(await UserModel.getAllUsers());
    } catch {
      toast.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openPanel = (mode, userId) => {
    if (panelMode === mode && panelUserId === userId) {
      setPanelMode(null);
      setPanelUserId(null);
    } else {
      setPanelMode(mode);
      setPanelUserId(userId);
    }
  };

  const closePanel = () => { setPanelMode(null); setPanelUserId(null); };

  // Chọn vai trò mới → lưu tạm, chưa gọi API
  const handleRoleSelectChange = (userId, currentRole, newRole) => {
    if (newRole === currentRole) {
      setPendingRole(prev => { const n = { ...prev }; delete n[userId]; return n; });
      return;
    }
    setPendingRole(prev => ({ ...prev, [userId]: newRole }));
  };

  // Ấn Xác nhận → optimistic update ngay lập tức, gọi API nền
  const handleConfirmRole = async (userId) => {
    const newRole = pendingRole[userId];
    if (!newRole) return;
    // Cập nhật ngay trên bảng (không chờ spinner)
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    setPendingRole(prev => { const n = { ...prev }; delete n[userId]; return n; });
    try {
      await UserModel.updateUser(userId, { role: newRole });
      toast.success(`Đã cập nhật vai trò thành ${ROLE_CONFIG[newRole]?.label || newRole}`);
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại — đang khôi phục...');
      fetchUsers(); // revert về dữ liệu server nếu lỗi
    }
  };

  // Ấn Hủy → bỏ pending, trả lại vai trò cũ
  const handleCancelRole = (userId) => {
    setPendingRole(prev => { const n = { ...prev }; delete n[userId]; return n; });
  };

  const handleReactivate = async (u) => {
    if (!window.confirm(`Kích hoạt lại tài khoản "${u.username}"?`)) return;
    try {
      await UserModel.reactivateUser(u._id);
      toast.success(`Đã kích hoạt lại tài khoản "${u.username}"`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Không thể kích hoạt lại');
    }
  };

  const handleAdminResetPassword = async (u) => {
    if (!window.confirm(
      `Đặt lại mật khẩu cho "${u.fullName || u.email}"?\n\nMật khẩu mới sẽ được tạo tự động và gửi qua email ${u.email}.`
    )) return;
    const tid = toast.loading('Đang đặt lại mật khẩu...');
    try {
      const result = await UserModel.adminResetPassword(u._id);
      toast.dismiss(tid);
      if (result.emailSent) {
        toast.success(`Mật khẩu mới đã được gửi tới ${u.email}`, { duration: 5000 });
      } else {
        toast(`Đã đặt lại mật khẩu nhưng email chưa gửi được — kiểm tra cấu hình SMTP`, {
          icon: '⚠️', duration: 6000
        });
      }
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.message || 'Không thể đặt lại mật khẩu');
    }
  };

  const panelUser = users.find(u => u._id === panelUserId);
  const panelOpen = panelMode !== null && panelUser;

  // ——— Thống kê ———
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const totalRoles    = Object.keys(ROLE_CONFIG).length;

  const STATS = [
    {
      label: 'Tổng tài khoản',
      value: totalUsers,
      icon: Users,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      valueCls: 'text-blue-700',
    },
    {
      label: 'Đang hoạt động',
      value: activeUsers,
      icon: UserCheck,
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      valueCls: 'text-emerald-700',
    },
    {
      label: 'Vô hiệu hóa',
      value: inactiveUsers,
      icon: UserX,
      bg: inactiveUsers > 0 ? 'bg-orange-50' : 'bg-slate-50',
      iconColor: inactiveUsers > 0 ? 'text-orange-500' : 'text-slate-400',
      valueCls: inactiveUsers > 0 ? 'text-orange-700' : 'text-slate-400',
    },
    {
      label: 'Vai trò hệ thống',
      value: totalRoles,
      icon: Shield,
      bg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      valueCls: 'text-purple-700',
    },
  ];

  return (
    <div className="h-full flex flex-col space-y-5">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tài khoản & Phân quyền</h2>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-primary-500/20">
          <UserPlus className="w-4 h-4" />
          Tạo tài khoản
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-5 min-h-0">

        {/* ——— Bảng tài khoản ——— */}
        <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 flex flex-col min-h-0 ${panelOpen ? 'flex-1' : 'w-full'}`}>
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex flex-col gap-3 shrink-0">
            {/* Dòng đầu: đếm + stats */}
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800 text-sm">
                {filteredUsers.length < users.length
                  ? <>{filteredUsers.length} <span className="font-normal text-slate-400">/ {users.length} tài khoản</span></>
                  : <>{users.length} tài khoản</>
                }
              </p>
              <span className="text-xs text-slate-400">
                {users.filter(u => u.isActive).length} hoạt động · {users.filter(u => !u.isActive).length} vô hiệu
              </span>
            </div>
            {/* Thanh tìm kiếm + bộ lọc */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Tìm theo tên, email..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15 focus:bg-white transition-all"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && searchQuery.trim().length > 0 && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50">
                    <div className="py-2 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                      {suggestions.map((item, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectSuggestion(item)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`w-full px-4 py-2 flex items-center justify-between text-left text-xs transition-colors ${
                              isActive ? 'bg-primary-50 text-primary-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate flex-1 mr-4">{item.label}</span>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">{item.code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value="">Tất cả vai trò</option>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Vô hiệu</option>
                <option value="reset">Quên mật khẩu</option>
              </select>
              {(searchQuery || filterRole || filterStatus) && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterRole(''); setFilterStatus(''); }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors shrink-0"
                  title="Xóa bộ lọc"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <span className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 z-10">
                  <tr>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-5 py-3 w-44">Tài khoản</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3 w-56">Email</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3 w-44">Vai trò</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3 w-36">Trạng thái</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3 w-36">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                        Không tìm thấy tài khoản phù hợp
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map(u => {
                    const isSelf = currentUser?._id === u._id;
                    const isPanelOpen = panelUserId === u._id;
                    const hasPending = !!pendingRole[u._id];
                    return (
                      <tr key={u._id}
                        className={`transition-colors ${isPanelOpen ? 'bg-primary-50/50' : 'hover:bg-slate-50/60'} ${!u.isActive ? 'opacity-60' : ''}`}>
                        {/* Cột 1: Tài khoản — hiển thị tên nhân viên */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.fullName || u.username} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 truncate">
                                  {u.fullName || u.username}
                                </span>
                                {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 font-bold shrink-0">Bạn</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Cột 2: Email */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600 truncate block">{u.email}</span>
                        </td>
                        {/* Vai trò — phải ấn xác nhận mới lưu */}
                        <td className="px-4 py-3">
                          {isSelf || u.role === 'Admin' ? (
                            <RoleBadge role={u.role} />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={pendingRole[u._id] ?? u.role}
                                onChange={e => handleRoleSelectChange(u._id, u.role, e.target.value)}
                                className={`text-xs rounded-lg border px-2 py-1 focus:outline-none focus:border-primary-500 cursor-pointer transition-colors ${
                                  hasPending
                                    ? 'border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                                    : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              >
                                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                                  <option key={k} value={k}>{v.short}</option>
                                ))}
                              </select>
                              {hasPending && (
                                <>
                                  <button
                                    onClick={() => handleConfirmRole(u._id)}
                                    className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md transition-colors"
                                    title="Xác nhận đổi vai trò"
                                  >
                                    <Check className="w-3 h-3" strokeWidth={3} />
                                  </button>
                                  <button
                                    onClick={() => handleCancelRole(u._id)}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md transition-colors"
                                    title="Hủy"
                                  >
                                    <X className="w-3 h-3" strokeWidth={3} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Trạng thái */}
                        <td className="px-4 py-3">
                          {!u.isActive ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 bg-red-50 text-red-600 ring-red-200">
                                <Ban className="w-3 h-3" /> Vô hiệu
                              </span>
                              {u.deactivationReason && (
                                <p className="text-[10px] text-slate-400 mt-0.5 max-w-[120px] truncate" title={u.deactivationReason}>
                                  {u.deactivationReason}
                                </p>
                              )}
                            </div>
                          ) : u.passwordResetRequested ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 bg-orange-50 text-orange-600 ring-orange-200">
                              <KeyRound className="w-3 h-3" /> Quên mật khẩu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200">
                              <UserCheck className="w-3 h-3" /> Hoạt động
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* Phân quyền */}
                            <button
                              onClick={() => openPanel('perm', u._id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isPanelOpen && panelMode === 'perm'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-slate-100 hover:bg-primary-100 hover:text-primary-600 text-slate-500'
                              }`}
                              title="Phân quyền chi tiết"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            {/* Phân công kho (không áp dụng cho Admin) */}
                            {u.role !== 'Admin' && (
                              <button
                                onClick={() => openPanel('warehouse', u._id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isPanelOpen && panelMode === 'warehouse'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-500'
                                }`}
                                title="Phân công kho"
                              >
                                <Warehouse className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* Vô hiệu hóa / Kích hoạt lại */}
                            {!isSelf && (
                              u.isActive ? (
                                <button
                                  onClick={() => setDeactivateTarget(u)}
                                  className="p-1.5 bg-slate-100 hover:bg-orange-100 hover:text-orange-600 rounded-lg text-slate-500 transition-colors"
                                  title="Vô hiệu hóa tài khoản"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(u)}
                                  className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg text-slate-500 transition-colors"
                                  title="Kích hoạt lại tài khoản"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                            {/* Đặt lại mật khẩu — chỉ Admin thao tác, không dùng cho chính mình */}
                            {!isSelf && (
                              <button
                                onClick={() => handleAdminResetPassword(u)}
                                className="p-1.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-600 rounded-lg text-slate-500 transition-colors"
                                title="Đặt lại mật khẩu — gửi MK mới qua email"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ——— Panel bên (Phân quyền hoặc Phân công kho) ——— */}
        {panelOpen && (
          <div className="w-80 bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 flex flex-col min-h-0 shrink-0 overflow-x-hidden">
            {panelMode === 'perm' && (
              <PermissionPanel userId={panelUserId} onClose={closePanel} onSaved={fetchUsers} />
            )}
            {panelMode === 'warehouse' && (
              <WarehousePanel user={panelUser} onClose={closePanel} onSaved={fetchUsers} />
            )}
          </div>
        )}
      </div>

      {/* ——— 4 ô thống kê ——— */}
      <div className="shrink-0 grid grid-cols-4 gap-3">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl ring-1 ring-slate-200 px-4 py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium leading-none mb-1">{s.label}</p>
                <p className={`text-xl font-bold leading-none ${s.valueCls}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSuccess={fetchUsers} />}
      {deactivateTarget && (
        <DeactivateModal
          user={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};
