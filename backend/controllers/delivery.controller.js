import { Delivery, DeliveryItem } from '../models/delivery.model.js';
import { DeliveryRequest } from '../models/deliveryRequest.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { StockCard } from '../models/stockCard.model.js';

// Helper: lấy phiếu xuất với đầy đủ thông tin liên quan
const findDeliveryFull = (id) => Delivery.findByPk(id, {
  include: [
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

// ── GET /api/v1/deliveries ───────────────────────────────────────
export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.findAll({
      include: [
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
// Kế toán kho lập phiếu xuất nháp (có thể từ yêu cầu xuất kho)
export const createDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { tenKhachHang, items, requestId } = req.body;

    if (!tenKhachHang || !tenKhachHang.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Tên khách hàng là bắt buộc' });
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
      const product = await Product.findByPk(item.product);
      if (!product) {
        await t.rollback();
        return res.status(400).json({ message: `Sản phẩm với ID ${item.product} không tồn tại` });
      }
      totalAmount += Number(item.quantity) * Number(item.price);
      mappedItems.push({
        productId: item.product,
        quantity: Number(item.quantity),
        price: Number(item.price),
        warehouseNodeId: item.warehouseNode
      });
    }

    const delivery = await Delivery.create({
      code,
      tenKhachHang: tenKhachHang.trim(),
      totalAmount,
      createdByUserId: req.user._id,
      status: 'preparing',
      requestId: requestId || null
    }, { transaction: t });

    // Nếu tạo từ yêu cầu → đánh dấu yêu cầu đang xử lý
    if (requestId) {
      await DeliveryRequest.update(
        { status: 'processing' },
        { where: { _id: requestId }, transaction: t }
      );
    }

    for (const mappedItem of mappedItems) {
      await DeliveryItem.create({
        deliveryId: delivery._id,
        productId: mappedItem.productId,
        quantity: mappedItem.quantity,
        price: mappedItem.price,
        warehouseNodeId: mappedItem.warehouseNodeId
      }, { transaction: t });
    }

    await t.commit();

    const populated = await findDeliveryFull(delivery._id);

    await recordAudit({
      action: 'delivery.create',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: delivery._id,
      payload: { code, totalAmount, itemCount: mappedItems.length }
    });

    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ── PUT /api/v1/deliveries/:id ───────────────────────────────────
// Kế toán sửa nội dung phiếu (chỉ khi trạng thái draft)
export const updateDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { tenKhachHang, items } = req.body;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: DeliveryItem, as: 'items' }]
    });
    if (!delivery) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    }
    if (delivery.status !== 'preparing') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể sửa nội dung phiếu xuất kho khi đang ở trạng thái Đang soạn' });
    }

    if (tenKhachHang && tenKhachHang.trim()) delivery.tenKhachHang = tenKhachHang.trim();

    if (items) {
      let totalAmount = 0;
      const mappedItems = [];
      for (const item of items) {
        const product = await Product.findByPk(item.product);
        if (!product) {
          await t.rollback();
          return res.status(400).json({ message: `Sản phẩm với ID ${item.product} không tồn tại` });
        }
        totalAmount += Number(item.quantity) * Number(item.price);
        mappedItems.push({
          productId: item.product,
          quantity: Number(item.quantity),
          price: Number(item.price),
          warehouseNodeId: item.warehouseNode
        });
      }

      await DeliveryItem.destroy({ where: { deliveryId: id }, transaction: t });

      for (const mappedItem of mappedItems) {
        await DeliveryItem.create({
          deliveryId: id,
          productId: mappedItem.productId,
          quantity: mappedItem.quantity,
          price: mappedItem.price,
          warehouseNodeId: mappedItem.warehouseNodeId
        }, { transaction: t });
      }

      delivery.totalAmount = totalAmount;
    }

    await delivery.save({ transaction: t });
    await t.commit();

    const populated = await findDeliveryFull(id);
    await recordAudit({
      action: 'delivery.update',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: Number(id),
      payload: { code: populated.code }
    });
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

// ── PATCH /api/v1/deliveries/:id/submit ─────────────────────────
// Kế toán gửi phiếu lên cho Quản lý phê duyệt (draft → approved sơ bộ → chờ duyệt)
// Trong thiết kế này draft = chờ phê duyệt, hành động submit là yêu cầu Quản lý xem xét
// Không đổi status model nhưng tạo audit để phân biệt hành động gửi duyệt
export const submitDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id);
    if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    if (delivery.status !== 'preparing') {
      return res.status(400).json({ message: 'Chỉ có thể gửi phê duyệt phiếu đang ở trạng thái Đang soạn' });
    }

    // Chuyển trạng thái sang draft (Chờ phê duyệt) để Quản lý kho xem xét
    await delivery.update({ status: 'draft' });

    await recordAudit({
      action: 'delivery.submitForApproval',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: Number(id),
      payload: { code: delivery.code, message: 'Kế toán gửi phiếu xuất để Quản lý phê duyệt' }
    });

    const populated = await findDeliveryFull(id);
    res.json({ message: 'Đã gửi phiếu xuất kho để Quản lý phê duyệt', delivery: populated });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/deliveries/:id/approve ────────────────────────
// Quản lý kho phê duyệt phiếu xuất (draft → approved)
export const approveDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id);
    if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    if (delivery.status !== 'draft') {
      return res.status(400).json({ message: 'Chỉ có thể phê duyệt phiếu đang ở trạng thái Nháp' });
    }

    await delivery.update({ status: 'approved' });

    await recordAudit({
      action: 'delivery.approve',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: Number(id),
      payload: { code: delivery.code }
    });

    const populated = await findDeliveryFull(id);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/deliveries/:id/reject ─────────────────────────
// Quản lý kho từ chối phiếu xuất (draft → rejected), có ghi nguyên nhân
export const rejectDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
    }

    const delivery = await Delivery.findByPk(id);
    if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    if (delivery.status !== 'draft') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối phiếu đang ở trạng thái Chờ phê duyệt' });
    }

    await delivery.update({ status: 'rejected', rejectNote: reason.trim() });

    await recordAudit({
      action: 'delivery.reject',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: Number(id),
      payload: { code: delivery.code, reason: reason.trim() }
    });

    const populated = await findDeliveryFull(id);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/deliveries/:id/ship ───────────────────────────
// Nhân viên kho xác nhận xuất hàng vật lý (approved → shipping)
// Tương ứng bước: Kiểm hàng → Đóng gói → Xác nhận xuất hàng
export const shipDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findByPk(id);
    if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    if (delivery.status !== 'approved') {
      return res.status(400).json({ message: 'Chỉ có thể xác nhận xuất hàng từ trạng thái "Đã phê duyệt"' });
    }

    await delivery.update({ status: 'shipping' });

    await recordAudit({
      action: 'delivery.shipping',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: Number(id),
      payload: { code: delivery.code, message: 'Nhân viên kho đã bàn giao hàng cho đơn vị vận chuyển' }
    });

    const populated = await findDeliveryFull(id);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/deliveries/:id/complete ───────────────────────
// Nhân viên kho hoàn tất sau khi nhận lại phiếu ký nhận (shipping → completed)
// Hệ thống: trừ tồn kho + lưu lịch sử giao dịch xuất kho chi tiết từng sản phẩm
export const completeDelivery = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: DeliveryItem, as: 'items' }]
    });
    if (!delivery) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu xuất kho' });
    }
    if (delivery.status !== 'shipping') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể hoàn tất phiếu đang ở trạng thái "Đang vận chuyển"' });
    }

    // Kiểm tra tồn kho lần cuối trước khi trừ
    for (const item of delivery.items) {
      const stock = await Inventory.findOne({
        where: { productId: item.productId, warehouseNodeId: item.warehouseNodeId },
        transaction: t
      });
      const currentQty = stock ? stock.quantity : 0;
      if (currentQty < item.quantity) {
        const prod = await Product.findByPk(item.productId, { transaction: t });
        await t.rollback();
        return res.status(400).json({
          message: `Sản phẩm "${prod?.name || 'không xác định'}" không đủ tồn kho tại vị trí chỉ định. (Yêu cầu: ${item.quantity}, Hiện có: ${currentQty})`
        });
      }
    }

    // Trừ tồn kho và ghi lịch sử giao dịch từng sản phẩm
    const stockDeductions = [];
    let currentCardCount = await StockCard.count({ transaction: t });

    for (const item of delivery.items) {
      const stock = await Inventory.findOne({
        where: { productId: item.productId, warehouseNodeId: item.warehouseNodeId },
        transaction: t
      });
      const beforeQty = stock.quantity;
      stock.quantity -= Number(item.quantity);
      await stock.save({ transaction: t });
      const afterQty = stock.quantity;

      const prod = await Product.findByPk(item.productId, { transaction: t });
      const node = await WarehouseNode.findByPk(item.warehouseNodeId, { transaction: t });
      stockDeductions.push({
        productId: item.productId,
        sku: prod?.sku,
        productName: prod?.name,
        warehouseNode: node?.code,
        deductedQty: item.quantity,
        beforeQty,
        afterQty: afterQty
      });

      // Tự động ghi nhận Thẻ kho (Stock Card)
      currentCardCount++;
      const scCode = `TK-${new Date().getFullYear()}-${String(currentCardCount).padStart(5, '0')}`;

      await StockCard.create({
        code: scCode,
        productId: item.productId,
        warehouseNodeId: item.warehouseNodeId,
        refCode: delivery.code,
        type: 'export',
        qtyBefore: beforeQty,
        qtyChange: -Number(item.quantity),
        qtyAfter: afterQty,
        note: `Xuất kho tự động theo phiếu ${delivery.code}`,
        recordedAt: new Date(),
        createdByUserId: req.user._id
      }, { transaction: t });
    }

    // Cập nhật trạng thái phiếu xuất thành hoàn tất
    await delivery.update({ status: 'completed' }, { transaction: t });

    // Tự động cập nhật trạng thái yêu cầu xuất kho liên kết thành completed
    if (delivery.requestId) {
      await DeliveryRequest.update(
        { status: 'completed' },
        { where: { _id: delivery.requestId }, transaction: t }
      );
    }

    await t.commit();

    // Ghi audit log tổng hợp hoàn tất
    await recordAudit({
      action: 'delivery.complete',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: Number(id),
      payload: { code: delivery.code }
    });

    // Ghi audit log chi tiết lịch sử giao dịch xuất kho từng sản phẩm
    await recordAudit({
      action: 'delivery.stock_deducted',
      userId: req.user._id,
      username: req.user.username,
      entity: 'delivery',
      entityId: Number(id),
      payload: {
        code: delivery.code,
        message: 'Hệ thống cập nhật số lượng tồn kho sau xuất hàng',
        deductions: stockDeductions
      }
    });

    const populated = await findDeliveryFull(id);
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
