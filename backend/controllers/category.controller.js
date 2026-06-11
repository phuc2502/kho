import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { recordAudit } from '../utils/audit.helper.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const exists = await Category.findOne({ where: { name } });
    if (exists) return res.status(400).json({ message: 'Danh mục này đã tồn tại' });

    const category = await Category.create({ name, description });
    await recordAudit({ action: 'category.create', userId: req.user?._id, username: req.user?.username, entity: 'category', entityId: category._id, payload: { name } });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

    if (name && name !== category.name) {
      const exists = await Category.findOne({ where: { name } });
      if (exists) return res.status(400).json({ message: 'Tên danh mục này đã tồn tại' });
      category.name = name;
    }
    if (description !== undefined) category.description = description;

    await category.save();
    await recordAudit({ action: 'category.update', userId: req.user?._id, username: req.user?.username, entity: 'category', entityId: Number(id), payload: { name: category.name } });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

    // Kiểm tra còn sản phẩm nào đang dùng danh mục này không
    const productCount = await Product.count({ where: { categoryId: Number(id) } });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa danh mục "${category.name}" vì còn ${productCount} sản phẩm đang sử dụng. Hãy chuyển các sản phẩm sang danh mục khác trước khi xóa.`
      });
    }

    await Category.destroy({ where: { _id: id } });
    await recordAudit({ action: 'category.delete', userId: req.user?._id, username: req.user?.username, entity: 'category', entityId: Number(id), payload: { name: category.name } });
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    next(error);
  }
};
