import React, { useState, useEffect } from 'react';
import { PartnerModel } from '../models/partner.model.js';
import { PermissionGuard } from '../components/PermissionGuard.jsx';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, Phone, Mail, MapPin, X } from 'lucide-react';

export const PartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('supplier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await PartnerModel.getAll(filterType);
      setPartners(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đối tác: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [filterType]);

  const openAddPartner = () => {
    setEditingPartner(null);
    setName('');
    setType('supplier');
    setEmail('');
    setPhone('');
    setAddress('');
    setShowModal(true);
  };

  const openEditPartner = (p) => {
    setEditingPartner(p);
    setName(p.name);
    setType(p.type);
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setAddress(p.address || '');
    setShowModal(true);
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    if (!name || !type) {
      toast.error('Tên đối tác và phân loại là bắt buộc');
      return;
    }

    const payload = { name, type, email, phone, address };

    try {
      if (editingPartner) {
        await PartnerModel.update(editingPartner._id, payload);
        toast.success('Đã cập nhật thông tin đối tác thành công');
      } else {
        await PartnerModel.create(payload);
        toast.success('Đã thêm đối tác mới thành công');
      }
      setShowModal(false);
      fetchPartners();
    } catch (error) {
      toast.error('Lỗi khi lưu đối tác: ' + error.message);
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đối tác này không?')) return;
    try {
      await PartnerModel.delete(id);
      toast.success('Đã xóa đối tác thành công');
      fetchPartners();
    } catch (error) {
      toast.error('Không thể xóa đối tác: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-primary-500"
        >
          <option value="">Tất cả đối tác</option>
          <option value="supplier">Nhà cung cấp (Supplier)</option>
          <option value="customer">Khách hàng (Customer)</option>
        </select>

        <PermissionGuard permission="partner:create">
          <button
            onClick={openAddPartner}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            Thêm đối tác mới
          </button>
        </PermissionGuard>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          <p className="mt-2">Đang tải danh sách đối tác...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">Chưa có thông tin đối tác nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map(p => (
            <div key={p._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-lg leading-tight">{p.name}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    p.type === 'supplier'
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    {p.type === 'supplier' ? 'Nhà cung cấp' : 'Khách hàng'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{p.phone || 'Không có sđt'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{p.email || 'Không có email'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span className="line-clamp-2">{p.address || 'Không có địa chỉ'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end gap-2">
                <PermissionGuard permission="partner:update">
                  <button
                    onClick={() => openEditPartner(p)}
                    className="p-1.5 bg-slate-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                </PermissionGuard>
                <PermissionGuard permission="partner:delete">
                  <button
                    onClick={() => handleDeletePartner(p._id)}
                    className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-600 transition-colors text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">
                {editingPartner ? 'Sửa thông tin đối tác' : 'Thêm đối tác mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePartner} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên đối tác *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="Ví dụ: Công ty TNHH Thành Đạt"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phân loại *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  >
                    <option value="supplier">Nhà cung cấp (Supplier)</option>
                    <option value="customer">Khách hàng (Customer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    placeholder="Ví dụ: 0981234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Địa chỉ Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500"
                  placeholder="example@partner.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Địa chỉ liên hệ</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3.5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Địa chỉ số nhà, quận huyện, tỉnh thành..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-primary-500/10"
                >
                  {editingPartner ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
