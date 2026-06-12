import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { UserModel } from '../models/user.model.js';

// ── Dropbox-style brand mark ─────────────────────────────────
const DropboxMark = ({ size = 24, color = '#0061fe' }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 40 36" fill="none">
    <path d="M20 6.5L10 13 20 19.5 10 26l-10-6.5L10 13 0 6.5 10 0z" fill={color}/>
    <path d="M20 6.5L30 0l10 6.5L30 13l10 6.5-10 6.5-10-6.5L30 13z" fill={color}/>
    <path d="M10 27.85L20 21.35l10 6.5-10 6.5z" fill={color}/>
  </svg>
);

export const ForgotPasswordPage = () => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Vui lòng nhập email công ty'); return; }

    setLoading(true);
    try {
      await UserModel.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: '#f7f5f2' }}>

      {/* ── LEFT — Dark editorial panel ──────────────────────── */}
      <section
        className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: '#1e1919' }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <DropboxMark size={22} color="#0061fe" />
          <span className="font-semibold text-sm" style={{ color: '#f7f5f2', letterSpacing: '-0.01em' }}>
            Fositek Warehouse
          </span>
        </div>
        <div className="relative z-10 max-w-sm">
          <p className="text-xs font-medium uppercase mb-6" style={{ color: '#716b61', letterSpacing: '0.08em' }}>
            Khôi phục tài khoản
          </p>
          <h1 style={{ color: '#f7f5f2', fontSize: '36px', fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Đặt lại<br />mật khẩu.
          </h1>
          <p style={{ color: '#716b61', fontSize: '14px', lineHeight: 1.7, marginTop: '20px' }}>
            Nhập email công ty, hệ thống sẽ thông báo cho quản trị viên. Admin sẽ cấp lại mật khẩu và liên hệ với bạn.
          </p>
        </div>
        <p className="text-xs relative z-10" style={{ color: '#3d3633' }}>© 2024 Fositek Warehouse Management System</p>
      </section>

      {/* ── RIGHT — Form ──────────────────────────────────────── */}
      <section className="flex items-center justify-center px-8 py-12" style={{ background: '#f7f5f2' }}>
        <div className="w-full max-w-[400px]">

          {/* Mobile wordmark */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <DropboxMark size={22} color="#0061fe" />
            <span className="font-semibold text-sm" style={{ color: '#1e1919' }}>Fositek Warehouse</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #eee9e2', borderRadius: '12px', padding: '36px' }}>

            {sent ? (
              /* ── Trạng thái đã gửi yêu cầu ── */
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#fff7ed' }}>
                    <CheckCircle className="w-7 h-7" style={{ color: '#ea580c' }} />
                  </div>
                </div>
                <h2 style={{ color: '#1e1919', fontSize: '22px', fontWeight: 500, lineHeight: 1.3, margin: '0 0 10px' }}>
                  Yêu cầu đã được ghi nhận
                </h2>
                <p style={{ color: '#716b61', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Quản trị viên sẽ thấy yêu cầu của bạn và cấp lại mật khẩu mới. Vui lòng chờ liên hệ từ bộ phận quản lý.
                </p>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-150"
                  style={{ background: '#1e1919', color: '#ffffff', borderRadius: '10px', padding: '12px 24px', textDecoration: 'none' }}
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              /* ── Form nhập email ── */
              <>
                <div className="mb-7">
                  <p className="text-[11px] font-medium uppercase mb-2" style={{ color: '#b8b2aa', letterSpacing: '0.07em' }}>
                    Khôi phục tài khoản
                  </p>
                  <h2 style={{ color: '#1e1919', fontSize: '26px', fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                    Quên mật khẩu?
                  </h2>
                  <p className="mt-1.5 text-sm" style={{ color: '#716b61' }}>
                    Nhập email công ty — quản trị viên sẽ được thông báo và cấp lại mật khẩu cho bạn.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 px-4 py-3 text-sm flex items-start gap-2.5"
                    style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: '#716b61', letterSpacing: '0.05em' }}>
                      Email công ty
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="ten.nhanvien@fositek.vn"
                        autoFocus
                        className="w-full text-sm outline-none transition-colors duration-150"
                        style={{ background: '#f7f5f2', border: '1px solid #eee9e2', borderRadius: '8px', padding: '11px 40px 11px 14px', color: '#1e1919' }}
                        onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#1e1919'; }}
                        onBlur={e => { e.target.style.background = '#f7f5f2'; e.target.style.borderColor = '#eee9e2'; }}
                      />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b8b2aa' }} />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: '#0061fe', borderRadius: '10px', padding: '12px 24px' }}
                      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0052d9'; }}
                      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0061fe'; }}
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Mail className="w-4 h-4" /><span>Gửi yêu cầu cấp lại mật khẩu</span></>
                      }
                    </button>
                  </div>
                </form>

                <div className="mt-5 text-center">
                  <Link
                    to="/login"
                    className="text-sm flex items-center justify-center gap-1.5 transition-colors"
                    style={{ color: '#716b61' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1e1919'}
                    onMouseLeave={e => e.currentTarget.style.color = '#716b61'}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
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
