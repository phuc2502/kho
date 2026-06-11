import React, { useState } from 'react';
import { useAuth } from '../controllers/auth.context.jsx';
import { UserModel } from '../models/user.model.js';
import { Eye, EyeOff, CheckCircle2, AlertCircle, User, ShieldCheck, KeyRound, Circle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Kiểm tra từng tiêu chí mật khẩu
const pwChecks = [
  { id: 'len',     label: 'Ít nhất 8 ký tự',         test: (v) => v.length >= 8 },
  { id: 'upper',   label: 'Ít nhất 1 chữ in hoa',     test: (v) => /[A-Z]/.test(v) },
  { id: 'digit',   label: 'Ít nhất 1 chữ số',         test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'Ít nhất 1 ký tự đặc biệt', test: (v) => /[^A-Za-z0-9]/.test(v) },
];
const validatePassword = (v) => pwChecks.every(c => c.test(v));

// ⚠️ Phải định nghĩa NGOÀI component — nếu để trong ProfilePage thì mỗi lần
//    state thay đổi React sẽ tạo lại function → input unmount/remount → mất focus
const PasswordInput = ({ value, onChange, show, onToggle, placeholder, autoComplete }) => (
  <div className="relative">
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      tabIndex={-1}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);

const ROLE_LABELS = {
  Admin:       { label: 'Quản trị viên', color: 'bg-purple-100 text-purple-700 ring-purple-200' },
  QuanLyKho:   { label: 'Quản lý kho',   color: 'bg-blue-100 text-blue-700 ring-blue-200' },
  KeToanKho:   { label: 'Kế toán kho',   color: 'bg-teal-100 text-teal-700 ring-teal-200' },
  NhanVienKho: { label: 'Nhân viên kho', color: 'bg-slate-100 text-slate-700 ring-slate-200' },
  QC:          { label: 'QC – Kiểm tra CL', color: 'bg-orange-100 text-orange-700 ring-orange-200' },
  Sale:        { label: 'Sale – Kinh doanh', color: 'bg-green-100 text-green-700 ring-green-200' },
};

export const ProfilePage = () => {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const roleInfo = ROLE_LABELS[user?.role] || { label: user?.role || 'Không xác định', color: 'bg-slate-100 text-slate-700 ring-slate-200' };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (!validatePassword(newPassword)) {
      setFormError('Mật khẩu chưa đáp ứng đủ yêu cầu bên dưới.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Xác nhận mật khẩu không khớp.');
      return;
    }
    if (newPassword === currentPassword) {
      setFormError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setSaving(true);
    try {
      await UserModel.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Đổi mật khẩu thành công!');
    } catch (err) {
      setFormError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Toaster position="top-right" />

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h1>
        <p className="text-sm text-slate-500 mt-1">Xem thông tin tài khoản và thay đổi mật khẩu của bạn.</p>
      </div>

      {/* Account info card */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Thông tin tài khoản</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {user?.fullName && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Họ và tên</p>
              <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Tên đăng nhập</p>
            <p className="text-sm font-bold text-slate-800">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Email</p>
            <p className="text-sm font-medium text-slate-700">{user?.email || '—'}</p>
          </div>
          {user?.position && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Chức vụ</p>
              <p className="text-sm font-medium text-slate-700">{user.position}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Vai trò</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${roleInfo.color}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {roleInfo.label}
            </span>
          </div>
          {user?.role !== 'Admin' && user?.permissions?.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Quyền hạn</p>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.slice(0, 10).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{p}</span>
                ))}
                {user.permissions.length > 10 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-xs">+{user.permissions.length - 10} khác</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Đổi mật khẩu</h2>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4" noValidate>

          {/* Success banner */}
          {success && (
            <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Đổi mật khẩu thành công! Vui lòng đăng nhập lại nếu phiên hết hạn.
            </div>
          )}

          {/* Error banner */}
          {formError && (
            <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current password — full width */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Mật khẩu hiện tại
              </label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setFormError(''); setSuccess(false); }}
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Mật khẩu mới
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setFormError(''); setSuccess(false); }}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFormError(''); setSuccess(false); }}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Password requirements checklist */}
          {newPassword && (
            <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 grid grid-cols-2 gap-1.5">
              {pwChecks.map(({ id, label, test }) => {
                const ok = test(newPassword);
                return (
                  <div key={id} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      : <Circle className="w-3.5 h-3.5 shrink-0" />
                    }
                    {label}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              {saving ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
