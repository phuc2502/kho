import { Receipt, ReceiptItem } from '../models/receipt.model.js';
import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { Partner } from '../models/partner.model.js';
import { User } from '../models/user.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';
import { sequelize } from '../config/db.js';

export const getReceipts = async (req, res, next) => {
  try {
    const receipts = await Receipt.findAll({
      include: [
        { model: Partner, as: 'partner', attributes: ['name', 'type'] },
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: ReceiptItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(receipts);
  } catch (error) {
    next(error);
  }
};

export const createReceipt = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { partner, items } = req.body;

    const count = await Receipt.count();
    const code = `RC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

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

    const receipt = await Receipt.create({
      code,
      partnerId: partner,
      totalAmount,
      createdByUserId: req.user._id,
      status: 'draft'
    }, { transaction: t });

    for (const mappedItem of mappedItems) {
      await ReceiptItem.create({
        receiptId: receipt._id,
        productId: mappedItem.productId,
        quantity: mappedItem.quantity,
        price: mappedItem.price,
        warehouseNodeId: mappedItem.warehouseNodeId
      }, { transaction: t });
    }

    await t.commit();

    const populated = await Receipt.findByPk(receipt._id, {
      include: [
        { model: Partner, as: 'partner', attributes: ['name', 'type'] },
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: ReceiptItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ]
    });

    res.status(201).json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const updateReceipt = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { partner, items, status } = req.body;

    const receipt = await Receipt.findByPk(id, {
      include: [{ model: ReceiptItem, as: 'items' }]
    });
    if (!receipt) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy phiếu nhập kho' });
    }

    if (receipt.status === 'completed' || receipt.status === 'rejected') {
      await t.rollback();
      return res.status(400).json({ message: 'Không thể sửa phiếu nhập kho đã hoàn tất hoặc bị hủy' });
    }

    if (partner) receipt.partnerId = partner;

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

      await ReceiptItem.destroy({ where: { receiptId: id }, transaction: t });

      for (const mappedItem of mappedItems) {
        await ReceiptItem.create({
          receiptId: id,
          productId: mappedItem.productId,
          quantity: mappedItem.quantity,
          price: mappedItem.price,
          warehouseNodeId: mappedItem.warehouseNodeId
        }, { transaction: t });
      }

      receipt.totalAmount = totalAmount;
    }

    if (status) {
      if (status === 'completed' || status === 'approved') {
        const canApprove = req.user.role === 'Admin' || req.user.permissions.includes('receipt:approve');
        if (!canApprove) {
          await t.rollback();
          return res.status(403).json({ message: 'Bạn không có quyền duyệt phiếu nhập kho' });
        }

        if (status === 'completed' && receipt.status !== 'completed') {
          const itemsToProcess = items ? await ReceiptItem.findAll({ where: { receiptId: id }, transaction: t }) : receipt.items;
          
          for (const item of itemsToProcess) {
            const [inventoryRecord, created] = await Inventory.findOrCreate({
              where: {
                productId: item.productId,
                warehouseNodeId: item.warehouseNodeId
              },
              defaults: {
                quantity: 0
              },
              transaction: t
            });

            inventoryRecord.quantity += Number(item.quantity);
            await inventoryRecord.save({ transaction: t });
          }
        }
      }
      receipt.status = status;
    }

    await receipt.save({ transaction: t });
    await t.commit();

    const populated = await Receipt.findByPk(id, {
      include: [
        { model: Partner, as: 'partner', attributes: ['name', 'type'] },
        { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
        {
          model: ReceiptItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] },
            { model: WarehouseNode, as: 'warehouseNode', attributes: ['name', 'code', 'type'] }
          ]
        }
      ]
    });

    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};
