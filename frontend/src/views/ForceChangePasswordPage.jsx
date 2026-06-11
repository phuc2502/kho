import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle2, Circle, AlertCircle, ShieldAlert } from 'lucide-react';
import { UserModel } from '../models/user.model.js';
import { useAuth } from '../controllers/auth.context.jsx';
import toast, { Toaster } from 'react-hot-toast';

// Tiêu chí mật khẩu — phải đồng bộ với backend validatePassword
const pwChecks = [
  { id: 'len',     label: 'Ít nhất 8 ký tự',         test: (v) => v.length >= 8 },
  { id: 'upper',   label: 'Ít nhất 1 chữ in hoa',     test: (v) => /[A-Z]/.test(v) },
  { id: 'digit',   label: 'Ít nhất 1 chữ số',         test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'Ít nhất 1 ký tự đặc biệt', test: (v) => /[^A-Za-z0-9]/.test(v) },
];
const allPassed = (v) => pwChecks.every(c => c.test(v));

// Ngoài component để tránh re-mount khi state thay đổi
const PwInput = ({ value, onChange, show, onToggle, placeholder, autoComplete }) => (
  <div className="relative">
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
    />
    <button type="button" onClick={onToggle} tabIndex={-1}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);

export const ForceChangePasswordPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allPassed(newPassword)) {
      setError('Mật khẩu chưa đáp ứng đủ yêu cầu bảo mật.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setSaving(true);
    try {
      await UserModel.forceChangePassword(newPassword);
      updateUser({ mustChangePassword: false });
      toast.success('Đổi mật khẩu thành công!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f7f5f2' }}>
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        {/* Header cảnh báo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#fff3cd', border: '1px solid #ffc107' }}>
            <ShieldAlert className="w-8 h-8" style={{ color: '#d97706' }} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Đổi mật khẩu bắt buộc</h1>
          <p className="text-sm text-slate-500 max-w-sm">
            Mật khẩu của bạn do hệ thống cấp. Vui lòng đặt mật khẩu mới trước khi tiếp tục sử dụng.
          </p>
          {user?.fullName && (
            <p className="mt-2 text-xs font-medium text-slate-400">
              Tài khoản: <span className="text-slate-700">{user.fullName}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 space-y-5">

          {/* Lỗi */}
          {error && (
            <div className="rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Mật khẩu mới
              </label>
              <PwInput
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
              />
            </div>

            {/* Checklist yêu cầu */}
            {newPassword && (
              <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 grid grid-cols-2 gap-1.5">
                {pwChecks.map(({ id, label, test }) => {
                  const ok = test(newPassword);
                  return (
                    <div key={id}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
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

            {/* Xác nhận */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <PwInput
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="mt-1.5 text-xs text-red-500">Mật khẩu xác nhận không khớp</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || !allPassed(newPassword) || newPassword !== confirmPassword}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#1e1919' }}
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <KeyRound className="w-4 h-4" />
              }
              {saving ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>

          {/* Đăng xuất */}
          <div className="pt-1 text-center">
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Đăng xuất và dùng tài khoản khác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
