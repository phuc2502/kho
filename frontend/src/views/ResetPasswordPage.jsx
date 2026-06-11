import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, CheckCircle, CheckCircle2, Circle, AlertCircle, Lock } from 'lucide-react';
import { UserModel } from '../models/user.model.js';

const pwChecks = [
  { id: 'len',     label: 'Ít nhất 8 ký tự',         test: (v) => v.length >= 8 },
  { id: 'upper',   label: 'Ít nhất 1 chữ in hoa',     test: (v) => /[A-Z]/.test(v) },
  { id: 'digit',   label: 'Ít nhất 1 chữ số',         test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'Ít nhất 1 ký tự đặc biệt', test: (v) => /[^A-Za-z0-9]/.test(v) },
];
const validatePassword = (v) => pwChecks.every(c => c.test(v));

const DropboxMark = ({ size = 24, color = '#0061fe' }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 40 36" fill="none">
    <path d="M20 6.5L10 13 20 19.5 10 26l-10-6.5L10 13 0 6.5 10 0z" fill={color}/>
    <path d="M20 6.5L30 0l10 6.5L30 13l10 6.5-10 6.5-10-6.5L30 13z" fill={color}/>
    <path d="M10 27.85L20 21.35l10 6.5-10 6.5z" fill={color}/>
  </svg>
);

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);
  const [error, setError]                   = useState('');

  useEffect(() => {
    if (!token) setError('Link không hợp lệ. Vui lòng gửi lại yêu cầu từ trang Quên mật khẩu.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(newPassword)) { setError('Mật khẩu chưa đáp ứng đủ yêu cầu bảo mật.'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }

    setLoading(true);
    try {
      await UserModel.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Link không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: '#f7f5f2', border: '1px solid #eee9e2',
    borderRadius: '8px', padding: '11px 14px', color: '#1e1919',
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: '#f7f5f2' }}>

      {/* LEFT */}
      <section
        className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: '#1e1919' }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <DropboxMark size={22} color="#0061fe" />
          <span className="font-semibold text-sm" style={{ color: '#f7f5f2', letterSpacing: '-0.01em' }}>MVC Warehouse</span>
        </div>
        <div className="relative z-10 max-w-sm">
          <p className="text-xs font-medium uppercase mb-6" style={{ color: '#716b61', letterSpacing: '0.08em' }}>Bảo mật tài khoản</p>
          <h1 style={{ color: '#f7f5f2', fontSize: '36px', fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Tạo mật khẩu<br />mới.
          </h1>
          <p style={{ color: '#716b61', fontSize: '14px', lineHeight: 1.7, marginTop: '20px' }}>
            Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ in hoa, chữ số và ký tự đặc biệt. Sau khi đặt lại thành công, bạn sẽ được chuyển về trang đăng nhập.
          </p>
        </div>
        <p className="text-xs relative z-10" style={{ color: '#3d3633' }}>© 2024 MVC Warehouse Management System</p>
      </section>

      {/* RIGHT */}
      <section className="flex items-center justify-center px-8 py-12" style={{ background: '#f7f5f2' }}>
        <div className="w-full max-w-[400px]">

          <div className="lg:hidden flex items-center gap-3 mb-10">
            <DropboxMark size={22} color="#0061fe" />
            <span className="font-semibold text-sm" style={{ color: '#1e1919' }}>MVC Warehouse</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #eee9e2', borderRadius: '12px', padding: '36px' }}>

            {success ? (
              /* ── Thành công ── */
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                    <CheckCircle className="w-7 h-7" style={{ color: '#16a34a' }} />
                  </div>
                </div>
                <h2 style={{ color: '#1e1919', fontSize: '22px', fontWeight: 500, margin: '0 0 10px' }}>Mật khẩu đã được đặt lại!</h2>
                <p style={{ color: '#716b61', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Bạn sẽ được chuyển về trang đăng nhập trong giây lát...
                </p>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  style={{ background: '#1e1919', color: '#ffffff', borderRadius: '10px', padding: '12px 24px', textDecoration: 'none' }}
                >
                  <ArrowLeft className="w-4 h-4" /> Đăng nhập ngay
                </Link>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div className="mb-7">
                  <p className="text-[11px] font-medium uppercase mb-2" style={{ color: '#b8b2aa', letterSpacing: '0.07em' }}>Bảo mật tài khoản</p>
                  <h2 style={{ color: '#1e1919', fontSize: '26px', fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                    Tạo mật khẩu mới
                  </h2>
                  <p className="mt-1.5 text-sm" style={{ color: '#716b61' }}>
                    Nhập mật khẩu mới cho tài khoản của bạn.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 px-4 py-3 text-sm flex items-start gap-2.5"
                    style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: '#716b61', letterSpacing: '0.05em' }}>
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setError(''); }}
                        placeholder="Tối thiểu 8 ký tự"
                        className="w-full text-sm outline-none transition-colors duration-150"
                        style={{ ...inputStyle, paddingRight: '44px' }}
                        onFocus={e => { e.target.style.background='#fff'; e.target.style.borderColor='#1e1919'; }}
                        onBlur={e => { e.target.style.background='#f7f5f2'; e.target.style.borderColor='#eee9e2'; }}
                        disabled={!token}
                      />
                      <button type="button" onClick={() => setShowNew(v => !v)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#b8b2aa' }}>
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password requirements checklist */}
                  {newPassword && (
                    <div style={{ background: '#f7f5f2', border: '1px solid #eee9e2', borderRadius: '8px', padding: '12px 14px' }}
                      className="grid grid-cols-2 gap-1.5">
                      {pwChecks.map(({ id, label, test }) => {
                        const ok = test(newPassword);
                        return (
                          <div key={id} className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: ok ? '#16a34a' : '#b8b2aa', transition: 'color 0.15s' }}>
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

                  {/* Xác nhận mật khẩu */}
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: '#716b61', letterSpacing: '0.05em' }}>
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full text-sm outline-none transition-colors duration-150"
                        style={{
                          ...inputStyle,
                          paddingRight: '44px',
                          ...(confirmPassword && confirmPassword !== newPassword
                            ? { borderColor: '#fca5a5', background: '#fff' }
                            : {})
                        }}
                        onFocus={e => { e.target.style.background='#fff'; if (!confirmPassword || confirmPassword===newPassword) e.target.style.borderColor='#1e1919'; }}
                        onBlur={e => { if (!confirmPassword || confirmPassword===newPassword) { e.target.style.background='#f7f5f2'; e.target.style.borderColor='#eee9e2'; } }}
                        disabled={!token}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#b8b2aa' }}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>Mật khẩu xác nhận không khớp</p>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading || !token || !validatePassword(newPassword) || newPassword !== confirmPassword}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: '#0061fe', borderRadius: '10px', padding: '12px 24px' }}
                      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0052d9'; }}
                      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0061fe'; }}
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Lock className="w-4 h-4" /><span>Đặt lại mật khẩu</span></>
                      }
                    </button>
                  </div>
                </form>

                <div className="mt-5 text-center">
                  <Link to="/forgot-password" className="text-sm transition-colors flex items-center justify-center gap-1.5"
                    style={{ color: '#716b61' }}
                    onMouseEnter={e => e.currentTarget.style.color='#1e1919'}
                    onMouseLeave={e => e.currentTarget.style.color='#716b61'}>
                    <ArrowLeft className="w-3.5 h-3.5" /> Gửi lại link mới
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
