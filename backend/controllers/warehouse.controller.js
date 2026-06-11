import { WarehouseNode } from '../models/warehouseNode.model.js';

export const getWarehouseNodes = async (req, res, next) => {
  try {
    const nodes = await WarehouseNode.findAll({
      include: [
        {
          model: WarehouseNode,
          as: 'parent',
          attributes: ['_id', 'name', 'code', 'type']
        }
      ],
      order: [['code', 'ASC']]
    });
    res.json(nodes);
  } catch (error) {
    next(error);
  }
};

export const createWarehouseNode = async (req, res, next) => {
  try {
    const { name, code, type, parent } = req.body;

    const codeUpper = code?.toUpperCase();
    const exists = await WarehouseNode.findOne({ where: { code: codeUpper } });
    if (exists) {
      return res.status(400).json({ message: `Mã vị trí ${codeUpper} đã được sử dụng` });
    }

    if (parent) {
      const parentNode = await WarehouseNode.findByPk(parent);
      if (!parentNode) {
        return res.status(400).json({ message: 'Vị trí cha không hợp lệ hoặc không tồn tại' });
      }
    }

    const node = await WarehouseNode.create({
      name,
      code: codeUpper,
      type,
      parentId: parent || null // Mapped field name
    });

    res.status(201).json(node);
  } catch (error) {
    next(error);
  }
};

export const updateWarehouseNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, type, parent } = req.body;

    const node = await WarehouseNode.findByPk(id);
    if (!node) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí kho' });
    }

    if (code) {
      const codeUpper = code.toUpperCase();
      if (codeUpper !== node.code) {
        const exists = await WarehouseNode.findOne({ where: { code: codeUpper } });
        if (exists) {
          return res.status(400).json({ message: `Mã vị trí ${codeUpper} đã được sử dụng` });
        }
        node.code = codeUpper;
      }
    }

    if (name) node.name = name;
    if (type) node.type = type;
    if (parent !== undefined) node.parentId = parent || null;

    await node.save();
    res.json(node);
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouseNode = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if there are child nodes
    const children = await WarehouseNode.findOne({ where: { parentId: id } });
    if (children) {
      return res.status(400).json({ message: 'Không thể xóa vị trí này vì có chứa các vị trí con bên trong' });
    }

    await WarehouseNode.destroy({ where: { _id: id } });
    res.json({ message: 'Xóa vị trí kho thành công' });
  } catch (error) {
    next(error);
  }
};
