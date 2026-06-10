import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/auth.context.jsx';
import { Eye, EyeOff, Lock, AlertCircle, ArrowRight } from 'lucide-react';

// ── Dropbox-style brand mark ─────────────────────────────────────
const DropboxMark = ({ size = 24, color = '#0061fe' }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 40 36" fill="none">
    <path d="M20 6.5L10 13 20 19.5 10 26l-10-6.5L10 13 0 6.5 10 0z" fill={color}/>
    <path d="M20 6.5L30 0l10 6.5L30 13l10 6.5-10 6.5-10-6.5L30 13z" fill={color}/>
    <path d="M10 27.85L20 21.35l10 6.5-10 6.5z" fill={color}/>
  </svg>
);

const FEATURES = [
  'Theo dõi tồn kho thời gian thực',
  'Phiếu nhập / xuất đa kho',
  'Kiểm kê và điều chỉnh tồn kho',
  'Phân quyền chi tiết theo vai trò',
];

export const LoginPage = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword]               = useState('');
  const [rememberMe, setRememberMe]           = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [locked, setLocked]                   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLocked(false);
    if (!emailOrUsername || !password) {
      setError('Vui lòng điền đầy đủ thông tin đăng nhập.');
      return;
    }
    setLoading(true);
    try {
      await login(emailOrUsername, password, rememberMe);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      if (err.status === 423) setLocked(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Cream Paper canvas */
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: '#f7f5f2' }}>

      {/* ── LEFT — Warm editorial panel ──────────────────────── */}
      <section
        className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: '#1e1919' }}
      >
        {/* Warm grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Wordmark */}
        <div className="flex items-center gap-3 relative z-10">
          <DropboxMark size={22} color="#0061fe" />
          <span
            className="font-semibold text-sm"
            style={{ color: '#f7f5f2', letterSpacing: '-0.01em' }}
          >
            MVC Warehouse
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-sm">
          {/* Eyebrow */}
          <p
            className="text-xs font-medium uppercase mb-6"
            style={{ color: '#716b61', letterSpacing: '0.08em' }}
          >
            Hệ thống quản lý kho
          </p>

          <h1
            className="mb-5"
            style={{
              color:       '#f7f5f2',
              fontSize:    '38px',
              fontWeight:  500,
              lineHeight:  1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Quản lý kho<br />thông minh<br />&amp; hiệu quả.
          </h1>

          <p style={{ color: '#716b61', fontSize: '15px', lineHeight: 1.7, fontWeight: 400 }}>
            Theo dõi hàng hóa, phiếu nhập xuất, kiểm kê và sơ đồ kho trong một giao diện duy nhất.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-2.5">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ background: '#0061fe' }}
                />
                <span style={{ color: '#9e9890', fontSize: '14px', fontWeight: 400 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs relative z-10" style={{ color: '#3d3633' }}>
          © 2024 MVC Warehouse Management System
        </p>
      </section>

      {/* ── RIGHT — Form ──────────────────────────────────────── */}
      <section
        className="flex items-center justify-center px-8 py-12"
        style={{ background: '#f7f5f2' }}
      >
        <div className="w-full max-w-[400px]">

          {/* Mobile wordmark */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <DropboxMark size={22} color="#0061fe" />
            <span className="font-semibold text-sm" style={{ color: '#1e1919', letterSpacing: '-0.01em' }}>
              MVC Warehouse
            </span>
          </div>

          {/* Card — Pure White on Cream */}
          <div
            style={{
              background:   '#ffffff',
              border:       '1px solid #eee9e2',
              borderRadius: '12px',
              padding:      '36px',
            }}
          >
            {/* Heading */}
            <div className="mb-7">
              <p
                className="text-[11px] font-medium uppercase mb-2"
                style={{ color: '#b8b2aa', letterSpacing: '0.07em' }}
              >
                Quản trị hệ thống
              </p>
              <h2
                style={{
                  color:         '#1e1919',
                  fontSize:      '26px',
                  fontWeight:    500,
                  lineHeight:    1.3,
                  letterSpacing: '-0.01em',
                }}
              >
                Đăng nhập
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: '#716b61', fontWeight: 400 }}>
                Dành cho nhân viên và quản lý kho hàng.
              </p>
            </div>

            {/* Error / lockout */}
            {error && (
              <div
                className="mb-5 px-4 py-3 text-sm flex items-start gap-2.5"
                style={locked
                  ? { background: '#fff8f0', color: '#92400e', border: '1px solid #fde68a', borderRadius: '8px' }
                  : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px' }
                }
              >
                {locked
                  ? <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                  : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                }
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Username */}
              <div>
                <label
                  className="block text-xs font-medium uppercase mb-2"
                  style={{ color: '#716b61', letterSpacing: '0.05em' }}
                >
                  Email công ty
                </label>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={e => { setEmailOrUsername(e.target.value); setError(''); setLocked(false); }}
                  autoComplete="email"
                  placeholder="ten.nhanvien@fositek.vn"
                  className="w-full text-sm outline-none transition-colors duration-150"
                  style={{
                    background:   '#f7f5f2',
                    border:       '1px solid #eee9e2',
                    borderRadius: '8px',
                    padding:      '11px 14px',
                    color:        '#1e1919',
                  }}
                  onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#1e1919'; }}
                  onBlur={e  => { e.target.style.background = '#f7f5f2'; e.target.style.borderColor = '#eee9e2'; }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-xs font-medium uppercase mb-2"
                  style={{ color: '#716b61', letterSpacing: '0.05em' }}
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); setLocked(false); }}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="w-full text-sm outline-none transition-colors duration-150"
                    style={{
                      background:   '#f7f5f2',
                      border:       '1px solid #eee9e2',
                      borderRadius: '8px',
                      padding:      '11px 44px 11px 14px',
                      color:        '#1e1919',
                    }}
                    onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#1e1919'; }}
                    onBlur={e  => { e.target.style.background = '#f7f5f2'; e.target.style.borderColor = '#eee9e2'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#b8b2aa' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#716b61'}
                    onMouseLeave={e => e.currentTarget.style.color = '#b8b2aa'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between pt-0.5">
                <label
                  className="flex items-center gap-2 text-sm cursor-pointer select-none"
                  style={{ color: '#716b61' }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: '#0061fe' }}
                  />
                  Ghi nhớ đăng nhập
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm transition-colors"
                  style={{ color: '#0061fe', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0052d9'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0061fe'}
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit — Dropbox Blue filled button, 16px radius */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:   '#0061fe',
                    borderRadius: '16px',
                    padding:      '12px 24px',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0052d9'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0061fe'; }}
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><span>Đăng nhập</span><ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </form>
          </div>

          {/* Demo hint */}
          <p className="mt-5 text-center text-xs" style={{ color: '#b8b2aa' }}>
            Demo:{' '}
            <span className="font-mono" style={{ color: '#716b61' }}>admin@fositek.vn</span>
            {' / '}
            <span className="font-mono" style={{ color: '#716b61' }}>admin123</span>
          </p>
        </div>
      </section>
    </div>
  );
};
