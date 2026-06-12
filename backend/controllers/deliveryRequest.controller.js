import { DeliveryRequest, DeliveryRequestItem } from '../models/deliveryRequest.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Customer } from '../models/customer.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { sendNotification, createNotificationForUser } from '../utils/notification.helper.js';

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
        { model: Customer, as: 'customer', attributes: ['_id', 'code', 'name', 'phone'] },
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
        { model: Customer, as: 'customer', attributes: ['_id', 'code', 'name', 'phone'] },
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
    const { customerId, tenKhachHang, expectedDeliveryDate, note, items } = req.body;

    // --- Giải quyết tên khách hàng ---
    let resolvedName = tenKhachHang?.trim() || '';
    let resolvedCustomerId = customerId ? Number(customerId) : null;

    if (resolvedCustomerId) {
      const customer = await Customer.findByPk(resolvedCustomerId, { transaction: t });
      if (!customer) {
        await t.rollback();
        return res.status(400).json({ message: 'Khách hàng không tồn tại' });
      }
      resolvedName = customer.name;
    }

    // --- Validation dữ liệu đầu vào ---
    if (!resolvedName) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng chọn hoặc nhập tên khách hàng' });
    }
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Yêu cầu phải có ít nhất 1 sản phẩm' });
    }

    // Kiểm tra chi tiết từng item: productId tồn tại, quantity hợp lệ
    for (const item of items) {
      if (!item.productId) {
        await t.rollback();
        return res.status(400).json({ message: 'Mỗi sản phẩm phải có mã sản phẩm hợp lệ' });
      }
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ message: `Sản phẩm với ID ${item.productId} không tồn tại trong hệ thống` });
      }
      if (!item.quantity || parseInt(item.quantity) < 1) {
        await t.rollback();
        return res.status(400).json({ message: `Số lượng sản phẩm "${product.name}" phải lớn hơn 0` });
      }
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

    // Tạo yêu cầu với trạng thái ban đầu là pending
    const request = await DeliveryRequest.create({
      code,
      customerId: resolvedCustomerId,
      tenKhachHang: resolvedName,
      expectedDeliveryDate: expectedDeliveryDate || null,
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
      payload: { code, tenKhachHang: req.body.tenKhachHang, itemCount: items.length }
    });

    // Trả về record đầy đủ
    const full = await DeliveryRequest.findByPk(request._id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['_id', 'code', 'name', 'phone'] },
        { model: User, as: 'createdByUser', attributes: ['_id', 'username', 'fullName', 'role'] },
        { model: DeliveryRequestItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] }] }
      ]
    });
    res.status(201).json(full);

    // Gửi thông báo cho Kế toán kho khi Sale tạo yêu cầu xuất kho (Kế toán kiểm tra tồn kho và lập phiếu xuất)
    sendNotification({
      targetRoles: ['KeToanKho'],
      excludeUserId: req.user._id,
      title: `Yêu cầu xuất kho mới: ${code}`,
      content: `${req.user.fullName || req.user.username} (Sale) vừa gửi yêu cầu xuất kho ${code} cho khách hàng "${resolvedName}" với ${items.length} sản phẩm. Vui lòng kiểm tra tồn kho và xử lý.`,
      type: 'delivery_request',
      refId: request._id
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ── POST /api/v1/delivery-requests/:id/check-stock ───────────────
// Kế toán kho kiểm tra tồn kho trước khi lập phiếu xuất
// - Nếu đủ: trả về danh sách sản phẩm khả dụng, trạng thái yêu cầu giữ nguyên pending
// - Nếu thiếu: cập nhật trạng thái yêu cầu thành insufficient_stock, trả về chi tiết thiếu
export const checkDeliveryRequestStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await DeliveryRequest.findByPk(id, {
      include: [
        {
          model: DeliveryRequestItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] }]
        }
      ]
    });

    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    if (['completed', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ message: 'Không thể kiểm tra yêu cầu đã hoàn thành hoặc đã huỷ' });
    }

    const checkResults = [];
    let allSufficient = true;

    for (const item of request.items) {
      // Tổng tồn kho của sản phẩm này trên tất cả vị trí
      const inventories = await Inventory.findAll({ where: { productId: item.productId } });
      const totalStock = inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
      const sufficient = totalStock >= item.quantity;
      if (!sufficient) allSufficient = false;

      checkResults.push({
        productId: item.productId,
        sku: item.product?.sku,
        productName: item.product?.name,
        requestedQty: item.quantity,
        availableQty: totalStock,
        sufficient
      });
    }

    // Cập nhật trạng thái yêu cầu theo kết quả kiểm tra
    const newStatus = allSufficient ? 'pending' : 'insufficient_stock';
    if (request.status !== newStatus) {
      await request.update({ status: newStatus });
    }

    await recordAudit({
      userId: req.user._id,
      username: req.user.username,
      action: 'deliveryrequest.checkStock',
      entity: 'deliveryrequest',
      entityId: request._id,
      payload: { code: request.code, allSufficient, checkResults }
    });

    res.json({
      requestId: request._id,
      code: request.code,
      status: newStatus,
      allSufficient,
      message: allSufficient
        ? 'Tất cả sản phẩm đủ tồn kho – có thể lập phiếu xuất'
        : 'Một số sản phẩm không đủ tồn kho – yêu cầu tạm dừng',
      items: checkResults
    });
  } catch (error) {
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
    if (!['pending', 'insufficient_stock'].includes(request.status)) {
      return res.status(400).json({ message: 'Chỉ có thể huỷ yêu cầu đang chờ xử lý hoặc tạm dừng' });
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

    // Nếu không phải chính người tạo tự huỷ, thông báo cho người tạo
    if (request.createdByUserId !== req.user._id) {
      createNotificationForUser(request.createdByUserId, {
        title: `Yêu cầu xuất kho ${request.code} đã bị huỷ`,
        content: `${req.user.fullName || req.user.username} đã huỷ yêu cầu xuất kho ${request.code}.`,
        type: 'delivery_request',
        refId: request._id
      });
    }
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/delivery-requests/:id/status ──────────────────
// Kế toán/Quản lý cập nhật trạng thái (processing / completed)
export const updateDeliveryRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Chỉ Kế toán và Quản lý mới được cập nhật trạng thái yêu cầu
    const allowedRoles = ['Admin', 'QuanLyKho', 'KeToanKho'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ Kế toán hoặc Quản lý kho mới có thể cập nhật trạng thái yêu cầu xuất' });
    }

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

    // Gửi thông báo phản hồi cho người tạo yêu cầu (thường là Sale)
    if (request.createdByUserId !== req.user._id) {
      const statusLabels = { processing: 'đang được xử lý', completed: 'đã hoàn tất', cancelled: 'đã bị huỷ' };
      const label = statusLabels[status] || status;
      createNotificationForUser(request.createdByUserId, {
        title: `Yêu cầu xuất kho ${request.code} ${label}`,
        content: `${req.user.fullName || req.user.username} đã cập nhật trạng thái yêu cầu xuất kho ${request.code} sang "${label}".`,
        type: 'delivery_request',
        refId: request._id
      });
    }
  } catch (error) {
    next(error);
  }
};
