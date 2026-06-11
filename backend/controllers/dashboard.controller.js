import { Op } from 'sequelize';
import { Inventory }              from '../models/inventory.model.js';
import { Product }                from '../models/product.model.js';
import { SoSerial }               from '../models/soSerial.model.js';
import { Delivery, DeliveryItem } from '../models/delivery.model.js';
import { Receipt,  ReceiptItem  } from '../models/receipt.model.js';
import { WarehouseNode }           from '../models/warehouseNode.model.js';

const LOW_STOCK_THRESHOLD = 20;   // dưới ngưỡng: < 20 đơn vị
const SLOW_DAYS           = 30;   // tồn lâu ngày: chưa xuất quá 30 ngày
const CONSUMPTION_DAYS    = 30;   // tốc độ tiêu thụ: 30 ngày gần nhất
const WARRANTY_DAYS       = 30;   // sắp hết bảo hành: trong 30 ngày tới

/**
 * GET /api/v1/dashboard/stats
 * Trả về dữ liệu cho 5 widget phân tích trang Tổng Quan (Gap 5 v2.0)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const now     = new Date();
    const ms30    = CONSUMPTION_DAYS * 24 * 60 * 60 * 1000;
    const ms_slow = SLOW_DAYS       * 24 * 60 * 60 * 1000;
    const date30Ago   = new Date(now.getTime() - ms30);
    const dateSlowCut = new Date(now.getTime() - ms_slow);

    // ─── 1. TỒN KHO DƯỚI NGƯỠNG ─────────────────────────────────────────────
    // WHERE quantity < LOW_STOCK_THRESHOLD ORDER BY quantity ASC LIMIT 10
    const lowStockRaw = await Inventory.findAll({
      where: { quantity: { [Op.lt]: LOW_STOCK_THRESHOLD } },
      include: [
        { model: Product,       as: 'product',       attributes: ['sku', 'name', 'unit'] },
        { model: WarehouseNode, as: 'warehouseNode',  attributes: ['name', 'code'] },
      ],
      order: [['quantity', 'ASC']],
      limit: 10,
    });

    const lowStock = lowStockRaw.map(inv => ({
      productId:   inv.productId,
      sku:         inv.product?.sku,
      name:        inv.product?.name,
      unit:        inv.product?.unit,
      location:    inv.warehouseNode?.code || inv.warehouseNode?.name,
      quantity:    inv.quantity,
      threshold:   LOW_STOCK_THRESHOLD,
    }));

    // ─── 2. TỐC ĐỘ TIÊU THỤ 30 NGÀY ─────────────────────────────────────────
    // Completed deliveries in last 30 days, group by product, SUM(quantity)
    const recentDlv = await Delivery.findAll({
      where: {
        status:    'completed',
        updatedAt: { [Op.gte]: date30Ago },
      },
      include: [{
        model: DeliveryItem,
        as:    'items',
        include: [{ model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] }],
      }],
    });

    const cMap = {};
    for (const dlv of recentDlv) {
      for (const item of (dlv.items || [])) {
        const pid = item.productId;
        if (!cMap[pid]) cMap[pid] = {
          productId: pid,
          sku:       item.product?.sku,
          name:      item.product?.name,
          unit:      item.product?.unit,
          qty30d:    0,
          orders30d: 0,
        };
        cMap[pid].qty30d    += item.quantity || 0;
        cMap[pid].orders30d += 1;
      }
    }
    const consumption30d = Object.values(cMap)
      .sort((a, b) => b.qty30d - a.qty30d)
      .slice(0, 10);

    // ─── 3. SẮP HẾT BẢO HÀNH ────────────────────────────────────────────────
    // Bảng SoSerial đã có cột Han_bao_hanh (migration v2.0).
    // Lấy các serial có hạn bảo hành trong [NOW, NOW + WARRANTY_DAYS].
    const dateWarrantyEnd = new Date(now.getTime() + WARRANTY_DAYS * 24 * 60 * 60 * 1000);

    const warrantyRaw = await SoSerial.findAll({
      where: {
        Han_bao_hanh: { [Op.between]: [now, dateWarrantyEnd] }
      },
      include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }],
      order: [['Han_bao_hanh', 'ASC']],
      limit: 20,
    });

    const warrantyExpiring = warrantyRaw.map(ss => ({
      serialId:    ss._id,
      serialCode:  ss.Ma_serial,
      productName: ss.product?.name || ss.product?.sku || '—',
      productSku:  ss.product?.sku,
      expiryDate:  ss.Han_bao_hanh,
      daysLeft:    Math.max(0, Math.ceil(
        (new Date(ss.Han_bao_hanh) - now) / (1000 * 60 * 60 * 24)
      )),
    }));

    // ─── 4. HÀNG TỒN LÂU NGÀY ───────────────────────────────────────────────
    // Inventory quantity > 0, updatedAt < (now - SLOW_DAYS), sorted oldest first
    const slowRaw = await Inventory.findAll({
      where: {
        quantity:  { [Op.gt]: 0 },
        updatedAt: { [Op.lt]: dateSlowCut },
      },
      include: [
        { model: Product,       as: 'product',      attributes: ['sku', 'name', 'unit'] },
        { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code'] },
      ],
      order: [['updatedAt', 'ASC']],
      limit: 10,
    });

    const slowMoving = slowRaw.map(inv => ({
      productId:       inv.productId,
      sku:             inv.product?.sku,
      name:            inv.product?.name,
      unit:            inv.product?.unit,
      location:        inv.warehouseNode?.code || inv.warehouseNode?.name,
      quantity:        inv.quantity,
      lastUpdated:     inv.updatedAt,
      daysSinceUpdate: Math.floor((now - new Date(inv.updatedAt)) / (1000 * 60 * 60 * 24)),
    }));

    // ─── 5. TOP 10 SẢN PHẨM XUẤT NHIỀU NHẤT ────────────────────────────────
    // All completed deliveries (all time), group by product, SUM(quantity) DESC
    const allDlv = await Delivery.findAll({
      where: { status: 'completed' },
      include: [{
        model: DeliveryItem,
        as:    'items',
        include: [{ model: Product, as: 'product', attributes: ['_id', 'sku', 'name', 'unit'] }],
      }],
    });

    const t10Map = {};
    for (const dlv of allDlv) {
      for (const item of (dlv.items || [])) {
        const pid = item.productId;
        if (!t10Map[pid]) t10Map[pid] = {
          productId:  pid,
          sku:        item.product?.sku,
          name:       item.product?.name,
          unit:       item.product?.unit,
          totalQty:   0,
          orderCount: 0,
        };
        t10Map[pid].totalQty   += item.quantity || 0;
        t10Map[pid].orderCount += 1;
      }
    }
    const top10Deliveries = Object.values(t10Map)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // ─── Response ─────────────────────────────────────────────────────────────
    res.json({
      lowStock:         { threshold: LOW_STOCK_THRESHOLD, items: lowStock },
      consumption30d:   { days: CONSUMPTION_DAYS, items: consumption30d },
      warrantyExpiring: { days: WARRANTY_DAYS,    items: warrantyExpiring },
      slowMoving:       { days: SLOW_DAYS,        items: slowMoving },
      top10Deliveries:  { items: top10Deliveries },
    });

  } catch (err) {
    next(err);
  }
};
