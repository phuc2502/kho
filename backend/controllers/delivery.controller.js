import { Delivery, DeliveryItem } from '../models/delivery.model.js';
import { DeliveryRequest } from '../models/deliveryRequest.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { Customer } from '../models/customer.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { StockCard } from '../models/stockCard.model.js';

// Helper: lấy phiếu xuất với đầy đủ thông tin liên quan
const findDeliveryFull = (id) => Delivery.findByPk(id, {
  include: [
    { model: Customer, as: 'customer', attributes: ['_id', 'code', 'name', 'phone', 'address'] },
    { model: User, as: 'createdByUser', attributes: ['username', 'fullName', 'role'] },
    {
      model: DeliveryItem,
      as: 'items',
      include: [
        { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
        { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
      ]
    },
    { model: DeliveryRequest, as: 'fromRequest', attributes: ['_id', 'code', 'status'] }
  ]
});

// Helper: lấy productId và warehouseNodeId an toàn (tránh lỗi field-aliasing)
const getItemIds = (item) => ({
  productId: item.get('productId') ?? item.dataValues?.product,
  nodeId:    item.get('warehouseNodeId') ?? item.dataValues?.warehouseNode,
});

// Helper: cập nhật tồn kho dùng raw SQL (tránh field-aliasing issue)
const reserveStock = async (productId, nodeId, qty, t) => {
  await sequelize.query(
    'UPDATE Inventories SET reservedQty = reservedQty + ? WHERE `product` = ? AND `warehouseNode` = ?',
    { replacements: [qty, productId, nodeId], transaction: t }
  );
};
const releaseStock = async (productId, nodeId, qty, t) => {
  await sequelize.query(
    'UPDATE Inventories SET reservedQty = GREATEST(0, reservedQty - ?) WHERE `product` = ? AND `warehouseNode` = ?',
    { replacements: [qty, productId, nodeId], transaction: t }
  );
};

// ── GET /api/v1/deliveries ───────────────────────────────────────
export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['_id', 'code', 'name'] },
        { model: User, as: 'createdByUser', attributes: ['username', 'fullName', 'role'] },
        {
          model: DeliveryItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        },
        { model: DeliveryRequest, as: 'fromRequest', attributes: ['_id', 'code', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(deliveries);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/deliveries ──────────────────────────────────────
export const createDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customerId, tenKhachHang, note, items, requestId } = req.body;

    // Giải quyết tên khách hàng: ưu tiên customerId
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

    if (!resolvedName) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng chọn hoặc nhập tên khách hàng' });
    }
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Phiếu xuất phải có ít nhất 1 sản phẩm' });
    }

    const count = await Delivery.count();
    const code = `DL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    let totalAmount = 0;
    const mappedItems = [];
    for (const item of items) {
      const product = await Product.findByPk(item.product, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ message: `Sản phẩm ID ${item.product} không tồn tại` });
      }
      totalAmount += Number(item.quantity) * Number(item.price);
      mappedItems.push({
        productId:       item.product,
        quantity:        Number(item.quantity),
        price:           Number(item.price),
        warehouseNodeId: item.warehouseNode
      });
    }

    const delivery = await Delivery.create({
      code,
      customerId:    resolvedCustomerId,
      tenKhachHang:  resolvedName,
      note:          note?.trim() || null,
      totalAmount,
      createdByUserId: req.user._id,
      status: 'preparing',
      requestId: requestId || null
    }, { transaction: t });

    if (requestId) {
      await DeliveryRequest.update({ status: 'processing' },
        { where: { _id: requestId }, transaction: t });
    }

    for (const mi of mappedItems) {
      await DeliveryItem.create({
        deliveryId:      delivery._id,
        productId:       mi.productId,
        quantity:        mi.quantity,
        price:           mi.price,
        warehouseNodeId: mi.warehouseNodeId
      }, { transaction: t });
    }

    await t.commit();
    const populated = await findDeliveryFull(delivery._id);
    await recordAudit({
      action: 'delivery.create', userId: req.user._id, username: req.user.username,
      entity: 'delivery', entityId: delivery._id,
      payload: { code, totalAmount, itemCount: mappedItems.length }
    });
    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ── PUT /api/v1/deliveries/:id ───────────────────────────────────
export const updateDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { customerId, tenKhachHang, note, items } = req.body;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: DeliveryItem, as: 'items' }]
    });
    if (!delivery) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' }); }
    if (delivery.status !== 'preparing') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể sửa phiếu đang ở trạng thái Đang soạn' });
    }

    if (customerId) {
      const customer = await Customer.findByPk(customerId, { transaction: t });
      if (!customer) { await t.rollback(); return res.status(400).json({ message: 'Khách hàng không tồn tại' }); }
      delivery.customerId = Number(customerId);
      delivery.tenKhachHang = customer.name;
    } else if (tenKhachHang?.trim()) {
      delivery.tenKhachHang = tenKhachHang.trim();
    }
    if (note !== undefined) delivery.note = note?.trim() || null;

    if (items) {
      let totalAmount = 0;
      const mappedItems = [];
      for (const item of items) {
        const product = await Product.findByPk(item.product, { transaction: t });
        if (!product) { await t.rollback(); return res.status(400).json({ message: `Sản phẩm ID ${item.product} không tồn tại` }); }
        totalAmount += Number(item.quantity) * Number(item.price);
        mappedItems.push({ productId: item.product, quantity: Number(item.quantity), price: Number(item.price), warehouseNodeId: item.warehouseNode });
      }
      await DeliveryItem.destroy({ where: { deliveryId: id }, transaction: t });
      for (const mi of mappedItems) {
        await DeliveryItem.create({ deliveryId: id, productId: mi.productId, quantity: mi.quantity, price: mi.price, warehouseNodeId: mi.warehouseNodeId }, { transaction: t });
      }
      delivery.totalAmount = totalAmount;
    }

    await delivery.save({ transaction: t });
    await t.commit();
    const populated = await findDeliveryFull(id);
    await recordAudit({ action: 'delivery.update', userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: Number(id), payload: { code: populated.code } });
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ── PATCH /api/v1/deliveries/:id/submit ─────────────────────────
export const submitDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    if (delivery.status !== 'preparing') return res.status(400).json({ message: 'Chỉ có thể gửi phê duyệt phiếu đang ở trạng thái Đang soạn' });

    await delivery.update({ status: 'draft' });
    await recordAudit({ action: 'delivery.submitForApproval', userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: Number(req.params.id), payload: { code: delivery.code } });
    const populated = await findDeliveryFull(req.params.id);
    res.json({ message: 'Đã gửi phiếu xuất kho để Quản lý phê duyệt', delivery: populated });
  } catch (error) { next(error); }
};

// ── PATCH /api/v1/deliveries/:id/approve ────────────────────────
// Quản lý phê duyệt → GIỮ CHỖ tồn kho ngay lập tức
export const approveDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id, {
      include: [{ model: DeliveryItem, as: 'items' }]
    });
    if (!delivery) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' }); }
    if (delivery.status !== 'draft') { await t.rollback(); return res.status(400).json({ message: 'Chỉ có thể phê duyệt phiếu đang ở trạng thái Chờ phê duyệt' }); }

    // Kiểm tra và giữ chỗ tồn kho khả dụng cho từng sản phẩm
    for (const item of delivery.items) {
      const { productId, nodeId } = getItemIds(item);
      const [rows] = await sequelize.query(
        'SELECT quantity, COALESCE(reservedQty, 0) AS reservedQty FROM Inventories WHERE `product` = ? AND `warehouseNode` = ? LIMIT 1',
        { replacements: [productId, nodeId], transaction: t }
      );
      const available = rows.length > 0 ? (Number(rows[0].quantity) - Number(rows[0].reservedQty)) : 0;
      if (available < item.quantity) {
        const prod = await Product.findByPk(productId, { transaction: t });
        await t.rollback();
        return res.status(400).json({
          message: `Sản phẩm "${prod?.name || 'không xác định'}" không đủ tồn kho khả dụng. (Yêu cầu: ${item.quantity}, Khả dụng: ${available} = Tồn kho: ${rows[0]?.quantity ?? 0} − Giữ chỗ: ${rows[0]?.reservedQty ?? 0})`
        });
      }
    }

    // Giữ chỗ tồn kho
    for (const item of delivery.items) {
      const { productId, nodeId } = getItemIds(item);
      await reserveStock(productId, nodeId, item.quantity, t);
    }

    await delivery.update({ status: 'approved' }, { transaction: t });
    await t.commit();

    await recordAudit({ action: 'delivery.approve', userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: Number(id), payload: { code: delivery.code, message: 'Phê duyệt + giữ chỗ tồn kho thành công' } });
    const populated = await findDeliveryFull(id);
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ── PATCH /api/v1/deliveries/:id/reject ─────────────────────────
export const rejectDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });

    const delivery = await Delivery.findByPk(id);
    if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    if (delivery.status !== 'draft') return res.status(400).json({ message: 'Chỉ có thể từ chối phiếu đang ở trạng thái Chờ phê duyệt' });

    await delivery.update({ status: 'rejected', rejectNote: reason.trim() });
    await recordAudit({ action: 'delivery.reject', userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: Number(id), payload: { code: delivery.code, reason: reason.trim() } });
    const populated = await findDeliveryFull(id);
    res.json(populated);
  } catch (error) { next(error); }
};

// ── PATCH /api/v1/deliveries/:id/ship ───────────────────────────
export const shipDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    if (delivery.status !== 'approved') return res.status(400).json({ message: 'Chỉ có thể xác nhận xuất hàng từ trạng thái "Đã phê duyệt"' });

    await delivery.update({ status: 'shipping' });
    await recordAudit({ action: 'delivery.shipping', userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: Number(req.params.id), payload: { code: delivery.code } });
    const populated = await findDeliveryFull(req.params.id);
    res.json(populated);
  } catch (error) { next(error); }
};

// ── PATCH /api/v1/deliveries/:id/complete ───────────────────────
// Nhân viên kho hoàn tất: trừ tồn kho, giải phóng giữ chỗ, lưu thông tin ký nhận
export const completeDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { signerName, signedAt, signatureNote } = req.body;

    if (!signerName?.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng nhập tên người ký nhận hàng' });
    }

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: DeliveryItem, as: 'items' }]
    });
    if (!delivery) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' }); }
    if (delivery.status !== 'shipping') { await t.rollback(); return res.status(400).json({ message: 'Chỉ có thể hoàn tất phiếu đang ở trạng thái "Đang vận chuyển"' }); }

    // Kiểm tra tồn kho lần cuối trước khi trừ
    for (const item of delivery.items) {
      const { productId, nodeId } = getItemIds(item);
      const [rows] = await sequelize.query(
        'SELECT quantity FROM Inventories WHERE `product` = ? AND `warehouseNode` = ? LIMIT 1',
        { replacements: [productId, nodeId], transaction: t }
      );
      const currentQty = rows.length > 0 ? Number(rows[0].quantity) : 0;
      if (currentQty < item.quantity) {
        const prod = await Product.findByPk(productId, { transaction: t });
        await t.rollback();
        return res.status(400).json({ message: `Sản phẩm "${prod?.name}" không đủ tồn kho. (Yêu cầu: ${item.quantity}, Hiện có: ${currentQty})` });
      }
    }

    // Trừ tồn kho + giải phóng giữ chỗ + ghi Thẻ kho
    const stockDeductions = [];
    let currentCardCount = await StockCard.count({ transaction: t });

    for (const item of delivery.items) {
      const { productId, nodeId } = getItemIds(item);

      // Dùng raw SQL để tránh field-aliasing và cập nhật cả hai cột trong 1 lệnh
      await sequelize.query(
        `UPDATE Inventories
         SET quantity    = quantity - ?,
             reservedQty = GREATEST(0, reservedQty - ?)
         WHERE \`product\` = ? AND \`warehouseNode\` = ?`,
        { replacements: [item.quantity, item.quantity, productId, nodeId], transaction: t }
      );

      const [afterRows] = await sequelize.query(
        'SELECT quantity FROM Inventories WHERE `product` = ? AND `warehouseNode` = ? LIMIT 1',
        { replacements: [productId, nodeId], transaction: t }
      );
      const afterQty  = afterRows.length > 0 ? Number(afterRows[0].quantity) : 0;
      const beforeQty = afterQty + Number(item.quantity);

      const prod = await Product.findByPk(productId, { transaction: t });
      const node = await WarehouseNode.findByPk(nodeId, { transaction: t });
      stockDeductions.push({ productId, sku: prod?.sku, productName: prod?.name, warehouseNode: node?.code, deductedQty: item.quantity, beforeQty, afterQty });

      currentCardCount++;
      const scCode = `TK-${new Date().getFullYear()}-${String(currentCardCount).padStart(5, '0')}`;
      await StockCard.create({
        code: scCode, productId, warehouseNodeId: nodeId,
        refCode: delivery.code, type: 'export',
        qtyBefore: beforeQty, qtyChange: -Number(item.quantity), qtyAfter: afterQty,
        note: `Xuất kho theo phiếu ${delivery.code} – Người nhận: ${signerName.trim()}`,
        recordedAt: new Date(), createdByUserId: req.user._id
      }, { transaction: t });
    }

    // Lưu thông tin ký nhận và hoàn tất phiếu
    await delivery.update({
      status:        'completed',
      signerName:    signerName.trim(),
      signedAt:      signedAt ? new Date(signedAt) : new Date(),
      signatureNote: signatureNote?.trim() || null
    }, { transaction: t });

    // Tự động hoàn tất yêu cầu xuất kho liên kết
    if (delivery.requestId) {
      await DeliveryRequest.update({ status: 'completed' }, { where: { _id: delivery.requestId }, transaction: t });
    }

    await t.commit();
    await recordAudit({ action: 'delivery.complete', userId: req.user._id, username: req.user.username, entity: 'delivery', entityId: Number(id), payload: { code: delivery.code, signerName: signerName.trim(), deductions: stockDeductions } });

    const populated = await findDeliveryFull(id);
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
