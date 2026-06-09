import React, { useState, useEffect } from 'react';
import { UserModel } from '../models/user.model.js';
import toast from 'react-hot-toast';
import { Shield, Key, Trash, UserPlus, X } from 'lucide-react';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('Staff');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for creating a new user
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Staff');

  const systemPermissions = [
    {
      group: 'Sản phẩm & Danh mục',
      items: [
        { key: 'product:read', label: 'Xem sản phẩm' },
        { key: 'product:create', label: 'Thêm sản phẩm' },
        { key: 'product:update', label: 'Sửa sản phẩm' },
        { key: 'product:delete', label: 'Xóa sản phẩm' },
        { key: 'category:read', label: 'Xem danh mục' },
        { key: 'category:create', label: 'Thêm danh mục' },
        { key: 'category:update', label: 'Sửa danh mục' },
        { key: 'category:delete', label: 'Xóa danh mục' }
      ]
    },
    {
      group: 'Cấu trúc Kho & Đối tác',
      items: [
        { key: 'warehouse:read', label: 'Xem sơ đồ kho' },
        { key: 'warehouse:create', label: 'Tạo sơ đồ kho' },
        { key: 'warehouse:update', label: 'Sửa sơ đồ kho' },
        { key: 'warehouse:delete', label: 'Xóa sơ đồ kho' },
        { key: 'partner:read', label: 'Xem đối tác' },
        { key: 'partner:create', label: 'Thêm đối tác' },
        { key: 'partner:update', label: 'Sửa đối tác' },
        { key: 'partner:delete', label: 'Xóa đối tác' }
      ]
    },
    {
      group: 'Vận hành Nhập & Xuất',
      items: [
        { key: 'receipt:read', label: 'Xem phiếu nhập' },
        { key: 'receipt:create', label: 'Tạo phiếu nhập' },
        { key: 'receipt:update', label: 'Sửa phiếu nhập' },
        { key: 'receipt:approve', label: 'Duyệt phiếu nhập (Duyệt/Hoàn tất)' },
        { key: 'delivery:read', label: 'Xem phiếu xuất' },
        { key: 'delivery:create', label: 'Tạo phiếu xuất' },
        { key: 'delivery:update', label: 'Sửa phiếu xuất' },
        { key: 'delivery:approve', label: 'Duyệt phiếu xuất (Duyệt/Hoàn tất)' }
      ]
    },
    {
      group: 'Kiểm kê & Điều chỉnh',
      items: [
        { key: 'stocktake:read', label: 'Xem phiếu kiểm kê' },
        { key: 'stocktake:create', label: 'Tạo/Sửa phiếu kiểm kê' },
        { key: 'adjustment:read', label: 'Xem phiếu điều chỉnh' },
        { key: 'adjustment:create', label: 'Tạo phiếu điều chỉnh' },
        { key: 'adjustment:approve', label: 'Duyệt phiếu điều chỉnh' },
        { key: 'incident:read', label: 'Xem báo cáo sự cố' },
        { key: 'incident:create', label: 'Tạo/Sửa báo cáo sự cố' }
      ]
    },
    {
      group: 'Báo cáo & Hệ thống',
      items: [
        { key: 'inventory:read', label: 'Xem tồn kho thực tế' },
        { key: 'user:manage', label: 'Quản lý tài khoản & Phân quyền' },
        { key: 'audit:read', label: 'Xem nhật ký hoạt động' }
      ]
    }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UserModel.getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách tài khoản: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedPermissions(user.permissions || []);
  };

  const handlePermissionChange = (permKey) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await UserModel.updatePermissions(selectedUser._id, selectedRole, selectedPermissions);
      toast.success(`Đã cập nhật quyền cho tài khoản ${selectedUser.username}`);
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      toast.error('Cập nhật thất bại: ' + error.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài khoản');
      return;
    }

    try {
      await UserModel.register(newUsername, newEmail, newPassword, newRole);
      toast.success('Đã tạo tài khoản thành công!');
      setShowAddModal(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('Staff');
      fetchUsers();
    } catch (error) {
      toast.error('Tạo tài khoản thất bại: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) return;
    try {
      await UserModel.deleteUser(userId);
      toast.success('Đã xóa tài khoản thành công');
      fetchUsers();
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error('Không thể xóa tài khoản: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh sách tài khoản hệ thống</h2>
          <p className="text-sm text-slate-500">Quản lý các tài khoản nhân viên và gán quyền thao tác chi tiết</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all-300 shadow-md shadow-primary-500/10"
        >
          <UserPlus className="w-4 h-4" />
          Tạo tài khoản mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Tài khoản thành viên</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
              <p className="mt-2">Đang tải danh sách tài khoản...</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map(u => (
                <div
                  key={u._id}
                  className={`p-6 flex justify-between items-center transition-colors cursor-pointer hover:bg-slate-50/80 ${
                    selectedUser?._id === u._id ? 'bg-primary-50/30' : ''
                  }`}
                  onClick={() => handleSelectUser(u)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{u.username}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{u.email}</p>
                    <p className="text-[11px] text-slate-400">
                      Quyền gán: {u.role === 'Admin' ? 'Toàn quyền (Bypass)' : `${u.permissions?.length || 0} chức năng`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSelectUser(u)}
                      className="p-2 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors"
                      title="Phân quyền chi tiết"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-2 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-600 transition-colors"
                      title="Xóa tài khoản"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center gap-2 text-slate-800">
            <Shield className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold">Bảng Phân Quyền Chi Tiết</h3>
          </div>

          {selectedUser ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-400">Đang thiết lập cho tài khoản</p>
                <h4 className="font-bold text-slate-900 text-lg">{selectedUser.username}</h4>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vai trò chính (Role)</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                >
                  <option value="Admin">Admin (Bypass phân quyền)</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {selectedRole === 'Admin' ? (
                <div className="bg-purple-50 text-purple-700 p-4 rounded-xl text-xs leading-relaxed border border-purple-100">
                  ⚠️ <strong>Lưu ý:</strong> Tài khoản vai trò <strong>Admin</strong> mặc định có tất cả quyền hạn trong hệ thống. Bạn không cần thiết lập mảng quyền chi tiết cho vai trò này.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {systemPermissions.map(group => (
                    <div key={group.group} className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{group.group}</h5>
                      <div className="space-y-1.5 pl-1">
                        {group.items.map(item => (
                          <label key={item.key} className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(item.key)}
                              onChange={() => handlePermissionChange(item.key)}
                              className="w-4.5 h-4.5 rounded border-slate-300 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                            />
                            <span className="text-sm text-slate-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSavePermissions}
                  className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-primary-500/10"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Chọn một tài khoản từ danh sách bên trái để tiến hành gán quyền chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Tạo tài khoản mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên đăng nhập</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="Nhập mật khẩu ban đầu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vai trò (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
