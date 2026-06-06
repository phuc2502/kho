import React, { useState } from 'react';
import { useAuth } from '../controllers/auth.context.jsx';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export const LoginPage = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await login(emailOrUsername, password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <Toaster position="top-right" />
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-slate-700/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-500 text-4xl mb-4">
            📦
          </div>
          <h2 className="text-2xl font-bold text-white">Hệ thống Quản lý Kho</h2>
          <p className="text-slate-400 text-sm mt-1">Đăng nhập để tiếp tục làm việc</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Tên đăng nhập hoặc Email</label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Nhập tên đăng nhập hoặc email"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-semibold py-3 px-4 rounded-xl transition-all-300 transform active:scale-95 flex items-center justify-center shadow-lg shadow-primary-500/20"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Tài khoản mẫu: admin@wms.local / admin_password_123</p>
        </div>
      </div>
    </div>
  );
};
