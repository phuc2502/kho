import { DeliveryRequest, DeliveryRequestItem } from '../models/deliveryRequest.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';

// ── GET /api/v1/delivery-requests ───────────────────────────────
// Sale: chỉ xem yêu cầu của mình
// Các role khác: xem tất cả
export const getDeliveryRequests = async (req, res, next) => {
  try {
    const where = req.user.role === 'Sale'
      ? { createdByUserId: req.user._id }
      : {};

    const requests = await DeliveryRequest.findAll({
      where,
      include: [
        { model: User, as: 'createdByUser', attributes: ['_id', 'username', 'fullName', 'role'] },
        {
          model: DeliveryRequestItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/delivery-requests/:id ───────────────────────────
export const getDeliveryRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await DeliveryRequest.findByPk(id, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['_id', 'username', 'fullName', 'role'] },
        {
          model: DeliveryRequestItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] }
          ]
        }
      ]
    });

    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });

    // Sale chỉ được xem yêu cầu của mình
    if (req.user.role === 'Sale' && request.createdByUserId !== req.user._id) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/delivery-requests ──────────────────────────────
// Chỉ Sale mới được tạo
export const createDeliveryRequest = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { tenKhachHang, note, items } = req.body;

    if (!tenKhachHang?.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng nhập tên khách hàng' });
    }
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Yêu cầu phải có ít nhất 1 sản phẩm' });
    }

    // Sinh mã yêu cầu: YC-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const countToday = await DeliveryRequest.count({
      where: sequelize.where(
        sequelize.fn('DATE', sequelize.col('createdAt')),
        today.toISOString().slice(0, 10)
      ),
      transaction: t
    });
    const code = `YC-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    // Tính tổng tiền ước tính
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (parseFloat(item.priceEstimate) || 0) * (parseInt(item.quantity) || 0);
    }

    // Tạo yêu cầu
    const request = await DeliveryRequest.create({
      code,
      tenKhachHang: tenKhachHang.trim(),
      note: note?.trim() || null,
      status: 'pending',
      totalAmount,
      createdByUserId: req.user._id
    }, { transaction: t });

    // Tạo items
    for (const item of items) {
      await DeliveryRequestItem.create({
        deliveryRequestId: request._id,
        productId: item.productId,
        quantity: parseInt(item.quantity),
        priceEstimate: parseFloat(item.priceEstimate) || 0
      }, { transaction: t });
    }

    await t.commit();

    await recordAudit({
      userId: req.user._id,
      username: req.user.username,
      action: 'deliveryrequest.create',
      entity: 'deliveryrequest',
      entityId: request._id,
      payload: { code, tenKhachHang: req.body.tenKhachHang }
    });

    // Trả về record đầy đủ
    const full = await DeliveryRequest.findByPk(request._id, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['_id', 'username', 'fullName', 'role'] },
        { model: DeliveryRequestItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] }] }
      ]
    });
    res.status(201).json(full);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ── PATCH /api/v1/delivery-requests/:id/cancel ──────────────────
// Sale huỷ yêu cầu của mình (chỉ khi đang pending)
export const cancelDeliveryRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await DeliveryRequest.findByPk(id);

    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể huỷ yêu cầu đang chờ xử lý' });
    }
    if (req.user.role === 'Sale' && request.createdByUserId !== req.user._id) {
      return res.status(403).json({ message: 'Không có quyền huỷ yêu cầu này' });
    }

    await request.update({ status: 'cancelled' });

    await recordAudit({
      userId: req.user._id,
      username: req.user.username,
      action: 'deliveryrequest.cancel',
      entity: 'deliveryrequest',
      entityId: request._id,
      payload: { code: request.code }
    });

    res.json({ message: 'Đã huỷ yêu cầu', request });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/delivery-requests/:id/status ──────────────────
// Kho/QL cập nhật trạng thái (processing / completed)
export const updateDeliveryRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['processing', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const request = await DeliveryRequest.findByPk(id);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });

    await request.update({ status });

    await recordAudit({
      userId: req.user._id,
      username: req.user.username,
      action: 'deliveryrequest.updateStatus',
      entity: 'deliveryrequest',
      entityId: request._id,
      payload: { code: request.code, newStatus: status }
    });

    res.json(request);
  } catch (error) {
    next(error);
  }
};
