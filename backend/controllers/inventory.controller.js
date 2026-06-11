import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { WarehouseNode } from '../models/warehouseNode.model.js';

export const getInventory = async (req, res, next) => {
  try {
    const { productId, warehouseNodeId } = req.query;
    
    const filter = {};
    if (productId) filter.productId = productId;
    if (warehouseNodeId) filter.warehouseNodeId = warehouseNodeId;

    const stock = await Inventory.findAll({
      where: filter,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['_id', 'sku', 'name', 'description', 'priceIn', 'priceOut', 'unit'],
          include: [{ model: Category, as: 'category', attributes: ['name'] }]
        },
        {
          model: WarehouseNode,
          as: 'warehouseNode',
          attributes: ['_id', 'name', 'code', 'type', 'parentId'],
          include: [
            {
              model: WarehouseNode,
              as: 'parent',
              attributes: ['name', 'code', 'type']
            }
          ]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(stock);
  } catch (error) {
    next(error);
  }
};
